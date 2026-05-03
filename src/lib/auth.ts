import { AppwriteException, ID } from "appwrite";
import { getAppwriteServices } from "./appwrite";
import { createClientAuditLog } from "./audit";
import { COLLECTIONS, DATABASE_ID } from "./constants";
import { appLogger } from "./logger";
import type { Profile } from "../types";

class AuthFlowError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const toUserFacingAuthError = (error: unknown, fallback: string) => {
  if (error instanceof AuthFlowError) {
    return error;
  }

  if (error instanceof AppwriteException) {
    const message = error.message || fallback;

    if (error.code === 409) {
      return new AuthFlowError("CONFLICT", "An account with this email already exists.");
    }
    if (message.includes("Creation of a session is prohibited when a session is active")) {
      return new AuthFlowError("ACTIVE_SESSION", message);
    }
    if (
      error.code === 401 &&
      /invalid credentials|incorrect email or password|user_invalid_credentials/i.test(message)
    ) {
      return new AuthFlowError("UNAUTHORIZED", "Incorrect email or password.");
    }
    if (error.code === 429) {
      return new AuthFlowError("RATE_LIMITED", "Too many attempts. Please wait a moment and try again.");
    }

    return new AuthFlowError("APPWRITE_ERROR", message);
  }

  if (error instanceof Error) {
    return new AuthFlowError("UNKNOWN", error.message || fallback);
  }

  return new AuthFlowError("UNKNOWN", fallback);
};

const isNoActiveSessionError = (error: unknown) =>
  error instanceof AppwriteException &&
  (error.code === 401 || error.code === 404) &&
  /missing scope|guest|current user|no session|user \(role: guests\) missing scope/i.test(error.message || "");

const isActiveSessionCreationError = (error: unknown) =>
  error instanceof AppwriteException &&
  (error.message || "").includes("Creation of a session is prohibited when a session is active");

const getRealProfile = async (userId: string): Promise<Profile> => {
  const services = getAppwriteServices();
  if (!services) {
    appLogger.error("auth", "Attempted to load profile without Appwrite services.", { userId });
    throw new Error("Appwrite services are unavailable.");
  }

  appLogger.info("auth", "Loading profile document.", { userId });
  const document = await services.databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId);
  return {
    id: document.$id,
    userId: document.userId,
    email: document.email,
    fullName: document.fullName,
    companyName: document.companyName,
    role: document.role,
    status: document.status,
    onboardingCompleted: document.onboardingCompleted,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
};

const mapAppwriteUser = (appwriteUser: { $id: string; email: string; name: string }) => ({
  id: appwriteUser.$id,
  email: appwriteUser.email,
  name: appwriteUser.name,
});

async function getExistingSessionSafe() {
  const services = getAppwriteServices();
  if (!services) {
    appLogger.warn("auth", "getExistingSessionSafe called without Appwrite services.");
    return null;
  }

  try {
    const user = await services.account.get();
    return user;
  } catch (error) {
    return null;
  }
}

const buildSessionFromExistingUser = async (userId: string, email: string, name: string) => {
  const profile = await getRealProfile(userId);
  return {
    user: {
      id: userId,
      email,
      name,
    },
    profile,
  };
};

const ensureProfileDocument = async ({
  userId,
  email,
  fullName,
  companyName,
}: {
  userId: string;
  email: string;
  fullName: string;
  companyName: string;
}) => {
  const services = getAppwriteServices();
  if (!services) {
    throw new Error("Appwrite services are unavailable.");
  }

  const now = new Date().toISOString();

  try {
    const profileDoc = await services.databases.createDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
      userId,
      email,
      fullName,
      companyName,
      role: "user",
      status: "active",
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    });

    appLogger.info("auth", "Registration profile created", { userId });
    return {
      id: profileDoc.$id,
      userId: profileDoc.userId,
      email: profileDoc.email,
      fullName: profileDoc.fullName,
      companyName: profileDoc.companyName,
      role: profileDoc.role,
      status: profileDoc.status,
      onboardingCompleted: profileDoc.onboardingCompleted,
      createdAt: profileDoc.createdAt,
      updatedAt: profileDoc.updatedAt,
    } satisfies Profile;
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 409) {
      appLogger.warn("auth", "Registration profile already exists; loading existing profile.", { userId });
      return getRealProfile(userId);
    }
    throw error;
  }
};

