import { MODULE_NAME } from "./const.js";
import { DATA_MODE, DATA_GETTERS, PACKAGE_CONFIG } from "./package-config.js";
import { refreshPackageConfig } from "./field-registration.js";

const API = {
    CONST: {
        DATA_MODE,
        DATA_GETTERS,
    },
    PACKAGE_CONFIG,
    refreshPackageConfig,
};

export function defineAPI() {
    const aip = game.modules.get(MODULE_NAME);
    aip.API = API;
}
