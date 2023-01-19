const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS, DEVELOPER_IDS } = require("../../constants");
const { resetHWID } = require("../../utils/luawl");

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

    if (config.EnableUserHWIDReset === true) {
      if (DEVELOPER_IDS.indexOf(interaction.member.id) === -1) {
        if (
          !interaction.member.roles.cache.find((role) => role.id === role_id)
        ) {
          return (
            (await resetHWID({
              discord_id: interaction.user.id,
              token: api_key,
            })) &&
            (await interaction.followUp({
              embeds: [
                success_embed.setDescription(
                  "**Successfully reset your hwid**"
                ),
              ],
            }))
          );
        }
      }
    } else {
      if (DEVELOPER_IDS.indexOf(interaction.member.id) === -1) {
        if (
          !interaction.member.roles.cache.find((role) => role.id === role_id)
        ) {
          return await interaction.followUp({
            embeds: [
              error_embed.setDescription(
                "**You do not have the required permissions**"
              ),
            ],
          });
        }
      }
    }

    const member = interaction.options.getMember("member", false);

    if (!member)
      return await interaction.followUp({
        embeds: [
          error_embed.setDescription("**Couldn't find member in the server**"),
        ],
      });

    try {
      const response = await resetHWID({
        discord_id: member.id,
        token: api_key,
      });

      if (
        response ===
        "HWID is already empty, user must run key registration script"
      )
        return await interaction.followUp({
          embeds: [
            error_embed.setDescription(
              Formatters.bold(
                `${member.user.toString()} does not have a linked hwid`
              )
            ),
          ],
        });

      await interaction.followUp({
        embeds: [
          success_embed.setDescription(
            Formatters.bold(
              `Successfully reset ${member.user.toString()}'s hwid`
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
    description: "Resets the user's hwid",
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
