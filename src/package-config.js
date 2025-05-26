/**
 * @enum {string}
 * Determines which data should be provided to the Autocompleter
 */
export const DATA_MODE = {
    /**
     * The data of the sheet's entity
     * @deprecated since 2.4.0, use {@link DATA_MODE.DOCUMENT_DATA} instead.
     */
    ENTITY_DATA: "entity",

    /**
     * The data of the sheet's document
     */
    DOCUMENT_DATA: "document",

    /**
     * The roll data of the sheet's document
     */
    ROLL_DATA: "roll",

    /**
     * The data of the sheet's document's owning actor
     */
    OWNING_ACTOR_DATA: "owning-actor",

    /**
     * The roll data of the sheet's document's owning actor
     */
    OWNING_ACTOR_ROLL_DATA: "actor-roll",

    /**
     * Custom data as defined by the `customDataGetter`
     */
    CUSTOM: "custom",
};

/**
 * Getter functions corresponding to the data modes defined in {@link DATA_MODE}
 */
export const DATA_GETTERS = {
    [DATA_MODE.ENTITY_DATA]: (sheet) => sheet.document?.toObject(false),
    [DATA_MODE.DOCUMENT_DATA]: (sheet) => sheet.document?.toObject(false),
    [DATA_MODE.ROLL_DATA]: (sheet) => sheet.document?.getRollData(),
    [DATA_MODE.OWNING_ACTOR_DATA]: (sheet) =>
        _getSheetDocumentParentActor(sheet)?.toObject(false) ?? _getFallbackActorData(),
    [DATA_MODE.OWNING_ACTOR_ROLL_DATA]: (sheet) =>
        _getSheetDocumentParentActor(sheet)?.getRollData() ?? _getFallbackActorRollData(),
    [DATA_MODE.CUSTOM]: (sheet, customDataGetter) => customDataGetter(sheet),
};

/**
 * Gets the owning actor of a given `FormApplication`'s document.
 * If the document does not have a parent, or the parent is not an Actor, returns null.
 * @param {FormApplication} sheet
 * @returns {Actor | null}
 * @private
 */
function _getSheetDocumentParentActor(sheet) {
    const parent = sheet.document?.actor ?? sheet.document?.parent;
    return parent && parent instanceof Actor ? parent : null;
}

let _dummyActors;

function _getDummyActors() {
    if (!_dummyActors) {
        const cls = getDocumentClass("Actor");
        const types = (game.release.generation < 12) ? game.system.template.Actor.types : Object.keys(game.system.documentTypes.Actor);
        _dummyActors = types.map((type) => new cls({ type, name: "dummy" }));
    }
    return _dummyActors;
}

/**
 * The cached merged actor data to use as fallback for unowned documents
 * @type {object}
 * @private
 */
let _fallbackActorData;

/**
 * Gets an object containing the merged data of all actor types.
 * @returns {object}
 * @private
 */
function _getFallbackActorData() {
    if (!_fallbackActorData) {
        _fallbackActorData = {};
        for (const actor of _getDummyActors()) {
            foundry.utils.mergeObject(_fallbackActorData, actor.toObject(false));
        }
    }
    return _fallbackActorData;
}

/**
 * The cached merged actor roll data to use as fallback for unowned documents
 * @type {object}
 * @private
 */
let _fallbackActorRollData;

/**
 * Gets an object containing the merged roll data of all actor types.
 * @returns {object}
 * @private
 */
function _getFallbackActorRollData() {
    if (!_fallbackActorRollData) {
        _fallbackActorRollData = {};
        for (const actor of _getDummyActors()) {
            foundry.utils.mergeObject(_fallbackActorRollData, actor.getRollData());
        }
    }
    return _fallbackActorRollData;
}

