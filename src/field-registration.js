import { Autocompleter } from "./autocompleter.js";
import { logger } from "./logger.js";
import { PACKAGE_CONFIG } from "./package-config.js";

/**
 * Register autocompletion for the given `packageConfig`
 * @param {import("./package-config").AIPPackageConfig[]} packageConfig
 * @returns {void}
 */
export function registerFields(packageConfig) {
    if (!packageConfig.find((pkg) => pkg.packageName === game.system.id)) {
        ui.notifications.warn(game.i18n.localize("AIP.SystemNotSupported"));
    }

    for (const pkg of packageConfig) {
        if (pkg.packageName !== game.system.id && !game.modules.get(pkg.packageName)?.active) continue;

        for (const sheetClass of pkg.sheetClasses) {
            logger.debug(`Registering for "render${sheetClass.name}" hook event`);
            Hooks.on(`render${sheetClass.name}`, (app) => {
                registerFieldConfigs(app, sheetClass.fieldConfigs);
            });
        }
    }
}

/**
 * Refresh the package config for the given app according to the package config.
 * @param {Application} app The application for which to refersh the package config
 * @param {string} [packageName] If given, only the entry in the package config for the package will be considered
 * @returns {void}
 */
export function refreshPackageConfig(app, packageName) {
    const pkgs = PACKAGE_CONFIG.filter(
        (pkg) =>
            (pkg.packageName === game.system.id || game.modules.get(pkg.packageName)?.active) &&
            (packageName === undefined || packageName === pkg.packageName),
    );

    const sheetClassNames = app.constructor._getInheritanceChain().map((cls) => cls.name);
    const fieldConfigs = pkgs
        .flatMap((pkg) => pkg.sheetClasses)
        .filter((sheetClass) => sheetClassNames.includes(sheetClass.name))
        .flatMap((sheetClass) => sheetClass.fieldConfigs);

    registerFieldConfigs(app, fieldConfigs);
}

/**
 * Register field configs for a given `app`.
 * @param {Application} app
 * @param {import("./package-config").AIPFieldConfig[]} fieldConfigs
 */
function registerFieldConfigs(app, fieldConfigs) {
    for (const fieldDef of fieldConfigs) {
        registerFieldConfig(app, fieldDef);
    }
}

/** @type {Autocompleter | null} */
let _autocompleter = null;
/** @type {HTMLButtonElement | null} */
let _summonerButton = null;

/**
 * Register autocompletion for a field according to the given `fieldConfig`.
 *
 * @param {Application} app                                       - The `Application` on which the selector should be registered
 * @param {import("./package-config").AIPFieldConfig} fieldConfig - The configuration object describing the field
 */
