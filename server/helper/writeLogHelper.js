
const moment = require("moment");
const { System_log, User } = require("../models");
const helper = {};

helper.writeLog = async (req, t, param) => {
    const myDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    const ip = req.ip || req.socket?.remoteAddress || null;

    var user_id = 0;
    var name = '';

    if (req.user?.principalType === "administrator" && req.user.id) {
      const account = await User.findOne({
        attributes: ["id", "name"],
        where: { id: req.user.id },
      });
      if (account) {
        user_id = account.id;
        name = account.name;
      }
    }

    try {
        // input system log to database
        await System_log.create({
            user_id : user_id,
            msg : name + " " + param.msg,
            ip : ip,
            createdAt : myDate,
            updatedAt : myDate
        }, {
            transaction: t,
        });

    } catch (error) {
        console.error("Gagal menulis system log.");
    }
};

module.exports = helper;
