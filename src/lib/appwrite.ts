import { Account, Client, Databases, Functions, Storage } from "appwrite";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, USE_MOCKS } from "./constants";

let client: Client | null = null;

export const hasAppwriteConfig = Boolean(APPWRITE_ENDPOINT && APPWRITE_PROJECT_ID);

export const getAppwriteClient = () => {
  if (USE_MOCKS || !hasAppwriteConfig) {
    return null;
  }

  if (!client) {
    client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
  }

  return client;
};

export const getAppwriteServices = () => {
  const activeClient = getAppwriteClient();
  if (!activeClient) {
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
