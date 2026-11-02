const { Op, Setting } = require("../../../models");

class Model_r {
    constructor(req) {
        this.req = req;
    }

    async wapisender_api_device_key() {
        var data = {};
        await Setting.findAll({
            where: {
                name: { [Op.in]: ["api_key", "device_key"] },
            },
        }).then(async (value) => {
            await Promise.all(
                await value.map(async (e) => {
                    data[e.name] = e.value;
                })
            );
        });
        return data;
    }
}

module.exports = Model_r;

