const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");
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

      await interaction.user.send({
        embeds: [
          new EmbedBuilder(success_embed.toJSON())
            .setDescription(`Key Status: ${whitelist.key_status}`)
            .addField("Whitelist Key:", whitelist.wl_key)
            .setThumbnail(interaction.guild.iconURL())
            .setAuthor({ name: interaction.guild.name }),
        ],
      });

      if (whitelist.key_status === "Disabled") {
        return await interaction.followUp({
          embeds: [
            success_embed.setDescription(
              Formatters.bold(
                "Your key will not function - it is only sent to you for support reasons"
              )
            ),
          ],
        });
      }

      return await interaction.followUp({
        embeds: [
          success_embed.setDescription(
            Formatters.bold(
              `Successfully fetched your key${
                whitelist.key_status !== "Active" ? " - No hwid assigned" : ""
              }`
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
    description: "Fetches the users key and dms it to them",
    ephemeral: false,
  }
);
