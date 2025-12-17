import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    MessageFlags,
    EmbedBuilder,
} from "discord.js";
import { setOffset } from "../../services/getOffset";
import { updateAllMessages } from "../../services/updateMessages";
import { logToFile } from "../../utils/logger";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

export default {
    data: new SlashCommandBuilder()
        .setName("setoffset")
        .setDescription("HSR 로테이션을 일시적으로 변경합니다.(개발자 전용)")
        .addStringOption((option) =>
            option
                .setName("item")
                .setDescription("변경할 항목")
                .setRequired(true)
                .addChoices(
                    { name: "화폐전쟁 시작 날짜", value: "battlestart" },
                    { name: "이번 버전 업데이트 날짜", value: "versionupdate" },
                    { name: "다음 버전 업데이트 날짜", value: "nextversionupdate" },
                    { name: "다다음 버전 업데이트 날짜", value: "nextnextversionupdate" },
                    { name: "공훈 종료 시간", value: "passendtime" },
                    { name: "프리뷰 방송 시간", value: "previewprogramtime" }
                )
        )
        .addStringOption((option) =>
            option.setName("date").setDescription("변경할 날짜와 시간 (예: 2025-12-05 05:00)").setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const item = interaction.options.getString("item", true);
        const dateString = interaction.options.getString("date", true);
        if (interaction.user.id != process.env.DEVELOPER_ID) {
            await interaction.reply({
                content: "이 명령어는 개발자 전용 명령어입니다.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // 날짜 유효성 검증
        const parsedDate = dayjs(dateString);
        if (!parsedDate.isValid()) {
            await interaction.reply({
                content: "올바른 날짜 형식이 아닙니다. (예: 2025-12-05 05:00)",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        try {
            const itemMap: Record<string, string> = {
                battlestart: "battleStart",
                versionupdate: "versionUpdate",
                nextversionupdate: "nextversionUpdate",
                nextnextversionupdate: "nextnextversionUpdate",
                passendtime: "passEndTime",
                previewprogramtime: "previewProgramTime",
            };

            const offsetKey = itemMap[item];
            setOffset(offsetKey, dateString);

            // 데이터가 변경되었으므로 메시지 업데이트
            logToFile("setoffset", `오프셋 변경: ${itemMap[item]} -> ${dateString}`);
            await updateAllMessages(interaction.client);

            const itemNameMap: Record<string, string> = {
                battlestart: "화폐전쟁 시작 날짜",
                versionupdate: "이번 버전 업데이트 날짜",
                nextversionupdate: "다음 버전 업데이트 날짜",
                nextnextversionupdate: "다다음 버전 업데이트 날짜",
                passendtime: "공훈 종료 시간",
                previewprogramtime: "프리뷰 방송 시간",
            };

            await interaction.reply({
                content: `✅ ${itemNameMap[item]}을(를) ${parsedDate.format("YYYY-MM-DD HH:mm:ss")}로 설정했습니다.`,
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            await interaction.reply({
                content: `오프셋 설정에 실패했습니다.\n\nError: ${error}`,
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
