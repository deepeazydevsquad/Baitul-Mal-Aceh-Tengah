const moment = require('moment');
const { Sequelize, Syarat, sequelize } = require("../../../models");

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
            await Syarat.create({
            name: body.name,
            path: body.path,
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
            const syarat = await Syarat.findByPk(body.id, { transaction: this.t });
            if (!syarat) {
                throw new Error('Data tidak ditemukan');
            }

            await syarat.update({
                name: body.name,
                path: body.path,
                updatedAt: date,
            }, { transaction: this.t });

            this.state = true;
            this.message = 'Data berhasil diperbarui';
        } catch (err) {
            this.message = err.message;
        }
    }

    async delete() {
        const { id } = this.req.body; // ambil id dari params
        this.t = await sequelize.transaction();
        try {
            const syarat = await Syarat.findByPk(id, { transaction: this.t });
            if (!syarat) {
                throw new Error('Data tidak ditemukan');
            }

            await syarat.destroy({ transaction: this.t });

            this.state = true;
            this.message = 'Data berhasil dihapus';
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
