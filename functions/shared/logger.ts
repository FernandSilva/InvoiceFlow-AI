type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

const serializeMeta = (meta?: Record<string, unknown>) => {
  if (!meta) {
    return "";
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " {\"meta\":\"unserializable\"}";
  }
};

const writeLog = (level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>) => {
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

export const functionLogger = {
  info(scope: string, message: string, meta?: Record<string, unknown>) {
    writeLog("INFO", scope, message, meta);
  },
  warn(scope: string, message: string, meta?: Record<string, unknown>) {
    writeLog("WARN", scope, message, meta);
  },
  error(scope: string, message: string, meta?: Record<string, unknown>) {
    writeLog("ERROR", scope, message, meta);
  },
  debug(scope: string, message: string, meta?: Record<string, unknown>) {
    writeLog("DEBUG", scope, message, meta);
  },
};
