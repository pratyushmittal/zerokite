class CliError extends Error {
  constructor(message, code = 1, details = null) {
    super(message);
    this.name = "CliError";
    this.code = code;
    this.details = details;
  }
}

class KiteApiError extends Error {
  constructor(message, statusCode, errorType = "KiteError", data = null) {
    super(message);
    this.name = "KiteApiError";
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.data = data;
  }
}

module.exports = {
  CliError,
  KiteApiError
};
