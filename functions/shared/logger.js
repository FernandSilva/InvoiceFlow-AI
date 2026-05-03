"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionLogger = void 0;
const serializeMeta = (meta) => {
    if (!meta) {
        return "";
    }
    try {
        return ` ${JSON.stringify(meta)}`;
    }
    catch {
        return " {\"meta\":\"unserializable\"}";
    }
};
const writeLog = (level, scope, message, meta) => {
    const line = `[InvoiceFlowAI][${scope}][${level}] ${message}${serializeMeta(meta)}`;
    if (level === "ERROR") {
        console.error(line);
        return;
    }
    if (level === "WARN") {
        console.warn(line);
        return;
    }
    console.log(line);
};
exports.functionLogger = {
    info(scope, message, meta) {
        writeLog("INFO", scope, message, meta);
    },
    warn(scope, message, meta) {
        writeLog("WARN", scope, message, meta);
    },
    error(scope, message, meta) {
        writeLog("ERROR", scope, message, meta);
    },
    debug(scope, message, meta) {
        writeLog("DEBUG", scope, message, meta);
    },
};
