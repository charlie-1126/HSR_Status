import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { formatTime, getTimeData } from "../../../utils/getTimeData";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

export default {
	data: new SlashCommandBuilder()
		.setName("로테이션")
		.setDescription("HSR 로테이션 정보를 확인합니다."),
	async execute(interaction: ChatInputCommandInteraction) {
		const timedata = await getTimeData();
		if (timedata.error) {
			await interaction.reply({
				content:
					typeof timedata.data === "string"
						? timedata.data
						: JSON.stringify(timedata.data),
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		// 출력
		const embed = new EmbedBuilder()
			.setColor("White")
			.setDescription(formatTime(timedata))
			.setTimestamp()
			.setFooter({
				text: `version ${typeof timedata.data === "string" ? timedata.data : timedata.data.gameversion}`,
			});

		await interaction.reply({ embeds: [embed] });
	},
};
