const {
  handleValidationErrors,
  handleServerError,
  messageError,
} = require("../../../helper/handleError");
const ExcelJS = require("exceljs");
const moment = require("moment");
const Model_r = require("../models/Model_r");
const { convertToRP } = require("../../../helper/currencyHelper");
const { kabupatenKota } = require("../../../helper/locationHelper");

const controllers = {};

controllers.get_tahun = async (req, res) => {
  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.get_tahun();
    if (feedBack.error) {
      res.status(400).json({
        error: true,
        error_msg: "Data laporan penyaluran tidak ditemukan",
      });
    } else {
      res.status(200).json({
        error: false,
        error_msg: "Data laporan penyaluran ditemukan",
        data: feedBack.data,
      });
    }
  } catch (error) {
    handleServerError(res);
  }
};

controllers.info = async (req, res) => {
  try {
    const model_r = new Model_r(req);
    const feedBack = await model_r.info_laporan_umum();
    if (feedBack.error) {
      res.status(400).json({
        error: true,
        error_msg: "Data laporan umum tidak ditemukan",
      });
    } else {
      res.status(200).json({
        error: false,
        error_msg: "Data laporan umum ditemukan",
        data: feedBack.data,
      });
    }
  } catch (error) {
    handleServerError(res);
  }
};

