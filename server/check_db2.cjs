const db = require('./models/index');

async function test() {
  try {
    const list = await db.Kegiatan.findAll({
      attributes: ['asnaf_id', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['asnaf_id'],
      raw: true
    });
    console.log("Kegiatan by asnaf_id:", list);

    const r_list = await db.Realisasi_permohonan.findAll({
      include: [
        {
          model: db.Permohonan,
          include: [db.Kegiatan]
        }
      ],
      raw: true
    });
    console.log("Total Realisasi_permohonan records:", r_list.length);
    let counts = {};
    for (const r of r_list) {
      const asnaf_id = r['Permohonan.Kegiatan.asnaf_id'];
      counts[asnaf_id] = (counts[asnaf_id] || 0) + 1;
    }
    console.log("Realisasi by asnaf_id:", counts);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}

test();
