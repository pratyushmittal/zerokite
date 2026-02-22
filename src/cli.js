const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const { parseArgs, readPort, hasJsonFlag, stripJsonFlag } = require("./args");
const { printTable, printSuccessJson, printErrorJson } = require("./output");
const { CliError, KiteApiError } = require("./errors");
const { SESSION_FILE, loadSession, saveSession } = require("./session");
const { kiteRequest, exchangeRequestToken } = require("./kite");

const DEFAULT_AUTH_PORT = 6583;
const AUTH_TIMEOUT_MS = 180000;
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost"]);

function printHelp() {
  console.log(`zerokite (Unofficial CLI for Zerodha Kite API)

Usage:
  zerokite <command> [options]

Commands:
  help                               Show help
  version                            Show CLI version
  completion <bash|zsh>              Print shell completion script
  auth [-p <port>]                   Start callback server and login flow
  login [-p <port>]                  Alias of auth
  verify                             Verify stored access token
  profile                            Fetch user profile
  holdings                           Fetch holdings and available funds
  positions [--day|--net]            Fetch positions (default: net)
  orders list                        List orders
  orders place [--variety regular]   Place an order
  orders modify --order_id ID        Modify an order
  orders cancel --order_id ID        Cancel an order

Global options:
  --json                             Print JSON output
`);
}

function printVersion() {
  const packageJsonPath = path.join(__dirname, "..", "package.json");
  const packageJson = require(packageJsonPath);
  console.log(packageJson.version);
}

function runCompletionCommand(commandArgs) {
  const { positionals } = parseArgs(commandArgs);
  const shellName = positionals[0];

  if (!shellName) {
    throw new CliError("Missing shell name. Use `zerokite completion bash` or `zerokite completion zsh`.");
  }

  const fileMap = {
    bash: "zerokite.bash",
    zsh: "_zerokite"
  };
  const completionFile = fileMap[shellName];

  if (!completionFile) {
    throw new CliError("Unsupported shell. Supported values: bash, zsh.");
  }

  const completionPath = path.join(__dirname, "..", "completions", completionFile);
  if (!fs.existsSync(completionPath)) {
    throw new CliError(`Completion script not found at ${completionPath}.`);
  }

  const script = fs.readFileSync(completionPath, "utf8");
  process.stdout.write(script);
  if (!script.endsWith("\n")) {
    process.stdout.write("\n");
  }
}

function assert(value, message) {
  if (!value) {
    throw new CliError(message);
  }
}

function numberOrZero(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatFixed(value, decimals = 2) {
  return numberOrZero(value).toFixed(decimals);
}

function resolveAuthContext() {
  const session = loadSession();
  const apiKey = process.env.KITE_API_KEY || (session && session.api_key);
  const accessToken = session && session.access_token;

  assert(
    apiKey,
    "Missing api_key. Set KITE_API_KEY or login once with `zerokite auth`."
  );
  assert(accessToken, "No access token found. Run `zerokite auth`.");

  return {
    apiKey,
    accessToken,
    session
  };
}

function parseRedirectUrl(port) {
  const redirectUrl = process.env.KITE_REDIRECT_URL;
  assert(
    redirectUrl,
    "Missing KITE_REDIRECT_URL. Example: http://127.0.0.1:6583/callback"
  );

  let parsedUrl;
  try {
    parsedUrl = new URL(redirectUrl);
  } catch (error) {
    throw new CliError("KITE_REDIRECT_URL is not a valid URL.");
  }

  const configuredPort = Number(
    parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80)
  );

  if (configuredPort !== port) {
    throw new CliError(
      `Configured redirect URL port (${configuredPort}) does not match selected port (${port}).`
    );
  }

  return parsedUrl;
}

function resolveListenHost(redirectUrl) {
  if (LOOPBACK_HOSTS.has(redirectUrl.hostname)) {
    return "127.0.0.1";
  }
  return "0.0.0.0";
}

function filterPayload(options, keysToIgnore) {
  const ignored = new Set(keysToIgnore);
  const payload = {};
  for (const [key, value] of Object.entries(options)) {
    if (ignored.has(key)) {
      continue;
    }
    if (value === true || value === false) {
      continue;
    }
    if (value !== undefined && value !== null && value !== "") {
      payload[key] = value;
    }
  }
  return payload;
}

