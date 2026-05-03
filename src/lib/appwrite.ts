import { Account, Client, Databases, Functions, Storage } from "appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "./constants";
import { appLogger } from "./logger";

let client: Client | null = null;

export const hasAppwriteConfig = Boolean(APPWRITE_ENDPOINT && APPWRITE_PROJECT_ID);

export const getAppwriteClient = () => {
  if (!hasAppwriteConfig) {
    appLogger.error("appwrite", "Appwrite configuration is missing in the frontend.");
    return null;
  }

  if (!client) {
    appLogger.info("appwrite", "Creating frontend Appwrite client.", {
      endpoint: APPWRITE_ENDPOINT,
      projectId: APPWRITE_PROJECT_ID,
    });
    client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
  }

  return client;
};

export const getAppwriteServices = () => {
  const activeClient = getAppwriteClient();
  if (!activeClient) {
    appLogger.warn("appwrite", "Appwrite services requested without an active client.");
    return null;
  }

  return {
    client: activeClient,
    account: new Account(activeClient),
    databases: new Databases(activeClient),
    storage: new Storage(activeClient),
    functions: new Functions(activeClient),
  };
};
