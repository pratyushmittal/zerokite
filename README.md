# zoro

`zoro` is an unofficial command-line client for interacting with Zerodha's Kite API.

## Goal

Provide a fast and scriptable way to use Kite APIs directly from the terminal without implying an official Zerodha CLI.

## Tech Stack

- Node.js (18+ recommended)

## Setup

1. Install and link:

```bash
npm install
npm link
```

2. Verify install:

```bash
zoro help
```

## Kite App Configuration

Create a Kite Connect app and configure:

- `api_key`
- `api_secret`
- Redirect URL (example): `http://127.0.0.1:6583/callback`

Set environment variables:

```bash
export KITE_API_KEY="your_api_key"
export KITE_API_SECRET="your_api_secret"
export KITE_REDIRECT_URL="http://127.0.0.1:6583/callback"
```

## Authentication Flow

`zoro auth` starts a temporary local HTTP server and waits for Kite to redirect back with a `request_token`.

Default port is `6583`. Use `-p` or `--port` to change it:

```bash
zoro auth
zoro auth -p 7000
```

If you change the port, your app's configured redirect URL must use the same port.  
`zoro login` is an alias of `zoro auth`.

On success, `access_token` is stored at:

`~/.zoro/session.json`

## Commands

- `zoro help`
- `zoro version`
- `zoro auth [-p <port>]`
- `zoro login [-p <port>]`
- `zoro verify`
- `zoro profile`
- `zoro holdings` (includes available funds from margins)
- `zoro positions [--day|--net]`
- `zoro orders list`
- `zoro orders place ...`
- `zoro orders modify --order_id <id> ...`
- `zoro orders cancel --order_id <id>`
- Add `--json` to any command for machine-readable output

## Examples

```bash
# verify current token
zoro verify

# holdings + available funds
zoro holdings

# positions
zoro positions --net
zoro positions --day

# list orders
zoro orders list

# place a regular market order
zoro orders place \
  --variety regular \
  --exchange NSE \
  --tradingsymbol INFY \
  --transaction_type BUY \
  --quantity 1 \
  --order_type MARKET \
  --product CNC
```
