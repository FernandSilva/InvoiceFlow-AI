# Appwrite Setup

## Existing Appwrite Cloud resources

This codebase now targets the manually created Appwrite Cloud resources below:

- Project ID: `69f37b080009c77bacc1`
- Database ID: `69f3813a00274d97c7c5`
- Collections:
  - `profiles`
  - `documents`
  - `extracted_data`
  - `audit_logs`
  - `user_usage`
- Storage bucket:
  - `69f4baed0038dc6f98a8`
- Functions:
  - `processDocument`
  - `deleteUserData`

## Free plan note

Appwrite Free plan allows one database, one storage bucket, and two functions. This repo is aligned to that limit.

## Storage layout

Use only `69f4baed0038dc6f98a8`.

Logical organization is done with file name prefixes:

- `original/{userId}/{documentId}/{filename}`
- `outputs/{userId}/{documentId}/{filename}`
- `temp/{userId}/{documentId}/{filename}`

Appwrite Storage does not require real folders for this MVP. These are logical prefixes only.

## Auth

- Enable email/password auth.
- Register creates:
  - Appwrite Auth user
  - `profiles` document with document ID = Auth user ID
  - `user_usage` document with document ID = Auth user ID

## First admin user

1. Register a normal user.
2. Open `profiles`.
3. Set `role = "admin"` on that profile.

## Manual checks still required

- Ensure uploaded files remain private.
- Ensure backend API keys exist only in function env vars.
- Ensure collection and bucket permissions match your MVP access model.
