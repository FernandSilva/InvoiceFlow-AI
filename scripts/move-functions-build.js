import { mkdir, rename, rm, access } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();

const functionNames = ["processDocument", "deleteUserData"];

const ensureExists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const moveEntrypoint = async (functionName) => {
  const functionDir = path.join(rootDir, "functions", functionName);
  const srcJsPath = path.join(functionDir, "src", "main.js");
  const distDir = path.join(functionDir, "dist");
  const distJsPath = path.join(distDir, "main.js");

  if (!(await ensureExists(srcJsPath))) {
    throw new Error(`Expected compiled function entrypoint at ${srcJsPath}, but it was not found.`);
  }

  await mkdir(distDir, { recursive: true });

  if (await ensureExists(distJsPath)) {
    await rm(distJsPath, { force: true });
  }

  await rename(srcJsPath, distJsPath);
};

const main = async () => {
  for (const functionName of functionNames) {
    await moveEntrypoint(functionName);
  }
};

main().catch((error) => {
  console.error("[InvoiceFlowAI][functions-build][ERROR] Failed to move compiled function entrypoints.", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
