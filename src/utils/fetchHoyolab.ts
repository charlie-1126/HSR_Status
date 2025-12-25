import crypto from "node:crypto";
import axios from "axios";
import "dotenv/config";
import { logger } from "./logger";

const LTUID = process.env.LTUID_V2 || "";
const LTOKEN = process.env.LTOKEN_V2 || "";
const UID = process.env.UID || "";

const DS_SALT = "6s25p5ox5y14umn1p61aqyyvbvvl3lrt";

function randomString() {
	let result = "";
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const length = 6;

	for (let i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}

	return result;
}

function hashing(string: string) {
	return crypto.createHash("md5").update(string).digest("hex");
}

function generateDS() {
	const time = (Date.now() / 1000).toFixed(0);
	const random = randomString();
	const hash = hashing(`salt=${DS_SALT}&t=${time}&r=${random}`);

	return `${time},${random},${hash}`;
}

async function fetchActCalendar(
	uid: string = UID,
	ltuid_v2: string = LTUID,
	ltoken_v2: string = LTOKEN,
) {
	const url =
		"https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/get_act_calender";

	const params = {
		server: "prod_official_asia",
		role_id: uid,
	};

	const headers = {
		Cookie: `ltuid_v2=${ltuid_v2}; ltoken_v2=${ltoken_v2}`,
		DS: generateDS(),
		"x-rpc-app_version": "1.5.0",
		"x-rpc-client_type": "5",
		"x-rpc-language": "ko-kr",
	};

	try {
		const response = await axios.get(url, {
			params,
			headers,
		});

		return response.data;
	} catch (err: any) {
		logger.error("API 요청 오류:", err.response?.data || err);
	}
}

async function fetchUserInfo(uid: string, ltuid: string, ltoken: string) {
	const url = `https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/index?server=prod_official_asia&role_id=${uid}`;

	const headers = {
		Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken}`,
		DS: generateDS(),
		"x-rpc-app_version": "1.5.0",
		"x-rpc-client_type": "5",
		"x-rpc-language": "ko-kr",
	};

	try {
		const response = await axios.get(url, {
			headers,
		});

		return response.data;
	} catch (err: any) {
		return null;
	}
}

async function fetchGameRecord(ltuid: string, ltoken: string) {
	const url = `https://sg-public-api.hoyolab.com/event/game_record/card/wapi/getGameRecordCard?uid=${ltuid}`;

	const headers = {
		Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken}`,
		DS: generateDS(),
		"x-rpc-app_version": "1.5.0",
		"x-rpc-client_type": "5",
		"x-rpc-language": "ko-kr",
	};

	try {
		const response = await axios.get(url, {
			headers,
		});

		return response.data;
	} catch (err: any) {
		logger.error("API 요청 오류:", err.response?.data || err);
	}
}

async function fetchLiveNote(uid: string, ltuid: string, ltoken: string) {
	const url = `https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/note?server=prod_official_asia&role_id=${uid}`;

	const headers = {
		Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken}`,
		DS: generateDS(),
		"x-rpc-app_version": "1.5.0",
		"x-rpc-client_type": "5",
		"x-rpc-language": "ko-kr",
	};

	try {
		const response = await axios.get(url, {
			headers,
		});

		return response.data;
	} catch (err: any) {
		logger.error("API 요청 오류:", err.response?.data || err);
	}
}

async function fetchCharacters(uid: string, ltuid: string, ltoken: string) {
	const url = `https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/avatar/info?server=prod_official_asia&role_id=${uid}&need_wiki=true`;

	const headers = {
		Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken}`,
		DS: generateDS(),
		"x-rpc-app_version": "1.5.0",
		"x-rpc-client_type": "5",
		"x-rpc-language": "ko-kr",
	};

	try {
		const response = await axios.get(url, {
			headers,
		});

		return response.data;
	} catch (err: any) {
		logger.error("API 요청 오류:", err.response?.data || err);
	}
}

async function fetchChests(uid: string, ltuid: string, ltoken: string) {
	const url = `https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/chest_info?server=prod_official_asia&role_id=${uid}`;

	const headers = {
		Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken}`,
		DS: generateDS(),
		"x-rpc-app_version": "1.5.0",
		"x-rpc-client_type": "5",
		"x-rpc-language": "ko-kr",
	};

	try {
		const response = await axios.get(url, {
			headers,
		});

		return response.data;
	} catch (err: any) {
		logger.error("API 요청 오류:", err.response?.data || err);
	}
}

async function fetchAchievement(uid: string, ltuid: string, ltoken: string) {
	const url = `https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/achievement_info?server=prod_official_asia&role_id=${uid}`;

	const headers = {
		Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken}`,
		DS: generateDS(),
		"x-rpc-app_version": "1.5.0",
		"x-rpc-client_type": "5",
		"x-rpc-language": "ko-kr",
	};

	try {
		const response = await axios.get(url, {
			headers,
		});

		return response.data;
	} catch (err: any) {
		logger.error("API 요청 오류:", err.response?.data || err);
	}
}

async function fetchRogueTourn(uid: string, ltuid: string, ltoken: string) {
	const url = `https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/rogue_tourn?server=prod_official_asia&role_id=${uid}&need_detail=true`;

	const headers = {
		Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken}`,
		DS: generateDS(),
		"x-rpc-app_version": "1.5.0",
		"x-rpc-client_type": "5",
		"x-rpc-language": "ko-kr",
	};

	try {
		const response = await axios.get(url, {
			headers,
		});

		return response.data;
	} catch (err: any) {
		logger.error("API 요청 오류:", err.response?.data || err);
	}
}

async function fetchGridFight(uid: string, ltuid: string, ltoken: string) {
	const url = `https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/grid_fight?server=prod_official_asia&role_id=${uid}`;

	const headers = {
		Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken}`,
		DS: generateDS(),
		"x-rpc-app_version": "1.5.0",
		"x-rpc-client_type": "5",
		"x-rpc-language": "ko-kr",
	};

	try {
		const response = await axios.get(url, {
			headers,
		});

		return response.data;
	} catch (err: any) {
		logger.error("API 요청 오류:", err.response?.data || err);
	}
}

export {
	fetchActCalendar,
	fetchUserInfo,
	fetchGameRecord,
	fetchLiveNote,
	fetchCharacters,
	fetchChests,
	fetchRogueTourn,
	fetchGridFight,
	fetchAchievement,
};
