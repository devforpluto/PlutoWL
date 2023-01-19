const { create_command } = require("../../handlers/commands");
const config = require("../../../config.json");
const { dkto } = require("dkto.js");
const { sep } = require("path");
const { EmbedBuilder, Formatters } = require("discord.js");
const { EMBED_COLORS, DEVELOPER_IDS } = require("../../constants");
const { webhookError } = require("../../utils/functions");

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
		const guild = interaction.client.guilds.cache.get(interaction.options.getString('guild_id'))

		if (!guild)
			return await interaction.followUp({
				embeds: [
					error_embed
						.setDescription(
							Formatters.bold(
								'The specified guild was not found'
							)
						)
				]
			})

		await guild.leave()

		return await interaction.followUp({
			embeds: [
				success_embed
					.setDescription(
						Formatters.bold(
							`Successfully left ${guild.name} (${guild.id})`
						)
					)
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
	ephemeral: false,
	options: (
		dkto.builder.command_options()
			.string({
				name: 'guild_id',
				description: 'Leaves the given server id',
				required: true
			})
		.toJSON()
	)
})