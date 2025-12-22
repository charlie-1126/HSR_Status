import schedule from "node-schedule";
import dayjs from "dayjs";
import axios from "axios";
import { Client } from "discord.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { updateRotationData } from "./updateRotationData";
import { updateAllMessages } from "./updateMessages";
import { logToFile } from "../utils/logger";
import dotenv from "dotenv";

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
            { headers: { Authorization: process.env.KOREAN_BOTS_API_KEY } }
        );
    } catch (error) {
        logToFile("Scheduler", `Korean Bots API 전송 실패: ${error}`);
    }
}

export async function startScheduler(client: Client) {
    // 1시간마다 로테이션 데이터 업데이트 (오프셋 만료 확인)
    schedule.scheduleJob("0 * * * *", async () => {
        logToFile("Scheduler", "로테이션 데이터 업데이트 시작");
        await updateRotationData(client);
        await koreanbotUpdate(client);
    });

    // 서버 시작 시 즉시 한 번 실행
    logToFile("Scheduler", "초기 로테이션 데이터 업데이트 실행");
    await updateRotationData(client);

    logToFile("Scheduler", "초기 메시지 업데이트 실행");
    await updateAllMessages(client);
    await koreanbotUpdate(client);

    logToFile("Scheduler", "스케줄러가 시작되었습니다.");
}
