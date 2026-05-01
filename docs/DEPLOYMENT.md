# Deployment

## Repo structure

One repository contains:

- React frontend
- Appwrite function source
- Shared utilities and types
- Documentation

## Deployment split

- Frontend deploys later to a web host such as Vercel or Netlify
- Appwrite Functions deploy separately into Appwrite Cloud
- Auth, Database, Storage, and Functions run in Appwrite Cloud

## Local modes

- `VITE_USE_MOCKS=true` for mock mode
- `VITE_USE_MOCKS=false` for live Appwrite mode

## Free-plan-aligned resources

- 1 database: `69f3813a00274d97c7c5`
- 1 bucket: `69f4baed0038dc6f98a8`
- 2 functions: `processDocument`, `deleteUserData`
