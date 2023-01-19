const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS, DEVELOPER_IDS } = require("../../constants");
const { getLogs } = require("../../utils/luawl");
const moment = require("moment");

create_command(
  async function (interaction, api_key, role_id) {
    const error_embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();
    const success_embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setFooter({ text: `${config.version}` })
      .setTimestamp();

    if (DEVELOPER_IDS.indexOf(interaction.member.id) === -1) {
      if (!interaction.member.roles.cache.find((role) => role.id === role_id)) {
        return await interaction.followUp({
          embeds: [
            error_embed.setDescription(
              "**You do not have the required permissions**"
            ),
          ],
        });
      }
    }

    const member = interaction.options.getMember("member", true);

    if(!member) return await interaction.followUp({
      embeds: [
        error_embed.setDescription(
          "**Couldn't find member in the server**"
        ),
      ],
    });
    
    try {
      const logs = await getLogs({
        discord_id: member.id,
        token: api_key,
      });

      if ("error" in logs) {
        return await interaction.followUp({
          embeds: [
            error_embed.setDescription(
              Formatters.bold("No logs found for the given user")
            ),
          ],
        });
      }

      await interaction.followUp({
        content: "Fetched User's Logs:",
        files: [
          {
            attachment: Buffer.from(JSON.stringify(logs, null, "  ")),
            name: `User-Logs_${member.id}_-${moment(Date.now()).format(
              "LLLL"
            )}.json`,
          },
        ],
      });
    } catch (e) {
      interaction.followUp({
        embeds: [error_embed.setDescription(Formatters.bold(`${e}`))],
      });

      console.error(e);
    }
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Fetches the user's logs",
    ephemeral: true,
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Fetch member by mention or user id",
        required: true,
      })
      .toJSON(),
  }
);
