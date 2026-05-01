# Database Schema

Database ID: `69f3813a00274d97c7c5`

## Collection: `profiles`

- `userId`: string, required
- `email`: string, required
- `fullName`: string
- `companyName`: string
- `role`: enum `user | admin`, default `user`
- `status`: enum `active | suspended | deleted`, default `active`
- `onboardingCompleted`: boolean, default `false`
- `createdAt`: datetime
- `updatedAt`: datetime

## Collection: `documents`

- `userId`: string, required
- `originalFileId`: string
- `originalFileName`: string
- `originalMimeType`: string
- `originalSize`: number
- `workflowType`: enum `invoice_reader | e_invoice_creator`
- `status`: enum `uploaded | processing | completed | failed | needs_review`
- `requestedOutputFormat`: enum `xlsx | docx | pdf | json | xml`
- `generatedFileIds`: string array
- `extractedDataId`: string
- `confidenceScore`: number
- `complianceStatus`: enum `not_applicable | draft | needs_review | ready`
- `errorMessage`: string
- `createdAt`: datetime
- `updatedAt`: datetime

## Collection: `extracted_data`

- `documentId`: string
- `userId`: string
- `supplierName`: string
- `supplierTaxId`: string
- `supplierAddress`: string
- `buyerName`: string
- `buyerTaxId`: string
- `buyerAddress`: string
- `invoiceNumber`: string
- `invoiceDate`: string
- `dueDate`: string
- `currency`: string
- `subtotal`: number
- `taxTotal`: number
- `total`: number
- `lineItems`: string or JSON
- `rawExtractedJson`: string or JSON
- `normalizedJson`: string or JSON
- `validationIssues`: string array
- `createdAt`: datetime
- `updatedAt`: datetime

## Collection: `audit_logs`

- `actorUserId`: string
- `targetUserId`: string
- `action`: string
- `entityType`: string
- `entityId`: string
- `metadata`: string or JSON
- `ipAddress`: string
- `createdAt`: datetime

## Collection: `user_usage`

- `userId`: string
- `documentsProcessed`: number
- `eInvoicesCreated`: number
- `readerConversions`: number
- `failedJobs`: number
- `lastActivityAt`: datetime

## Storage bucket

### `69f4baed0038dc6f98a8`
- Private bucket
- Per-user read access
- Appwrite Functions write access
- Logical file prefixes for MVP organization:
  - `original/{userId}/{documentId}/{filename}`
  - `outputs/{userId}/{documentId}/{filename}`
  - `temp/{userId}/{documentId}/{filename}`
- Appwrite Storage does not require real folders here; prefixes are stored in file names only