controllers.download_excel_laporan_penyaluran = async (req, res) => {
  const list_asnaf = {
    fakir: 1,
    miskin: 2,
    muallaf: 3,
    gharim: 4,
    fisabilillah: 5,
    ibnu_sabil: 6,
    amil: 7,
  };
  const tahun = req.query.tahun;
  const asnaf = req.query.asnaf;
  const token = req.query.token;
  const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  try {
    console.log("------------");
    console.log("------------SSS");
    console.log("------------");

    // Buat workbook dan worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Asnaf " + asnaf);

    const Header = [
      "NO",
      "TANGGAL",
      "URAIAN",
      "NIK",
      "ALAMAT",
      "KEC",
      "KODE AKUN",
      "KREDIT",
    ];

    const model_r = new Model_r(req);
    const asnafLowerCase = asnaf?.toLowerCase?.() || "";

    const data =
      asnafLowerCase === "amil"
        ? await model_r.fn_asnaf_amil(tahun)
        : await model_r.fn_asnaf(tahun, list_asnaf[asnafLowerCase]);

    const border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
    var kabupatenKotas = await kabupatenKota();
    var title = [
      "BAITUL MAL",
      kabupatenKotas.toUpperCase(),
      "BUKU PENYALURAN ASNAF " + asnaf.toUpperCase().replace("_", " "),
      tahun == "0" ? "" : "TAHUN " + tahun,
    ];

    var rows = 1;
    for (y in title) {
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = title[y];
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(`A${rows}`).font = { bold: true };
      rows++;
    }

    worksheet.addRow([]);
    rows++;

    console.log("------------Data");
    console.log(data);
    console.log("------------Data");

    for (x in data) {
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = data[x].bulan;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "left",
        vertical: "middle",
      };
      worksheet.getCell(`A${rows}`).font = { bold: true };
      rows++;
      const headerRow = worksheet.addRow(Header);
      headerRow.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = border;
        cell.font = { bold: true };
      });

      rows++;
      data[x].data.forEach((row) => {
        const dataRow = worksheet.addRow(row);
        dataRow.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = border;
        });
        rows++;
      });

      worksheet.mergeCells(`A${rows}:F${rows}`);
      worksheet.getCell(`A${rows}`).value = "JUMLAH";
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(`A${rows}`).border = border;
      worksheet.getCell(`A${rows}`).font = { bold: true };
      worksheet.getCell(`G${rows}`).border = border;
      worksheet.getCell(`H${rows}`).value = data[x].total;
      worksheet.getCell(`H${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(`H${rows}`).border = border;
      worksheet.getCell(`H${rows}`).font = { bold: true };
      rows++;

      worksheet.addRow([]);
      rows++;
    }

    var tanda_tangan = await model_r.tanda_tangan();

    if (data.length > 0) {
      worksheet.mergeCells(`A${rows}:D${rows}`);
      worksheet.getCell(`A${rows}`).value = "DIKETAHUI";
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`E${rows}:H${rows}`);
      worksheet.getCell(`E${rows}`).value = "REDELONG,  ";
      worksheet.getCell(`E${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:D${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_jabatan1;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`E${rows}:H${rows}`);
      worksheet.getCell(`E${rows}`).value = tanda_tangan.data.nama_jabatan2;
      worksheet.getCell(`E${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows = rows + 4;
      worksheet.mergeCells(`A${rows}:D${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_pejabat1;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`E${rows}:H${rows}`);
      worksheet.getCell(`E${rows}`).value = tanda_tangan.data.nama_pejabat2;
      worksheet.getCell(`E${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = "BAITUL MAL";
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:H${rows}`);
      var kabupatenKotas = await kabupatenKota();
      worksheet.getCell(`A${rows}`).value = kabupatenKotas.toUpperCase();
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_jabatan3;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows = rows + 4;
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_pejabat3;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    }

    worksheet.columns = [
      { key: "nomor", width: 10 },
      { key: "tanggal", width: 15 },
      { key: "uraian", width: 35 },
      { key: "nik", width: 20 },
      { key: "alamat", width: 20 },
      { key: "kec", width: 10 },
      { key: "kode_akun", width: 20 },
      { key: "kredit", width: 20 },
    ];

    // Set header untuk mengunduh file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_penyaluran_asnaf_${asnaf}_tahun_${
        tahun === "0" ? "semua" : tahun
      }_datetime:_${myDate}.xlsx`
    );

    // Kirim file Excel
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("------------");
    console.log(error);
    console.log("------------");
    res.status(500).send("Terjadi kesalahan saat mengunduh file Excel");
  }
};

controllers.download_excel_laporan_all_penyaluran = async (req, res) => {
  const list_asnaf = {
    fakir: 1,
    miskin: 2,
    muallaf: 3,
    gharim: 4,
    fisabilillah: 5,
    ibnu_sabil: 6,
    amil: 7,
  };
  const tahun = req.query.tahun;
  const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  try {
    const Header = [
      "NO",
      "TANGGAL",
      "URAIAN",
      "NIK",
      "ALAMAT",
      "KEC",
      "KODE AKUN",
      "KREDIT",
    ];
    const border = {
      top: { style: "double", color: { argb: "FF000000" } },
      left: { style: "double", color: { argb: "FF000000" } },
      bottom: { style: "double", color: { argb: "FF000000" } },
      right: { style: "double", color: { argb: "FF000000" } },
    };
    // get data
    const model_r = new Model_r(req);
    const info = await model_r.fn_get_data(tahun);
    // Buat workbook dan worksheet
    const workbook = new ExcelJS.Workbook();
    // var worksheet = {};
    // var title = {};
    for (let x in list_asnaf) {
      var data = info[x];

      console.log("xxxx");
      console.log(data);
      console.log("xxxx");

      var kabupatenKotas = await kabupatenKota();
      var worksheet = workbook.addWorksheet("Asnaf " + x);
      var title = [
        "BAITUL MAL",
        kabupatenKotas.toUpperCase(),
        "BUKU PENYALURAN ASNAF " + x.toUpperCase().replace("_", " "),
        tahun == "0" ? "" : "TAHUN " + tahun,
      ];
      var rows = 1;
      for (y in title) {
        worksheet.mergeCells(`A${rows}:H${rows}`);
        worksheet.getCell(`A${rows}`).value = title[y];
        worksheet.getCell(`A${rows}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(`A${rows}`).font = { bold: true };
        rows++;
      }

      worksheet.addRow([]);
      rows++;

      for (x in data) {
        worksheet.mergeCells(`A${rows}:H${rows}`);
        worksheet.getCell(`A${rows}`).value = data[x].bulan;
        worksheet.getCell(`A${rows}`).alignment = {
          horizontal: "left",
          vertical: "middle",
        };
        worksheet.getCell(`A${rows}`).font = { bold: true };
        rows++;

        var headerRow = worksheet.addRow(Header);
        headerRow.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = border;
          cell.font = { bold: true };
        });

        rows++;
        data[x].data.forEach((row) => {
          var dataRow = worksheet.addRow(row);
          dataRow.eachCell((cell) => {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = border;
          });
          rows++;
        });

        worksheet.mergeCells(`A${rows}:F${rows}`);
        worksheet.getCell(`A${rows}`).value = "JUMLAH";
        worksheet.getCell(`A${rows}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(`A${rows}`).border = border;
        worksheet.getCell(`A${rows}`).font = { bold: true };
        worksheet.getCell(`G${rows}`).border = border;
        worksheet.getCell(`H${rows}`).value = data[x].total;
        worksheet.getCell(`H${rows}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(`H${rows}`).border = border;
        worksheet.getCell(`H${rows}`).font = { bold: true };
        rows++;

        worksheet.addRow([]);
        rows++;
      }
      worksheet.columns = [
        { key: "nomor", width: 10 },
        { key: "tanggal", width: 15 },
        { key: "uraian", width: 25 },
        { key: "nik", width: 20 },
        { key: "alamat", width: 20 },
        { key: "kec", width: 10 },
        { key: "kode_akun", width: 20 },
        { key: "kredit", width: 20 },
      ];
    }
    // Set header untuk mengunduh file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_penyaluran_seluruh_asnaf_tahun_${
        tahun === "0" ? "semua" : tahun
      }_datetime:_${myDate}.xlsx`
    );
    // Kirim file Excel
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).send("Terjadi kesalahan saat mengunduh file Excel");
  }
};

controllers.download_excel_laporan_rekap_penyaluran_per_asnaf = async (
  req,
  res
) => {
  const list_asnaf = {
    fakir: 1,
    miskin: 2,
    muallaf: 3,
    gharim: 4,
    fisabilillah: 5,
    ibnu_sabil: 6,
    amil: 7,
  };
  const tahun = req.query.tahun;
  const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  try {
    console.log("------------------");
    console.log("------------------");
    console.log("------------------");

    // const Header = ['NO', 'TANGGAL', 'URAIAN', 'NIK', 'ALAMAT', 'KEC', 'KODE AKUN',  'KREDIT' ];
    const border = {
      top: { style: "double", color: { argb: "FF000000" } },
      left: { style: "double", color: { argb: "FF000000" } },
      bottom: { style: "double", color: { argb: "FF000000" } },
      right: { style: "double", color: { argb: "FF000000" } },
    };

    const fill = {
      type: "pattern", // Tipe pola
      pattern: "solid", // Pola solid
      fgColor: { argb: "FFD3D3D3" }, // Warna merah (ARGB) AFAFAF00
    };
    // // get data
    const model_r = new Model_r(req);
    const data = await model_r.fn_get_data_laporan_rekap_per_asnaf(tahun);
    // Buat workbook dan worksheet
    const workbook = new ExcelJS.Workbook();
    var worksheet = {};
    var worksheet = workbook.addWorksheet("Rekap");
    var kabupatenKotas = await kabupatenKota();
    var title = [
      "BAITUL MAL",
      kabupatenKotas.toUpperCase(),
      "REKAPITULASI PENYALURAN PER ASNAF ",
      tahun == "0" ? "" : "TAHUN " + tahun,
    ];
    var rows = 1;
    for (y in title) {
      worksheet.mergeCells(`A${rows}:O${rows}`);
      worksheet.getCell(`A${rows}`).value = title[y];
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(`A${rows}`).font = { bold: true };
      rows++;
    }

    worksheet.addRow([]);
    rows++;
    // sDefine Header
    worksheet.mergeCells(`A${rows}:A${rows + 1}`);
    worksheet.mergeCells(`B${rows}:B${rows + 1}`);
    worksheet.mergeCells(`C${rows}:N${rows}`);
    worksheet.mergeCells(`O${rows}:O${rows + 1}`);
    worksheet.getCell(`A${rows}`).value = "NO";
    worksheet.getCell(`A${rows}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`A${rows}`).border = border;
    worksheet.getCell(`A${rows}`).fill = fill;
    worksheet.getCell(`B${rows}`).value = "URAIAN";
    worksheet.getCell(`B${rows}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`B${rows}`).border = border;
    worksheet.getCell(`B${rows}`).fill = fill;
    worksheet.getCell(`C${rows}`).value = "BULAN";
    worksheet.getCell(`C${rows}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`C${rows}`).border = border;
    worksheet.getCell(`C${rows}`).fill = fill;
    worksheet.getCell(`O${rows}`).value = "JUMLAH";
    worksheet.getCell(`O${rows}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`O${rows}`).border = border;
    worksheet.getCell(`O${rows}`).fill = fill;
    worksheet.getCell(`C${rows + 1}`).value = "JAN";
    worksheet.getCell(`C${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`C${rows + 1}`).border = border;
    worksheet.getCell(`C${rows + 1}`).fill = fill;
    worksheet.getCell(`D${rows + 1}`).value = "FEB";
    worksheet.getCell(`D${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`D${rows + 1}`).border = border;
    worksheet.getCell(`D${rows + 1}`).fill = fill;
    worksheet.getCell(`E${rows + 1}`).value = "MAR";
    worksheet.getCell(`E${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`E${rows + 1}`).border = border;
    worksheet.getCell(`E${rows + 1}`).fill = fill;
    worksheet.getCell(`F${rows + 1}`).value = "APR";
    worksheet.getCell(`F${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`F${rows + 1}`).border = border;
    worksheet.getCell(`F${rows + 1}`).fill = fill;
    worksheet.getCell(`G${rows + 1}`).value = "MEI";
    worksheet.getCell(`G${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`G${rows + 1}`).border = border;
    worksheet.getCell(`G${rows + 1}`).fill = fill;
    worksheet.getCell(`H${rows + 1}`).value = "JUN";
    worksheet.getCell(`H${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`H${rows + 1}`).border = border;
    worksheet.getCell(`H${rows + 1}`).fill = fill;
    worksheet.getCell(`I${rows + 1}`).value = "JUL";
    worksheet.getCell(`I${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`I${rows + 1}`).border = border;
    worksheet.getCell(`I${rows + 1}`).fill = fill;
    worksheet.getCell(`J${rows + 1}`).value = "AGS";
    worksheet.getCell(`J${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`J${rows + 1}`).border = border;
    worksheet.getCell(`J${rows + 1}`).fill = fill;
    worksheet.getCell(`K${rows + 1}`).value = "SEP";
    worksheet.getCell(`K${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`K${rows + 1}`).border = border;
    worksheet.getCell(`K${rows + 1}`).fill = fill;
    worksheet.getCell(`L${rows + 1}`).value = "OKT";
    worksheet.getCell(`L${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`L${rows + 1}`).border = border;
    worksheet.getCell(`L${rows + 1}`).fill = fill;
    worksheet.getCell(`M${rows + 1}`).value = "NOV";
    worksheet.getCell(`M${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`M${rows + 1}`).border = border;
    worksheet.getCell(`M${rows + 1}`).fill = fill;
    worksheet.getCell(`N${rows + 1}`).value = "DES";
    worksheet.getCell(`N${rows + 1}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`N${rows + 1}`).border = border;
    worksheet.getCell(`N${rows + 1}`).fill = fill;

    var huruf = [
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
    ];

    rows = rows + 2;
    for (let index = 0; index <= 1; index++) {
      var i = 1;
      var total_rupiah_permohonan_asnaf_perbulan = {};
      for (x in data.feedBack) {
        worksheet.getCell(`A${rows}`).value = i;
        worksheet.getCell(`A${rows}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(`A${rows}`).border = border;
        worksheet.getCell(`B${rows}`).value = data.feedBack[x].name;
        worksheet.getCell(`B${rows}`).alignment = {
          horizontal: "left",
          vertical: "middle",
        };
        worksheet.getCell(`B${rows}`).border = border;
        var c = 0;
        if (index === 0) {
          var total_rupiah = 0;
          for (let y in data.feedBack[x].total_rupiah) {
            worksheet.getCell(`${huruf[c]}${rows}`).value = await convertToRP(
              data.feedBack[x].total_rupiah[y]
            );
            worksheet.getCell(`${huruf[c]}${rows}`).alignment = {
              horizontal: "center",
              vertical: "middle",
            };
            worksheet.getCell(`${huruf[c]}${rows}`).border = border;
            total_rupiah = total_rupiah + data.feedBack[x].total_rupiah[y];

            if (
              total_rupiah_permohonan_asnaf_perbulan[huruf[c]] === undefined
            ) {
              total_rupiah_permohonan_asnaf_perbulan = {
                ...total_rupiah_permohonan_asnaf_perbulan,
                ...{ [huruf[c]]: data.feedBack[x].total_rupiah[y] },
              };
            } else {
              total_rupiah_permohonan_asnaf_perbulan[huruf[c]] =
                total_rupiah_permohonan_asnaf_perbulan[huruf[c]] +
                data.feedBack[x].total_rupiah[y];
            }
            c++;
          }
          worksheet.getCell(`${huruf[c]}${rows}`).value = await convertToRP(
            total_rupiah
          );
          worksheet.getCell(`${huruf[c]}${rows}`).alignment = {
            horizontal: "center",
            vertical: "middle",
          };
          worksheet.getCell(`${huruf[c]}${rows}`).border = border;
        } else {
          var total_pemohon = 0;
          for (let y in data.feedBack[x].total_pemohon) {
            worksheet.getCell(`${huruf[c]}${rows}`).value =
              data.feedBack[x].total_pemohon[y];
            worksheet.getCell(`${huruf[c]}${rows}`).alignment = {
              horizontal: "center",
              vertical: "middle",
            };
            worksheet.getCell(`${huruf[c]}${rows}`).border = border;
            total_pemohon = total_pemohon + data.feedBack[x].total_pemohon[y];

            if (
              total_rupiah_permohonan_asnaf_perbulan[huruf[c]] === undefined
            ) {
              total_rupiah_permohonan_asnaf_perbulan = {
                ...total_rupiah_permohonan_asnaf_perbulan,
                ...{ [huruf[c]]: data.feedBack[x].total_pemohon[y] },
              };
            } else {
              total_rupiah_permohonan_asnaf_perbulan[huruf[c]] =
                total_rupiah_permohonan_asnaf_perbulan[huruf[c]] +
                data.feedBack[x].total_pemohon[y];
            }
            c++;
          }
          worksheet.getCell(`${huruf[c]}${rows}`).value = total_pemohon;
          worksheet.getCell(`${huruf[c]}${rows}`).alignment = {
            horizontal: "center",
            vertical: "middle",
          };
          worksheet.getCell(`${huruf[c]}${rows}`).border = border;
        }
        rows++;
        i++;
      }
      worksheet.mergeCells(`A${rows}:B${rows}`);
      worksheet.getCell(`A${rows}`).value = "TOTAL";
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "right",
        vertical: "middle",
      };
      worksheet.getCell(`A${rows}`).border = border;
      var total_total = 0;
      for (let u in huruf) {
        if (huruf[u] != "O") {
          worksheet.getCell(`${huruf[u]}${rows}`).value =
            index === 0
              ? await convertToRP(
                  total_rupiah_permohonan_asnaf_perbulan[huruf[u]]
                )
              : total_rupiah_permohonan_asnaf_perbulan[huruf[u]];
          worksheet.getCell(`${huruf[u]}${rows}`).alignment = {
            horizontal: "center",
            vertical: "middle",
          };
          worksheet.getCell(`${huruf[u]}${rows}`).border = border;
          total_total =
            total_total + total_rupiah_permohonan_asnaf_perbulan[huruf[u]];
        }
      }
      worksheet.getCell(`O${rows}`).value =
        index === 0 ? await convertToRP(total_total) : total_total;
      worksheet.getCell(`O${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(`O${rows}`).border = border;

      rows++;
    }

    rows = rows + 2;

    var tanda_tangan = await model_r.tanda_tangan();

    console.log("______________________________A");
    console.log(data);
    console.log(data.feedBack);
    console.log("______________________________A");

    if (Object.keys(data.feedBack).length > 0) {
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = "DIKETAHUI";
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`I${rows}:O${rows}`);
      worksheet.getCell(`I${rows}`).value = "REDELONG,  ";
      worksheet.getCell(`I${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_jabatan1;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`I${rows}:O${rows}`);
      worksheet.getCell(`I${rows}`).value = tanda_tangan.data.nama_jabatan2;
      worksheet.getCell(`I${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows = rows + 4;
      worksheet.mergeCells(`A${rows}:H${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_pejabat1;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`I${rows}:O${rows}`);
      worksheet.getCell(`I${rows}`).value = tanda_tangan.data.nama_pejabat2;
      worksheet.getCell(`I${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:O${rows}`);
      worksheet.getCell(`A${rows}`).value = "BAITUL MAL";
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:O${rows}`);
      var kabupatenKotas = await kabupatenKota();
      worksheet.getCell(`A${rows}`).value = kabupatenKotas.toUpperCase();
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:O${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_jabatan3;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows = rows + 4;
      worksheet.mergeCells(`A${rows}:O${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_pejabat3;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    }

    worksheet.columns = [
      { key: "nomor", width: 5 },
      { key: "uraian", width: 25 },
      { key: "jan", width: 15 },
      { key: "feb", width: 15 },
      { key: "mar", width: 15 },
      { key: "apr", width: 15 },
      { key: "mei", width: 15 },
      { key: "jun", width: 15 },
      { key: "jul", width: 15 },
      { key: "ags", width: 15 },
      { key: "sep", width: 15 },
      { key: "okt", width: 15 },
      { key: "nov", width: 15 },
      { key: "des", width: 15 },
      { key: "jumlah", width: 25 },
    ];

    // Set header untuk mengunduh file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_rekap_penyaluran_per_asnaf_tahun_${
        tahun === "0" ? "semua" : tahun
      }_datetime:_${myDate}.xlsx`
    );
    // Kirim file Excel
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("----------------");
    console.log(error);
    console.log("----------------");
    res.status(500).send("Terjadi kesalahan saat mengunduh file Excel");
  }
};

function paramStyle(i) {
  var param = {
    value: i.value,
    alignment: { horizontal: "center", vertical: "middle" },
    border: i.border,
  };
  if (i.fill !== undefined) param = { ...param, ...{ fill: i.fill } };
  return param;
}

controllers.download_excel_laporan_rekap_penyaluran_per_kode_asnaf = async (
  req,
  res
) => {
  const list_asnaf = {
    fakir: 1,
    miskin: 2,
    muallaf: 3,
    gharim: 4,
    fisabilillah: 5,
    ibnu_sabil: 6,
    amil: 7,
  };
  const tahun = req.query.tahun;
  const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  try {
    const border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    var huruf = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];
    var bulan = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MEI",
      "JUN",
      "JUL",
      "AGS",
      "SEP",
      "OKT",
      "NOV",
      "DES",
    ];

    const fill = {
      type: "pattern", // Tipe pola
      pattern: "solid", // Pola solid
      fgColor: { argb: "FFD3D3D3" }, // Warna merah (ARGB) AFAFAF00
    };
    // // get data
    const model_r = new Model_r(req);
    const data = await model_r.fn_get_data_laporan_rekap_per_kode_asnaf(tahun);
    // Buat workbook dan worksheet
    const workbook = new ExcelJS.Workbook();
    var worksheet = {};
    var worksheet = workbook.addWorksheet("Rekap");
    var kabupatenKotas = await kabupatenKota();
    var title = [
      "BAITUL MAL",
      kabupatenKotas.toUpperCase(),
      "REKAPITULASI PENYALURAN PER KODE ASNAF ",
      tahun == "0" ? "" : "TAHUN " + tahun,
    ];
    var rows = 1;
    for (y in title) {
      worksheet.mergeCells(`A${rows}:Z${rows}`);
      worksheet.getCell(`A${rows}`).value = title[y];
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(`A${rows}`).font = { bold: true };
      rows++;
    }

    worksheet.addRow([]);

    worksheet.mergeCells(`B${rows}:M${rows}`);
    worksheet.getCell(`A${rows}`).value = "ASNAF";
    worksheet.getCell(`A${rows}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`A${rows}`).border = border;
    worksheet.getCell(`A${rows}`).fill = fill;
    worksheet.getCell(`B${rows}`).value = "KODE";
    worksheet.getCell(`B${rows}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`B${rows}`).border = border;
    worksheet.getCell(`B${rows}`).fill = fill;
    worksheet.getCell(`Z${rows}`).value = "JUMLAH";
    worksheet.getCell(`Z${rows}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`Z${rows}`).border = border;
    worksheet.getCell(`Z${rows}`).fill = fill;

    for (let bul in bulan) {
      worksheet.getCell(
        `${huruf[(parseInt(bul) + 13).toString()]}${rows}`
      ).value = bulan[bul];
      worksheet.getCell(
        `${huruf[(parseInt(bul) + 13).toString()]}${rows}`
      ).alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getCell(
        `${huruf[(parseInt(bul) + 13).toString()]}${rows}`
      ).border = border;
      worksheet.getCell(
        `${huruf[(parseInt(bul) + 13).toString()]}${rows}`
      ).fill = fill;
    }

    rows++;

    var rowsA = rows;

    for (let x in data.feedBack) {
      var z = data.feedBack[x];
      var detail = data.feedBack[x].detail;
      var t = 0;
      var kode = z.kode?.trim()?.split(".")?.join("") || "00";
      var kodeSplit = kode.split("");

      if (Object.keys(detail).length > 0) {
        var total_total = {
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
          7: 0,
          8: 0,
          9: 0,
          10: 0,
          11: 0,
        };

        for (let y in detail) {
          var kod = detail[y].kode;
          var detail_penyaluran = detail[y].detail_penyaluran;

          if (t === 0) {
            var end = rowsA + z.rows;

            worksheet.mergeCells(`A${rowsA}:A${end}`);
            worksheet.getCell(`A${rowsA}`).value = z.name
              .trim()
              .split("Asnaf")
              .join("\n");
            worksheet.getCell(`A${rowsA}`).alignment = {
              horizontal: "center",
              vertical: "middle",
            };
            worksheet.getCell(`A${rowsA}`).border = border;

            rowsA = end + 1;

            for (let f in kodeSplit) {
              worksheet.getCell(
                `${huruf[(parseInt(f) + 1).toString()]}${rows}`
              ).value = kodeSplit[f];
              worksheet.getCell(
                `${huruf[(parseInt(f) + 1).toString()]}${rows}`
              ).alignment = { horizontal: "center", vertical: "middle" };
              worksheet.getCell(
                `${huruf[(parseInt(f) + 1).toString()]}${rows}`
              ).border = border;
            }

            if (kod !== "") {
              var kod2 = kod.split("");
              worksheet.getCell(`L${rows}`).value = kod2[0];
              worksheet.getCell(`L${rows}`).alignment = {
                horizontal: "center",
                vertical: "middle",
              };
              worksheet.getCell(`L${rows}`).border = border;

              worksheet.getCell(`M${rows}`).value = kod2[1];
              worksheet.getCell(`M${rows}`).alignment = {
                horizontal: "center",
                vertical: "middle",
              };
              worksheet.getCell(`M${rows}`).border = border;
            }
          } else {
            for (let f in kodeSplit) {
              worksheet.getCell(
                `${huruf[(parseInt(f) + 1).toString()]}${rows}`
              ).value = kodeSplit[f];
              worksheet.getCell(
                `${huruf[(parseInt(f) + 1).toString()]}${rows}`
              ).alignment = { horizontal: "center", vertical: "middle" };
              worksheet.getCell(
                `${huruf[(parseInt(f) + 1).toString()]}${rows}`
              ).border = border;
            }
            if (kod !== "") {
              var kod2 = kod.split("");
              worksheet.getCell(`L${rows}`).value = kod2[0];
              worksheet.getCell(`L${rows}`).alignment = {
                horizontal: "center",
                vertical: "middle",
              };
              worksheet.getCell(`L${rows}`).border = border;

              worksheet.getCell(`M${rows}`).value = kod2[1];
              worksheet.getCell(`M${rows}`).alignment = {
                horizontal: "center",
                vertical: "middle",
              };
              worksheet.getCell(`M${rows}`).border = border;
            }
          }

          var nilai = 13;
          var total_row = 0;
          for (let r in detail_penyaluran) {
            total_total[r] = total_total[r] + detail_penyaluran[r];
            total_row = total_row + detail_penyaluran[r];
            worksheet.getCell(`${huruf[nilai.toString()]}${rows}`).value =
              await convertToRP(detail_penyaluran[r]);
            worksheet.getCell(`${huruf[nilai.toString()]}${rows}`).alignment = {
              horizontal: "center",
              vertical: "middle",
            };
            worksheet.getCell(`${huruf[nilai.toString()]}${rows}`).border =
              border;
            nilai++;
          }
          worksheet.getCell(`${huruf[nilai.toString()]}${rows}`).value =
            await convertToRP(total_row);
          worksheet.getCell(`${huruf[nilai.toString()]}${rows}`).alignment = {
            horizontal: "center",
            vertical: "middle",
          };
          worksheet.getCell(`${huruf[nilai.toString()]}${rows}`).border =
            border;
          rows++;
          t++;
        }

        worksheet.mergeCells(`B${rows}:M${rows}`);
        worksheet.getCell(`B${rows}`).value = "JUMLAH";
        worksheet.getCell(`B${rows}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(`B${rows}`).border = border;

        var start = 13;
        var ttotal = 0;
        for (let o in total_total) {
          worksheet.getCell(`${huruf[start.toString()]}${rows}`).value =
            await convertToRP(total_total[o]);
          worksheet.getCell(`${huruf[start.toString()]}${rows}`).alignment = {
            horizontal: "center",
            vertical: "middle",
          };
          worksheet.getCell(`${huruf[start.toString()]}${rows}`).border =
            border;
          ttotal = ttotal + total_total[o];
          start++;
        }

        worksheet.getCell(`${huruf[start.toString()]}${rows}`).value =
          await convertToRP(ttotal);
        worksheet.getCell(`${huruf[start.toString()]}${rows}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(`${huruf[start.toString()]}${rows}`).border = border;

        rows++;
      }
    }

    rows = rows + 2;

    var tanda_tangan = await model_r.tanda_tangan();

    console.log("______________________________A");
    console.log(data);
    console.log(data.feedBack);
    console.log("______________________________A");

    if (Object.keys(data.feedBack).length > 0) {
      worksheet.mergeCells(`A${rows}:R${rows}`);
      worksheet.getCell(`A${rows}`).value = "DIKETAHUI";
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`S${rows}:Z${rows}`);
      worksheet.getCell(`S${rows}`).value = "REDELONG,  ";
      worksheet.getCell(`S${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:R${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_jabatan1;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`S${rows}:Z${rows}`);
      worksheet.getCell(`S${rows}`).value = tanda_tangan.data.nama_jabatan2;
      worksheet.getCell(`S${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows = rows + 4;
      worksheet.mergeCells(`A${rows}:R${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_pejabat1;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`S${rows}:Z${rows}`);
      worksheet.getCell(`S${rows}`).value = tanda_tangan.data.nama_pejabat2;
      worksheet.getCell(`S${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:Z${rows}`);
      worksheet.getCell(`A${rows}`).value = "BAITUL MAL";
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:Z${rows}`);
      var kabupatenKotas = await kabupatenKota();
      worksheet.getCell(`A${rows}`).value = kabupatenKotas.toUpperCase();
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:Z${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_jabatan3;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows = rows + 4;
      worksheet.mergeCells(`A${rows}:Z${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_pejabat3;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    }

    worksheet.columns = [
      { key: "nomor", width: 15 },
      { key: "kode1", width: 5 },
      { key: "kode2", width: 5 },
      { key: "kode3", width: 5 },
      { key: "kode4", width: 5 },
      { key: "kode5", width: 5 },
      { key: "kode6", width: 5 },
      { key: "kode7", width: 5 },
      { key: "kode8", width: 5 },
      { key: "kode9", width: 5 },
      { key: "kode10", width: 5 },
      { key: "kode11", width: 5 },
      { key: "kode12", width: 5 },
      { key: "jan", width: 15 },
      { key: "feb", width: 15 },
      { key: "mar", width: 15 },
      { key: "apr", width: 15 },
      { key: "mei", width: 15 },
      { key: "jun", width: 15 },
      { key: "jul", width: 15 },
      { key: "ags", width: 15 },
      { key: "sep", width: 15 },
      { key: "okt", width: 15 },
      { key: "nov", width: 15 },
      { key: "des", width: 15 },
      { key: "jumlah", width: 25 },
    ];

    // Set header untuk mengunduh file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_rekap_penyaluran_per_kode_asnaf_tahun_${
        tahun === "0" ? "semua" : tahun
      }_datetime:_${myDate}.xlsx`
    );
    // Kirim file Excel
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("-----------------------------");
    console.log(error);
    console.log("-----------------------------");

    res.status(500).send("Terjadi kesalahan saat mengunduh file Excel");
  }
};

controllers.download_excel_laporan_rekap_penyaluran_per_kecamatan = async (
  req,
  res
) => {
  const list_asnaf = {
    fakir: 1,
    miskin: 2,
    muallaf: 3,
    gharim: 4,
    fisabilillah: 5,
    ibnu_sabil: 6,
    amil: 7,
  };
  const tahun = req.query.tahun;
  const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  try {
    const border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    var huruf = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];
    var bulan = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MEI",
      "JUN",
      "JUL",
      "AGS",
      "SEP",
      "OKT",
      "NOV",
      "DES",
    ];

    var total_total = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
      11: 0,
    };

    const fill = {
      type: "pattern", // Tipe pola
      pattern: "solid", // Pola solid
      fgColor: { argb: "FFD3D3D3" }, // Warna merah (ARGB) AFAFAF00
    };

    // get data
    const model_r = new Model_r(req);
    const data = await model_r.fn_get_data_laporan_rekap_per_kecamatan(tahun);

    console.log("++++++++++++++++++++ data ");
    console.log(data);
    console.log("++++++++++++++++++++ data ");

    // Buat workbook dan worksheet
    const workbook = new ExcelJS.Workbook();
    var worksheet = {};
    var worksheet = workbook.addWorksheet("Rekap");
    var kabupatenKotas = await kabupatenKota();
    var title = [
      "BAITUL MAL",
      kabupatenKotas.toUpperCase(),
      "REKAPITULASI PENYALURAN PER KECAMATAN ",
      tahun == "0" ? "" : "TAHUN " + tahun,
    ];
    var rows = 1;
    for (y in title) {
      worksheet.mergeCells(`A${rows}:N${rows}`);
      worksheet.getCell(`A${rows}`).value = title[y];
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(`A${rows}`).font = { bold: true };
      rows++;
    }

    worksheet.addRow([]);

    worksheet.getCell(`A${rows}`).value = "KEC";
    worksheet.getCell(`A${rows}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`A${rows}`).border = border;
    worksheet.getCell(`A${rows}`).fill = fill;
    worksheet.getCell(`N${rows}`).value = "JUMLAH";
    worksheet.getCell(`N${rows}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(`N${rows}`).border = border;
    worksheet.getCell(`N${rows}`).fill = fill;

    for (let bul in bulan) {
      worksheet.getCell(
        `${huruf[(parseInt(bul) + 1).toString()]}${rows}`
      ).value = bulan[bul];
      worksheet.getCell(
        `${huruf[(parseInt(bul) + 1).toString()]}${rows}`
      ).alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getCell(
        `${huruf[(parseInt(bul) + 1).toString()]}${rows}`
      ).border = border;
      worksheet.getCell(
        `${huruf[(parseInt(bul) + 1).toString()]}${rows}`
      ).fill = fill;
    }

    rows++;

    for (let index = 0; index <= 1; index++) {
      for (let x in data.feedBack) {
        worksheet.getCell(`A${rows}`).value = data.feedBack[x].kode;
        worksheet.getCell(`A${rows}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(`A${rows}`).border = border;

        var total = 0;

        for (let bun in bulan) {
          worksheet.getCell(`${huruf[parseInt(bun) + 1]}${rows}`).value =
            index === 0
              ? await convertToRP(data.feedBack[x].detail_rupiah[bun])
              : data.feedBack[x].detail_pemohon[bun];
          worksheet.getCell(`${huruf[parseInt(bun) + 1]}${rows}`).alignment = {
            horizontal: "center",
            vertical: "middle",
          };
          worksheet.getCell(`${huruf[parseInt(bun) + 1]}${rows}`).border =
            border;

          total =
            total +
            (index === 0
              ? data.feedBack[x].detail_rupiah[bun]
              : data.feedBack[x].detail_pemohon[bun]);

          total_total[bun] =
            total_total[bun] +
            (index === 0
              ? data.feedBack[x].detail_rupiah[bun]
              : data.feedBack[x].detail_pemohon[bun]);
        }

        worksheet.getCell(`N${rows}`).value =
          index === 0 ? await convertToRP(total) : total;
        worksheet.getCell(`N${rows}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(`N${rows}`).border = border;

        rows++;
      }
      worksheet.getCell(`A${rows}`).value = "JUMLAH";
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(`A${rows}`).border = border;
      worksheet.getCell(`A${rows}`).fill = fill;
      var tt_total = 0;
      for (let bun in bulan) {
        worksheet.getCell(`${huruf[parseInt(bun) + 1]}${rows}`).value =
          index === 0 ? await convertToRP(total_total[bun]) : total_total[bun];
        worksheet.getCell(`${huruf[parseInt(bun) + 1]}${rows}`).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(`${huruf[parseInt(bun) + 1]}${rows}`).border = border;
        worksheet.getCell(`${huruf[parseInt(bun) + 1]}${rows}`).fill = fill;
        tt_total = tt_total + total_total[bun];
      }

      worksheet.getCell(`N${rows}`).value =
        index === 0 ? await convertToRP(tt_total) : tt_total;
      worksheet.getCell(`N${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(`N${rows}`).border = border;
      worksheet.getCell(`N${rows}`).fill = fill;

      rows++;
    }

    rows = rows + 2;
    var tanda_tangan = await model_r.tanda_tangan();
    console.log("______________________________A");
    console.log(data);
    console.log(data.feedBack);
    console.log("______________________________A");
    if (Object.keys(data.feedBack).length > 0) {
      worksheet.mergeCells(`A${rows}:G${rows}`);
      worksheet.getCell(`A${rows}`).value = "DIKETAHUI";
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`H${rows}:N${rows}`);
      worksheet.getCell(`H${rows}`).value = "REDELONG,  ";
      worksheet.getCell(`H${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:G${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_jabatan1;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`H${rows}:N${rows}`);
      worksheet.getCell(`H${rows}`).value = tanda_tangan.data.nama_jabatan2;
      worksheet.getCell(`H${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows = rows + 4;
      worksheet.mergeCells(`A${rows}:G${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_pejabat1;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.mergeCells(`H${rows}:N${rows}`);
      worksheet.getCell(`H${rows}`).value = tanda_tangan.data.nama_pejabat2;
      worksheet.getCell(`H${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:N${rows}`);
      worksheet.getCell(`A${rows}`).value = "BAITUL MAL";
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:N${rows}`);
      var kabupatenKotas = await kabupatenKota();
      worksheet.getCell(`A${rows}`).value = kabupatenKotas.toUpperCase();
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows++;
      worksheet.mergeCells(`A${rows}:N${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_jabatan3;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      rows = rows + 4;
      worksheet.mergeCells(`A${rows}:N${rows}`);
      worksheet.getCell(`A${rows}`).value = tanda_tangan.data.nama_pejabat3;
      worksheet.getCell(`A${rows}`).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
    }

    worksheet.columns = [
      { key: "kec", width: 15 },
      { key: "jan", width: 15 },
      { key: "feb", width: 15 },
      { key: "mar", width: 15 },
      { key: "apr", width: 15 },
      { key: "mei", width: 15 },
      { key: "jun", width: 15 },
      { key: "jul", width: 15 },
      { key: "ags", width: 15 },
      { key: "sep", width: 15 },
      { key: "okt", width: 15 },
      { key: "nov", width: 15 },
      { key: "des", width: 15 },
      { key: "jmlh", width: 25 },
    ];

    // Set header untuk mengunduh file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_rekap_penyaluran_per_kecamatan_tahun_${
        tahun === "0" ? "semua" : tahun
      }_datetime:_${myDate}.xlsx`
    );
    // Kirim file Excel
    await workbook.xlsx.write(res);
  } catch (error) {
    console.log("---------------------");
    console.log(error);
    console.log("---------------------");
    res.status(500).send("Terjadi kesalahan saat mengunduh file Excel");
  }
};

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
    var tanda_tangan = await model_r_instance.tanda_tangan();
    const feedBack = await model_r_instance.fn_asnaf(tahun, asnaf);

    if (feedBack.length === 0) {
      return res.status(200).json({
        error: false,
        error_msg: "Data laporan penyaluran tidak ditemukan",
        data: { list: [], tanda_tangan: tanda_tangan.data },
      });
    }

    res.status(200).json({
      error: false,
      error_msg: "Data laporan penyaluran ditemukan",
      data: { list: feedBack, tanda_tangan: tanda_tangan.data },
    });
  } catch (error) {
    console.error("ERROR in fn_asnaf controller:", error);
    res.status(500).json({ error: true, error_msg: "Internal Server Error" });
  }
};

controllers.fn_asnaf_amil = async (req, res) => {
  try {
    const { tahun } = req.query;

    if (!tahun) {
      return res.status(400).json({
        error: true,
        error_msg: 'Parameter "tahun" dibutuhkan.',
      });
    }

    const model_r_instance = new Model_r(req);
    const feedBack = await model_r_instance.fn_asnaf_amil(tahun);

    if (feedBack.length === 0) {
      return res.status(200).json({
        error: false,
        error_msg: "Data laporan penyaluran tidak ditemukan",
        data: [],
      });
    }

    res.status(200).json({
      error: false,
      error_msg: "Data laporan penyaluran ditemukan",
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
