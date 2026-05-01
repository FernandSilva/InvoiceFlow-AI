# Storage Architecture

InvoiceFlow AI uses one Appwrite Storage bucket:

- `69f4baed0038dc6f98a8`

## Logical prefix strategy

Files are organized by file name prefixes:

- `original/{userId}/{documentId}/{filename}`
- `outputs/{userId}/{documentId}/{filename}`
- `temp/{userId}/{documentId}/{filename}`

## Important note

Appwrite Storage does not require real folders for this MVP. These are logical prefixes stored in file names only.

The `processDocument` Appwrite Function downloads the original file from this single bucket and sends the file contents to OpenAI only on the backend when `AI_PROVIDER=openai`.

## Stored references

- `documents.originalFileId` stores the uploaded Appwrite file ID
- `documents.generatedFileIds` stores generated output Appwrite file IDs