const ensureUserUsageDocument = async (userId: string) => {
  const services = getAppwriteServices();
  if (!services) {
    throw new Error("Appwrite services are unavailable.");
  }

  const now = new Date().toISOString();

  try {
    await services.databases.createDocument(DATABASE_ID, COLLECTIONS.USER_USAGE, userId, {
      userId,
      documentsProcessed: 0,
      eInvoicesCreated: 0,
      readerConversions: 0,
      failedJobs: 0,
      lastActivityAt: now,
    });
    appLogger.info("auth", "Registration user_usage created", { userId });
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 409) {
      appLogger.warn("auth", "user_usage already exists; continuing.", { userId });
      return;
    }
    throw error;
  }
};

export const authApi = {
  async getCurrentSession() {
    const services = getAppwriteServices();
    if (!services) {
      appLogger.warn("auth", "No Appwrite services available while reading current session.");
      return null;
    }

    try {
      appLogger.info("auth", "Fetching current Appwrite session.");
      const appwriteUser = await services.account.get();
      const profile = await getRealProfile(appwriteUser.$id);
      appLogger.info("auth", "Current session resolved successfully.", {
        userId: appwriteUser.$id,
        email: appwriteUser.email,
      });
      return {
        user: mapAppwriteUser(appwriteUser),
        profile,
      };
    } catch (error) {
      appLogger.warn("auth", "No active session could be resolved.", {
        error: error instanceof Error ? error.message : "unknown",
      });
      return null;
    }
  },
  async login(email: string, password: string) {
    const services = getAppwriteServices();
    if (!services) {
      appLogger.error("auth", "Login attempted without Appwrite configuration.");
      throw new Error("Missing Appwrite configuration.");
    }

    try {
      appLogger.info("auth", "Checking existing session before login", { email });
      const existingUser = await getExistingSessionSafe();

      if (existingUser) {
        appLogger.info("auth", "Existing session found; skipping createEmailPasswordSession", {
          userId: existingUser.$id,
          email: existingUser.email,
        });
        const restored = await buildSessionFromExistingUser(existingUser.$id, existingUser.email, existingUser.name);
        appLogger.info("auth", "Existing active session found; restored session.", {
          userId: existingUser.$id,
          email: existingUser.email,
        });
        return restored;
      }

      appLogger.info("auth", "No existing session; creating new session", { email });
      await services.account.createEmailPasswordSession(email, password);
      const appwriteUser = await services.account.get();
      const profile = await getRealProfile(appwriteUser.$id);
      await createClientAuditLog(services, {
        actorUserId: appwriteUser.$id,
        targetUserId: appwriteUser.$id,
        action: "user.logged_in",
        entityType: "profile",
        entityId: appwriteUser.$id,
        metadata: { source: "frontend" },
      }).catch(() => undefined);
      appLogger.info("auth", "Login completed successfully.", {
        userId: appwriteUser.$id,
        email: appwriteUser.email,
      });
      return { user: mapAppwriteUser(appwriteUser), profile };
    } catch (error) {
      if (isActiveSessionCreationError(error)) {
        appLogger.warn("auth", "Session creation blocked by existing active session; attempting restore.", { email });
        const restoredUser = await getExistingSessionSafe();
        if (restoredUser) {
          const restored = await buildSessionFromExistingUser(restoredUser.$id, restoredUser.email, restoredUser.name);
          appLogger.info("auth", "Existing active session found; restored session.", {
            userId: restoredUser.$id,
            email: restoredUser.email,
          });
          return restored;
        }

        try {
          await services.account.deleteSession("current");
        } catch (deleteError) {
          if (!isNoActiveSessionError(deleteError)) {
            appLogger.warn("auth", "Failed to clear conflicting session after restore attempt.", {
              email,
              error: deleteError instanceof Error ? deleteError.message : "unknown",
            });
          }
        }

        throw new AuthFlowError(
          "ACTIVE_SESSION_RECOVERY_FAILED",
          "A conflicting Appwrite session was detected. Please try signing in again.",
        );
      }

      appLogger.error("auth", "Login failed.", {
        email,
        error: error instanceof Error ? error.message : "unknown",
      });
      throw toUserFacingAuthError(error, "Unable to login right now. Please try again.");
    }
  },
  async register({
    email,
    password,
    fullName,
    companyName,
  }: {
    email: string;
    password: string;
    fullName: string;
    companyName: string;
  }) {
    const services = getAppwriteServices();
    if (!services) {
      appLogger.error("auth", "Registration attempted without Appwrite configuration.");
      throw new Error("Missing Appwrite configuration.");
    }

    try {
      appLogger.info("auth", "Checking existing session before registration", { email });
      const existingUser = await getExistingSessionSafe();
      if (existingUser) {
        try {
          await services.account.deleteSession("current");
        } catch (error) {
          if (!isNoActiveSessionError(error)) {
            throw error;
          }
        }
        appLogger.info("auth", "Existing session deleted before registration", {
          previousUserId: existingUser.$id,
          previousEmail: existingUser.email,
        });
      }

      appLogger.info("auth", "Creating Appwrite user.", { email, fullName, companyName });
      const user = await services.account.create(ID.unique(), email, password, fullName);
      appLogger.info("auth", "Registration user created", { userId: user.$id, email });
      await services.account.createEmailPasswordSession(email, password);
      const appwriteUser = await services.account.get();

      try {
        appLogger.info("auth", "Creating profile and usage documents for new user.", { userId: appwriteUser.$id });
        const profile = await ensureProfileDocument({
          userId: appwriteUser.$id,
          email: appwriteUser.email,
          fullName,
          companyName,
        });
        await ensureUserUsageDocument(appwriteUser.$id);

        await createClientAuditLog(services, {
          actorUserId: appwriteUser.$id,
          targetUserId: appwriteUser.$id,
          action: "user.registered",
          entityType: "profile",
          entityId: profile.id,
          metadata: { source: "frontend" },
        }).catch(() => undefined);

        appLogger.info("auth", "Registration completed successfully.", {
          userId: appwriteUser.$id,
          email,
        });
        return { user: mapAppwriteUser(appwriteUser), profile };
      } catch (error) {
        appLogger.error("auth", "Registration partially failed during profile setup.", {
          userId: appwriteUser.$id,
          email,
          error: error instanceof Error ? error.message : "unknown",
        });
        throw new AuthFlowError(
          "PARTIAL_REGISTRATION",
          "Your account was created, but we could not finish setting up your workspace profile. Please try logging in, or contact support if the issue continues.",
        );
      }
    } catch (error) {
      appLogger.error("auth", "Registration failed.", {
        email,
        error: error instanceof Error ? error.message : "unknown",
      });
      throw toUserFacingAuthError(error, "Unable to create your account right now. Please try again.");
    }
  },
  async logout() {
    const services = getAppwriteServices();
    if (!services) {
      appLogger.warn("auth", "Logout requested without Appwrite services.");
      return;
    }
    appLogger.info("auth", "Deleting current session.");
    try {
      await services.account.deleteSession("current");
    } catch (error) {
      if (!isNoActiveSessionError(error)) {
        throw error;
      }
      appLogger.warn("auth", "No active session found during logout; continuing.");
    }
    appLogger.info("auth", "Logout completed");
  },
};
