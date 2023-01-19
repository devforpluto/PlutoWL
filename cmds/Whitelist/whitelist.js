const { create_command } = require("../../handlers/commands");
const settings = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS, DEVELOPER_IDS } = require("../../constants");
const {
  getAccountScripts,
  whitelistUser,
} = require("../../utils/luawl");
const BuyerRole = settings.BuyerRoleID;

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
      .setFooter({ text: `${settings.version}` })
      .setTimestamp();
    const success_embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BASE)
      .setFooter({ text: `${settings.version}` })
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
    
    if (BuyerRole) {
      try {
        if (!member.roles.cache.find((r) => r.id === BuyerRole)) {
          await member.roles.add(BuyerRole);
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

    var msg = await interaction.followUp({
      embeds: [
        new EmbedBuilder(success_embed.toJSON()).setDescription(
          Formatters.bold(
            "Checking for scripts before processing the whitelist..."
          )
        ),
      ],
    });

    try {
      const scripts = await getAccountScripts({
        token: api_key,
      });
      if (
        "error" in scripts &&
        scripts.error !== "Error has occured fetching scripts."
      ) {
        return await msg[msg.editable ? "edit" : msg.replied ? "editReply" : "update"]({
          embeds: [
            error_embed.setDescription(
              Formatters.bold(
                error_messages[scripts.error] ||
                  `Unable to identify the error message: ${scripts.error}`
              )
            ),
          ],
        });
      }

      let awaiter;
      let wl_script_id = null;
      const scripts_list = {
        Universal: null,
      };

      try {
        if ('error' in scripts || scripts.length === 0) throw new Error();

        const select_menu = dkto.builder
          .message_components()
          .action_row()
          .select_menu({
            custom_id: "script_selection",
            placeholder: "Universal",
            min_values: 1,
            max_values: 1,
          });

        select_menu.add_option({
          custom_id: "script_0",
          label: "Universal",
          value: "0",
        });

        let i = 0; 
        for (const script of scripts) { 
          scripts_list[script.script_name] = script.wl_script_id;
          scripts_list[String(script.wl_script_id)] = script.script_name;
          select_menu.add_option({
            custom_id: `script_${i++}`,
            label: script.script_name,
            value: script.wl_script_id,
          });
        }

        await msg[msg.editable ? "edit" : msg.replied ? "editReply" : "update"]({
          embeds: [
            success_embed.setDescription(
              `**Select the script to whitelist ${member.user.toString()} to:**`
            ),
          ],
          components: select_menu.build().build().toJSON(),
        });

        awaiter = await msg.awaitMessageComponent({
          filter: (interactor) => interactor.user.id === interaction.user.id,
          max: 1,
          time: 30_000,
        });

        wl_script_id = awaiter.values[0];

        if (wl_script_id === "0") wl_script_id = null;
      } catch (e) {
      } finally {
        const branch = wl_script_id
          ? scripts_list[String(wl_script_id)]
          : "Universal Branch";
        if (awaiter) msg = awaiter;

        const response = await whitelistUser({
          discord_id: member.user.id,
          token: api_key,
          wl_script_id,
        });

        await msg[msg.editable ? "edit" : msg.replied ? "editReply" : "update"]({
          embeds: [
            new EmbedBuilder(success_embed.toJSON()).setDescription(
              Formatters.bold(
                `Successfully whitelisted ${member.user.toString()} to: ${branch}`
              )
            ),
          ],
          components: [],
        });

        member.user
          .send({
            embeds: [
              success_embed
                .setAuthor({
                  name: interaction.guild.name,
                })
                .setThumbnail(interaction.guild.iconURL())
                .setDescription(
                  Formatters.bold(`You have been whitelisted to: ${branch}`)
                )
                .setTimestamp()
                .addField("Key", response),
            ],
          })
          .catch(() => void -1);
      }
    } catch (e) {
      msg[msg.editable ? "edit" : msg.replied ? "editReply" : "update"]({
        embeds: [
          error_embed.setDescription(Formatters.bold(`${e}`)),
        ],
      });
      console.error(e);
    }
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Whitelists the mentioned user",
    ephemeral: false,
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Mention a user",
        required: true,
      })
      .toJSON(),
  }
);
