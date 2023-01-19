const { MESSAGES, DEVELOPER_IDS, EMBED_COLORS } = require("../constants");
const { Interaction, EmbedBuilder, Formatters } = require("discord.js");
const cmd_handler = require("../handlers/commands");
const config = require("../../config.json");
const role_id = config.adminRole;
const api_key = config.apiKey;

const embedTemplate = new EmbedBuilder()
  .setColor(EMBED_COLORS.ERROR)
  .setFooter({ text: `${config.version}` })
  .setTimestamp();

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return hDisplay + mDisplay + sDisplay;
}

/**
 * @param {Interaction} interaction
 */
module.exports = async function (interaction) {
  if (!interaction.user || interaction.user.system || interaction.user.bot)
    return;

  if (interaction.isChatInputCommand() && interaction.commandName) {
    if (!interaction.inGuild() || !interaction.member) {
      await interaction.deferReply({ ephemeral: false });
      return await interaction.followUp({
        embeds: [
          new EmbedBuilder(embedTemplate.toJSON()).setDescription(
            "**You cannot use commands in dms**"
          ),
        ],
      });
    }

    const cmd = cmd_handler.get_command(interaction.commandName);

    if (!cmd) return;

    if (DEVELOPER_IDS.indexOf(interaction.user.id) === -1) {
      if (
        cmd.config.is_developer ||
        ("permissions" in cmd.config &&
          !interaction.memberPermissions.has(cmd.config.permissions))
      ) {
        await interaction.deferReply({ ephemeral: false });
        return await interaction.followUp({
          embeds: [
            new EmbedBuilder(embedTemplate.toJSON()).setDescription(
              `**${MESSAGES.PERMISSION_DENIED}**`
            ),
          ],
        });
      }

      if (cmd.config.category === "Developer") {
        await interaction.deferReply({ ephemeral: false });
        return await interaction.followUp({
          embeds: [
            new EmbedBuilder(embedTemplate.toJSON()).setDescription(
              `**You cannot use developer commands**`
            ),
          ],
        });
      }
    }

    if (!(role_id || api_key)) {
      await interaction.deferReply({ ephemeral: true });
      return await interaction.followUp({
        embeds: [
          new EmbedBuilder(embedTemplate.toJSON()).setDescription(
            `**You do not have ${
              !api_key ? "an admin role set up" : "any linked account"
            }, Change the config.json with your account specifics**`
          ),
        ],
      });
    }

    if (config.EnableUserHWIDReset === true) {
      if (cmd.config.name === "reset-hwid") {
        if (DEVELOPER_IDS.indexOf(interaction.member.id) === -1) {
          if (
            !interaction.member.roles.cache.find((role) => role.id === role_id)
          ) {
            const cooldown = new (require("dkto.js").Cooldown)(
              cmd.config.name,
              config.resetHwidCooldownHours,
              "h"
            );
            if (cooldown.isOnCooldown(String(interaction.user.id))) {
              await interaction.deferReply({ ephemeral: false });
              return interaction.followUp({
                embeds: [
                  embedTemplate.setDescription(
                    Formatters.bold(
                      `You are on a cooldown for ${secondsToHms(
                        cooldown.getRemaining(String(interaction.user.id))
                      )}`
                    )
                  ),
                ],
              });
            }
            cooldown.setCooldown(String(interaction.user.id));
          }
        }
      }
    }

    if (!cmd.config.no_defer)
      await interaction.deferReply({
        ephemeral: !!cmd.config.ephemeral,
        fetchReply: false,
      });
    await cmd.run(interaction, api_key, role_id);
  }
};