async function runAuthCommand(command, commandArgs, jsonMode) {
  const { options } = parseArgs(commandArgs);
  const port = readPort(options, DEFAULT_AUTH_PORT);
  assert(port !== null, "Invalid port. Use a number from 1 to 65535.");

  const apiKey = process.env.KITE_API_KEY;
  const apiSecret = process.env.KITE_API_SECRET;
  assert(apiKey, "Missing KITE_API_KEY.");
  assert(apiSecret, "Missing KITE_API_SECRET.");

  const redirectUrl = parseRedirectUrl(port);
  const expectedPath = redirectUrl.pathname || "/";
  const listenHost = resolveListenHost(redirectUrl);
  const loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(
    apiKey
  )}`;

  if (!jsonMode) {
    console.log(
      `Starting callback server on http://${listenHost}:${port}${expectedPath}`
    );
    if (listenHost === "0.0.0.0") {
      console.log(
        "Accepting callbacks on all network interfaces for non-local redirect host."
      );
    }
    console.log("Open this URL in your browser and complete login:");
    console.log(loginUrl);
    console.log("");
    console.log(`Waiting for redirect on ${process.env.KITE_REDIRECT_URL} ...`);
  }

  const tokenResponse = await new Promise((resolve, reject) => {
    let settled = false;
    let timeout = null;
    let server = null;
    const finish = (done, value) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      if (server) {
        server.close(() => {
          done(value);
        });
      } else {
        done(value);
      }
    };

    server = http.createServer(async (request, response) => {
      const requestUrl = new URL(request.url, `http://127.0.0.1:${port}`);
      if (requestUrl.pathname !== expectedPath) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      const status = requestUrl.searchParams.get("status");
      const requestToken = requestUrl.searchParams.get("request_token");
      const errorMessage =
        requestUrl.searchParams.get("error") || requestUrl.searchParams.get("message");

      if (status && status !== "success") {
        response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Login failed. You can close this window.");
        finish(
          reject,
          new CliError(
            errorMessage || "Kite login did not return success status.",
            1,
            { status }
          )
        );
        return;
      }

      if (!requestToken) {
        response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Missing request_token in callback.");
        finish(reject, new CliError("Missing request_token in redirect callback."));
        return;
      }

      try {
        const sessionResponse = await exchangeRequestToken({
          apiKey,
          apiSecret,
          requestToken
        });
        response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Authentication successful. You can close this window.");
        finish(resolve, sessionResponse);
      } catch (error) {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Token exchange failed. See CLI output.");
        finish(reject, error);
      }
    });

    server.on("error", (error) => {
      finish(reject, new CliError(`Failed to start callback server: ${error.message}`));
    });

    server.listen(port, listenHost);

    timeout = setTimeout(() => {
      finish(
        reject,
        new CliError(
          "Timed out waiting for Kite redirect. Restart with `zerokite auth` and login again."
        )
      );
    }, AUTH_TIMEOUT_MS);
  });

  const sessionData = tokenResponse.data || {};
  const session = {
    api_key: apiKey,
    access_token: sessionData.access_token,
    public_token: sessionData.public_token || null,
    refresh_token: sessionData.refresh_token || null,
    user_id: sessionData.user_id || null,
    login_time: new Date().toISOString()
  };

  assert(session.access_token, "Did not receive access_token from Kite API.");
  saveSession(session);

  if (jsonMode) {
    printSuccessJson(command, {
      session_file: SESSION_FILE,
      user_id: session.user_id,
      login_time: session.login_time
    });
    return;
  }

  console.log("Login successful.");
  console.log(`Session saved to ${SESSION_FILE}`);
  if (session.user_id) {
    console.log(`User: ${session.user_id}`);
  }
}

async function runVerifyCommand(command, jsonMode) {
  const context = resolveAuthContext();
  const response = await kiteRequest({
    method: "GET",
    route: "/user/profile",
    apiKey: context.apiKey,
    accessToken: context.accessToken
  });

  if (jsonMode) {
    printSuccessJson(command, {
      valid: true,
      user_id: response.data.user_id,
      user_name: response.data.user_name
    });
    return;
  }

  console.log("Access token is valid.");
  console.log(`User ID: ${response.data.user_id}`);
  console.log(`Name: ${response.data.user_name}`);
}

async function runProfileCommand(command, jsonMode) {
  const context = resolveAuthContext();
  const response = await kiteRequest({
    method: "GET",
    route: "/user/profile",
    apiKey: context.apiKey,
    accessToken: context.accessToken
  });

  if (jsonMode) {
    printSuccessJson(command, response.data);
    return;
  }

  const profile = response.data;
  console.log(`User ID: ${profile.user_id}`);
  console.log(`Name: ${profile.user_name}`);
  console.log(`Email: ${profile.email}`);
  console.log(`Broker: ${profile.broker}`);
  console.log(`Products: ${(profile.products || []).join(", ")}`);
}

