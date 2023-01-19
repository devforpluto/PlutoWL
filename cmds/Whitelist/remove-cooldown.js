const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS, DEVELOPER_IDS } = require("../../constants");
const { removeCooldown } = require("../../utils/luawl");

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

    if (!member)
      return await interaction.followUp({
        embeds: [
          error_embed.setDescription("**Couldn't find member in the server**"),
        ],
      });

    try {
      const response = await removeCooldown({
        discord_id: member.id,
        token: api_key,
      });

      if (response === "Cooldown removed")
        return await interaction.followUp({
          embeds: [
            success_embed.setDescription(
              Formatters.bold(
                `Removed ${member.user.toString()}'s script cooldown(s)`
              )
            ),
          ],
        });

      await interaction.followUp({
        embeds: [
          error_embed.setDescription(
            Formatters.bold(
              `Could not find ${member.user.toString()}'s whitelist`
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
    description: "Removes a user's cooldown",
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Fetch member by mention or user id",
        required: true,
      })
      .string({
        name: "reason",
        description: "Input a reason",
        required: false,
      })
      .toJSON(),
  }
);
