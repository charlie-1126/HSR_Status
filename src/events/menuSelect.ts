import {
    Events,
    StringSelectMenuInteraction,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonInteraction,
} from "discord.js";
import path from "path";
import {
    getChestDetail,
    getGameRecord,
    getCharacterList,
    getAchievementDetail,
    getEndContentRecord,
} from "../utils/getGameRecord";
import { getUserData } from "../services/dbHandler";
import { checkAPI } from "../utils/tools/validation";
import {
    accountLinkUI,
    menuSelectUI,
    chestDetailEmbed,
    playRecordEmbed,
    notExistEmbed,
    expiredEmbed,
    gameRecordEmbed,
    achievementDetailEmbed,
    setupAccountLinkCollector,
} from "../utils/messageUI";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: StringSelectMenuInteraction | ButtonInteraction) {
        if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;
        if (
            !interaction.customId.startsWith("menuSelect") &&
            !interaction.customId.startsWith("chestDetail") &&
            !interaction.customId.startsWith("achievementDetail") &&
            !interaction.customId.startsWith("playrecord")
        )
            return;

        const subjectId = interaction.customId.split(":")[1];
        const cid = interaction.customId.split(":")[2];

        if (interaction.user.id != cid) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("권한 없음")
                .setDescription(`명령어를 실행한 <@${cid}>님만 메뉴를 사용할 수 있습니다.`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const customIdPrefix = interaction.customId.split(":")[0];
        const selectedValue = interaction.isStringSelectMenu()
            ? customIdPrefix === "menuSelect"
                ? interaction.values[0]
                : customIdPrefix
            : customIdPrefix;
        const original_message = interaction.message;

        // 유저 데이터 확인
        const userData = getUserData(subjectId);
        if (!userData) {
            await interaction.deferUpdate();
            if (subjectId == cid) {
                const { embed, row } = await accountLinkUI(false);
                const msg = await original_message.edit({ embeds: [embed], components: [row], files: [] });
                await setupAccountLinkCollector(msg, subjectId);
            } else {
                await original_message.edit({ embeds: [notExistEmbed()], components: [], files: [] });
            }
            return;
        }

        // API 체크
        if (!(await checkAPI(userData.uid, userData.ltuid, userData.ltoken))) {
            await interaction.deferUpdate();
            if (subjectId == cid) {
                const { embed, row } = await accountLinkUI(true);
                const msg = await original_message.edit({ embeds: [embed], components: [row], files: [] });
                await setupAccountLinkCollector(msg, subjectId, userData);
            } else {
                await original_message.edit({ embeds: [expiredEmbed()], components: [], files: [] });
            }
            return;
        }

        await interaction.deferUpdate();
        if (selectedValue == "mainprofile") {
            // 게임 기록 임베드 생성
            const gameRecord = await getGameRecord(userData.uid, userData.ltuid, userData.ltoken);
            const embed = await gameRecordEmbed(gameRecord);

            const select = menuSelectUI("mainprofile", subjectId, cid);
            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

            await original_message.edit({
                files: [{ attachment: path.join(process.cwd(), "assets", "testImg.jpg") }],
                embeds: [embed],
                components: [row],
            });
        } else if (selectedValue == "playrecord") {
            const gameRecord = await getGameRecord(userData.uid, userData.ltuid, userData.ltoken);
            if (!gameRecord) return;
            const embed = playRecordEmbed(gameRecord);

            const select = menuSelectUI("playrecord", subjectId, cid);

            const ChestDetailBTN = new ButtonBuilder()
                .setCustomId(`chestDetail:${subjectId}:${cid}`)
                .setLabel("전리품 상세 보기")
                .setStyle(ButtonStyle.Success);
            const AchievementDetailBTN = new ButtonBuilder()
                .setCustomId(`achievementDetail:${subjectId}:${cid}`)
                .setLabel("업적 상세 보기")
                .setStyle(ButtonStyle.Success);
            const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(ChestDetailBTN, AchievementDetailBTN);
            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

            await original_message.edit({ embeds: [embed], components: [row, buttonRow], files: [] });
        } else if (selectedValue == "endcontentrecord") {
            // 빛 따라 금 찾아 전적
            const challengeRecord = await getEndContentRecord(userData.uid, userData.ltuid, userData.ltoken);
            if (!challengeRecord) return;
            const select = menuSelectUI("endcontentrecord", subjectId, cid);
            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
            const embed = new EmbedBuilder()
                .setColor("White")
                .setTitle(`빛 따라 금 찾아 전적 (${challengeRecord.nickname})`)
                .setDescription(
                    `- 이상중재 전적: ${
                        challengeRecord.challengeRecord.peak
                            ? `${challengeRecord.challengeRecord.peak.current_progress} / ${challengeRecord.challengeRecord.peak.total_progress}`
                            : `미오픈`
                    }\n- 혼돈의 기억 전적: ${
                        challengeRecord.challengeRecord.chaos
                            ? `${challengeRecord.challengeRecord.chaos.current_progress} / ${challengeRecord.challengeRecord.chaos.total_progress}`
                            : `미오픈`
                    }\n- 허구 이야기 전적: ${
                        challengeRecord.challengeRecord.story
                            ? `${challengeRecord.challengeRecord.story.current_progress} / ${challengeRecord.challengeRecord.story.total_progress}`
                            : `미오픈`
                    }\n- 종말의 환영 전적: ${
                        challengeRecord.challengeRecord.boss
                            ? `${challengeRecord.challengeRecord.boss.current_progress} / ${challengeRecord.challengeRecord.boss.total_progress}`
                            : `미오픈`
                    }`
                )
                .setTimestamp();
            await original_message.edit({ embeds: [embed], components: [row], files: [] });
        } else if (selectedValue == "weeklycontentrecord") {
            // 우주 전쟁 전적
        } else if (selectedValue == "chestDetail") {
            const selectedIndex =
                interaction.isStringSelectMenu() && customIdPrefix === "chestDetail"
                    ? parseInt(interaction.values[0])
                    : 0;
            const chestDetail = await getChestDetail(userData.uid, userData.ltuid, userData.ltoken);
            if (!chestDetail) return;

            const { embed, row } = await chestDetailEmbed(chestDetail, selectedIndex, subjectId, cid);
            const backBTN = new ButtonBuilder()
                .setCustomId(`playrecord:${subjectId}:${cid}`)
                .setLabel("뒤로 가기")
                .setStyle(ButtonStyle.Primary);
            const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backBTN);
            await original_message.edit({ embeds: [embed], components: [row, buttonRow], files: [] });
        } else if (selectedValue == "achievementDetail") {
            const achievement_detail = await getAchievementDetail(userData.uid, userData.ltuid, userData.ltoken);
            if (!achievement_detail) return;

            const embed = await achievementDetailEmbed(achievement_detail);
            const select = menuSelectUI("none", subjectId, cid);
            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
            await original_message.edit({ embeds: [embed], components: [row], files: [] });
        }
    },
};
