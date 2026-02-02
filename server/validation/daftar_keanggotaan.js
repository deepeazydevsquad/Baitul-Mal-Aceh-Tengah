const { Op, Member, Kecamatan, Desa } = require("../models");

const validation = {};

// Validasi id keanggotaan apakah sudah ada di database
validation.check_id_keanggotaan = async (value) => {
  const check = await Member.findByPk(value);
  if (!check) {
    throw new Error("Anggota keanggotaan tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi id kecamatan apakah sudah ada di database
validation.check_id_kecamatan = async (value) => {
  const check = await Kecamatan.findByPk(value);
  if (!check) {
    throw new Error("Kecamatan tidak terdaftar di pangkalan data");
  }
  return true;
};

// Validasi id desa apakah sudah ada di database
validation.check_id_desa = async (value) => {
  const check = await Desa.findByPk(value);
  if (!check) {
    throw new Error("Desa tidak terdaftar di pangkalan data");
  }
  return true;
};

// validasi username
validation.check_username = async (value, { req }) => {
  const id = req.body.id;

  if (id) {
    const current = await Member.findByPk(id);
    if (!current) {
      throw new Error("Member tidak ditemukan");
    }

    if (current.username === value) {
      return true;
    }

    const check = await Member.findOne({
      where: {
        id: { [Op.ne]: id },
        username: value,
      },
    });

    if (check) {
      throw new Error(
        "Member dengan nama yang sama sudah terdaftar di pangkalan data",
      );
    }
  } else {
    const check = await Member.findOne({
      where: {
        username: value,
      },
    });

    if (check) {
      throw new Error(
        "Member dengan nama yang sama sudah terdaftar di pangkalan data",
      );
    }
  }

  return true;
};

// validasi password
validation.check_password = async (value, { req }) => {
  if (value && value.length < 8) {
    throw new Error("Password minimal 8 karakter");
  }

  if (value && value !== req.body.confirm_password) {
    throw new Error("Password dan konfirmasi password tidak sama");
  }
  return true;
};

// validation Array
validation.validateData = (req, res, next) => {
  const form = req.body;

  if (form.tipeAkun === "instansi") {
    if (!form.kecamatan_id) {
      throw new Error("Kecamatan tidak boleh kosong.");
    }
    if (!form.desa_id) {
      throw new Error("Desa tidak boleh kosong.");
    }
  } else if (form.tipeAkun === "perorangan") {
    if (!form.nomor_ktp) {
      throw new Error("Nomor KTP tidak boleh kosong.");
    }
    // if (!form.nomor_kk) {
    //   throw new Error("Nomor KK tidak boleh kosong.");
    // }
    if (!form.birth_date) {
      throw new Error("Tanggal Lahir tidak boleh kosong.");
    }
    if (!form.kecamatan_id) {
      throw new Error("Kecamatan tidak boleh kosong.");
    }
    if (!form.desa_id) {
      throw new Error("Desa tidak boleh kosong.");
    }
  }
  next();
};

module.exports = validation;
