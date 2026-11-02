const moment = require('moment');
const { Sequelize, Program, sequelize } = require("../../../models");

class Model_cud {
    constructor(req) {
        this.req = req;
        this.state = false; // default gagal
        this.message = null; // pesan default
        this.t = null; // simpan transaction
    }

    async create() {
        const body = this.req.body;
        const date =  moment().format('YYYY-MM-DD HH:mm:ss');
        this.t = await sequelize.transaction();
        try {
            await Program.create({
            name: body.name,
            desc: body.desc,
            createdAt: date,
            updatedAt: date,

            }, {transaction: this.t});
            this.state = true;
            this.message = 'Data berhasil disimpan';
        } catch (err) {
            this.message = err.message;
        }
    }

    async update() {
        const body = this.req.body;
        const date = moment().format('YYYY-MM-DD HH:mm:ss');
        this.t = await sequelize.transaction();
        try {
            const daftar_program = await Program.findByPk(body.id, { transaction: this.t });
            if (!daftar_program) {
                throw new Error('Data tidak ditemukan');
            }

            await daftar_program.update({
                name: body.name,
                desc: body.desc,
                updatedAt: date,
            }, { transaction: this.t });

            this.state = true;
            this.message = 'Program Berhasil Diperbaharui.';
        } catch (err) {
            this.message = err.message;
        }
    }

    async delete() {
        const { id } = this.req.body; // ambil id dari params
        this.t = await sequelize.transaction();
        try {
            const daftar_program = await Program.findByPk(id, { transaction: this.t });
            if (!daftar_program) {
                throw new Error('Data tidak ditemukan');
            }

            await daftar_program.destroy({ transaction: this.t });

            this.state = true;
            this.message = 'Program Berhasil Dihapus.';
        } catch (err) {
            this.message = err.message;
        }
    }

    async response() {
        if (this.state) {
            await this.t.commit(); // simpan perubahan
            return true;
        } else {
            if (this.t) await this.t.rollback(); // batalkan kalau error
            return false;
        }
    }
}

module.exports = Model_cud;
