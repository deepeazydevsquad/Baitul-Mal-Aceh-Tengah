const fs = require("fs");
const path = require("path");

const repositoryRoot = path.resolve(__dirname, "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function dockerIgnoreLines(relativePath) {
  return read(relativePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

describe("Docker build context", () => {
  test("excludes server secrets while retaining the example file", () => {
    const lines = dockerIgnoreLines("server/.dockerignore");

    expect(lines).toContain(".env");
    expect(lines).toContain(".env.*");
    expect(lines).toContain("!.env.example");
    expect(lines).toContain("node_modules");
  });

  test("uses reproducible installs and a non-root server user", () => {
    const dockerfile = read("server/Dockerfile");

    expect(dockerfile).toContain("npm ci --omit=dev");
    expect(dockerfile).toContain("USER node");
    expect(dockerfile).not.toMatch(/dockerize/i);
    expect(dockerfile).not.toContain("npm install");
  });

  test("provides an executable context check command", () => {
    const packageJson = JSON.parse(read("server/package.json"));

    expect(packageJson.scripts["check:docker-context"]).toBe(
      "node scripts/check-docker-context.js"
    );
  });

  test("client builds exclude environment files but retain source", () => {
    const lines = dockerIgnoreLines("client/.dockerignore");

    expect(lines).toContain(".env");
    expect(lines).toContain(".env.*");
    expect(lines).not.toContain("src");
    expect(read("client/Dockerfile")).toContain("npm ci");
  });

  test("production deployment migrates without dropping or seeding the database", () => {
    const workflow = read(".github/workflows/main.yml");

    expect(workflow).toContain("--profile tools run --rm migrate");
    expect(workflow).not.toContain("DROP DATABASE");
    expect(workflow).not.toContain("db:seed:all");
    expect(workflow).not.toMatch(/mysql\s+-uroot\s+-p/);
  });

  test("pins base images and hardens the server container", () => {
    const serverDockerfile = read("server/Dockerfile");
    const compose = read("docker-compose.yml");

    expect(serverDockerfile).toMatch(/FROM node:22-bookworm-slim@sha256:[a-f0-9]{64}/);
    expect(compose).toContain("read_only: true");
    expect(compose).toContain("no-new-privileges:true");
    expect(compose).toContain("- ALL");
  });
});
