"use strict";

const fs = require("fs");
const path = require("path");

const serverRoot = path.resolve(__dirname, "..");
const ignorePath = path.join(serverRoot, ".dockerignore");
const dockerfilePath = path.join(serverRoot, "Dockerfile");

function fail(message) {
  throw new Error(`Docker context tidak aman: ${message}`);
}

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${path.basename(filePath)} tidak ditemukan.`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function main() {
  const patterns = readRequired(ignorePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const dockerfile = readRequired(dockerfilePath);

  if (!patterns.includes(".env")) {
    fail(".dockerignore wajib mengecualikan .env.");
  }
  if (!patterns.includes(".env.*")) {
    fail(".dockerignore wajib mengecualikan turunan .env.");
  }
  if (!patterns.includes("!.env.example")) {
    fail(".env.example harus tetap tersedia di build context.");
  }
  if (/\bCOPY\s+(?:[^\n]*\s)?\.env(?:\s|$)/im.test(dockerfile)) {
    fail("Dockerfile tidak boleh menyalin .env.");
  }
  if (!/\bCOPY\s+--chown=node:node\s+\.\s+\./.test(dockerfile)) {
    fail("source server harus disalin dengan ownership user runtime.");
  }

  console.log("Docker context aman: .env dikecualikan.");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
