# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 3.0.3

- Fixes an issue where the (module).API.PACKAGE_CONFIG was undefined rather than the correct object.

### 3.0.2

- DND5E: Some updates to support the correct fields in actor proficiencies and weapon damage and attacks (also working in Foundry V13).

### 3.0.1

- Set minimum Foundry version to 11.
- Get basic support working by testing with dnd5e 3.3.1 on Foundry V11 and dnd 4.3.9 on Foundry V12.

### [2.9.1](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.9.0...v2.9.1) (2023-07-17)

## [2.9.0](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.8.1...v2.9.0) (2022-09-11)


### Features

* **pf1:** add autocompletion support for roll formulas in item action sheets in pf1 ([78c1c2d](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/78c1c2dd22ce2bba527ec222a3b6d5837dc18ed9)), closes [#192](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/issues/192)


### Bug Fixes

* prevent the cursor from jumping to the front when autocompleting ([c8e8dc6](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/c8e8dc63b8bfaf93b9c816049f1ab1199e4cec8f)), closes [#189](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/issues/189)

### [2.8.1](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.8.0...v2.8.1) (2022-08-24)


### Bug Fixes

* avoid triggering any foundry keybindings when pressing keys in the autocompletion window ([96ab33d](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/96ab33d05ae89eb4f19b3f6c1b646e54dc372f68))
* don't crash the autocompletion window when rerendering it ([7697fee](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/7697fee93399fecec07f3684658ead978e4c365b))

## [2.8.0](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.7.7...v2.8.0) (2022-07-17)


### Features

* get rid of v10 compatibility warnings and add support for dnd5e v2.0.0 ([9831d33](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/9831d33a434b3947284c51a88cf153b591e3ad62))

### [2.7.7](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.7.6...v2.7.7) (2022-07-17)


### Bug Fixes

* restore the inline prefix (@) for dnd5e and sw5e ([ae5b14f](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/ae5b14fc42e8728f5f610b91a399a5a741dcde35)), closes [#157](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/issues/157)

### [2.7.6](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.7.5...v2.7.6) (2022-05-26)


### Bug Fixes

* properly handle unowned items in dnd5e and sw5e ([3454814](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/34548145efe235f031a2da159f5b883197981705))

### [2.7.5](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.7.4...v2.7.5) (2022-02-08)

### [2.7.4](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.7.3...v2.7.4) (2022-02-01)

### [2.7.3](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.7.2...v2.7.3) (2022-01-31)

### [2.7.2](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.7.1...v2.7.2) (2022-01-31)


### Bug Fixes

* switch to new way of enabling bug reporter ([b0842ac](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/b0842acf33d1b35ad5daacc8846f420bff31ae56))

### [2.7.1](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.7.0...v2.7.1) (2021-12-07)

## [2.7.0](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.6.0...v2.7.0) (2021-12-04)


### Features

* mark compatibility wih foundry V9 ([eb1ca48](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/eb1ca4867e05a5d918088650b9cee44bb343481d))

## [2.6.0](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.5.0...v2.6.0) (2021-11-05)


### Features

* add debug mode setting ([33141d2](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/33141d20e3a56c2b723f83be8cfb9f76e78d01a9))
* add functionality to refresh the package config for an application ([eed5d3e](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/eed5d3e674b4b459e7e88f1d519188b1d8adfa69))

## [2.5.0](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.4.1...v2.5.0) (2021-10-28)


### Features

* add a hook event to register package configurations ([46b461c](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/46b461c0b7958a53010cebb215ca305e8dd6ede4)), closes [#26](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/issues/26)

### [2.4.1](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.4.0...v2.4.1) (2021-10-08)

## [2.4.0](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.3.3...v2.4.0) (2021-10-02)


### Features

* allow selecting properties with arrow keys ([2481102](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/2481102e6e9151cd7ccab19a501bc6680cec4d95)), closes [#3](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/issues/3)
* use highlighted entry when pressing enter ([194ed13](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/194ed13a09f9a987d8299bae129cb4c93617ec19)), closes [#9](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/issues/9)

### [2.3.3](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.3.2...v2.3.3) (2021-10-01)

### [2.3.2](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.3.1...v2.3.2) (2021-09-01)


### Bug Fixes

* add missing files to release zip ([90b409f](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/90b409f2e1e30bbd9bf914c87998e8344d6f1db8))

### [2.3.1](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.3.0...v2.3.1) (2021-08-31)


### Bug Fixes

* remove the floating "@" button on mouse out ([c82ee5a](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/c82ee5ac3a2dad82de3e10d5f9ef0b0b9d8cbb4d))

## [2.3.0](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/compare/v2.2.0...v2.3.0) (2021-08-21)


### Features

* re-focus text area after inserting ([a7f2553](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/a7f2553817a5f941c36236dff6ab87230ac0f5af))

## 2.2.0 (2021-08-21)


### Features

* add support for effects and unowned items ([71b9b97](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/71b9b97b6abaedd8637a1d626a5600d63857fd8a))
* add support for the ds4 system ([8cb3dee](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/8cb3dee38b6828b7b41f18835394898879ad7b0c))
* allow specifying an `inlinePrefix` for every `dataMode` ([c200bfb](https://github.com/ghost-fvtt/FVTT-Autocomplete-Inline-Properties/commit/c200bfbcf391d64f3bd849edaf169b7962737ec7))

### 2.1.1 (2021-06-05)


### Bug Fixes

* Fixed an error that would occur on startup because the SW5e config was still referring to the old location of AIP constants
* Fixed an error that would occur on startup because a symbol was used before it had been initialized.

## 2.1.0 (2021-06-05)


### Features

* Added compatibility with SW5e system. (Thanks Cyr-)

## 2.0.0 (2021-06-05)


### ⚠ BREAKING CHANGES

* Moved publicly accessible AIP properties from the global CONST and CONFIG into `game.modules.get("autocomplete-inline-properties").API`.

### Features

* Compatibility with 0.8.x

## 1.2.0 (2021-02-19)


### Features

* Added pf1 support (thank you @MikauScekzen for the contribution!)
* Added support for `<textarea>` tags in addition to text `<input>` tags

## 1.1.0 (2021-02-17)


### Features

* Added several field configuration properties
  * `defaultPath`: sets the default path that will appear in the Autocompleter on initial load for the target field.
  * `DATA_MODE.OWNING_ACTOR_ROLL_DATA`: a new data mode which will get the roll data of the owning actor.
  * `customInlinePrefix`: a prefix that will be inserted in front of the final path in the target field when the Autocompleter is submitted.
  * `filteredKeys`: an array of keys which should not be displayed in the Autocompleter for the target field.

### 1.0.1 (2021-02-17)


### Bug Fixes

* Fix an issue which would cause `customDataGetter`s to not be as useful as they should have been.
* Fix an issue where an error would be thrown in circumstances where a data getter returned null or undefined

## 1.0.0 (2021-02-17)
