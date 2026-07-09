const Model_r = require('./modules/rekap_distribusi_per_asnaf/models/model_r');
const req = { query: { year: 2026 } };
const model = new Model_r(req);
model.list_rekap_distribusi_per_asnaf().then(res => console.log(JSON.stringify(res, null, 2))).catch(console.error);
