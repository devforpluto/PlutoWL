const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS, DEVELOPER_IDS } = require("../../constants");
const { getKey } = require("../../utils/luawl");

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
      const whitelist = await getKey({
        discord_id: member.id,
        token: api_key,
      });

      await interaction.followUp({
        embeds: [
          success_embed.addField(
            "Whitelist Information:",
            Formatters.codeBlock(
              [
                `Key${Boolean(Number(whitelist.isTrial)) ? " [Trial]" : ""}: ${
                  whitelist.wl_key
                }`,
                `HWID: ${whitelist.HWID}`,
                `Key Status: ${whitelist.key_status}` +
                  (Boolean(Number(whitelist.isTrial))
                    ? "\n" +
                      [
                        `Expiration [UTC+4]: ${whitelist.expiration}`,
                        `Hours Remaining: ${whitelist.hours_remaining}`,
                      ].join("\n")
                    : ""),
              ].join("\n")
            )
          ),
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
    description: "Fetches the users whitelist information",
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
