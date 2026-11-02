const memberHelper = {};

memberHelper.get_member_id = async (req) => {
  if (req.user?.principalType !== "member") return null;
  return req.user.id ? Number(req.user.id) : null;
};

module.exports = memberHelper;
