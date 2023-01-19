const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS, DEVELOPER_IDS } = require("../../constants");
const { getAccountScripts } = require("../../utils/luawl");

const error_messages = {
  "Missing required data.": "Invalid API token provided",
  "Account plan has expired, please renew your plan":
    "Your account is expired, no scripts will function",
  "Error has occured fetching scripts.":
    "Could not fetch the script data linked to your account",
};

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

    try {
      const scripts = await getAccountScripts({
        token: api_key,
      });

      if ("error" in scripts) {
        return await interaction.followUp({
          embeds: [
            error_embed.setDescription(
              Formatters.bold(error_messages[scripts.error])
            ),
          ],
        });
      }

      await interaction.followUp({
        embeds: [
          success_embed
            .setDescription(
              Formatters.bold(
                `There are ${scripts.length} scripts on your account`
              )
            )
            .addFields(
              scripts.map((script) => {
                return {
                  name: `${script.script_name} | (${script.wl_script_id})`,
                  value: [
                    `Notes: ${script.script_notes || "No notes"}`,
                    `Shoppy Link: ${script.shoppy_link}`,
                    `Enabled: ${
                      Number(script.enabled) === 1 ? "True" : "False"
                    }`,
                    `Created: ${script.created_on}`,
                  ].join("\n"),
                  inline: true,
                };
              })
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
    description: "Fetches the account's scripts",
    ephemeral: false,
  }
);