function _getFallbackParentItemRollData(item) {
    const itemData = item.toObject();
    const fallbackActorItemRollData = {};
    const cls = getDocumentClass("Item");
    for (const actor of _getDummyActors()) {
        const tempItem = new cls(itemData, { parent: actor });
        foundry.utils.mergeObject(fallbackActorItemRollData, tempItem.getRollData());
    }
    return fallbackActorItemRollData;
}

/**
 * @typedef {Object} AIPPackageConfig
 * A configuration object describing the sheet classes that AIP should be applied to for this package
 *
 * @property {string} packageName - the name of the package that this AIP config belongs to.
 * @property {AIPSheetClassConfig[]} sheetClasses - an array of sheet class configs registered by this package.
 */

/**
 * @typedef {Object} AIPSheetClassConfig
 * A configuration object describing a specific sheet class and which fields within that sheet should have AIP applied.
 * The default data modes assume that this sheet is a {@link FormApplication} which references a document.
 *
 * @property {string} name - the name of the sheet class
 * @property {AIPFieldConfig[]} fieldConfigs - the fields within this sheet that should have AIP applied
 */

/**
 * @typedef {Object} AIPFieldConfig
 * A configuration object describing a field to which AIP should be applied
 *
 * @property {string} selector - the selector string that should be used to find this field within the containing sheet
 * @property {(string)} [defaultPath] - this path will be used as the default contents of the path field when the Autocompleter is first created
 * @property {boolean} showButton - whether the AIP "@" button should be shown for this field.
 * @property {boolean} allowHotkey - whether pressing the "@" key on the keyboard should activate the Autocompleter for this field.
 * @property {(string[])} [filteredKeys] - an array of keys that should not be shown in the Autocompleter.
 * @property {DATA_MODE} dataMode - determines what data is provided to the Autocompleter for this field.
 * @property {string} [inlinePrefix] - if provided, this prefix will be inserted in the target field when the Autocompleter is submitted. Otherwise, the default for the chosen `dataMode` is used.
 * @property {(function(Application): object | undefined)} customDataGetter - if `dataMode` is `CUSTOM`, this function will be called to produce the data for the Autocompleter.
 * @property {string} [customInlinePrefix] - deprecated, use `inlinePrefix` instead.
 */

/** @type {AIPPackageConfig[]} */
export let PACKAGE_CONFIG;

