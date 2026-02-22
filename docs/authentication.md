# Authentication

`zoro` uses Kite Connect login and token exchange.

## Commands

- `zoro auth`
- `zoro auth -p <port>`
- `zoro login` (alias of `zoro auth`)
- `zoro verify`

## Flow

1. `zoro auth` starts a temporary local HTTP server on `127.0.0.1` (default port `6583`).
2. CLI prints the Kite login URL for your `KITE_API_KEY`.
3. You open the URL and complete login/consent.
4. Kite redirects to `KITE_REDIRECT_URL` with `request_token`.
5. CLI exchanges `request_token` at `/session/token`.
6. CLI stores session at `~/.zoro/session.json`.

Stored fields include:

- `api_key`
- `access_token`
- `public_token`
- `refresh_token` (if provided)
- `user_id`
- `login_time`

## Important Rules

- `KITE_REDIRECT_URL` must be set.
- Selected port (`-p`) must match the redirect URL port.
- `KITE_API_SECRET` is required for token exchange.
- If callback is not received in time, auth command times out and must be re-run.

## Validating Session

Use:

```bash
zoro verify
```

`verify` calls `/user/profile` using your stored `access_token`.
