import { MODULE_NAME } from "./const.js";

export function registerSettings() {

    game.settings.register(MODULE_NAME, "showButton", {
        name: "AIP.showButton.name",
        hint: "AIP.showButton.hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });

    game.settings.register(MODULE_NAME, "debug", {
        name: "AIP.debug.name",
        hint: "AIP.debug.hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
    });
}
