import { Events, Client } from "discord.js";
import { startScheduler } from "../services/scheduler";

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client) {
        console.log(`${client.user?.tag}으로 로그인 성공!`);
        console.log(`봇이 ${client.guilds.cache.size}개의 서버에서 실행 중`);
        startScheduler(client);

        // 봇 상태 설정
        client.user?.setPresence({
            activities: [{ name: "HSR 로테이션 봇", type: 4 }],
            status: "online",
        });
    },
};
