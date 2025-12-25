import crypto from "node:crypto";
import axios from "axios";
import { getUserData } from "../../services/dbHandler";
import { logger } from "../logger";

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

export async function isExistUser(userId: string) {
	const userData = getUserData(userId);
	if (userData) {
		return true;
	} else {
		return false;
	}
}

export async function checkAPI(uid: string, ltuid: string, ltoken: string) {
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

		if (response.data && response.data.retcode === 0) {
			return true;
		} else {
			return false;
		}
	} catch (err: any) {
		logger.error("API 요청 오류:", err.response?.data || err);
		return false;
	}
}
