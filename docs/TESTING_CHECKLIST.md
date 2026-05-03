# Testing Checklist

1. Register user
2. Confirm Auth user created
3. Confirm `profiles` document created
4. Confirm `user_usage` document created
5. Login
6. Upload file
7. Confirm file exists in `69f4baed0038dc6f98a8`
8. Confirm `documents` record created
9. Confirm the frontend calls Appwrite Function ID `69f4c09a0006111a3936`
10. Confirm `extracted_data` document created
11. Confirm generated output file created
12. Confirm document status becomes `completed` or `needs_review`
13. Confirm My Documents displays the record

## OpenAI Extraction Test

1. In Appwrite Function variables, set `AI_PROVIDER=openai`
2. Set `OPENAI_API_KEY` to a valid backend secret
3. Optionally set `OPENAI_MODEL=gpt-4.1-mini`
4. Confirm frontend env includes `VITE_APPWRITE_FUNCTION_PROCESS_DOCUMENT_ID=69f4c09a0006111a3936`
5. Upload one PDF invoice through Invoice Reader
6. Confirm the original file is stored in `69f4baed0038dc6f98a8`
7. Confirm the function execution appears in Appwrite under Function ID `69f4c09a0006111a3936`
8. Confirm `processDocument` creates an `extracted_data` record with populated supplier, buyer, totals, and line items
9. Confirm a generated output file is stored with the `outputs/{userId}/{documentId}/...` naming pattern
10. Confirm the `documents` record stores `confidenceScore`
11. Confirm the document moves to `needs_review` if confidence is below `0.75` or validation issues exist
12. Upload one photographed invoice image and repeat the same checks
13. Confirm failures write `document.processing_failed` audit logs and populate `documents.errorMessage`

## E-Invoice Creator Fallback Number Test

1. Use the `e_invoice_creator` workflow with a source document that does not include an invoice number
2. Confirm `processDocument` generates a fallback number in the format `INV-{YYYY}-{shortDocumentId}`
3. Confirm the fallback number is stored in `extracted_data.invoiceNumber`
4. Confirm the document is marked `needs_review`
5. Confirm `documents.complianceStatus` becomes `needs_review`
