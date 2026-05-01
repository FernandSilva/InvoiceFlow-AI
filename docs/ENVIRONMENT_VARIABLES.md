# Environment Variables

## Frontend

Frontend local environment files may use only:

```env
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=69f37b080009c77bacc1
VITE_APP_NAME=InvoiceFlow AI
VITE_USE_MOCKS=false
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
OPENAI_MODEL=gpt-4.1-mini
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=
AZURE_DOCUMENT_INTELLIGENCE_KEY=
ANTHROPIC_API_KEY=
VERYFI_CLIENT_ID=
VERYFI_CLIENT_SECRET=
```

Notes:

- `AI_PROVIDER=mock` is still supported for local or fallback MVP processing.
- If `OPENAI_MODEL` is missing, the backend defaults to `gpt-4.1-mini`.
- Never place `OPENAI_API_KEY` in any frontend `.env` file.
