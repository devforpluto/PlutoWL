const { create_command } = require("../../handlers/commands");
const settings = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS, DEVELOPER_IDS } = require("../../constants");
const {
  getKey,
  getAccountScripts,
  whitelistUser
} = require("../../utils/luawl");

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
      let wl_script_id;
      const scripts_list = {
        Universal: null,
      };
      const role = interaction.options.getRole("role", true);

      if(!role) return await interaction.followUp({
        embeds: [
          error_embed.setDescription(
            "**Couldn't find role in the server**"
          ),
        ],
      });

      try {
        if ("error" in scripts || scripts.length === 0) throw new Error();

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

        await msg.edit({
          embeds: [
            success_embed.setDescription(
              `**Select the script to whitelist ${role.toString()} to:**`
            ),
          ],
          components: select_menu.build().build().toJSON(),
        });

        awaiter = await msg.awaitMessageComponent({
          filter: (interactor) => interactor.user.id === interaction.user.id,
          max: 1,
          time: 30_000
        });

        wl_script_id = awaiter.values[0];

        if (wl_script_id === "0") wl_script_id = null;
      } catch (e) {
        console.log(e);
      } finally {
        const branch = wl_script_id
          ? scripts_list[String(wl_script_id)]
          : "Universal Branch";
        if (awaiter) msg = awaiter;

        await msg[msg.editable ? "edit" : msg.replied ? "editReply" : "update"]({
          embeds: [
            new EmbedBuilder(success_embed.toJSON()).setDescription(
              Formatters.bold(
                `Now whitelisting all previously non-whitelisted under ${role.toString()} to: ${branch}`
              )
            ),
          ],
          components: [],
        });

        for (const member of role.members.toJSON()) {
          if (member.user.bot) continue;
          let key = await getKey({
            discord_id: member.user.id,
            token: api_key, 
          }); 
          //console.log(`${member.user.tag} ${typeof key !== "string" ? "whitelisted" : "not whitelisted"}`)
          setTimeout(async () => {
            while (!key || (typeof key === "string" && key.indexOf(' ') !== -1)) {
              key = await whitelistUser({
                discord_id: member.user.id,
                token: api_key,
                wl_script_id,
              });
            } 
          }, 1000) 
        }

        await msg[msg.editable ? "edit" : msg.replied ? "editReply" : "update"]({
          embeds: [
            new EmbedBuilder(success_embed.toJSON()).setDescription(
              Formatters.bold(
                `Successfully whitelisted all previously non-whitelisted under ${role.toString()} to: ${branch}`
              )
            ),
          ],
          components: [],
        });
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
    description: "Whitelists the mentioned role",
    ephemeral: false,
    options: dkto.builder
      .command_options()
      .role({
        name: "role",
        description: "Role to whitelist",
      })
      .toJSON(),
  }
);
