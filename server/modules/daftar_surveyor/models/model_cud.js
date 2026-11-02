const { Surveyor, sequelize } = require("../../../models"); 
const moment = require("moment");

class Model_cud {
    constructor(req) {
        this.req = req;
        this.state = false;
        this.message = null;
        this.t = null;
    }

    async create() {
        const body = this.req.body;
        console.log("--------------");

        console.log("--------------");

        const date = moment().format('YYYY-MM-DD HH:mm:ss');
        this.t = await sequelize.transaction();
        try {
            await Surveyor.create({
                name: body.name,
                nik: body.nik,
                whatsapp_number: body.whatsapp_number,
                created_at: date,
                updated_at: date,
            }, { transaction: this.t });

            this.state = true;
            this.message = 'Data berhasil disimpan';
        } catch (err) {
            this.message = err.message;
        }
    }

    async update() {
        const body = this.req.body;
        console.log("--------------");

        console.log("--------------");
        const date = moment().format('YYYY-MM-DD HH:mm:ss');
        this.t = await sequelize.transaction();
        try {
            const data = await Surveyor.findByPk(body.id, { transaction: this.t });
            if (!data) throw new Error('Data tidak ditemukan');

            await data.update({
                name: body.name,
                nik: body.nik,
                whatsapp_number: body.whatsapp_number,
                updated_at: date,
            }, { transaction: this.t });

            this.state = true;
            this.message = 'Data berhasil diperbarui';
        } catch (err) {
            this.message = err.message;
        }
    }

    async delete() {
        const { id } = this.req.body;
        this.t = await sequelize.transaction();
        try {
            const data = await Surveyor.findByPk(id, { transaction: this.t });
            if (!data) throw new Error('Data tidak ditemukan');

            await data.destroy({ transaction: this.t });

            this.state = true;
            this.message = 'Data berhasil dihapus';
        } catch (err) {
            this.message = err.message;
        }
    }

    async response() {
        if (this.state) {
            if (this.t) await this.t.commit();
            return { success: true, message: this.message };
        } else {
            if (this.t) await this.t.rollback();
            return { success: false, message: this.message };
        }
    }
}

module.exports = Model_cud;
