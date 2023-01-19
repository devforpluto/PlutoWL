const axios = require("axios").default;

module.exports = class Functions {
	static sleep(delay) {
		let start = new Date().getTime();
		while (new Date().getTime() < start + delay);
	}
};

const getKey = (id, token) => {
	return new Promise((resolve, reject) => {
		const body = {
			discord_id: id,
			token: token,
		};
		const keyOption = {
			method: "POST",
			url: "https://api.luawl.com/getKey.php",
			headers: { "Content-Type": "application/json" },
			data: JSON.stringify(body),
		};
		axios.request(keyOption).then(function (response, err) {
			if (err) {
				console.log(err);
				reject(err);
				return;
			}

			resolve(response.data);
		});
	});
};
module.exports.getKey = getKey;