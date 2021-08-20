# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
