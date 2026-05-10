# Environment Variables

## Frontend

Frontend local environment files may use only:

```env
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=69f37b080009c77bacc1
VITE_APP_NAME=InvoiceFlow AI
VITE_APPWRITE_FUNCTION_PROCESS_DOCUMENT_ID=69f4c09a0006111a3936
VITE_APPWRITE_FUNCTION_DELETE_USER_DATA_ID=69f4c1230010371d2e12
```

Never expose backend secrets in the frontend.

Do not place these in frontend env files:

- `APPWRITE_API_KEY`
- `OPENAI_API_KEY`
- `AZURE_DOCUMENT_INTELLIGENCE_KEY`
- `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
- `ANTHROPIC_API_KEY`
- `VERYFI_CLIENT_ID`
- `VERYFI_CLIENT_SECRET`

## Appwrite Function environment variables

Set these on both Appwrite functions:

```env
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=69f37b080009c77bacc1
APPWRITE_API_KEY=<secret backend API key>
STORAGE_BUCKET_ID=69f4baed0038dc6f98a8
DATABASE_ID=69f3813a00274d97c7c5
COLLECTION_DOCUMENTS=documents
COLLECTION_EXTRACTED_DATA=extracted_data
COLLECTION_AUDIT_LOGS=audit_logs
COLLECTION_USER_USAGE=user_usage
COLLECTION_PROFILES=profiles
AI_PROVIDER=openai
OPENAI_API_KEY=<secret>
OPENAI_MODEL=gpt-4.1-nano
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=
AZURE_DOCUMENT_INTELLIGENCE_KEY=
ANTHROPIC_API_KEY=
VERYFI_CLIENT_ID=
VERYFI_CLIENT_SECRET=
```

Notes:

- The frontend calls Appwrite Functions by real Appwrite Function ID, not by friendly function name.
- If either frontend function ID variable is missing, the app logs `Missing Appwrite function ID environment variable.` and blocks execution before calling Appwrite.
- `APPWRITE_API_KEY` must be a manually created Appwrite Project API Key with backend scopes. It is not an Appwrite account password, not a frontend variable, and not a user login/session credential.
- Required Appwrite Project API Key scopes for `processDocument`:
  - Auth:
    - `users.read`
  - Databases:
    - `databases.read`
    - `databases.write`
    - `tables.read`
    - `columns.read`
    - `indexes.read`
    - `rows.read`
    - `rows.write`
  - Deprecated but recommended to also select while using Appwrite SDK document APIs:
    - `collections.read`
    - `documents.read`
    - `documents.write`
  - Storage:
    - `buckets.read`
    - `files.read`
    - `files.write`
  - Functions, optional for debugging:
    - `executions.read`
    - `executions.write`
- If `OPENAI_MODEL` is missing, the backend defaults to `gpt-4.1-nano`.
- For this MVP, the recommended model is `OPENAI_MODEL=gpt-4.1-nano`.
- Never place `OPENAI_API_KEY` in any frontend `.env` file.
