# zerokite CLI (CLI for Zerodha's Kite APIs)

`zerokite` is an unofficial command-line client for interacting with Zerodha's Kite API.

## Goal

Provide a fast and scriptable way to use Kite APIs directly from the terminal without implying an official Zerodha CLI.

## Tech Stack

- Node.js (18+ recommended)

## Installation

Install from npm:

```bash
npm install -g zerokite
```

Verify install:

```bash
zerokite help
```

After install, you can enable shell completions:

```bash
zerokite completion bash
zerokite completion zsh
```

## Local Development Setup

1. Clone this repo and install dependencies:

```bash
npm install
npm link
```

2. Verify linked local CLI:

```bash
zerokite help
```

## Kite App Configuration

Create a Kite Connect app and configure:

- Create app: https://developers.kite.trade/create

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

`zerokite auth` starts a temporary callback server and waits for Kite to redirect back with a `request_token`.

Default port is `6583`. Use `-p` or `--port` only when you need a different port.

```bash
zerokite auth
```

If you change the port, your app's configured redirect URL must use that same port.  
For localhost redirect URLs, `zerokite` listens on `127.0.0.1`. For non-localhost redirect URLs, it listens on all interfaces (`0.0.0.0`).
`zerokite login` is an alias of `zerokite auth`.

On success, `access_token` is stored at:

`~/.zerokite/session.json`

## Commands

- `zerokite help`
- `zerokite version`
- `zerokite completion <bash|zsh>`
- `zerokite auth [-p <port>]`
- `zerokite login`
- `zerokite verify`
- `zerokite profile`
- `zerokite holdings` (includes available funds from margins)
- `zerokite positions [--day|--net]`
- `zerokite orders list`
- `zerokite orders place ...`
- `zerokite orders modify --order_id <id> ...`
- `zerokite orders cancel --order_id <id>`
- Add `--json` to any command for machine-readable output

## Examples

```bash
# verify current token
zerokite verify

# holdings + available funds
zerokite holdings

# positions
zerokite positions --net
zerokite positions --day

# list orders
zerokite orders list

# place a regular market order
zerokite orders place \
  --variety regular \
  --exchange NSE \
  --tradingsymbol INFY \
  --transaction_type BUY \
  --quantity 1 \
  --order_type MARKET \
  --product CNC
```

## Documentation

Detailed docs are available in `/docs`:

- [Docs Index](./docs/index.md)

## More

- [Shell Completions Guide](./docs/completions.md)
- [Redirect URL Scenarios](./docs/authentication.md#redirect-url-scenarios)
