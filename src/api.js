import { MODULE_NAME } from "./const.js";
import { DATA_MODE, DATA_GETTERS, PACKAGE_CONFIG } from "./package-config.js";
import { refreshPackageConfig } from "./field-registration.js";

export function defineAPI() {
    const aip = game.modules.get(MODULE_NAME);
    aip.API = {
        CONST: {
            DATA_MODE,
            DATA_GETTERS,
        },
        PACKAGE_CONFIG,
        refreshPackageConfig
    }
}
