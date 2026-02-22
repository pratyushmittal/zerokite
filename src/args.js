function normalizeKey(key) {
  return key.replace(/-/g, "_");
}

function parseArgs(tokens) {
  const options = {};
  const positionals = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (token === "--") {
      positionals.push(...tokens.slice(i + 1));
      break;
    }

    if (token.startsWith("--")) {
      const equalsIndex = token.indexOf("=");
      if (equalsIndex >= 0) {
        const key = normalizeKey(token.slice(2, equalsIndex));
        options[key] = token.slice(equalsIndex + 1);
        continue;
      }

      const key = normalizeKey(token.slice(2));
      const nextToken = tokens[i + 1];
      if (nextToken && !nextToken.startsWith("-")) {
        options[key] = nextToken;
        i += 1;
      } else {
        options[key] = true;
      }
      continue;
    }

    if (token.startsWith("-") && token.length > 1) {
      const shortKey = token.slice(1);
      const nextToken = tokens[i + 1];
      if (nextToken && !nextToken.startsWith("-")) {
        options[shortKey] = nextToken;
        i += 1;
      } else {
        options[shortKey] = true;
      }
      continue;
    }

    positionals.push(token);
  }

  return { options, positionals };
}

function readPort(options, fallback) {
  const candidate = options.port || options.p;
  if (candidate === undefined) {
    return fallback;
  }

  const parsed = Number(candidate);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return null;
  }

  return parsed;
}

function hasJsonFlag(argv) {
  return argv.includes("--json");
}

function stripJsonFlag(argv) {
  return argv.filter((arg) => arg !== "--json");
}

module.exports = {
  parseArgs,
  readPort,
  hasJsonFlag,
  stripJsonFlag
};
