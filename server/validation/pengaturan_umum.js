const { Setting } = require("../models");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const validation = {};

// Setup upload paths untuk berbagai jenis file
const uploadPaths = {
  icon: path.join(__dirname, "../uploads/img/icons"),
  logo: path.join(__dirname, "../uploads/img/logos"),
  logo_tanpa_teks: path.join(__dirname, "../uploads/img/logos"),
  hero_logo: path.join(__dirname, "../uploads/img/hero"),
};

Object.values(uploadPaths).forEach((uploadPath) => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
});

const fixedFilenames = {
  icon: "site_icon.ico",
  logo: "site_logo.png",
  logo_tanpa_teks: "logo_tanpa_teks.png",
  hero_logo: "hero_logo.png",
};

// Storage sementara untuk validasi
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempPath = path.join(__dirname, "../uploads/temp");
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    // Nama file temp yang lebih unik dengan ekstensi asli
    const tempName = `temp_${file.fieldname}.png`;
    cb(null, tempName);
  },
});

const fileFilter = (req, file, cb) => {
  // Khusus untuk icon, hanya izinkan .ico
  if (file.fieldname === "icon") {
    const allowedIconTypes = ["image/x-icon", "image/ico"];
    if (allowedIconTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format file icon harus .ico"), false);
    }
    // Khusus untuk logo, hanya izinkan .png
  } else if (
    file.fieldname === "logo" ||
    file.fieldname === "logo_tanpa_teks"
  ) {
    if (file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Format file logo harus .png"), false);
    }
    // Untuk file gambar lainnya
  } else {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format file harus PNG, JPG atau JPEG"), false);
    }
  }
};

validation.upload = multer({
  storage: tempStorage,
  fileFilter,
  limits: {
    fileSize: 1 * 1024 * 2048, // 2 MB
    files: 4,
    fields: 16,
    parts: 24,
    fieldSize: 8 * 1024,
    fieldNameSize: 64,
  },
});

// Middleware validasi dimensi gambar
validation.check_dimensions = (isRequired = true) => {
  return async (req, res, next) => {
    const files = req.files;

    if (!files && isRequired) {
      return res.status(400).json({
        error: true,
        error_msg: "File gambar wajib diupload",
      });
    }

    if (!files) {
      return next();
    }

    const tempFiles = [];

    try {
      const dimensionRules = {
        icon: {
          minWidth: 16,
          minHeight: 16,
          maxWidth: 48,
          maxHeight: 48,
          name: "Icon",
        },
        logo: {
          minWidth: 50,
          minHeight: 50,
          maxWidth: 779,
          maxHeight: 161,
          name: "Logo",
        },
        logo_tanpa_teks: {
          minWidth: 100,
          minHeight: 100,
          maxWidth: 200,
          maxHeight: 200,
          name: "Logo Tanpa Teks",
        },
        hero_logo: {
          minWidth: 100,
          minHeight: 50,
          maxWidth: 2000,
          maxHeight: 1000,
          name: "Hero Logo",
        },
      };

      for (const [fieldname, rule] of Object.entries(dimensionRules)) {
        if (files[fieldname] && files[fieldname][0]) {
          const file = files[fieldname][0];
          tempFiles.push(file.path);

          let metadata;
          try {
            metadata = await sharp(file.path).metadata();
          } catch (sharpError) {
            console.error(
              `Sharp metadata error for ${file.originalname}:`,
              sharpError
            );
            throw new Error(`${rule.name} tidak valid atau filenya rusak.`);
          }
          if (!["jpeg", "png"].includes(metadata.format)) {
            throw new Error(`${rule.name} harus berupa gambar PNG atau JPEG.`);
          }

          // Cek dimensi minimum
          if (
            metadata.width < rule.minWidth ||
            metadata.height < rule.minHeight
          ) {
            throw new Error(
              `Dimensi ${rule.name} terlalu kecil (minimal ${rule.minWidth}x${rule.minHeight} piksel).`
            );
          }

          // Cek dimensi maximum
          if (
            metadata.width > rule.maxWidth ||
            metadata.height > rule.maxHeight
          ) {
            throw new Error(
              `Dimensi ${rule.name} terlalu besar (maksimal ${rule.maxWidth}x${rule.maxHeight} piksel).`
            );
          }
        }
      }

      for (const [fieldname, rule] of Object.entries(dimensionRules)) {
        if (files[fieldname] && files[fieldname][0]) {
          const file = files[fieldname][0];
          const finalPath = uploadPaths[fieldname];
          const finalFilename = fixedFilenames[fieldname];
          const finalFullPath = path.join(finalPath, finalFilename);

          await sharp(file.path).png().toFile(finalFullPath);

          // Simpan filename ke req.body
          switch (fieldname) {
            case "icon":
              req.body.iconPath = finalFilename;
              break;
            case "logo":
              req.body.logoPath = finalFilename;
              break;
            case "hero_logo":
              req.body.heroLogoPath = finalFilename;
              break;
            case "logo_tanpa_teks":
              req.body.logoTanpaTeksPath = finalFilename;
              break;
          }
        }
      }

      tempFiles.forEach((tempPath) => {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      });

      next();
    } catch (error) {
      tempFiles.forEach((tempPath) => {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      });

      return res.status(400).json({
        error: true,
        error_msg: error.message,
      });
    }
  };
};

module.exports = validation;
