# Functions

Appwrite Free plan allows only two functions, and this project uses exactly these two:

## `processDocument`

- Validates request payload
- Verifies authenticated user context
- Loads the document record
- Downloads the uploaded source file from `69f4baed0038dc6f98a8`
- Runs the AI provider abstraction
- Supports `AI_PROVIDER=mock` and `AI_PROVIDER=openai`
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

- Verifies the current user or admin may delete the target user
- Deletes files from `69f4baed0038dc6f98a8` when possible
- Soft-deletes profile status to `deleted`
- Marks document records for MVP cleanup
- Writes audit logs

There is no separate `generateOutput` Appwrite function in this free-plan MVP.

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

`processDocument` keeps all OpenAI access on the backend. The frontend never calls OpenAI directly and never stores an OpenAI key.
