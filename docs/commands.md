# Command Reference

## Global

- `--json` for machine-readable output.

## Core Commands

### `zerokite help`

Prints command usage.

### `zerokite version`

Prints CLI version.

### `zerokite completion <bash|zsh>`

Prints shell completion script to stdout.

Examples:

```bash
zerokite completion bash
zerokite completion zsh
```

### `zerokite auth [-p <port>]`

Starts callback server and login flow.

### `zerokite login`

Alias of `zerokite auth`.

### `zerokite verify`

Verifies whether stored `access_token` is valid.

### `zerokite profile`

Fetches profile details from `/user/profile`.

### `zerokite holdings`

Fetches:

- holdings from `/portfolio/holdings`
- funds from `/user/margins`

In non-JSON mode, prints holdings table and available equity funds.

### `zerokite positions [--day|--net]`

Fetches positions from `/portfolio/positions`.

- Default scope: `--net`
- Use `--day` for intraday/day scope

### `zerokite orders list`

Lists orders from `/orders`.

### `zerokite orders place [--variety regular] ...`

Places an order to `/orders/:variety`.

Required flags:

- `--exchange`
- `--tradingsymbol`
- `--transaction_type`
- `--quantity`
- `--order_type`
- `--product`

Any extra valid Kite order fields may also be passed as flags.

Example:

```bash
zerokite orders place \
  --variety regular \
  --exchange NSE \
  --tradingsymbol INFY \
  --transaction_type BUY \
  --quantity 1 \
  --order_type MARKET \
  --product CNC
```

### `zerokite orders modify --order_id <id> [--variety regular] ...`

Modifies order at `/orders/:variety/:order_id`.

Requires:

- order id via `--order_id` (or first positional id)
- at least one field to modify

### `zerokite orders cancel --order_id <id> [--variety regular]`

Cancels order at `/orders/:variety/:order_id`.
