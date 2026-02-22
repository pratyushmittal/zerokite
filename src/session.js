const fs = require("fs");
const os = require("os");
const path = require("path");

const SESSION_DIR = path.join(os.homedir(), ".zoro");
const SESSION_FILE = path.join(SESSION_DIR, "session.json");

function ensureSessionDir() {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

function loadSession() {
  if (!fs.existsSync(SESSION_FILE)) {
    return null;
  }

  const raw = fs.readFileSync(SESSION_FILE, "utf8");
  return JSON.parse(raw);
}

function saveSession(session) {
  ensureSessionDir();
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), "utf8");
}

function clearSession() {
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }
}

module.exports = {
  SESSION_FILE,
  loadSession,
  saveSession,
  clearSession
};
