// Offline reproduction of two remaining Issue 006 gaps. No real DB or file writes.
// Run from repository root: node doc/security/issue-006-review-2-repro.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const serverRequire = createRequire(path.join(root, 'server/package.json'));
const filename = path.join(root, 'server/modules/permohonan_bantuan/models/model_cud.js');
const parents = {
  1: { id: 1, member_id: 7, kegiatan_id: 30 },
  2: { id: 2, member_id: 8, kegiatan_id: 30 },
  3: { id: 3, member_id: 7, kegiatan_id: 30 },
};
const rows = [
  { id: 11, permohonan_id: 1, bulan: 3, periode_key: '7:30:2026:3' },
  { id: 12, permohonan_id: 2, bulan: 3, periode_key: '8:30:2026:3' },
  { id: 13, permohonan_id: 3, bulan: 4, periode_key: '7:30:2026:4' },
];
const docs = [
  { id: 21, realisasi_permohonan_id: 11, path: 'shared.pdf' },
  { id: 22, realisasi_permohonan_id: 13, path: 'shared.pdf' },
];
const removed = [];
class Reads {
  async info_realisasi() { return { ...rows[0] }; }
  async info_permohonan(id) { return { ...parents[id] }; }
  async info_kegiatan() { return { nama_kegiatan: 'Fixture', tahun: 2026 }; }
  async info_member() { return { fullname: 'Fixture' }; }
}
const mocks = {
  '../../../models': {
    sequelize: { transaction: async () => ({ commit: async () => {}, rollback: async () => {} }) },
    Permohonan: { update: async (data, options) => { Object.assign(parents[options.where.id], data); return [1]; } },
    Validasi_syarat_permohonan: {
      // raw SELECT returns a detached snapshot, not the mutable backing record.
      findAll: async () => [{ ...docs[0] }],
      update: async (data, options) => { Object.assign(docs.find(d => d.id === options.where.id), data); return [1]; },
    },
  },
  '../models/model_r': Reads,
  '../../../helper/writeLogHelper': { writeLog: async () => {} },
  '../../../helper/uploadStorageHelper': {
    resolveStoredPath: (dir, name) => name ? path.join(dir, name) : null,
    removeStoredFile: (dir, name) => { removed.push(name); return true; },
  },
  '../../../helper/monthlyPeriodHelper': serverRequire('./helper/monthlyPeriodHelper'),
};
const loaded = { exports: {} };
vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
  module: loaded, exports: loaded.exports, __dirname: path.dirname(filename),
  console: { log() {}, error() {} },
  require(name) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (['path', 'moment'].includes(name)) return serverRequire(name);
    throw new Error(`Unexpected dependency: ${name}`);
  },
}, { filename });
(async () => {
  const model = new loaded.exports({
    body: {
      id: 11, member_id: 8, kegiatan_id: 30, bank_id: 1,
      nomor_rekening: 'fixture', atas_nama: 'fixture',
      dokumenMap: {
        dokumen_ktp: { file: 'new.pdf' },
        dokumen_ktp_meta: { id: 21, file_name: 'ktp', status: 'replace' },
      },
    },
    adminPermohonanUploads: [{ path: 'new.pdf', file_name: 'ktp' }],
  });
  await model.edit();
  assert.equal(await model.response(), true);
  const actualKeys = rows.slice(0, 2).map(r => `${parents[r.permohonan_id].member_id}:${parents[r.permohonan_id].kegiatan_id}:2026:${r.bulan}`);
  assert.equal(new Set(actualKeys).size, 1);
  assert.equal(new Set(rows.map(r => r.periode_key)).size, 3);
  assert(removed.includes('shared.pdf'));
  assert.equal(docs[1].path, 'shared.pdf');
  console.log(JSON.stringify({ success: true, otherRecordStillReferences: docs[1].path,
    removed, actualBusinessKeys: actualKeys, storedUniqueKeys: rows.map(r => r.periode_key),
    note: 'Model-level fixture proof, not a live DB/HTTP test. Exit 0 confirms vulnerable behavior.' }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