async function runHoldingsCommand(command, jsonMode) {
  const context = resolveAuthContext();

  const [holdingsResponse, marginsResponse] = await Promise.all([
    kiteRequest({
      method: "GET",
      route: "/portfolio/holdings",
      apiKey: context.apiKey,
      accessToken: context.accessToken
    }),
    kiteRequest({
      method: "GET",
      route: "/user/margins",
      apiKey: context.apiKey,
      accessToken: context.accessToken
    })
  ]);

  const data = {
    holdings: holdingsResponse.data || [],
    funds: marginsResponse.data || {}
  };

  const holdings = data.holdings;
  const holdingsWithValues = holdings.map((holding) => {
    const quantity = numberOrZero(holding.quantity);
    const averagePrice = numberOrZero(holding.average_price);
    const lastPrice = numberOrZero(holding.last_price);
    return {
      ...holding,
      cost_value: quantity * averagePrice,
      market_value: quantity * lastPrice
    };
  });
  const totals = holdingsWithValues.reduce(
    (sum, holding) => ({
      quantity: sum.quantity + numberOrZero(holding.quantity),
      pnl: sum.pnl + numberOrZero(holding.pnl),
      cost_value: sum.cost_value + numberOrZero(holding.cost_value),
      market_value: sum.market_value + numberOrZero(holding.market_value)
    }),
    {
      quantity: 0,
      pnl: 0,
      cost_value: 0,
      market_value: 0
    }
  );

  if (jsonMode) {
    printSuccessJson(command, {
      ...data,
      totals
    });
    return;
  }

  const equityFunds = data.funds.equity && data.funds.equity.available
    ? data.funds.equity.available
    : {};

  console.log(`Holdings: ${holdings.length}`);
  printTable(holdingsWithValues, [
    { header: "Symbol", key: "tradingsymbol" },
    { header: "Qty", key: "quantity", align: "right" },
    {
      header: "Avg",
      key: "average_price",
      align: "right",
      format: (value) => (value === "" || value === null || value === undefined ? "" : formatFixed(value, 2))
    },
    {
      header: "LTP",
      key: "last_price",
      align: "right",
      format: (value) => (value === "" || value === null || value === undefined ? "" : formatFixed(value, 2))
    },
    { header: "PnL", key: "pnl", align: "right", format: (value) => formatFixed(value, 2) },
    { header: "Cost Value", key: "cost_value", align: "right", format: (value) => formatFixed(value, 2) },
    { header: "Market Value", key: "market_value", align: "right", format: (value) => formatFixed(value, 2) }
  ], {
    footerRows: [
      {
        tradingsymbol: "TOTAL",
        quantity: totals.quantity,
        average_price: "",
        last_price: "",
        pnl: totals.pnl,
        cost_value: totals.cost_value,
        market_value: totals.market_value
      }
    ]
  });
  console.log("");
  console.log("Available Funds (Equity):");
  console.log(`Cash: ${equityFunds.cash || 0}`);
  console.log(`Live Balance: ${equityFunds.live_balance || 0}`);
  console.log(`Collateral: ${equityFunds.collateral || 0}`);
}

async function runPositionsCommand(command, commandArgs, jsonMode) {
  const { options } = parseArgs(commandArgs);
  const context = resolveAuthContext();
  const response = await kiteRequest({
    method: "GET",
    route: "/portfolio/positions",
    apiKey: context.apiKey,
    accessToken: context.accessToken
  });

  const scope = options.day ? "day" : "net";
  const positions = response.data[scope] || [];
  const result = { scope, positions };

  if (jsonMode) {
    printSuccessJson(command, result);
    return;
  }

  console.log(`Positions scope: ${scope}`);
  printTable(positions, [
    { header: "Symbol", key: "tradingsymbol" },
    { header: "Product", key: "product" },
    { header: "Qty", key: "quantity" },
    { header: "Avg", key: "average_price" },
    { header: "LTP", key: "last_price" },
    { header: "PnL", key: "pnl" }
  ]);
}

