type LogMeta = Record<string, unknown> | undefined;

const serializeMeta = (meta: LogMeta) => {
  if (!meta) {
    return "";
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " {\"meta\":\"unserializable\"}";
  }
};

const writeLog = (level: "INFO" | "WARN" | "ERROR" | "DEBUG", scope: string, message: string, meta?: LogMeta) => {
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

export const appLogger = {
  info(scope: string, message: string, meta?: LogMeta) {
    writeLog("INFO", scope, message, meta);
  },
  warn(scope: string, message: string, meta?: LogMeta) {
    writeLog("WARN", scope, message, meta);
  },
  error(scope: string, message: string, meta?: LogMeta) {
    writeLog("ERROR", scope, message, meta);
  },
  debug(scope: string, message: string, meta?: LogMeta) {
    writeLog("DEBUG", scope, message, meta);
  },
};
