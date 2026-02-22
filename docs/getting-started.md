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
zoro help
```

## Environment Variables

```bash
export KITE_API_KEY="your_api_key"
export KITE_API_SECRET="your_api_secret"
export KITE_REDIRECT_URL="http://127.0.0.1:6583/callback"
```

## First Login

```bash
zoro auth
```

Or use a different callback port:

```bash
zoro auth -p 7000
```

If you use a custom port, update your app's redirect URL to the same port.
