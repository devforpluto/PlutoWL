const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");
const { Configuration, BloxlinkAPI } = require("@morgann1/bloxlink");
const configuration = new Configuration({
  apiKey: "b3a5dafb-49ca-42a8-867d-54e17274d127",
});
const bloxlink = new BloxlinkAPI(configuration);

async function get_profile_image(id) {
  const fetch = (await import("node-fetch")).default;

  return await (
    await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=420x420&format=Png&isCircular=false&_=${id}`
    )
  ).json();
}

async function get_roblox_profile(id) {
  const fetch = (await import("node-fetch")).default;
  return await (await fetch(`https://verify.eryn.io/api/user/${id}`)).json();
}

async function get_roblox_user(id) {
  const fetch = (await import("node-fetch")).default;
  return await (await fetch(`https://users.roblox.com/v1/users/${id}`)).json();
}

create_command(
  async function (interaction) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setDescription(`**Searching...**`)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    const member =
      interaction.options.getMember("member", false) || interaction.member;

    let bloxUserExists;
    let roVerUserExists;
    try {
      const Roprofile = await get_roblox_profile(member.user.id);
      const bloxUser = await bloxlink.search(member.id);
      const bloxFinal = await get_roblox_user(bloxUser.user.robloxId);
      bloxUserExists = true
      roVerUserExists = true

      if (typeof Roprofile !== "object" || Roprofile.status !== "ok") {
        roVerUserExists = false
      }
      if(!bloxUser.user.robloxId) {
        bloxUserExists = false
      }
      return await interaction.followUp({
        embeds: [
          embed
            .setDescription(`**${member.toString()}'s Roblox Details**`)
            .setThumbnail("https://res.cloudinary.com/crunchbase-production/image/upload/c_lpad,f_auto,q_auto:eco,dpr_1/rbgebzd54uexaaqdnzrs.png")
            .addField(
              "[RoVer] User:",
              `${Roprofile.robloxUsername || "No Account Linked"}`,
              true
            )
            .addField("| |", "**| |**", true)
            .addField(
              "[Bloxlink] User:",
              `${bloxFinal.name || "No Account Linked"}`,
              true
            )
            .addField(
              "[RoVer] User ID:",
              `${roVerUserExists ? String(Roprofile.robloxId) : "No Account Linked"}`,
              true
            )
            .addField("| |", "**| |**", true)
            .addField(
              "[Bloxlink] User ID:",
              `${bloxUserExists ? (await bloxUser.user.robloxId) : "No Account Linked"}`,
              true
            ),
        ],
      });
    } catch (e) {
      console.log(e);
    }
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Fetches a user's roblox profile from Rover",
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Fetch member by mention or user id",
        required: false,
      })
      .toJSON(),
  }
);
