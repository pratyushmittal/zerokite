# Output and Errors

## Human Output

Default command output is terminal-friendly text or tables.

## JSON Output

Add `--json` to any command.

Success shape:

```json
{
  "ok": true,
  "command": "verify",
  "data": {}
}
```

Error shape:

```json
{
  "ok": false,
  "command": "verify",
  "error": {
    "type": "CliError",
    "message": "No access token found. Run `zerokite auth`."
  }
}
```

## Exit Codes

- `0` on success
- non-zero on failure

## Common Failures

- Missing `KITE_API_KEY`, `KITE_API_SECRET`, or `KITE_REDIRECT_URL`
- No saved session at `~/.zerokite/session.json`
- Invalid or expired `access_token`
- Invalid order payload for `orders place/modify/cancel`
