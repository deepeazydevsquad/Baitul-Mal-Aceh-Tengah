const { Sequelize, DataTypes, Op } = require('sequelize');
const db = require('./models/index');

async function test() {
  try {
    const asnaf = '5';
    const tahun = '0';
    
    var where = {
      status: "approve",
      status_realisasi: "sudah_direalisasi",
    };

    const count = await db.Realisasi_permohonan.count({
      where: where,
      include: [
        {
          model: db.Permohonan,
          required: true,
          include: [
            {
              model: db.Kegiatan,
              required: true,
              where: {
                asnaf_id: asnaf,
              }
            }
          ]
        }
      ]
    });

    console.log("Count with asnaf=5:", count);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}

test();
