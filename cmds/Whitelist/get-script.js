const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");
const { getKey } = require("../../utils/luawl");
const scriptUrl = config.scriptUrl;

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

    try {
      const whitelist = await getKey({
        discord_id: interaction.user.id,
        token: api_key,
      });

      if (!(whitelist && whitelist.wl_key))
        return await interaction.followUp({
          embeds: [
            error_embed.setDescription(
              Formatters.bold("You are not whitelisted")
            ),
          ],
        });

      if (whitelist.key_status === "Blacklisted") {
        return await interaction.followUp({
          embeds: [
            error_embed.setDescription(
              Formatters.bold("You are currently blacklisted")
            ),
          ],
        });
      }

      return await interaction.followUp({
        embeds: [
          success_embed
            .setDescription(`Key Status: ${whitelist.key_status}`)
            .addField(
              `Script:`,
              `${Formatters.codeBlock('lua', `_G.wl_key = "${whitelist.wl_key}"\nloadstring(game:HttpGet("${scriptUrl}", true))()`)}`
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
    description: "Fetches the script with the user's key",
    ephemeral: true,
  }
);