export function setPackageConfig() {
    PACKAGE_CONFIG = [
        {
            // contributed by https://github.com/schultzcole
            packageName: "dnd5e",
            sheetClasses: [
                {
                    name: "ProficiencyConfig",
                    fieldConfigs: ["system"].flatMap((key) => [
                        {
                            selector: `input[type="text"][name*=".bonuses"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.ROLL_DATA,
                        },
                    ]),
                },
                {
                    name: "ItemSheet5e",
                    fieldConfigs: ["system"].flatMap((key) => [
                        {
                            selector: `.tab.details input[type="text"][name="${key}.attack.bonus"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.CUSTOM,
                            customDataGetter: (sheet) =>
                                sheet.document.getRollData() ?? _getFallbackActorRollData(sheet.document),
                            inlinePrefix: "@",
                        },
                        {
                            selector: `.tab.details input[type="text"][name^="${key}.damage"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.CUSTOM,
                            customDataGetter: (sheet) =>
                                sheet.document.getRollData() ?? _getFallbackActorRollData(sheet.document),
                            inlinePrefix: "@",
                        },
                        {
                            selector: `.tab.details input[type="text"][name="${key}.formula"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.CUSTOM,
                            customDataGetter: (sheet) =>
                                sheet.document.getRollData() ?? _getFallbackParentItemRollData(sheet.document),
                            inlinePrefix: "@",
                        },
                    ]),
                },
                {
                    name: "AttackSheet",    // Foundry V12+
                    fieldConfigs: ["system"].flatMap((key) => [
                        {
                            selector: `.tab[data-tab="effect"] input[type="text"][name="attack.bonus"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.CUSTOM,
                            customDataGetter: (sheet) =>  // sheet.document not available in the AttackSheet
                                sheet.document.getRollData() ?? _getFallbackActorRollData(sheet.document),
                            inlinePrefix: "@",
                        },
                        {
                            selector: `.tab[data-tab="effect"] input[type="text"][name*="damage"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.CUSTOM,
                            customDataGetter: (sheet) =>
                                sheet.document.getRollData() ?? _getFallbackActorRollData(sheet.document),
                            inlinePrefix: "@",
                        }
                    ]),
                },
                {
                    name: "ActiveEffectConfig",
                    fieldConfigs: [
                        {
                            selector: `.tab[data-tab="${(game.release.generation < 13) ? 'effects' : 'changes'}"] .key input[type="text"]`,
                            defaultPath: "system",
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.OWNING_ACTOR_DATA,
                        },
                    ],
                },
            ],
        },
        {
            // contributed by https://github.com/MikauSchekzen
            packageName: "pf1",
            sheetClasses: [
                {
                    name: "ItemSheetPF",
                    fieldConfigs: [
                        {
                            selector: `input.formula[type="text"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.ROLL_DATA,
                        },
                        {
                            selector: `textarea.context-text`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.ROLL_DATA,
                        },
                    ],
                },
                {
                    name: "ActorSheetPF",
                    fieldConfigs: [
                        {
                            selector: `input.formula[type="text"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.ROLL_DATA,
                        },
                        {
                            selector: `textarea.context-text`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.ROLL_DATA,
                        },
                    ],
                },
                {
                    name: "ItemActionSheet",
                    fieldConfigs: [
                        {
                            selector: `input.formula[type="text"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.ROLL_DATA,
                        },
                    ],
                },
            ],
        },
        {
            // contributed by https://github.com/cyr-
            packageName: "sw5e",
            sheetClasses: [
                {
                    name: "ActorSheetFlags",
                    fieldConfigs: ["system"].flatMap((key) => [
                        {
                            selector: `input[type="text"][name^="${key}.bonuses"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.ROLL_DATA,
                        },
                    ]),
                },
                {
                    name: "ItemSheet5e",
                    fieldConfigs: ["system"].flatMap((key) => [
                        {
                            selector: `.tab.details input[type="text"][name="${key}.attackBonus"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.CUSTOM,
                            customDataGetter: (sheet) =>
                                sheet.document.getRollData() ?? _getFallbackActorRollData(sheet.document),
                            inlinePrefix: "@",
                        },
                        {
                            selector: `.tab.details input[type="text"][name^="${key}.damage"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.CUSTOM,
                            customDataGetter: (sheet) =>
                                sheet.document.getRollData() ?? _getFallbackActorRollData(sheet.document),
                            inlinePrefix: "@",
                        },
                        {
                            selector: `.tab.details input[type="text"][name="${key}.formula"]`,
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.CUSTOM,
                            customDataGetter: (sheet) =>
                                sheet.document.getRollData() ?? _getFallbackActorRollData(sheet.document),
                            inlinePrefix: "@",
                        },
                    ]),
                },
                {
                    name: "ActiveEffectConfig",
                    fieldConfigs: [
                        {
                            selector: `.tab[data-tab="effects"] .key input[type="text"]`,
                            defaultPath: "system",
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.OWNING_ACTOR_DATA,
                        },
                    ],
                },
            ],
        },
        {
            packageName: "ds4",
            sheetClasses: [
                {
                    name: "ActiveEffectConfig",
                    fieldConfigs: [
                        {
                            selector: `.tab[data-tab="effects"] .key input[type="text"]`,
                            defaultPath: "system",
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.OWNING_ACTOR_DATA,
                        },
                        {
                            selector: `.tab[data-tab="effects"] .value input[type="text"]`,
                            defaultPath: "system",
                            showButton: true,
                            allowHotkey: true,
                            dataMode: DATA_MODE.OWNING_ACTOR_DATA,
                            inlinePrefix: "@",
                        },
                    ],
                },
            ],
        },
    ];
}
