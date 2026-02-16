# Laravel API Authentication Reference

## Detection checklist
- `config/auth.php` guards/providers
- `config/sanctum.php` or Passport/JWT packages
- route groups in `routes/api.php`

## Baseline endpoint set
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh` (if refresh-token model)
- `GET /auth/me`

## Security controls
- `RateLimiter::for('login', ...)`
- consistent auth error payloads
- token revocation on logout
- revoke all sessions/tokens on sensitive credential changes

## Test matrix
- login success/fail
- throttled login
- access protected route without auth
- access protected route with invalid/revoked token
