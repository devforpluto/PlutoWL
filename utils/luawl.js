const { default: axios } = require("axios");
const URL = "https://api.luawl.com"

const object = {
	method: "POST",
	headers: {"Content-Type": "application/json"}
}

async function request(href, body)
{
	return (await axios.request(Object.assign({},
		object,
		{
			url: `${URL}/${href}`,
			data: JSON.stringify(body)
		}
	))).data
}

async function getBuyerRole(body)
{
	return await request('getBuyerRole.php', body)
}

async function addKeyTags(body)
{
	return await request('addKeyTags.php', body)
}

async function getKeyTags(body)
{
	return await request('getKeyTags.php', body)
}

async function isOnCooldown(body)
{
	return await request('isOnCooldown.php', body)
}

async function removeCooldown(body)
{
	return await request('removeCooldown.php', body)
}

async function deleteKey(body)
{
	return await request('deleteKey.php', body)
}

async function updateKeyStatus(body)
{
	return await request('updateKeyStatus.php', body)
}

async function createBlacklist(body)
{
	return await request('createBlacklist.php', body)
}

async function removeBlacklist(body)
{
	return await request('removeBlacklist.php', body)
}

async function getKey(body)
{
	return await request('getKey.php', body)
}

async function getLogs(body)
{
	return await request('getLogs.php', body)
}

async function getAccountScripts(body)
{
	return await request('getAccountScripts.php', body)
}

async function resetHWID(body)
{
	return await request('resetHWID.php', body)
}
async function whitelistUser(body)
{
	return await request('whitelistUser.php', body)
}

async function getAccountInfo(body)
{
	return await request('getAccountInfo.php', body)
}

async function creditObfuscation(body)
{
	return await request('creditObfuscation.php', body)
}

async function creditAccountWeeks(body)
{
	return await request('creditAccountWeeks.php', body)
}

async function changeTier(body)
{
	return await request('changeTier.php', body)
}

async function disableAccount(body)
{
	return await request('disableAccount.php', body)
}
module.exports = {
	createBlacklist,
	removeBlacklist,
	updateKeyStatus,
	deleteKey,
	isOnCooldown,
	getKey,
	getLogs,
	getAccountScripts,
	removeCooldown,
	resetHWID,
	whitelistUser,
	getAccountInfo,
	creditObfuscation,
	creditAccountWeeks,
	changeTier,
	disableAccount,
	getKeyTags,
	addKeyTags,
	getBuyerRole
}