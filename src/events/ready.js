const { Client } = require("discord.js");
const { load } = require("../handlers/commands");
const { list } = require("../handlers/commands");

module.exports.bot;

/**
 *
 * @param {Client} bot
 */
module.exports = async function (bot) {
	module.exports.bot = bot

	const cmds = await bot.application.commands.fetch()	

	for (const [name, cmd] of cmds) {
		list[cmd.name] = cmd
	}

	await load(bot)

	console.log(bot.user.tag, "has started!");
	bot.user.setActivity(`Managing whitelists`, {
        type: "PLAYING",
      }),
	console.log(
		bot.generateInvite({
			permissions: ["Administrator"],
			scopes: ["applications.commands", "bot"],
		})
	);
};
