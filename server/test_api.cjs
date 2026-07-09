const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, role: 'admin' }, '9813kbk31023khvviuytyuwqkiwvj9mnb757uytr34nm123o', { expiresIn: '1h' });

async function test() {
  try {
    console.log("Sending with token:", token);
    const res = await axios.get('http://localhost:3003/rekap_distribusi_per_asnaf/list?year=2026', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      validateStatus: () => true
    });
    console.log(res.status);
    console.log(JSON.stringify(res.data).substring(0, 500));
  } catch (err) {
    console.error(err.message);
  }
}
test();
