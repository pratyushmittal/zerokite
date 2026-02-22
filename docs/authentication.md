# Authentication

`zerokite` uses Kite Connect login and token exchange.

## Commands

- `zerokite auth` (optionally `-p <port>`)
- `zerokite login` (alias of `zerokite auth`)
- `zerokite verify`

## Flow

1. `zerokite auth` starts a temporary callback server on port `6583` by default.
2. CLI prints the Kite login URL for your `KITE_API_KEY`.
3. You open the URL and complete login/consent.
4. Kite redirects to `KITE_REDIRECT_URL` with `request_token`.
5. CLI exchanges `request_token` at `/session/token`.
6. CLI stores session at `~/.zerokite/session.json`.

Stored fields include:

- `api_key`
- `access_token`
- `public_token`
- `refresh_token` (if provided)
- `user_id`
- `login_time`

## Important Rules

- `KITE_REDIRECT_URL` must be set.
- If you use a custom port, it must match the redirect URL port.
- `zerokite` listens on `127.0.0.1` for localhost redirects, and `0.0.0.0` for non-localhost redirects.
- `KITE_API_SECRET` is required for token exchange.
- If callback is not received in time, auth command times out and must be re-run.

## Redirect URL Scenarios

### Everything runs on your laptop

Use:

`http://127.0.0.1:6583/callback`

No extra setup needed.

### `zerokite auth` runs on a server with static public IP

Use:

`http://<static_ip>:6583/callback`

### `zerokite auth` runs on a server with dynamic IP (Tailscale)

1. Install and sign in to Tailscale on the auth server.
2. Install and sign in to Tailscale on the browser machine.
3. Ensure both are in the same tailnet.
4. On the auth server, run `tailscale ip -4`.
5. Set redirect URL to `http://<tailscale_ip>:6583/callback`.
6. Set `KITE_REDIRECT_URL` on the auth server to the same URL.
7. Run `zerokite auth` on the auth server.
8. Open the Kite login URL from a browser on the same tailnet.

If your tailnet has MagicDNS enabled, you can use:

`http://<device-name>.<tailnet>.ts.net:6583/callback`

## Validating Session

Use:

```bash
zerokite verify
```

`verify` calls `/user/profile` using your stored `access_token`.
