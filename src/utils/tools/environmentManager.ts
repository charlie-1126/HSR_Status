import "dotenv/config";
import { logger } from "../logger";

const env = process.env.NODE_ENV || "production";
const isDevelopment = env === "development";
const TOKEN = isDevelopment ? process.env.TESTBOT_TOKEN : process.env.TOKEN;
const CLIENT_ID = isDevelopment
	? process.env.TESTBOT_CLIENT_ID
	: process.env.CLIENT_ID;

if (!TOKEN) {
	logger.error("Discord bot token is not defined in environment variables.");
}
if (!CLIENT_ID) {
	logger.error(
		"Discord bot client ID is not defined in environment variables.",
	);
}

export { env, isDevelopment, TOKEN, CLIENT_ID };
