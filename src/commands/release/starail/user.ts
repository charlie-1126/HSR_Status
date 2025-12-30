import path from "node:path";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
	ActionRowBuilder,
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	type StringSelectMenuBuilder,
} from "discord.js";
import { getUserData } from "../../../services/dbHandler";
import { getGameRecord } from "../../../utils/getGameRecord";
import { logger } from "../../../utils/logger";
import {
	accountLinkUI,
	expiredEmbed,
	gameRecordEmbed,
	menuSelectUI,
	notExistEmbed,
	setupAccountLinkCollector,
} from "../../../utils/messageUI";
import { checkAPI } from "../../../utils/tools/validation";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

export default {
	data: new SlashCommandBuilder()
		.setName("user")
		.setNameLocalizations({ ko: "유저" })
		.setDescription("Check user information.")
		.setDescriptionLocalizations({ ko: "유저의 정보를 확인합니다." })
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Enter the user to check information for.")
				.setNameLocalizations({ ko: "유저" })
				.setDescriptionLocalizations({
					ko: "정보를 확인할 유저를 입력해주세요.",
				})
				.setRequired(false),
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("user") || interaction.user;
		// 유저 데이터 확인
		const userData = getUserData(user.id);
		if (!userData) {
			if (user.id === interaction.user.id) {
				const { embed, row } = await accountLinkUI(false);
				const msg = await interaction.reply({
					embeds: [embed],
					components: [row],
				});
				await setupAccountLinkCollector(msg, user.id);
			} else {
				await interaction.reply({ embeds: [notExistEmbed()], ephemeral: true });
			}
			return;
		}

		// API 체크
		if (!(await checkAPI(userData.uid, userData.ltuid, userData.ltoken))) {
			if (user.id === interaction.user.id) {
				const { embed, row } = await accountLinkUI(true);
				const msg = await interaction.reply({
					embeds: [embed],
					components: [row],
				});
				await setupAccountLinkCollector(msg, user.id, userData);
			} else {
				await interaction.reply({ embeds: [expiredEmbed()], ephemeral: true });
			}
			return;
		}

		await interaction.deferReply();

		// 게임 기록 임베드 생성
		const gameRecord = await getGameRecord(
			userData.uid,
			userData.ltuid,
			userData.ltoken,
		);
		if (!gameRecord) {
			logger.error(
				`게임 기록을 불러오는 데 실패했습니다. UID: ${userData.uid}`,
			);
			return;
		}
		const embed = await gameRecordEmbed(gameRecord);

		const select = menuSelectUI("mainprofile", user.id, interaction.user.id);
		const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			select,
		);

		await interaction.editReply({
			files: [
				{ attachment: path.join(process.cwd(), "assets", "testImg.jpg") },
			],
			embeds: [embed],
			components: [row],
		});
	},
};
