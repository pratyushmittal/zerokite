# Getting Started

## Prerequisites

- Node.js 18+
- A Kite Connect app from Zerodha with:
- `api_key`
- `api_secret`
- Redirect URL (example): `http://127.0.0.1:6583/callback`

## Install

```bash
npm install
npm link
```

Verify:

```bash
zerokite help
```

## Environment Variables

```bash
export KITE_API_KEY="your_api_key"
export KITE_API_SECRET="your_api_secret"
export KITE_REDIRECT_URL="http://127.0.0.1:6583/callback"
```

## First Login

```bash
zerokite auth
```

If needed, use `-p` to run auth on a custom callback port, and set the same port in your app's redirect URL.
