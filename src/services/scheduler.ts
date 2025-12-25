import axios from "axios";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import type { Client } from "discord.js";
import dotenv from "dotenv";
import schedule from "node-schedule";
import { logger } from "../utils/logger";
import { updateAllMessages } from "./updateMessages";
import { updateRotationData } from "./updateRotationData";

dotenv.config();

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

async function koreanbotUpdate(client: Client) {
	// Korean Bots에 서버 수 전송
	try {
		await axios.post(
			`https://koreanbots.dev/api/v2/bots/${process.env.CLIENT_ID}/stats`,
			{
				servers: client.guilds.cache.size,
				shards: client.shard?.count || 1,
			},
			{ headers: { Authorization: process.env.KOREAN_BOTS_API_KEY } },
		);
	} catch (error) {
		logger.error(`Korean Bots API 전송 실패: `);
		logger.error(error);
	}
}

export async function startScheduler(client: Client) {
	// 1시간마다 로테이션 데이터 업데이트 (오프셋 만료 확인)
	schedule.scheduleJob("0 * * * *", async () => {
		logger.info("스케줄러: 로테이션 데이터 업데이트 실행");
		await updateRotationData(client);
		await koreanbotUpdate(client);
	});

	// 서버 시작 시 즉시 한 번 실행
	logger.info("스케줄러: 초기 로테이션 데이터 업데이트 실행");
	await updateRotationData(client);

	logger.info("스케줄러: 초기 메시지 업데이트 실행");
	await updateAllMessages(client);
	await koreanbotUpdate(client);

	logger.info("스케줄러가 시작되었습니다.");
}
