# Auth Flow

InvoiceFlow AI uses Appwrite Auth with email/password sessions.

## Register

1. Create Appwrite Auth user.
2. Create email/password session.
3. Create `profiles` document with document ID = Auth user ID.
4. Create `user_usage` document with document ID = Auth user ID.

## Login

1. Create email/password session.
2. Load current Auth user with `account.get()`.
3. Load profile document by document ID = Auth user ID.

## Logout

1. Delete current session.

## Route protection

- Protected routes require an active session.
- Admin routes require `profile.role === "admin"`.
- Suspended or deleted profiles are blocked.

## Onboarding

`profiles.onboardingCompleted` controls one-time onboarding visibility.
