import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from "discord.js";
import {
    menuSelectUI,
    notExistEmbed,
    expiredEmbed,
    accountLinkUI,
    setupAccountLinkCollector,
    gameRecordEmbed,
} from "../../../utils/messageUI";
import { getUserData } from "../../../services/dbHandler";
import { checkAPI } from "../../../utils/tools/validation";
import { getGameRecord, getChestDetail, getCharacterList, GameRecord } from "../../../utils/getGameRecord";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import path from "path";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

export default {
    data: new SlashCommandBuilder()
        .setName("유저")
        .setDescription("유저의 정보를 확인합니다.")
        .addUserOption((option) =>
            option.setName("유저").setDescription("정보를 확인할 유저를 입력해주세요.").setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("유저") || interaction.user;

        // 유저 데이터 확인
        const userData = getUserData(user.id);
        if (!userData) {
            if (user.id == interaction.user.id) {
                const { embed, row } = await accountLinkUI(false);
                const msg = await interaction.reply({ embeds: [embed], components: [row] });
                await setupAccountLinkCollector(msg, user.id);
            } else {
                await interaction.reply({ embeds: [notExistEmbed()], ephemeral: true });
            }
            return;
        }

        // API 체크
        if (!(await checkAPI(userData.uid, userData.ltuid, userData.ltoken))) {
            if (user.id == interaction.user.id) {
                const { embed, row } = await accountLinkUI(true);
                const msg = await interaction.reply({ embeds: [embed], components: [row] });
                await setupAccountLinkCollector(msg, user.id, userData);
            } else {
                await interaction.reply({ embeds: [expiredEmbed()], ephemeral: true });
            }
            return;
        }

        await interaction.deferReply();

        // 게임 기록 임베드 생성
        const gameRecord = await getGameRecord(userData.uid, userData.ltuid, userData.ltoken);
        const embed = await gameRecordEmbed(gameRecord);

        const select = menuSelectUI("mainprofile", user.id, interaction.user.id);
        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

        await interaction.editReply({
            files: [{ attachment: path.join(process.cwd(), "assets", "testImg.jpg") }],
            embeds: [embed],
            components: [row],
        });
    },
};
