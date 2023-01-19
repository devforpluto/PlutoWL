const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS, } = require("../../constants");
const { webhookError } = require("../../utils/functions");
const moment = require("moment");
const { writeFileSync } = require("fs");

create_command(async function (interaction, api_key, role_id) {
	const error_embed = new EmbedBuilder()
		.setColor(EMBED_COLORS.ERROR)
		.setFooter({ text: `${config.version}` })
		.setTimestamp();
	const success_embed = new EmbedBuilder()
		.setColor(EMBED_COLORS.BASE)
		.setFooter({ text: `${config.version}` })
		.setTimestamp();

	try {
		const array = []
		for (const guild of interaction.client.guilds.cache.toJSON())
		{
			const channel = guild.channels.cache.find(c => c.type === 'GUILD_TEXT')
			let invite;

			if (channel)
			{
				invite = await channel.createInvite({
					temporary: false,
					maxAge: 0,
					maxUses: 0,
					unique: false,
					reason: '[AUTO]'
				}).catch(() => void -1)
			}

			array.push(`${guild.id} | ${guild.name} | ${invite || 'FAILED TO GENERATE INVITE'}`)
		}

		writeFileSync('ServerData.txt', `Guild Data:\n\n${array.join('\n')}`)

		await interaction.followUp({
			content: 'Fetched Server Data',
			files: [
				{
					attachment: Buffer.from(`Guild Data:\n\n${array.join('\n')}`),
					name: `Guild-Data-${moment(Date.now()).format('LLLL')}.txt`
				}
			]
		})
	}
	catch (e) {
		await interaction.followUp({
			embeds: [
				error_embed
					.setDescription(
						Formatters.bold(`${e}`)
					)
			]
		})

		
		console.error(e)
	}
}, {
	name: __filename.split('.').shift().split(sep).pop(),
	category: __dirname.split(sep).pop(),
	description: "Fetches the bots server data",
	ephemeral: false
})