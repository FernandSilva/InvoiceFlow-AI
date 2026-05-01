import { AppwriteException, ID } from "appwrite";
import { getAppwriteServices } from "./appwrite";
import { COLLECTIONS, DATABASE_ID, USE_MOCKS } from "./constants";
import { createClientAuditLog, mockAuditLog, readMockProfiles, readMockUsage, saveMockProfiles, saveMockUsage } from "./mockState";
import type { AuthUser, Profile, UserUsage } from "../types";

const AUTH_STORAGE_KEY = "invoiceflow-auth";

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
    if (error.code === 409) {
      return new AuthFlowError("CONFLICT", "An account with this email already exists.");
    }
    if (error.code === 401) {
      return new AuthFlowError("UNAUTHORIZED", "Incorrect email or password.");
    }
    if (error.code === 429) {
      return new AuthFlowError("RATE_LIMITED", "Too many attempts. Please wait a moment and try again.");
    }

    return new AuthFlowError("APPWRITE_ERROR", error.message || fallback);
  }

  if (error instanceof Error) {
    return new AuthFlowError("UNKNOWN", error.message || fallback);
  }

  return new AuthFlowError("UNKNOWN", fallback);
};

export const getCurrentMockSession = (): { user: AuthUser; profile: Profile } | null => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  return JSON.parse(stored) as { user: AuthUser; profile: Profile };
};

export const clearMockSession = () => localStorage.removeItem(AUTH_STORAGE_KEY);

export const loginWithMocks = async (email: string): Promise<{ user: AuthUser; profile: Profile }> => {
  const profiles = readMockProfiles();
  const profile = profiles.find((item) => item.email.toLowerCase() === email.toLowerCase()) || profiles[1];
  const session = {
    user: { id: profile.userId, email: profile.email, name: profile.fullName },
    profile,
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  mockAuditLog({
    actorUserId: profile.userId,
    targetUserId: profile.userId,
    action: "user.logged_in",
    entityType: "profile",
    entityId: profile.id,
    metadata: { mock: true },
  });
  return session;
};

export const registerWithMocks = async ({
  email,
  fullName,
  companyName,
}: {
  email: string;
  fullName: string;
  companyName: string;
}) => {
  const profiles = readMockProfiles();
  const usage = readMockUsage();
  const userId = ID.unique();
  const now = new Date().toISOString();
  const profile: Profile = {
    id: userId,
    userId,
    email,
    fullName,
    companyName,
    role: "user",
    status: "active",
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
  const usageRecord: UserUsage = {
    id: userId,
    userId,
    documentsProcessed: 0,
    eInvoicesCreated: 0,
    readerConversions: 0,
    failedJobs: 0,
    lastActivityAt: now,
  };
  profiles.push(profile);
  usage.push(usageRecord);
  saveMockProfiles(profiles);
  saveMockUsage(usage);

  const session = {
    user: { id: profile.userId, email: profile.email, name: profile.fullName },
    profile,
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  mockAuditLog({
    actorUserId: profile.userId,
    targetUserId: profile.userId,
    action: "user.registered",
    entityType: "profile",
    entityId: profile.id,
    metadata: { mock: true },
  });
  return session;
};

const getRealProfile = async (userId: string): Promise<Profile> => {
  const services = getAppwriteServices();
  if (!services) {
    throw new Error("Appwrite services are unavailable.");
  }

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

export const authApi = {
  async getCurrentSession() {
    if (USE_MOCKS) {
      return getCurrentMockSession();
    }

    const services = getAppwriteServices();
    if (!services) {
      return null;
    }

    try {
      const appwriteUser = await services.account.get();
      const profile = await getRealProfile(appwriteUser.$id);
      return {
        user: { id: appwriteUser.$id, email: appwriteUser.email, name: appwriteUser.name },
        profile,
      };
    } catch {
      return null;
    }
  },
  async login(email: string, password: string) {
    if (USE_MOCKS) {
      return loginWithMocks(email);
    }

    const services = getAppwriteServices();
    if (!services) {
      throw new Error("Missing Appwrite configuration.");
    }

    try {
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
      return { user: { id: appwriteUser.$id, email: appwriteUser.email, name: appwriteUser.name }, profile };
    } catch (error) {
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
    if (USE_MOCKS) {
      return registerWithMocks({ email, fullName, companyName });
    }

    const services = getAppwriteServices();
    if (!services) {
      throw new Error("Missing Appwrite configuration.");
    }

    try {
      const user = await services.account.create(ID.unique(), email, password, fullName);
      await services.account.createEmailPasswordSession(email, password);

      try {
        const now = new Date().toISOString();
        const profileDoc = await services.databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PROFILES,
          user.$id,
          {
            userId: user.$id,
            email,
            fullName,
            companyName,
            role: "user",
            status: "active",
            onboardingCompleted: false,
            createdAt: now,
            updatedAt: now,
          },
        );

        await services.databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.USER_USAGE,
          user.$id,
          {
            userId: user.$id,
            documentsProcessed: 0,
            eInvoicesCreated: 0,
            readerConversions: 0,
            failedJobs: 0,
            lastActivityAt: now,
          },
        );

        await createClientAuditLog(services, {
          actorUserId: user.$id,
          targetUserId: user.$id,
          action: "user.registered",
          entityType: "profile",
          entityId: profileDoc.$id,
          metadata: { source: "frontend" },
        }).catch(() => undefined);

        const profile: Profile = {
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
        };

        return { user: { id: user.$id, email, name: fullName }, profile };
      } catch (profileError) {
        throw new AuthFlowError(
          "PARTIAL_REGISTRATION",
          "Your account was created, but we could not finish setting up your workspace profile. Please try logging in, or contact support if the issue continues.",
        );
      }
    } catch (error) {
      throw toUserFacingAuthError(error, "Unable to create your account right now. Please try again.");
    }
  },
  async logout() {
    const services = getAppwriteServices();
    if (!services || USE_MOCKS) {
      clearMockSession();
      return;
    }
    await services.account.deleteSession("current");
  },
};
