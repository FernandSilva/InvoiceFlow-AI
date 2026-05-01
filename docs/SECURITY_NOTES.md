# Security Notes

- Frontend must never contain private backend keys.
- All AI provider secrets belong only in Appwrite Function environment variables.
- Uploaded files must remain private.
- Appwrite Auth handles login, logout, register, and current session.
- Profile status should be checked before allowing access to protected routes.
- Admin UI is role-driven from `profiles.role`.
- Admin impersonation remains a visible frontend placeholder and is intentionally not a secure auth bypass.
- Audit logs are written for registration, login when feasible, upload, processing, failure, deletion, and impersonation placeholder events.
