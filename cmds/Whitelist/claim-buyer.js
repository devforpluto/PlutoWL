const { create_command } = require("../../handlers/commands");
const settings = require("../../../config.json");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS } = require("../../constants");
const { getKey } = require("../../utils/luawl");
const BuyerRole = settings.BuyerRoleID;

create_command(
  async function (interaction, api_key, role_id) {
    const error_embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setFooter({ text: `${settings.version}` })
      .setTimestamp();
    const success_embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setFooter({ text: `${settings.version}` })
      .setTimestamp();

    try {
      const whitelist = await getKey({
        discord_id: interaction.user.id,
        token: api_key,
      });

      if (!(whitelist && whitelist.wl_key) || whitelist.isTrial === "1")
        return await interaction.followUp({
          embeds: [
            error_embed.setDescription(
              Formatters.bold("You are not whitelisted")
            ),
          ],
        });

      if (BuyerRole) {
        try {
          if (!interaction.member.roles.cache.find((r) => r.id === BuyerRole)) {
            await interaction.member.roles.add(BuyerRole);
          } else {
          }
        } catch (e) {
          try {
            if (
              interaction.guild.me.roles.highest.comparePositionTo(
                interaction.guild.roles.cache.find((r) => r.id === BuyerRole)
              ) <= 0
            )
              return interaction.followUp({
                embeds: [
                  error_embed.setDescription(
                    Formatters.bold(
                      "Missing Permissions || My Role Is Not High Enough"
                    )
                  ),
                ],
              });
          } catch (e) {
            interaction.channel.send(e)
            return interaction.followUp({
              embeds: [
                error_embed.setDescription(
                  Formatters.bold(
                    "Invalid buyer role ID: Set the correct role ID in config.json"
                  )
                ),
              ],
            });
          }
        }
      } else {
      }

      try {
        await interaction.member.roles.add(BuyerRole);
        await interaction.followUp({
          embeds: [
            success_embed.setDescription(
              Formatters.bold(`Successfully gave you <@&${BuyerRole.toString()}>`)
            ),
          ],
        });
      } catch (e) {
        return await interaction.followUp({
          embeds: [
            error_embed.setDescription(
              Formatters.bold(
                `Invalid buyer role ID: Set the correct role ID in config.json`
              )
            ),
          ],
        });
      }
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
    description: "Checks if the user has a key and gives them the buyer role",
    ephemeral: false,
  }
);
