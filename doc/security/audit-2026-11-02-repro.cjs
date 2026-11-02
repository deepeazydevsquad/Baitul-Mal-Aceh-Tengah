// Offline audit reproductions. No real DB, WhatsApp, or upload filesystem access.
// Run from repository root: node doc/security/audit-2026-11-02-repro.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const serverRequire = createRequire(path.join(root, 'server/package.json'));
const results = [];
function load(relative, mocks = {}) {
  const filename = path.join(root, relative);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports, __dirname: path.dirname(filename),
    Buffer, process: { env: { OTP_HASH_SECRET: 'offline-synthetic-secret-at-least-32-characters' } },
    console: { log() {}, error() {}, warn() {} },
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (['path', 'fs', 'crypto', 'moment', 'multer', 'sharp'].includes(name)) return serverRequire(name);
      throw new Error(`Unmocked dependency: ${relative}: ${name}`);
    },
  }, { filename });
  return module.exports;
}
const logMock = { writeLog: async () => {} };
const helpers = {
  '../../../helper/writeLogHelper': logMock,
  '../../../helper/waSenderHelper': { sendWhatsApp: async () => { throw new Error('WA must not be called'); } },
  '../../../helper/currencyHelper': { convertToRP: async () => 'synthetic' },
};
function transaction() {
  return { LOCK: { UPDATE: 'UPDATE' }, commit: async () => {}, rollback: async () => {} };
}
async function main() {
  let deleted = false;
  const DeleteModel = load('server/modules/riwayat_permohonan_bantuan/models/model_cud.js', {
    ...helpers,
    '../../../models': {
      sequelize: { transaction: async () => transaction() },
      Permohonan: {
        findByPk: async () => ({ id: 41, member_id: 7, status: 'sedang_berlangsung' }),
        destroy: async (options) => { assert.equal(options.where.member_id, 7); deleted = true; return 1; },
      },
    },
  });
  const deletion = new DeleteModel({ body: { id: 41 }, user: { id: 7 } });
  await deletion.delete();
  assert.equal(await deletion.response(), true);
  assert.equal(deleted, true);
  results.push({ proof: 'member-delete', deleteIssuedWithoutRealisasiCheck: deleted,
    note: 'CASCADE impact established from migration; no live database cascade executed.' });

  let removed = [];
  const stored = {
    resolveStoredPath: (directory, name) => name ? path.join(directory, name) : null,
    removeStoredFile: (directory, name) => { removed.push(name); return true; },
  };
  const records = new Map([[1, { berita_acara: 'shared.pdf' }], [2, { berita_acara: 'shared.pdf' }]]);
  class Reads {
    async info_realisasi(id) { return { ...records.get(id), permohonan_id: 41 }; }
    async info_permohonan() { return { kegiatan_id: 10, member_id: 7 }; }
    async info_kegiatan() { return { nama_kegiatan: 'synthetic' }; }
    async info_member() { return { fullname: 'synthetic' }; }
  }
  const BaseModel = load('server/modules/bakal_penerima_bantuan/models/model_cud.js', {
    ...helpers,
    '../../../models': {
      sequelize: { transaction: async () => transaction() },
      Realisasi_permohonan: { update: async (data, options) => {
        Object.assign(records.get(options.where.id), data); return [1];
      } },
    },
    '../models/model_r': Reads,
    '../../../helper/uploadStorageHelper': stored,
  });
  const replacement = new BaseModel({ body: { id: 1 }, beritaAcaraDocument: { filename: 'new.pdf' } });
  await replacement.upload_berita_acara();
  assert.equal(await replacement.response(), true);
  assert.equal(records.get(2).berita_acara, 'shared.pdf');
  assert(removed.includes('shared.pdf'));
  results.push({ proof: 'shared-document-delete', otherRecordStillReferences: records.get(2).berita_acara, removed });

  const { EventEmitter } = require('node:events');
  removed = [];
  const uploadValidation = load('server/validation/bakal_penerima_bantuan.js', {
    '../models': {},
    '../helper/secureDocumentUploadHelper': { createSecureDocumentUpload: () => ({
      middleware: (req, res, next) => next(), persist: (req, res, next) => next(),
      remove: req => removed.push(req.buktiRealisasiDocument.filename),
    }) },
  });
  let committed = false;
  const UncertainModel = load('server/modules/bakal_penerima_bantuan/models/model_cud.js', {
    ...helpers,
    '../../../models': {
      sequelize: { transaction: async () => ({ ...transaction(), commit: async () => {
        committed = true; throw new Error('synthetic: COMMIT applied, acknowledgement lost');
      } }) },
      Realisasi_permohonan: { update: async () => [1] },
    },
    '../models/model_r': Reads,
    '../../../helper/uploadStorageHelper': stored,
  });
  const controller = load('server/modules/bakal_penerima_bantuan/controllers/index.js', {
    '../models/model_r': Reads, '../models/model_cud': UncertainModel,
    '../../../helper/handleError': { handleValidationErrors: async () => true,
      handleServerError: (res) => res.status(500).json({ error: true }) },
  });
  const req = { body: { id: 1, tipe: 'transfer', nominal_realisasi: 100 }, buktiRealisasiDocument: { filename: 'committed.pdf' } };
  const res = new EventEmitter();
  res.status = code => { res.statusCode = code; return res; };
  res.json = () => res.emit('finish');
  await new Promise(resolve => uploadValidation.single.upload('bukti_realisasi')(req, res, resolve));
  await controller.realisasi_bantuan(req, res);
  assert.equal(committed, true);
  assert.equal(res.statusCode, 500);
  assert(removed.includes('committed.pdf'));
  results.push({ proof: 'commit-uncertainty', simulatedDatabaseCommitted: committed, httpStatus: res.statusCode, removed });

  // Both requests pass the actual validator before either reaches the write.
  let state = 'belum_direalisasi';
  const validator = load('server/validation/bakal_penerima_bantuan.js', {
    '../models': { Realisasi_permohonan: { findOne: async () => ({ status: 'approve', status_realisasi: state }) } },
    '../helper/secureDocumentUploadHelper': { createSecureDocumentUpload: () => ({}) },
  });
  await Promise.all([validator.check_status_belum_direalisasi(1), validator.check_status_belum_direalisasi(1)]);
  let writes = 0;
  const RaceModel = load('server/modules/bakal_penerima_bantuan/models/model_cud.js', {
    ...helpers, '../models/model_r': Reads, '../../../helper/uploadStorageHelper': stored,
    '../../../models': {
      sequelize: { transaction: async () => transaction() },
      Realisasi_permohonan: { update: async (_, options) => {
        assert.deepEqual(Object.keys(options.where), ['id']);
        writes++; state = 'sudah_direalisasi'; return [1];
      } },
    },
  });
  const outcomes = [];
  for (const filename of ['first.pdf', 'second.pdf']) {
    const model = new RaceModel({ ...req, buktiRealisasiDocument: { filename } });
    await model.realisasi_bantuan(); outcomes.push(await model.response());
  }
  assert.equal(writes, 2); assert(outcomes.every(Boolean));
  results.push({ proof: 'realisasi-stale-validation', writes, successResponses: outcomes.length,
    note: 'Deterministic interleaving of two requests; not a live DB load test, no bank transfer.' });

  // Capability middleware + real multipart parser: no file is uploaded/written.
  const capability = load('server/helper/surveyCapabilityHelper.js', {
    '../models': { Surveyor_kegiatan: { findOne: async () => ({ id: 1, kegiatan_id: 10, access_code: 'trusted-code' }) } },
  });
  const express = serverRequire('express');
  const request = serverRequire('supertest');
  const multer = serverRequire('multer');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => {
    req.cookies = { survey_capability: capability.createCapabilityToken({ id: 1, access_code: 'trusted-code' }) }; next();
  });
  app.post('/submit', capability.requireSurveyCapability, multer().none(), (req, res) =>
    res.json({ capabilityId: req.surveyCapability.id, codeAfterParser: req.body.access_code || null }));
  const multipart = await request(app).post('/submit').field('member_id', '7').field('access_code', 'client-code');
  assert.equal(multipart.body.codeAfterParser, 'client-code');
  const absent = await request(app).post('/submit').field('member_id', '7');
  assert.equal(absent.body.codeAfterParser, null);
  results.push({ proof: 'survey-multipart-regression', suppliedCode: multipart.body, omittedCode: absent.body,
    note: 'Other active code still required by downstream validation; not proof of access without knowledge of that code.' });

  const surveyUpload = load('server/validation/survey_lapangan.js', {
    '../models': {},
    fs: { existsSync: () => true, mkdirSync() {} },
    '../helper/uploadedFileHelper': {
      SURVEY_UPLOAD_DIRECTORY: path.join(root, 'audit-never-written'),
      cleanupRequestUploads() {}, removeUploadedFiles() {},
    },
  });
  app.post('/survey-upload', capability.requireSurveyCapability, surveyUpload.uploadSurveyFiles,
    (req, res) => res.json({ fields: Object.keys(req.body).length }));
  let fieldRequest = request(app).post('/survey-upload');
  for (let i = 0; i < 80; i++) fieldRequest = fieldRequest.field('unused_' + i, 'x'.repeat(16 * 1024));
  const fieldResponse = await fieldRequest;
  assert.equal(fieldResponse.status, 200);
  assert.equal(fieldResponse.body.fields, 80);
  results.push({ proof: 'survey-unbounded-text-fields', acceptedFields: 80, textBytes: 80 * 16 * 1024,
    note: 'Actual survey parser accepts >1 MiB before validation. No OOM or production load test performed.' });

  const Decision = load('server/modules/validasi_permohonan_bantuan/models/model_cud.js', {
    ...helpers, '../models/model_r': Reads, '../../../helper/uploadStorageHelper': stored,
    '../../../models': { sequelize: { transaction: async () => transaction() },
      Op: serverRequire('sequelize').Op,
      Realisasi_permohonan: { findByPk: async () => ({ status: 'process' }) },
      Validasi_syarat_permohonan: { count: async () => 0 },
    },
  });
  const decision = new Decision({ body: { id: 1, biaya_disetujui: 100, send_wa: false } });
  await decision.approve_permohonan();
  assert.equal(decision.state, false);
  assert.equal(decision.message, 'Op is not defined');
  results.push({ proof: 'approval-regression', error: decision.message });
  console.log(JSON.stringify(results, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
