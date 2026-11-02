const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  isSafeStoredFilename,
  removeStoredFile,
  resolveStoredPath,
} = require("../helper/uploadStorageHelper");

describe("stored upload path boundaries", () => {
  let temporaryRoot;
  let uploadDirectory;

  beforeEach(() => {
    temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "baitulmal-upload-storage-")
    );
    uploadDirectory = path.join(temporaryRoot, "uploads");
    fs.mkdirSync(uploadDirectory);
  });

  afterEach(() => {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  });

  test.each([
    "../outside.png",
    "..\\outside.png",
    "/outside.png",
    "nested/outside.png",
    ".",
    "..",
    "",
  ])("rejects a non-basename stored path %s", (filename) => {
    expect(isSafeStoredFilename(filename, new Set([".png"]))).toBe(false);
    expect(resolveStoredPath(uploadDirectory, filename)).toBeNull();
  });

  test("does not delete a file outside the configured directory", () => {
    const outside = path.join(temporaryRoot, "SYNTHETIC_TARGET.txt");
    fs.writeFileSync(outside, "must remain");

    expect(
      removeStoredFile(uploadDirectory, "../SYNTHETIC_TARGET.txt")
    ).toBe(false);
    expect(fs.existsSync(outside)).toBe(true);
  });

  test("does not follow a symlink that resolves outside the directory", () => {
    const outside = path.join(temporaryRoot, "SYNTHETIC_TARGET.txt");
    const link = path.join(uploadDirectory, "synthetic.png");
    fs.writeFileSync(outside, "must remain");
    fs.symlinkSync(outside, link, "file");

    expect(resolveStoredPath(uploadDirectory, "synthetic.png")).toBeNull();
    expect(
      removeStoredFile(uploadDirectory, "synthetic.png")
    ).toBe(false);
    expect(fs.existsSync(outside)).toBe(true);
  });
});