async function runOrdersCommand(command, commandArgs, jsonMode) {
  const context = resolveAuthContext();
  const subcommand = commandArgs[0];
  const { options, positionals } = parseArgs(commandArgs.slice(1));

  assert(
    subcommand,
    "Missing orders subcommand. Use: list | place | modify | cancel"
  );

  if (subcommand === "list") {
    const response = await kiteRequest({
      method: "GET",
      route: "/orders",
      apiKey: context.apiKey,
      accessToken: context.accessToken
    });

    if (jsonMode) {
      printSuccessJson(command, response.data || []);
      return;
    }

    printTable(response.data || [], [
      { header: "Order ID", key: "order_id" },
      { header: "Status", key: "status" },
      { header: "Symbol", key: "tradingsymbol" },
      { header: "Txn", key: "transaction_type" },
      { header: "Qty", key: "quantity" },
      { header: "Price", key: "price" }
    ]);
    return;
  }

  if (subcommand === "place") {
    const variety = options.variety || "regular";
    const payload = filterPayload(options, ["variety"]);

    assert(payload.exchange, "Missing --exchange for `orders place`.");
    assert(payload.tradingsymbol, "Missing --tradingsymbol for `orders place`.");
    assert(payload.transaction_type, "Missing --transaction_type for `orders place`.");
    assert(payload.quantity, "Missing --quantity for `orders place`.");
    assert(payload.order_type, "Missing --order_type for `orders place`.");
    assert(payload.product, "Missing --product for `orders place`.");

    const response = await kiteRequest({
      method: "POST",
      route: `/orders/${variety}`,
      apiKey: context.apiKey,
      accessToken: context.accessToken,
      params: payload
    });

    if (jsonMode) {
      printSuccessJson(command, response.data);
      return;
    }
    console.log(`Order placed. Order ID: ${response.data.order_id}`);
    return;
  }

  if (subcommand === "modify") {
    const variety = options.variety || "regular";
    const orderId = options.order_id || positionals[0];
    assert(orderId, "Missing order ID. Use --order_id <id>.");

    const payload = filterPayload(options, ["variety", "order_id"]);
    assert(Object.keys(payload).length > 0, "Provide at least one field to modify.");

    const response = await kiteRequest({
      method: "PUT",
      route: `/orders/${variety}/${orderId}`,
      apiKey: context.apiKey,
      accessToken: context.accessToken,
      params: payload
    });

    if (jsonMode) {
      printSuccessJson(command, response.data);
      return;
    }
    console.log(`Order modified. Order ID: ${response.data.order_id}`);
    return;
  }

  if (subcommand === "cancel") {
    const variety = options.variety || "regular";
    const orderId = options.order_id || positionals[0];
    assert(orderId, "Missing order ID. Use --order_id <id>.");

    const payload = filterPayload(options, ["variety", "order_id"]);
    const response = await kiteRequest({
      method: "DELETE",
      route: `/orders/${variety}/${orderId}`,
      apiKey: context.apiKey,
      accessToken: context.accessToken,
      params: payload
    });

    if (jsonMode) {
      printSuccessJson(command, response.data);
      return;
    }
    console.log(`Order cancelled. Order ID: ${response.data.order_id}`);
    return;
  }

  throw new CliError(
    `Unknown orders subcommand: ${subcommand}. Use list | place | modify | cancel.`
  );
}

function toErrorPayload(error) {
  if (error instanceof KiteApiError) {
    return {
      type: error.errorType,
      message: error.message,
      status_code: error.statusCode
    };
  }

  return {
    type: error.name || "Error",
    message: error.message || String(error)
  };
}

function handleError(command, jsonMode, error) {
  if (jsonMode) {
    printErrorJson(command, toErrorPayload(error));
    process.exitCode = error && error.code ? error.code : 1;
    return;
  }

  const printable = toErrorPayload(error);
  console.error(`${printable.type}: ${printable.message}`);
  if (printable.status_code) {
    console.error(`HTTP status: ${printable.status_code}`);
  }
  process.exitCode = error && error.code ? error.code : 1;
}

async function main(rawArgv) {
  const jsonMode = hasJsonFlag(rawArgv);
  const argv = stripJsonFlag(rawArgv);
  const command = argv[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "version" || command === "--version" || command === "-v") {
    printVersion();
    return;
  }

  if (command === "completion") {
    runCompletionCommand(argv.slice(1));
    return;
  }

  if (command === "auth" || command === "login") {
    await runAuthCommand(command, argv.slice(1), jsonMode);
    return;
  }

  if (command === "verify") {
    await runVerifyCommand(command, jsonMode);
    return;
  }

  if (command === "profile") {
    await runProfileCommand(command, jsonMode);
    return;
  }

  if (command === "holdings") {
    await runHoldingsCommand(command, jsonMode);
    return;
  }

  if (command === "positions") {
    await runPositionsCommand(command, argv.slice(1), jsonMode);
    return;
  }

  if (command === "orders" || command === "order") {
    await runOrdersCommand("orders", argv.slice(1), jsonMode);
    return;
  }

  throw new CliError(`Unknown command: ${command}`);
}

function run(rawArgv) {
  main(rawArgv).catch((error) => {
    const jsonMode = hasJsonFlag(rawArgv);
    const argv = stripJsonFlag(rawArgv);
    const command = argv[0] || "help";
    handleError(command, jsonMode, error);
  });
}

module.exports = {
  run
};