function registerFieldConfig(app, fieldConfig) {
    /** @type {HTMLElement | undefined} */
    const sheetElement = app._element?.[0] ?? app.element;
    if (!sheetElement) {
        logger.error("Application does not have an HTML element, skipping registering field.", app, fieldConfig);
        return;
    }

    // Check that we get valid data for the given application. If not, skip adding Autocomplete to this field.
    try {
        const data = Autocompleter.getData(app, fieldConfig);
        if (!data) {
            logger.debug("Specified data for field not found", app, fieldConfig);
            return;
        }
    } catch (e) {
        logger.error("Error registering AIP field", e, app, fieldConfig);
        return;
    }

    const elements = Array.from(sheetElement.querySelectorAll(fieldConfig.selector)).filter(
        (e) => e.tagName === "TEXTAREA" || (e.tagName === "INPUT" && e.type === "text"),
    );
    for (const targetElement of elements) {
        const key = app.appId + targetElement.name;

        _removeOldEventListeners(targetElement);

        if (fieldConfig.showButton && !targetElement.disabled && !targetElement.readOnly) {
            // Show the summoner button when the user mouses over this field
            targetElement.addEventListener(
                "mouseenter",
                (targetElement.aipOnMouseEnter = function onMouseEnter() {
                    if (!_summonerButton) {
                        // Create button
                        _summonerButton = document.createElement("button");
                        _summonerButton.classList.add("autocompleter-summon");
                        _summonerButton.innerHTML = `<i class="fas fa-at autocompleter-summon-icon"></i>`;

                        document.body.appendChild(_summonerButton);
                    }

                    // Position button
                    const targetElementRect = targetElement.getBoundingClientRect();
                    _summonerButton.style.width = targetElementRect.height - 4 + "px";
                    _summonerButton.style.height = targetElementRect.height - 4 + "px";
                    _summonerButton.style.top = targetElementRect.top + 2 + "px";
                    const buttonElementRect = _summonerButton.getBoundingClientRect();
                    _summonerButton.style.left = targetElementRect.right - buttonElementRect.height - 4 + "px";
                    _summonerButton.firstElementChild.style.fontSize = buttonElementRect.height - 8 + "px";

                    _summonerButton.addEventListener("click", function (event) {
                        event.preventDefault();
                        _activateAutocompleter(targetElement, key, fieldConfig, app);
                    });
                    _summonerButton.addEventListener("mouseout", (event) => {
                        if (
                            !event.relatedTarget?.closest("i.autocompleter-summon-icon") &&
                            !event.relatedTarget?.closest(fieldConfig.selector) &&
                            !event.relatedTarget?.closest("button.autocompleter-summon")
                        ) {
                            _removeSummonerButton();
                        }
                    });
                }),
                false,
            );

            // Destroy the summoner button when the user moves away from this field
            targetElement.addEventListener(
                "mouseout",
                (targetElement.aipOnMouseOut = function onMouseOut(event) {
                    targetElement.clearAIPOnMouseOut = function () {
                        targetElement.removeEventListener("mouseout", onMouseOut);
                    };
                    if (!event.relatedTarget?.closest("button.autocompleter-summon")) {
                        _removeSummonerButton();
                    }
                }),
                false,
            );

            // Destroy the summoner button when the user starts typing in the target element
            targetElement.addEventListener("input", _removeSummonerButton);

            // Destroy the summoner button when the user scrolls this sheet
            sheetElement.addEventListener("wheel", _removeSummonerButton, { passive: true });
        }

        if (fieldConfig.allowHotkey) {
            // If the user presses the "@" key while the target element is focused, open the Autocompleter
            targetElement.addEventListener(
                "keydown",
                (targetElement.aipOnKeyDown = function onKeyDown(event) {
                    if (event.key === "@") {
                        event.preventDefault();
                        _activateAutocompleter(targetElement, key, fieldConfig, app);
                    }
                }),
                false,
            );
        }

        // If an autocompleter already exists with this key (because the target sheet is being re-rendered),
        // retarget the autocompleter to the newly rendered target element.
        if (_autocompleter?.targetKey === key) {
            _autocompleter.retarget(targetElement);
        }
    }
}

/**
 * Removes any old event listeners from the target element.
 * @param {HTMLElement} targetElement - The element from which to remove old event listeners
 * @private
 */
function _removeOldEventListeners(targetElement) {
    if (targetElement.aipOnMouseEnter !== undefined) {
        targetElement.removeEventListener("mouseenter", targetElement.aipOnMouseEnter, false);
        delete targetElement.aipOnMouseEnter;
    }
    if (targetElement.aipOnMouseOut !== undefined) {
        targetElement.removeEventListener("mouseout", targetElement.aipOnMouseOut, false);
        delete targetElement.aipOnMouseOut;
    }
    if (targetElement.aipOnKeyDown !== undefined) {
        targetElement.removeEventListener("keydown", targetElement.aipOnKeyDown, false);
        delete targetElement.aipOnKeyDown;
    }
}

/**
 * Removes the summoner button if it currently exists.
 * @private
 */
function _removeSummonerButton() {
    _summonerButton?.remove();
    _summonerButton = null;
}

/**
 * Creates a new autocompleter, or if one already exists, closes it and creates a new one targeting the provided target element.
 * @param {HTMLInputElement} targetElement
 * @param {string} targetKey
 * @param {import("./package-config").AIPFieldConfig} fieldConfig
 * @param {Application} app
 * @private
 */
function _activateAutocompleter(targetElement, targetKey, fieldConfig, app) {
    _autocompleter?.close();

    // Otherwise, create a new autocompleter
    const data = Autocompleter.getData(app, fieldConfig);
    _autocompleter = new Autocompleter(data, targetElement, targetKey, fieldConfig, () => {
        // When this Autocompleter gets closed, clean up the registration for this element.
        _autocompleter = null;
    }).render(true);
}
