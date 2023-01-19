const { getKey, updateKeyStatus } = require("../utils/luawl");
const settings = require("../../config.json");
const apiKey = settings.apiKey;

module.exports = async function (member) {
  if (settings["DisableOnLeave-VV"] === true) {
    const key = await getKey({
      discord_id: member.user.id,
      token: apiKey,
    });

    if (!(key && key.wl_key)) return;

    const keyUpdate = await updateKeyStatus({
      discord_id: member.user.id,
      token: apiKey,
      status: "Disabled",
    });
    console.log(keyUpdate);
    console.log(`Disabled ${member.user.tag}'s key due leaving`);
  }
};
