const path = require("path");

function printHelp() {
  console.log(`Zerodha-CLI

Usage:
  zerodha-cli <command> [options]

Commands:
  help       Show help
  version    Show CLI version
  login      Start Kite login flow (placeholder)
  profile    Fetch Kite profile (placeholder)
  holdings   Fetch Kite holdings (placeholder)
  positions  Fetch Kite positions (placeholder)
  order      Place an order (placeholder)
`);
}

function printVersion() {
  const packageJsonPath = path.join(__dirname, "..", "package.json");
  const packageJson = require(packageJsonPath);
  console.log(packageJson.version);
}

function printPlaceholder(commandName) {
  console.log(
    `${commandName} is scaffolded. Implement Kite API integration in this command.`
  );
}

function run(argv) {
  const [command] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "version" || command === "--version" || command === "-v") {
    printVersion();
    return;
  }

  if (command === "login") {
    printPlaceholder("login");
    return;
  }

  if (command === "profile") {
    printPlaceholder("profile");
    return;
  }

  if (command === "holdings") {
    printPlaceholder("holdings");
    return;
  }

  if (command === "positions") {
    printPlaceholder("positions");
    return;
  }

  if (command === "order") {
    printPlaceholder("order");
    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exitCode = 1;
}

module.exports = {
  run
};
