import { MODULE_NAME } from "./const.js";

export function registerSettings() {
    game.settings.register(MODULE_NAME, "debug", {
        name: "AIP.DebugName",
        hint: "AIP.DebugHint",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
    });
}
