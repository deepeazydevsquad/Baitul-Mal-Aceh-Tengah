const {
  sequelize,
  Stored_file_cleanup,
} = require("../models");
const {
  removeStoredFile,
  resolveStoredPath,
} = require("../helper/uploadStorageHelper");
const {
  findStoredFileReferences,
} = require("../helper/storedFileReferenceHelper");

async function main() {
  const apply = process.argv.includes("--apply");
  const writersStopped = process.argv.includes("--writers-stopped");
  if (apply && !writersStopped) {
    throw new Error(
      "Gunakan --apply hanya saat seluruh writer aplikasi berhenti; tambahkan --writers-stopped setelah pemeriksaan."
    );
  }

  const pending = await Stored_file_cleanup.findAll({
    order: [["id", "ASC"]],
    limit: 500,
  });
  const report = [];

  for (const candidate of pending) {
    const references = await findStoredFileReferences(candidate.filename);
    const referenced = Object.values(references).some(Boolean);
    const path = resolveStoredPath(candidate.directory, candidate.filename);
    const action = referenced ? "keep-referenced" : path ? "candidate" : "missing";
    report.push({
      id: candidate.id,
      filename: candidate.filename,
      directory: candidate.directory,
      action,
    });

    if (apply && action === "candidate") {
      const removed = removeStoredFile(
        candidate.directory,
        candidate.filename
      );
      if (removed) await candidate.destroy();
    } else if (apply && action === "missing") {
      await candidate.destroy();
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        scanned: pending.length,
        candidates: report.filter((item) => item.action === "candidate").length,
        referenced: report.filter((item) => item.action === "keep-referenced")
          .length,
        report,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
