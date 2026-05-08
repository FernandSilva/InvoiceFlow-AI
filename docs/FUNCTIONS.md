# Functions

Appwrite Free plan allows only two functions, and this project uses exactly these two:

## `processDocument`

- Appwrite Function ID: `69f4c09a0006111a3936`
- Runtime: `Node.js`
- Entrypoint: `functions/processDocument/dist/main.js`
- Build command: `npm install && npm run build:functions`

- Validates request payload
- Verifies authenticated user context
- Loads the document record
- Downloads the uploaded source file from `69f4baed0038dc6f98a8`
- Runs the AI provider abstraction
- Uses `OPENAI_API_KEY` and `OPENAI_MODEL` only inside the Appwrite Function when `AI_PROVIDER=openai`
- Validates extracted invoice data
- Generates a temporary invoice number for `e_invoice_creator` when the source document has no invoice number using `INV-{YYYY}-{shortDocumentId}`
- Creates `extracted_data`
- Generates the requested output
- Uploads the generated output to `69f4baed0038dc6f98a8`
- Updates `documents`
- Updates `user_usage`
- Writes audit logs

## `deleteUserData`

- Appwrite Function ID: `69f4c1230010371d2e12`
- Runtime: `Node.js`
- Entrypoint: `functions/deleteUserData/dist/main.js`
- Build command: `npm install && npm run build:functions`

- Verifies the current user or admin may delete the target user
- Deletes files from `69f4baed0038dc6f98a8` when possible
- Soft-deletes profile status to `deleted`
- Marks document records for MVP cleanup
- Writes audit logs

There is no separate `generateOutput` Appwrite function in this free-plan MVP.

The frontend must execute these functions using their real Appwrite Function IDs from environment variables:

```env
VITE_APPWRITE_FUNCTION_PROCESS_DOCUMENT_ID=69f4c09a0006111a3936
VITE_APPWRITE_FUNCTION_DELETE_USER_DATA_ID=69f4c1230010371d2e12
```

TypeScript function sources are compiled before deployment:

- `functions/processDocument/src/main.ts` is compiled and exposed through `functions/processDocument/dist/main.js`
- `functions/deleteUserData/src/main.ts` is compiled and exposed through `functions/deleteUserData/dist/main.js`
- shared backend modules compile into `functions/shared/*.js` and `functions/shared/ai/*.js`

## `processDocument` environment variables

```env
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=69f37b080009c77bacc1
APPWRITE_API_KEY=<secret backend API key>
STORAGE_BUCKET_ID=69f4baed0038dc6f98a8
DATABASE_ID=69f3813a00274d97c7c5
COLLECTION_PROFILES=profiles
COLLECTION_USER_USAGE=user_usage
COLLECTION_EXTRACTED_DATA=extracted_data
COLLECTION_DOCUMENTS=documents
COLLECTION_AUDIT_LOGS=audit_logs
AI_PROVIDER=openai
OPENAI_API_KEY=<secret>
OPENAI_MODEL=gpt-4.1-mini
```

`APPWRITE_API_KEY` must be a manually created Appwrite Project API Key. It is not an Appwrite account password, not a frontend environment variable, and not a browser/session credential.

Required API key scopes for backend processing:

- `databases.read`
- `databases.write`
- `collections.read`
- `documents.read`
- `documents.write`
- `storage.read`
- `storage.write`
- `files.read`
- `files.write`
- `users.read`

`processDocument` keeps all OpenAI access on the backend. The frontend never calls OpenAI directly and never stores an OpenAI key.
