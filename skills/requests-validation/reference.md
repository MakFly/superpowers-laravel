# Laravel Validation Reference

## FormRequest skeleton
- `rules()` for constraints
- `authorize()` for access
- `prepareForValidation()` for normalization
- `messages()`/`attributes()` for UX-safe responses

## Common advanced patterns
- conditional rules (`required_if`, `exclude_unless`)
- cross-field checks in `withValidator()->after(...)`
- custom `Rule` classes for domain constraints

## Tests
- valid payload accepted
- missing required fields rejected
- malformed types rejected
- unauthorized request rejected
