# Command Reference

## Global

- `--json` for machine-readable output.

## Core Commands

### `zoro help`

Prints command usage.

### `zoro version`

Prints CLI version.

### `zoro auth [-p <port>]`

Starts local callback server and login flow.

### `zoro login [-p <port>]`

Alias of `zoro auth`.

### `zoro verify`

Verifies whether stored `access_token` is valid.

### `zoro profile`

Fetches profile details from `/user/profile`.

### `zoro holdings`

Fetches:

- holdings from `/portfolio/holdings`
- funds from `/user/margins`

In non-JSON mode, prints holdings table and available equity funds.

### `zoro positions [--day|--net]`

Fetches positions from `/portfolio/positions`.

- Default scope: `--net`
- Use `--day` for intraday/day scope

### `zoro orders list`

Lists orders from `/orders`.

### `zoro orders place [--variety regular] ...`

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
zoro orders place \
  --variety regular \
  --exchange NSE \
  --tradingsymbol INFY \
  --transaction_type BUY \
  --quantity 1 \
  --order_type MARKET \
  --product CNC
```

### `zoro orders modify --order_id <id> [--variety regular] ...`

Modifies order at `/orders/:variety/:order_id`.

Requires:

- order id via `--order_id` (or first positional id)
- at least one field to modify

### `zoro orders cancel --order_id <id> [--variety regular]`

Cancels order at `/orders/:variety/:order_id`.
