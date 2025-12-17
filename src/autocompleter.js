import { logger } from "./logger.js";
import { DATA_GETTERS, DATA_MODE } from "./package-config.js";

const { HandlebarsApplicationMixin,ApplicationV2 } = foundry.applications.api

export class Autocompleter extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        classes: ["autocompleter"],
        tag: 'form',
        form: {
            submitOnChange: false,
            closeOnSubmit: true,
            handler: this.#onSubmitForm,
        },
        position: {
            //minWidth: 300,
            height: "auto",
        },
        window: {
            //frame: false,
            positioned: true,
            minimizable: false
        },
        actions: {
            back: this.#onBack
        },
    }

    static PARTS = {
        form: { template: "./modules/autocomplete-inline-properties/templates/autocompleter.hbs" }
    }

    static currentPopup;

    /**
     *
     * @param {object} data
     * @param {HTMLInputElement} target
     * @param {string} targetKey
     * @param {import("./package-config").AIPFieldConfig} fieldConfig
     * @param {() => void} onClose
     * @param {object} options
     */
    constructor(data, target, targetKey, fieldConfig, onClose, options) {
        super(options);

        this.targetData = data;
        this.target = target;
        this.targetKey = targetKey;

        this.filteredKeys = fieldConfig.filteredKeys ?? null;
        this.mode = fieldConfig.dataMode;

        let inlinePrefix;
        if (fieldConfig.customInlinePrefix !== undefined) {
            logger.warn(
                "You are using customInlinePrefix which has been deprecated in favor of inlinePrefix and will be removed in a future version.",
            );
            inlinePrefix = fieldConfig.customInlinePrefix;
        }
        inlinePrefix = fieldConfig.inlinePrefix ?? inlinePrefix;

        switch (this.mode) {
            case DATA_MODE.ROLL_DATA:
            case DATA_MODE.OWNING_ACTOR_ROLL_DATA:
                this.keyPrefix = inlinePrefix ?? "@";
                break;
            default:
                this.keyPrefix = inlinePrefix ?? "";
                break;
        }

        this.rawPath = fieldConfig.defaultPath?.length ? this._keyWithTrailingDot(fieldConfig.defaultPath) : "";
        this.onClose = onClose;

        /**
         * The index of the currently selected candidate.
         * @type {number | null}
         */
        this.selectedCandidateIndex = null;
    }

    /**
     * Given a sheet, the data mode, and, if necessary, a custom data getter, return the appropriate data for that data mode
     * @param {Application} sheet
     * @param {import("./package-config").AIPFieldConfig} options
     * @returns {object | null}
     */
    static getData(sheet, { dataMode, customDataGetter = null }) {
        if (dataMode === DATA_MODE.ENTITY_DATA) {
            logger.warn(
                "You are using DATA_MODE.ENTITY_DATA which has been deprecated in favor of DATA_MODE.DOCUMENT_DATA and will be removed in a future version.",
            );
        }

        const getter = DATA_GETTERS[dataMode];
        if (!getter) throw new Error(`Unrecognized data mode "${dataMode}"`);
        return getter(sheet, customDataGetter);
    }

    /** @override */
    get popOut() {
        return true;
    }

    /**
     * If the given key does not terminate in a primitive value, return the key with a dot appended, otherwise assume the key is final.
     * If the key is not valid (does not exist in targetData), return the key with no modification
     * @param {string} key
     * @returns {string}
     * @private
     */
    _keyWithTrailingDot(key) {
        const data =foundry.utils.getProperty(this.targetData, key);
        return key + (data && typeof data === "object" ? "." : "");
    }

    /**
     * The Autocompleter path textbox
     * @returns {HTMLInputElement}
     */
    get inputElement() {
        return this.element?.querySelector("input.aip-input");
    }

    /**
     * The current raw path split into an array of path elements
     * @returns {string[]}
     */
    get splitPath() {
        return this.rawPath.split(".");
    }

    /**
     * The current raw path, with any partially entered key trimmed off
     * @returns {string}
     */
    get pathWithoutPartial() {
        return this.splitPath.slice(0, -1).join(".");
    }

    /**
     * Gets the target data at the current rawPath, formatting the keys to include the full path until this point.
     * @returns {{ key: string, value: any }[]}
     * @private
     */
    get _dataAtPath() {
        const path = this.pathWithoutPartial;
        const value = path?.length ?foundry.utils.getProperty(this.targetData, path) : this.targetData;
        if (value === null || value === undefined) return [];
        return Object.entries(value)
            .map(([key, value]) => ({
                key: path + (path.length ? "." : "") + key,
                value,
            }))
            .filter(({ key }) => {
                if (!this.filteredKeys) return true;
                return !this.filteredKeys.some((filter) => key.startsWith(filter));
            });
    }

    /**
     * Given a key value pair, "stringify" and format the value to be appropriate to display in the Autocompleter
     * @param {string} key
     * @param {any} value
     * @returns {{ key: string, value: string }}
     * @private
     */
    static #formatData({ key, value }) {
        let formattedValue;
        switch (typeof value) {
            case "undefined":
                formattedValue = typeof value;
                break;
            case "object":
                if (!value) {
                    formattedValue = "null";
                } else {
                    formattedValue = "{}";
                }
                break;
            case "string":
                formattedValue = `"${value}"`;
                break;
            default:
                formattedValue = value.toString();
        }
        return { key, value: formattedValue };
    }

    /**
     * Returns the sorted data at the current rawPath.
     * Sorting is done lexicographically, except that primitive values are always sorted first
     * @returns {{ key: string, value: any }[]}
     */
    get sortedDataAtPath() {
        return this._dataAtPath.sort((a, b) => {
            if (typeof a.value !== "object" && typeof b.value !== "object") return a.key.localeCompare(b.key);
            if (typeof a.value !== "object") return -1;
            if (typeof b.value !== "object") return 1;

            return a.key.localeCompare(b.key);
        });
    }

    /**
     * Sorted data in which the values have been formatted appropriately for displaying in the Autocompleter
     * @returns {{key: string, value: string}[]}
     */
    get sortedDataAtPathFormatted() {
        return this.sortedDataAtPath.map(Autocompleter.#formatData);
    }

    /**
     * The Autocompleter list entry that most closely matches the current `rawPath`
     * @returns {{ key: string, value: any } | undefined}
     */
    get currentBestMatch() {
        return this.sortedDataAtPath.find(({ key }) => key.startsWith(this.rawPath));
    }

    /**
     * The index of the Autocompleter list entry that most closely matches the current `rawPath`, respective to the
     * `sortedDataAtPath`.
     */
    get indexOfCurrentBestMatch() {
        return this.sortedDataAtPath.map(({ key }) => key).indexOf(this.currentBestMatch?.key);
    }

    /**
     * The Autocompleter list entry that has been selected, if any, otherwise the one that most closely matchs the
     * current `rawPath`.
     */
    get selectedOrBestMatch() {
        return this.selectedCandidateIndex !== null
            ? this.sortedDataAtPath[this.selectedCandidateIndex]
            : this.currentBestMatch;
    }

    /**
     * Assigns this Autocompleter a new target input element (in the case of a sheet re-render, for instance) and
     * re-renders.
     * @param newTarget
     */
    retarget(newTarget) {
        this.target = newTarget;
        this.selectedCandidateIndex = null;
        this.render(false);
        this.bringToTop();
    }

    /** @override */
    async _prepareContext(options)  {
        const context = await super._prepareContext(options);
        const escapedCombinedPath = "^" + this.rawPath.replace(/\./, "\\.");
        let highlightedEntry = this.selectedCandidateIndex;
        const dataEntries = this.sortedDataAtPathFormatted.map(({ key, value }, index) => {
            const match = key.match(escapedCombinedPath)?.[0];
            if (!match) return { key, value };
            const matchedKey = key.slice(0, match.length);
            const unmatchedKey = key.slice(match.length);

            if (highlightedEntry === null) highlightedEntry = index;

            return {
                key: `<span class="match">${matchedKey}</span>${unmatchedKey}`,
                value,
            };
        });

        highlightedEntry = highlightedEntry ?? 0;
        Object.assign(context, {
            keyPrefix: this.keyPrefix,
            path: this.rawPath,
            dataEntries,
            highlightedEntry,
        });

        return context;
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);

        //this.element.addEventListener("focusout", () => { this.close(); });

        const input = this.element.querySelector(`input.aip-input`);
        input.addEventListener("input", this.#onInputChanged.bind(this));
        input.addEventListener("keydown", this.#onInputKeydown.bind(this));

        // Ensure focus remains at the END of the input field at all times.
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);

        for (const item of this.element.querySelectorAll(`span.aip-key`)) {
            item.addEventListener("click", this.#onItemClick.bind(this));
        }
        Autocompleter.currentPopup = this;
    }

    /** @override */
    _configureRenderOptions(options) {
        super._configureRenderOptions(options);

        // Set location to be just below the target
        const targetRect = this.target.getBoundingClientRect();
        options.position.top = targetRect.bottom;  // targetRect.top - this.element.getBoundingClientRect().height - 5;
        options.position.width = Math.max(300,targetRect.width);
        options.position.left = targetRect.left;
        options.force = true; // maximimize & bringToFront
    }

    _updatePosition(position) {
        /* Because this.element.getBoundingClientRect() isn't available in _configureRenderOptions() */
        const targetRect = this.target.getBoundingClientRect();
        position.top = targetRect.top - this.element.getBoundingClientRect().height - 5;
        return super._updatePosition(position);
    }

    /** @override */
    async _renderFrame(options) {
        /* Hide the window title (don't delete, so the text can be changed, but still ignored) */
        const html = await super._renderFrame(options);
        html.querySelector("header.window-header").style.display = "none"; //remove();
        return html;
    }

    /** @override */
    async close(options = {}) {
        if (Autocompleter.currentPopup === this) Autocompleter.currentPopup = null;
        this.onClose();
        return super.close(options);
    }

    /**
     * @private
     */
    #onInputChanged() {
        const input = this.inputElement;
        this.rawPath = input.value;
        this.selectedCandidateIndex = null;
        this.render(false);
    }

    /**
     * @param {KeyboardEvent} event
     * @private
     */
    #onInputKeydown(event) {
        switch (event.key) {
            case "Escape": {
                this.close();
                return;
            }
            case "ArrowUp": {
                event.preventDefault();
                event.stopPropagation();
                this.selectedCandidateIndex =
                    this.sortedDataAtPath.length > 0
                        ? ((this.selectedCandidateIndex ?? this.indexOfCurrentBestMatch) + 1) %
                          this.sortedDataAtPath.length
                        : null;
                this.render();
                return;
            }
            case "ArrowDown": {
                event.preventDefault();
                event.stopPropagation();
                this.selectedCandidateIndex =
                    this.sortedDataAtPath.length > 0
                        ? ((this.selectedCandidateIndex ?? this.indexOfCurrentBestMatch) -
                              1 +
                              this.sortedDataAtPath.length) %
                          this.sortedDataAtPath.length
                        : null;
                this.render();
                return;
            }
            case "Tab": {
                event.preventDefault();
                event.stopPropagation();
                const selectedOrBestMatch = this.selectedOrBestMatch;
                if (!selectedOrBestMatch) {
                    ui.notifications.warn(`The key "${this.rawPath}" does not match any known keys.`);
                    this.rawPath = "";
                } else {
                    this.rawPath = this._keyWithTrailingDot(selectedOrBestMatch.key);
                }
                this.selectedCandidateIndex = null;
                this.render();
                return;
            }
        }
    }

    #onItemClick(event) {
        const text = event.currentTarget?.innerText;
        if (text) {
            this.inputElement.value = this._keyWithTrailingDot(text);
            this.#onInputChanged();
        }
    }

    static #onBack(event) {
        event.preventDefault();
        const text = this.inputElement.value;
        const last = text.slice(0,-1).lastIndexOf('.');  // ignore trailing '.'
        this.inputElement.value = (last > 0) ? text.slice(0, last+1) : "";  // include the trailing '.'
        this.#onInputChanged();
    }

    /**
     * @param {Event} event
     * @private
     */
    static async #onSubmitForm(event, form, formData) {
        event.preventDefault();
        const oldValue = this.target.value;

        const selectionStart = this.target.selectionStart;
        const selectionEnd = this.target.selectionEnd;

        const preString = oldValue.slice(0, selectionStart);
        const postString = oldValue.slice(selectionEnd);

        const preSpacer = !preString.length || preString[preString.length - 1] === " " ? "" : " ";
        const postSpacer = !postString.length || postString[postString.length - 1] === " " ? "" : " ";
        const insert = this.selectedOrBestMatch?.key ?? this.inputElement.value;
        const fullInsert = `${preSpacer}${this.keyPrefix}${insert}${postSpacer}`;

        this.target.focus();

        const inputEvent = new InputEvent("input", {
            bubbles: true,
            data: fullInsert,
            inputType: "insertText",
            cancelable: true,
        });

        const shouldPerformInsertion = this.target.dispatchEvent(inputEvent);

        if (shouldPerformInsertion) {
            this.target.value = `${preString}${fullInsert}${postString}`;
        }
    }
}

Hooks.on('setup', () => {
    // Global listener to close this dialog when clicking outside of it
    document.addEventListener("pointerdown", (event) => {
        const completer = Autocompleter.currentPopup;
        if (!completer) return;
        if (event.target.className !== "autocompleter-summon" &&
            !completer.element.contains(event.target)) {
            completer.close();
        }
    }, { passive: true });
})
