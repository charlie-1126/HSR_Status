import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
	type ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { updateAllMessages } from "../../services/updateMessages";
import { setOffset } from "../../utils/getOffset";
import { logger } from "../../utils/logger";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

export default {
	data: new SlashCommandBuilder()
		.setName("resetoffset")
		.setDescription("HSR 로테이션을 기본값으로 재설정합니다. (개발자 전용)"),
	async execute(interaction: ChatInputCommandInteraction) {
		if (interaction.user.id != process.env.DEVELOPER_ID) {
			await interaction.reply({
				content: "이 명령어는 개발자 전용 명령어입니다.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		try {
			// 모든 오프셋을 초기값(null)으로 리셋
			setOffset("versionUpdate", null);
			setOffset("nextversionUpdate", null);
			setOffset("nextnextversionUpdate", null);
			setOffset("passEndTime", null);
			setOffset("previewProgramTime", null);

			// 데이터가 변경되었으므로 메시지 업데이트
			logger.info("resetoffset 모든 오프셋 리셋");
			await updateAllMessages(interaction.client);

			await interaction.reply({
				content: "✅ 모든 오프셋이 초기값으로 리셋되었습니다.",
				flags: MessageFlags.Ephemeral,
			});
		} catch (error) {
			await interaction.reply({
				content: `오프셋 리셋에 실패했습니다.\n\nError: ${error}`,
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
