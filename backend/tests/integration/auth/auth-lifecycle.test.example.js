// Example test plan (adapt to your project's test runner and isolated test DB).
// 1. Request verification for unknown email -> generic 200 response.
// 2. Request verification for unverified active user -> email sent, DB stores hash only.
// 3. Verify with valid token -> email_verified_at populated; replay/expired token -> 400.
// 4. Request password reset -> generic 200 response regardless of account existence.
// 5. Reset password -> password hash changes and every active refresh token is revoked.
// 6. Replay/expired reset token -> 400; old password no longer works.
// 7. Repeated login/register/reset requests -> 429 after configured limit.
// 8. Verify no token, password, or SMTP secret appears in response bodies or logs.
