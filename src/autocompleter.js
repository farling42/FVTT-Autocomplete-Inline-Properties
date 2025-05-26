import { logger } from "./logger.js";
import { DATA_GETTERS, DATA_MODE } from "./package-config.js";

export class Autocompleter extends Application {
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

        // Currently unused
        this.targetSelectionStart = null;
        this.targetSelectionEnd = null;
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
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["autocompleter"],
            template: "./modules/autocomplete-inline-properties/templates/autocompleter.hbs",
            minWidth: 300,
            height: "auto",
        });
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
        const data = getProperty(this.targetData, key);
        return key + (data && typeof data === "object" ? "." : "");
    }

    /**
     * The Autocompleter path textbox
     * @returns {HTMLInputElement}
     */
    get inputElement() {
        return this.element?.[0]?.querySelector("input.aip-input");
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
        const value = path?.length ? getProperty(this.targetData, path) : this.targetData;
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
    static _formatData({ key, value }) {
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
        return this.sortedDataAtPath.map(Autocompleter._formatData);
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
    getData() {
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
        return {
            keyPrefix: this.keyPrefix,
            path: this.rawPath,
            dataEntries,
            highlightedEntry,
        };
    }

    /** @override */
    activateListeners($html) {
        super.activateListeners($html);
        const html = $html[0];

        const input = html.querySelector(`input.aip-input`);
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);

        input.addEventListener("focusout", () => {
            this.close();
        });
        input.addEventListener("input", this._onInputChanged.bind(this));
        input.addEventListener("keydown", this._onInputKeydown.bind(this));

        const insert = html.querySelector(`form.aip-form`);
        insert.addEventListener("submit", this._onSubmit.bind(this));
    }

    /** @override */
    async _render(force = false, options = {}) {
        // Set location to be just above the target
        const targetRect = this.target.getBoundingClientRect();
        mergeObject(this.position, {
            width: targetRect.width,
            left: targetRect.left,
        });
        return super._render(force, options).then((result) => {
            this.setPosition({ top: targetRect.top - this.element[0].getBoundingClientRect().height - 5 });
            this.bringToTop();
            return result;
        });
    }

    /** @override */
    async _renderOuter(options) {
        const html = await super._renderOuter(options);
        html[0].querySelector("header.window-header").remove();
        return html;
    }

    /**
     * Overridden in order to avoid an issue with {@link Application._replaceHTML} trying to set the window title, which
     * doesn't exist. Additionally, this is always a popOut window, so we can omit the non-popOut case.
     * @override
     */
    _replaceHTML(element, html) {
        if (!element.length) return;
        element.find(".window-content").html(html);
    }

    /** @override */
    async close(options = {}) {
        this.onClose();
        return super.close(options);
    }

    /**
     * @private
     */
    _onInputChanged() {
        const input = this.inputElement;
        this.rawPath = input.value;
        this.selectedCandidateIndex = null;
        this.render(false);
    }

    /**
     * @param {KeyboardEvent} event
     * @private
     */
    _onInputKeydown(event) {
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
                this.render(false);
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
                this.render(false);
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
                this.render(false);
                return;
            }
        }
    }

    /**
     * @param {Event} event
     * @private
     */
    async _onSubmit(event) {
        event.preventDefault();
        const oldValue = this.target.value;

        let spliceStart = oldValue.length;
        let spliceEnd = oldValue.length;
        if (Number.isNumeric(this.targetSelectionStart) && Number.isNumeric(this.targetSelectionEnd)) {
            spliceStart = Math.min(this.targetSelectionStart, this.targetSelectionEnd);
            spliceEnd = Math.max(this.targetSelectionStart, this.targetSelectionEnd);
        }

        const preString = oldValue.slice(0, spliceStart);
        const preSpacer = !preString.length || preString[preString.length - 1] === " " ? "" : " ";
        const postString = oldValue.slice(spliceEnd);
        const postSpacer = !postString.length || postString[postString.length - 1] === " " ? "" : " ";
        const insert = this.selectedOrBestMatch?.key ?? this.inputElement.value;
        const fullInsert = `${preSpacer}${this.keyPrefix}${insert}${postSpacer}`;

        this.target.focus();
        await this.close();

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
