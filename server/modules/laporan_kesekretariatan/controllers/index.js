const { handleValidationErrors, handleServerError, messageError } = require("../../../helper/handleError");
const ExcelJS = require('exceljs');
const moment = require("moment");
const Model_r = require("../models/Model_r");
const { convertToRP } = require("../../../helper/currencyHelper");
const { kabupatenKota } = require("../../../helper/locationHelper");

const controllers = {};

controllers.get_tahun = async ( req, res ) => {
  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_tahun();
    if( feedBack.error ) {
      res.status(400).json({
        error: true,
        error_msg: 'Data laporan penyaluran tidak ditemukan',
      });
    }else{
      res.status(200).json({
        error: false,
        error_msg: 'Data laporan penyaluran ditemukan',
        data : feedBack.data, 
      });
    } 
  } catch (error) {
    handleServerError(res);
  }
}


controllers.download_excel_laporan_penyaluran = async (req, res) => {
  const list_asnaf = { fakir : 1, miskin : 2, muallaf : 3, gharim : 4, fisabilillah : 5, ibnu_sabil : 6, amil : 7 };
  const tahun = req.query.tahun;
  const asnaf = req.query.asnaf;
  const token = req.query.token;
  const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  try {

    // Buat workbook dan worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheetName = asnaf.toLowerCase() === 'amil' ? 'Laporan Kesekretariatan' : 'Asnaf ' + asnaf;
    const worksheet = workbook.addWorksheet(worksheetName);

    const Header = ['NO', 'TANGGAL', 'URAIAN', 'NIK', 'ALamat', 'KEC', 'KODE AKUN',  'KREDIT' ];

    const model_r = new Model_r(req);
    const asnafLowerCase = asnaf.toLowerCase();
    const data = asnafLowerCase === 'amil' ? await model_r.kegiatan_kesekretariatan(tahun) : await model_r.fn_asnaf(tahun, list_asnaf[asnafLowerCase]);

    const border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };
    var kabupatenKotas = await kabupatenKota();
    
    var title;
    if (asnafLowerCase === 'amil') {
      title = ['BAITUL MAL', kabupatenKotas.toUpperCase() , 'BUKU LAPORAN KESEKRETARIATAN' ,  ( tahun == '0' ? '' : 'TAHUN ' + tahun)];
    } else {
      title = ['BAITUL MAL', kabupatenKotas.toUpperCase() , 'BUKU PENYALURAN ASNAF ' + asnaf.toUpperCase().replace("_", " ") ,  ( tahun == '0' ? '' : 'TAHUN ' + tahun)];
    }


    var rows = 1;
    for( y in title ) {
      worksheet.mergeCells(`A${rows}:H${rows}`); 
      worksheet.getCell(`A${rows}`).value = title[y]; 
      worksheet.getCell(`A${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(`A${rows}`).font = { bold: true };
      rows++;
    }

    worksheet.addRow([]);
    rows++;

    for( x in data ) {
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = data[x].bulan;
      worksheet.getCell(`A${rows}`).alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.getCell(`A${rows}`).font = { bold: true };
      rows++;
      const headerRow = worksheet.addRow(Header);
      headerRow.eachCell(cell => {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = border;
          cell.font = { bold: true };
      });

      rows++;
      data[x].data.forEach(row => {
        const dataRow = worksheet.addRow(row);
        dataRow.eachCell(cell => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = border;
        });
        rows++;
      });

      worksheet.mergeCells(`A${rows}:F${rows}`); 
      worksheet.getCell(`A${rows}`).value = 'JUMLAH'; 
      worksheet.getCell(`A${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(`A${rows}`).border = border
      worksheet.getCell(`A${rows}`).font = { bold: true };
      worksheet.getCell(`G${rows}`).border = border;
      worksheet.getCell(`H${rows}`).value = data[x].total; 
      worksheet.getCell(`H${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(`H${rows}`).border = border
      worksheet.getCell(`H${rows}`).font = { bold: true };
      rows++;

      worksheet.addRow([]);
      rows++;
    }

    var tanda_tangan = await model_r.tanda_tangan();

    if( data.length > 0  ) {
      
      worksheet.mergeCells(`A${rows}:D${rows}`);
      worksheet.getCell(`A${rows}`).value = 'DIKETAHUI'; 
      worksheet.getCell(`A${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.mergeCells(`E${rows}:H${rows}`);
      worksheet.getCell(`E${rows}`).value = 'REDELONG,  '; 
      worksheet.getCell(`E${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      rows++;
      worksheet.mergeCells(`A${rows}:D${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_jabatan1; 
      worksheet.getCell(`A${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.mergeCells(`E${rows}:H${rows}`);
      worksheet.getCell(`E${rows}`).value = tanda_tangan.data.nama_jabatan2; 
      worksheet.getCell(`E${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      rows = rows + 4;
      worksheet.mergeCells(`A${rows}:D${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_pejabat1; 
      worksheet.getCell(`A${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.mergeCells(`E${rows}:H${rows}`);
      worksheet.getCell(`E${rows}`).value = tanda_tangan.data.nama_pejabat2; 
      worksheet.getCell(`E${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      rows++;
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = 'BAITUL MAL'; 
      worksheet.getCell(`A${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      rows++;
      worksheet.mergeCells(`A${rows}:H${rows}`);
      var kabupatenKotas = await kabupatenKota();
      worksheet.getCell(`A${rows}`).value = kabupatenKotas.toUpperCase(); 
      worksheet.getCell(`A${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      rows++;
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_jabatan3; 
      worksheet.getCell(`A${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };
      rows = rows + 4;
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_pejabat3; 
      worksheet.getCell(`A${rows}`).alignment = { horizontal: 'center', vertical: 'middle' };

    }

    worksheet.columns = [
        { key: 'nomor', width: 10 }, 
        { key: 'tanggal', width: 15 }, 
        { key: 'uraian', width: 35 },
        { key: 'nik', width: 20 },
        { key: 'alamat', width: 20 },  
        { key: 'kec', width: 10 },  
        { key: 'kode_akun', width: 20 },  
        { key: 'kredit', width: 20 },  
    ];
 
    const tahunText = tahun === '0' ? 'semua' : tahun;
    const fileName = asnafLowerCase === 'amil' 
      ? `laporan_kesekretariatan_tahun_${tahunText}_datetime:_${myDate}.xlsx`
      : `laporan_penyaluran_asnaf_${asnaf}_tahun_${tahunText}_datetime:_${myDate}.xlsx`;
      
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileName}`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("------------");
    console.log(error);
    console.log("------------");
    res.status(500).send('Terjadi kesalahan saat mengunduh file Excel');
  }
}

controllers.fn_asnaf = async (req, res) => {
  try {
    const { tahun, asnaf } = req.query;

    if (!tahun || !asnaf) {
      return res.status(400).json({
        error: true,
        error_msg: 'Parameter "tahun" dan "asnaf" dibutuhkan.',
      });
    }

    const model_r_instance = new Model_r(req);
    const feedBack = await model_r_instance.fn_asnaf(tahun, asnaf);

    if (feedBack.length === 0) {
      return res.status(200).json({
        error: false,
        error_msg: 'Data laporan penyaluran tidak ditemukan',
        data: [],
      });
    }

    res.status(200).json({
      error: false,
      error_msg: 'Data laporan penyaluran ditemukan',
      data: feedBack,
    });
  } catch (error) {
    console.error("ERROR in fn_asnaf controller:", error);
    res.status(500).json({ error: true, error_msg: "Internal Server Error" });
  }
};

controllers.kegiatan_kesekretariatan = async (req, res) => {
  try {
    const { tahun } = req.query;

    if (!tahun) {
      return res.status(400).json({
        error: true,
        error_msg: 'Parameter "tahun" dibutuhkan.',
      });
    }

    const model_r_instance = new Model_r(req);
    const feedBack = await model_r_instance.kegiatan_kesekretariatan(tahun);

    if (feedBack.length === 0) {
      return res.status(200).json({
        error: false,
        error_msg: 'Data laporan penyaluran tidak ditemukan',
        data: [],
      });
    }

    res.status(200).json({
      error: false,
      error_msg: 'Data laporan penyaluran ditemukan',
      data: feedBack,
    });
  } catch (error) {
    console.error("ERROR in fn_asnaf controller:", error);
    res.status(500).json({ error: true, error_msg: "Internal Server Error" });
  }
};

controllers.tanda_tangan = async (req, res) => {
  if (!(await handleValidationErrors(req, res))) return;

  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.tanda_tangan();

    res.status(200).json({
      error: false,
      data: feedBack.data,
      total: feedBack.total,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};



module.exports = controllers;
