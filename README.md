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

## Redirect URL Scenarios

### 1. Everything runs on your laptop (recommended)

Use this redirect URL:

`http://127.0.0.1:6583/callback`

Why:

- `127.0.0.1` does not change across networks.
- No extra networking setup required.

### 2. `zerokite auth` runs on a separate server with static public IP

Use this redirect URL:

`http://<static_ip>:6583/callback`

Example:

`http://203.0.113.10:6583/callback`

### 3. `zerokite auth` runs on a separate server with dynamic IP (Tailscale)

Use Tailscale so the server gets a stable private identity inside your tailnet.

Steps:

1. Install and sign in to Tailscale on the auth server.
2. Install and sign in to Tailscale on the machine where you open the login URL (for example, your laptop browser).
3. Verify both are in the same tailnet.
4. On the auth server, get its Tailscale IP:

```bash
tailscale ip -4
```

5. Set Kite app redirect URL to:

`http://<tailscale_ip>:6583/callback`

6. Set `KITE_REDIRECT_URL` on the auth server to that same value.
7. Run `zerokite auth` on the auth server.
8. Open the printed Kite login URL from a browser that is also connected to the same tailnet.

If MagicDNS is enabled in your tailnet, you can use `http://<device-name>.<tailnet>.ts.net:6583/callback` instead of the IP.

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

## Shell Completions

Generate completion scripts from CLI:

```bash
zerokite completion bash
zerokite completion zsh
```

Bash setup:

```bash
mkdir -p ~/.bash_completion.d
zerokite completion bash > ~/.bash_completion.d/zerokite
```

Load `~/.bash_completion.d/zerokite` from your `~/.bashrc` or `~/.bash_profile`.

Zsh setup:

```bash
mkdir -p ~/.zfunc
zerokite completion zsh > ~/.zfunc/_zerokite
```

Add this to `~/.zshrc` once:

```bash
fpath=(~/.zfunc $fpath)
autoload -Uz compinit && compinit
```

Homebrew note:

- Completion files are stored in this package at `completions/zerokite.bash` and `completions/_zerokite`.
- A Homebrew formula can install these files into bash/zsh completion directories directly.

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
