const { create_command } = require("../../handlers/commands");
const settings = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { TextChannel, EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS, DEVELOPER_IDS } = require("../../constants");
const {
  createBlacklist,
  removeBlacklist,
  resetHWID,
  whitelistUser,
  getAccountScripts,
} = require("../../utils/luawl");
const ms = require("ms");

function msToTime(s) {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return hrs;
}

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
    const duration = interaction.options.getString("duration", true);

    if(!member) return await interaction.followUp({
      embeds: [
        error_embed.setDescription(
          "**Couldn't find member in the server**"
        ),
      ],
    });
    
    let msg;
    try {
      const key_time = msToTime(ms(duration));

      if (key_time > msToTime(ms("30d")))
        return await interaction.followUp({
          embeds: [
            error_embed.setDescription(
              Formatters.bold("Trial keys can last a maximum of 30 days")
            ),
          ],
        });

      if (key_time < msToTime(ms("1h")))
        return await interaction.followUp({
          embeds: [
            error_embed.setDescription(
              Formatters.bold("Trial keys can last a minimum of 1 hour")
            ),
          ],
        });

      msg = await interaction.followUp({
        embeds: [
          new EmbedBuilder(success_embed.toJSON()).setDescription(
            Formatters.bold(
              "Checking for scripts before processing the whitelist..."
            )
          ),
        ],
      });

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
      let wl_script_id;
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

			  wl_script_id = awaiter.values[0]

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
          isTrial: 1,
          trial_hours: key_time,
          wl_script_id,
        });

        await msg[msg.editable ? "edit" : msg.replied ? "editReply" : "update"]({
          embeds: [
            new EmbedBuilder(success_embed.toJSON()).setDescription(
              Formatters.bold(
                `Successfully issued a ${duration} long key for: ${branch} to: ${member.user.toString()}`
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
                  Formatters.bold(
                    `You have been whitelisted to: ${branch} for ${duration}`
                  )
                )
                .setTimestamp()
                .addField("Key", response),
            ],
          })
          .catch(() => void -1);
      }
    } catch (e) {
        msg[msg.editable ? "edit" : msg.replied ? "editReply" : "update"]({
        embeds: [error_embed.setDescription(Formatters.bold(`${e}`))],
      });
      console.error(e);
    }
  },
  {
    name: __filename.split(".").shift().split(sep).pop(),
    category: __dirname.split(sep).pop(),
    description: "Whitelists a user with a limited time key",
    options: dkto.builder
      .command_options()
      .user({
        name: "member",
        description: "Fetch member by mention or user id",
        required: true,
      })
      .string({
        name: "duration",
        description: "Time limit for the key, maximium 30 days",
        required: true,
      })
      .toJSON(),
  }
);
