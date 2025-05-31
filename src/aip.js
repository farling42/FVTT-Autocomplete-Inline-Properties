import { defineAPI } from "./api.js";
import { registerSettings } from "./settings.js";
import { PACKAGE_CONFIG, setPackageConfig } from "./package-config.js";
import { logger } from "./logger.js";
import { registerFields } from "./field-registration.js";

Hooks.on("init", () => {
    setPackageConfig();
    defineAPI();
    registerSettings();
})

Hooks.on("setup", () => {
    CONFIG.debug.aip = false;
    logger.info("Setting up Autocomplete Inline Properties");

    Hooks.callAll("aipSetup", PACKAGE_CONFIG);
    registerFields(PACKAGE_CONFIG);
    Hooks.callAll("aipReady");
})