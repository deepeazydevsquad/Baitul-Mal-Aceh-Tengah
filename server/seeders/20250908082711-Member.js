"use strict";
const bcrypt = require("bcryptjs");
const { validatePassword } = require("../helper/passwordPolicyHelper");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    let memberPasswords;
    try {
      memberPasswords = JSON.parse(
        process.env.SEED_MEMBER_PASSWORDS || ""
      );
    } catch {
      throw new Error("SEED_MEMBER_PASSWORDS harus berupa JSON valid.");
    }
    if (
      !memberPasswords ||
      typeof memberPasswords !== "object" ||
      Array.isArray(memberPasswords)
    ) {
      throw new Error("SEED_MEMBER_PASSWORDS wajib diisi sebagai object JSON.");
    }
    const members = [
        {
          desa_id: 1,
          kode: "AABBCC",
          tipe: "perorangan",
          fullname: "Member Admin Akun",
          nomor_ktp: "1175427237712001",
          nomor_kk: "1175427237712001",
          whatsapp_number: "085262802141",
          birth_date: "1999-01-01",
          alamat: "Jln Utama, Kabupaten Aceh Tengah",
          username: "member_admin",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 2,
          kode: "SDK12238",
          tipe: "perorangan",
          fullname: "Mita Wulandari",
          nomor_ktp: "1175427237712002",
          nomor_kk: "1175427237712002",
          whatsapp_number: "085262802141",
          birth_date: "1999-01-01",
          alamat: "Jln Bale Atu, Kecamatan Bukit, Kabupaten Bener Meriah",
          username: "member_mita",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 3,
          kode: "AABBCC",
          tipe: "instansi",
          fullname: "Depot Padepokan Alam",
          nomor_ktp: null,
          nomor_kk: null,
          whatsapp_number: "085262802141",
          birth_date: "1999-01-01",
          alamat: "Jln Utama, Kabupaten Aceh Tengah, Aceh Tengah",
          username: "member_instansi",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 29,
          kode: "MBR102",
          tipe: "perorangan",
          fullname: "Member Dummy 3",
          nomor_ktp: "1175427237712003",
          nomor_kk: "1175427238003",
          whatsapp_number: "085262802203",
          birth_date: "1992-03-15",
          alamat: "Jln Dummy 3, Kecamatan Simulasi, Aceh Tengah",
          username: "member_dummy_3",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 32,
          kode: "MBR103",
          tipe: "perorangan",
          fullname: "Member Dummy 4",
          nomor_ktp: "1175427237712004",
          nomor_kk: "1175427238004",
          whatsapp_number: "085262802204",
          birth_date: "1993-04-15",
          alamat: "Jln Dummy 4, Kecamatan Simulasi, Aceh Tengah",
          username: "member_dummy_4",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 34,
          kode: "MBR104",
          tipe: "perorangan",
          fullname: "Member Dummy 5",
          nomor_ktp: "1175427237712005",
          nomor_kk: "1175427238005",
          whatsapp_number: "085262802205",
          birth_date: "1994-05-15",
          alamat: "Jln Dummy 5, Kecamatan Simulasi, Aceh Tengah",
          username: "member_dummy_5",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 36,
          kode: "MBR105",
          tipe: "perorangan",
          fullname: "Member Dummy 6",
          nomor_ktp: "1175427237712006",
          nomor_kk: "1175427238006",
          whatsapp_number: "085262802206",
          birth_date: "1995-06-15",
          alamat: "Jln Dummy 6, Kecamatan Simulasi, Aceh Tengah",
          username: "member_dummy_6",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 37,
          kode: "MBR106",
          tipe: "perorangan",
          fullname: "Member Dummy 7",
          nomor_ktp: "1175427237712007",
          nomor_kk: "1175427238007",
          whatsapp_number: "085262802207",
          birth_date: "1996-07-15",
          alamat: "Jln Dummy 7, Kecamatan Simulasi, Aceh Tengah",
          username: "member_dummy_7",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 38,
          kode: "MBR107",
          tipe: "perorangan",
          fullname: "Member Dummy 8",
          nomor_ktp: "1175427237712008",
          nomor_kk: "1175427238008",
          whatsapp_number: "085262802208",
          birth_date: "1997-08-15",
          alamat: "Jln Dummy 8, Kecamatan Simulasi, Aceh Tengah",
          username: "member_dummy_8",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 39,
          kode: "MBR108",
          tipe: "perorangan",
          fullname: "Member Dummy 9",
          nomor_ktp: "1175427237712009",
          nomor_kk: "1175427238009",
          whatsapp_number: "085262802209",
          birth_date: "1998-09-15",
          alamat: "Jln Dummy 9, Kecamatan Simulasi, Aceh Tengah",
          username: "member_dummy_9",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 40,
          kode: "MBR109",
          tipe: "perorangan",
          fullname: "Member Dummy 10",
          nomor_ktp: "1175427237712010",
          nomor_kk: "1175427238010",
          whatsapp_number: "085262802210",
          birth_date: "1999-10-15",
          alamat: "Jln Dummy 10, Kecamatan Simulasi, Aceh Tengah",
          username: "member_dummy_10",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 41,
          kode: "MBR110",
          tipe: "perorangan",
          fullname: "Member Dummy 11",
          nomor_ktp: "1175427237712011",
          nomor_kk: "1175427238011",
          whatsapp_number: "085262802211",
          birth_date: "1990-11-15",
          alamat: "Jln Dummy 11, Kecamatan Simulasi, Aceh Tengah",
          username: "member_dummy_11",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 42,
          kode: "MBR111",
          tipe: "perorangan",
          fullname: "Member Dummy 12",
          nomor_ktp: "1175427237712012",
          nomor_kk: "1175427238012",
          whatsapp_number: "085262802212",
          birth_date: "1991-12-15",
          alamat: "Jln Dummy 12, Kecamatan Simulasi, Aceh Tengah",
          username: "member_dummy_12",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 43,
          kode: "MBR112",
          tipe: "perorangan",
          fullname: "Member Dummy 13",
          nomor_ktp: "1175427237712013",
          nomor_kk: "1175427238013",
          whatsapp_number: "085262802213",
          birth_date: "1992-01-15",
          alamat: "Jln Dummy 13, Kecamatan Simulasi, Aceh Tengah",
          username: "member_dummy_13",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          desa_id: 4,
          kode: "AABBCC",
          tipe: "perorangan",
          fullname: "Abdillah",
          nomor_ktp: "1175427237712014",
          nomor_kk: "1175427237712014",
          whatsapp_number: "085262802141",
          birth_date: "1999-01-01",
          alamat: "Jln Utama, Kabupaten Aceh Tengah",
          username: "member_abdillah",
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
    ];

    const usernames = members.map((member) => member.username);
    if (usernames.length !== new Set(usernames).size) {
      throw new Error("Username seeder member harus unik.");
    }
    const passwords = usernames.map(
      (username) => memberPasswords[username]
    );
    if (new Set(passwords).size !== passwords.length) {
      throw new Error(
        "Setiap username seeder harus memiliki password unik."
      );
    }
    for (const password of passwords) {
      validatePassword(password, { minLength: 12 });
    }
    const hashes = await Promise.all(
      passwords.map((password) => bcrypt.hash(password, 12))
    );
    members.forEach((member, index) => {
      member.password = hashes[index];
    });

    await queryInterface.bulkInsert("Members", members, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Members", null, {});
  },
};
