const axios = require('axios');
const jwt = require('jsonwebtoken');
async function test() {
  try {
    const token = jwt.sign({ id: 1, role: 'admin' }, '9813kbk31023khvviuytyuwqkiwvj9mnb757uytr34nm123o', { expiresIn: '1h' });
    const res = await axios.get('http://localhost:3003/rekap_distribusi_per_asnaf/list?year=2026', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("STATUS:", res.status);
    console.log("DATA:", res.data);
  } catch (err) {
    console.error("ERROR:", err.message);
    if(err.response) console.error(err.response.data);
  }
}
test();
