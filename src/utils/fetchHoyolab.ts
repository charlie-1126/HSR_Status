import crypto from "node:crypto";
import axios, { AxiosError } from "axios";
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

export enum FetchType {
	ACTCALENDAR = "act_calendar",
	USERINFO = "user_info",
	LIVENOTE = "live_note",
	CHARACTERS = "characters",
	CHESTS = "chests",
	ACHIEVEMENT = "achievement",
	ROGUE = "rogue",
	ROGUEMAGIC = "rogue_magic",
	ROGUELOCUST = "rogue_locust",
	ROGUENOUS = "rogue_nous",
	ROGUETOURN = "rogue_tourn",
	GRIDFIGHT = "grid_fight",
}

export async function fetchGameRecord(ltuid: string, ltoken: string) {
	const url =
		"https://sg-public-api.hoyolab.com/event/game_record/card/wapi/getGameRecordCard";
	const headers = {
		Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken}`,
		DS: generateDS(),
		"x-rpc-app_version": "1.5.0",
		"x-rpc-client_type": "5",
		"x-rpc-language": "ko-kr",
	};

	const params = {
		uid: ltuid,
	};

	try {
		const response = await axios.get(url, {
			params,
			headers,
		});

		return response.data;
	} catch (err: unknown) {
		if (err instanceof AxiosError) {
			logger.error(`API 요청 오류 (GameRecord):`, err.response?.data || err);
		}
		return null;
	}
}

export async function fetchDataFromHoyolab(
	type: FetchType,
	uid: string,
	ltuid: string,
	ltoken: string,
) {
	const baseUrl =
		"https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api";
	const server = "prod_official_asia";

	const urlMap: Record<FetchType, string> = {
		[FetchType.ACTCALENDAR]: `${baseUrl}/get_act_calender`,
		[FetchType.USERINFO]: `${baseUrl}/index`,
		[FetchType.LIVENOTE]: `${baseUrl}/note`,
		[FetchType.CHARACTERS]: `${baseUrl}/avatar/info`,
		[FetchType.CHESTS]: `${baseUrl}/chest_info`,
		[FetchType.ROGUE]: `${baseUrl}/rogue`,
		[FetchType.ROGUEMAGIC]: `${baseUrl}/rogue_magic`,
		[FetchType.ROGUELOCUST]: `${baseUrl}/rogue_locust`,
		[FetchType.ROGUENOUS]: `${baseUrl}/rogue_nous`,
		[FetchType.ROGUETOURN]: `${baseUrl}/rogue_tourn`,
		[FetchType.GRIDFIGHT]: `${baseUrl}/grid_fight`,
		[FetchType.ACHIEVEMENT]: `${baseUrl}/achievement_info`,
	};

	const url = urlMap[type];
	const headers = {
		Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken}`,
		DS: generateDS(),
		"x-rpc-app_version": "1.5.0",
		"x-rpc-client_type": "5",
		"x-rpc-language": "ko-kr",
	};

	const params: Record<string, string> = {};

	params.server = server;
	params.role_id = uid;

	// 특별 파라미터
	if (type === FetchType.CHARACTERS) {
		params.need_wiki = "true";
	}
	if (
		type === FetchType.ROGUETOURN ||
		type === FetchType.ROGUELOCUST ||
		type === FetchType.ROGUENOUS ||
		type === FetchType.ROGUEMAGIC ||
		type === FetchType.ROGUE
	) {
		params.need_detail = "true";
	}

	try {
		const response = await axios.get(url, {
			params,
			headers,
		});

		return response.data;
	} catch (err: unknown) {
		if (err instanceof AxiosError) {
			logger.error(`API 요청 오류 (${type}):`, err.response?.data || err);
		}
		return null;
	}
}

export async function fetchActCalendar() {
	return await fetchDataFromHoyolab(FetchType.ACTCALENDAR, UID, LTUID, LTOKEN);
}
