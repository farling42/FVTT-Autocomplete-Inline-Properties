import { MODULE_ABBREVIATION, MODULE_NAME } from "./const.js";

const loggingContext = MODULE_ABBREVIATION;
const loggingSeparator = "|";

/**
 * Gets a logging function for the requested log level.
 * @typedef {'debug' | 'info' | 'warn' | 'error'} LogLevel
 * @typedef {(...args: unknown[]) => void} LoggingFunction
 * @param {LogLevel} [type = 'info'] - The log level of the requested logger
 * @returns {LoggingFunction}
 */
function getLoggingFunction(type = "info") {
    const log = console[type];
    if (type === "debug") {
        return (...data) => {
            if (game.settings.get(MODULE_NAME, "debug")) {
                log(loggingContext, loggingSeparator, ...data);
            }
        };
    }
    return (...data) => log(loggingContext, loggingSeparator, ...data);
}

/**
 * A singleton logger object.
 */
export const logger = Object.freeze({
    debug: getLoggingFunction("debug"),
    info: getLoggingFunction("info"),
    warn: getLoggingFunction("warn"),
    error: getLoggingFunction("error"),
    getLoggingFunction,
});
