# Testing Checklist

1. Register user
2. Confirm Auth user created
3. Confirm `profiles` document created
4. Confirm `user_usage` document created
5. Login
6. Upload file
7. Confirm file exists in `69f4baed0038dc6f98a8`
8. Confirm `documents` record created
9. Call `processDocument`
10. Confirm `extracted_data` document created
11. Confirm generated output file created
12. Confirm document status becomes `completed` or `needs_review`
13. Confirm My Documents displays the record

## OpenAI Extraction Test

1. In Appwrite Function variables, set `AI_PROVIDER=openai`
2. Set `OPENAI_API_KEY` to a valid backend secret
3. Optionally set `OPENAI_MODEL=gpt-4.1-mini`
4. Upload one PDF invoice through Invoice Reader
5. Confirm the original file is stored in `69f4baed0038dc6f98a8`
6. Confirm `processDocument` creates an `extracted_data` record with populated supplier, buyer, totals, and line items
7. Confirm a generated output file is stored with the `outputs/{userId}/{documentId}/...` naming pattern
8. Confirm the `documents` record stores `confidenceScore`
9. Confirm the document moves to `needs_review` if confidence is below `0.75` or validation issues exist
10. Upload one photographed invoice image and repeat the same checks
11. Confirm failures write `document.processing_failed` audit logs and populate `documents.errorMessage`

## E-Invoice Creator Fallback Number Test

1. Use the `e_invoice_creator` workflow with a source document that does not include an invoice number
2. Confirm `processDocument` generates a fallback number in the format `INV-{YYYY}-{shortDocumentId}`
3. Confirm the fallback number is stored in `extracted_data.invoiceNumber`
4. Confirm the document is marked `needs_review`
5. Confirm `documents.complianceStatus` becomes `needs_review`
