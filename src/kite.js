const crypto = require("crypto");
const https = require("https");
const { KiteApiError } = require("./errors");

const API_BASE = "https://api.kite.trade";

function buildChecksum(parts) {
  return crypto.createHash("sha256").update(parts.join("")).digest("hex");
}

function makeRequest(url, { method = "GET", headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method,
        headers
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const responseBody = Buffer.concat(chunks).toString("utf8");
          let parsedBody = null;

          if (responseBody) {
            try {
              parsedBody = JSON.parse(responseBody);
            } catch (error) {
              parsedBody = responseBody;
            }
          }

          if (response.statusCode >= 400) {
            const message =
              parsedBody && parsedBody.message
                ? parsedBody.message
                : `HTTP ${response.statusCode}`;
            const errorType =
              parsedBody && parsedBody.error_type ? parsedBody.error_type : "KiteError";
            reject(new KiteApiError(message, response.statusCode, errorType, parsedBody));
            return;
          }

          if (parsedBody && parsedBody.status === "error") {
            reject(
              new KiteApiError(
                parsedBody.message || "Kite API error",
                response.statusCode || 500,
                parsedBody.error_type || "KiteError",
                parsedBody
              )
            );
            return;
          }

          resolve(parsedBody);
        });
      }
    );

    request.on("error", reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

async function kiteRequest({
  method = "GET",
  route,
  apiKey,
  accessToken = null,
  params = null,
  includeVersionHeader = true
}) {
  const url = new URL(`${API_BASE}${route}`);
  const headers = {};
  let body = null;

  if (includeVersionHeader) {
    headers["X-Kite-Version"] = "3";
  }

  if (accessToken) {
    headers.Authorization = `token ${apiKey}:${accessToken}`;
  }

  if (method === "GET" || method === "DELETE") {
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }
  } else if (params) {
    const encodedBody = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        encodedBody.set(key, String(value));
      }
    }
    body = encodedBody.toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    headers["Content-Length"] = Buffer.byteLength(body);
  }

  return makeRequest(url, { method, headers, body });
}

async function exchangeRequestToken({ apiKey, apiSecret, requestToken }) {
  const checksum = buildChecksum([apiKey, requestToken, apiSecret]);
  return kiteRequest({
    method: "POST",
    route: "/session/token",
    apiKey,
    params: {
      api_key: apiKey,
      request_token: requestToken,
      checksum
    }
  });
}

module.exports = {
  buildChecksum,
  kiteRequest,
  exchangeRequestToken
};
