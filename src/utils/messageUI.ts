import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	type InteractionResponse,
	LabelBuilder,
	type Message,
	MessageFlags,
	ModalBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { emojis } from "../emoji/emojis";
import type * as hoyolabType from "../types/hoyolabType";
import { emojiFromUrl } from "../utils/tools/emojiManager";

export async function accountLinkUI(isTokenExpired = false) {
	const embed = new EmbedBuilder()
		.setColor(isTokenExpired ? "Red" : "DarkGrey")
		.setTitle(isTokenExpired ? "토큰 만료" : "계정 연동 진행")
		.setDescription(
			isTokenExpired
				? "저장된 토큰이 만료되었거나 올바르지 않습니다. 정보 수정 후 다시 시도해주세요"
				: "아래 버튼을 통해 계정 연동을 진행해주세요.\n입력한 토큰값은 안전하게 암호화되어 저장됩니다.",
		);

	const linkBTN = new ButtonBuilder()
		.setCustomId("linkaccount")
		.setLabel("계정 연동하기")
		.setStyle(ButtonStyle.Primary);

	const guideBTN = new ButtonBuilder()
		.setCustomId("linkguide")
		.setLabel("연동 가이드")
		.setStyle(ButtonStyle.Success);
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		linkBTN,
		guideBTN,
	);
	return { embed, row };
}

export async function gameRecordEmbed(gameRecord: hoyolabType.GameRecord) {
	const expeditionPromises = gameRecord.expeditions.map(async (expedition) => {
		const emoji = await emojiFromUrl(expedition.icon);

		return `${emoji}${expedition.finish_time == null ? "완료됨" : `<t:${expedition.finish_time.unix()}:R>`}`;
	});

	const expeditionTexts = await Promise.all(expeditionPromises);

	const embed = new EmbedBuilder()
		.setColor("White")
		.addFields(
			{
				name: "일일 훈련",
				value: `${gameRecord.current_train_score}/${gameRecord.max_train_score}`,
				inline: true,
			},
			{
				name: "개척력",
				value: `${emojis.stamina}${gameRecord.current_stamina} / ${
					gameRecord.max_stamina
				} ${
					gameRecord.current_stamina === gameRecord.max_stamina
						? "(가득참)"
						: `<t:${gameRecord.stamina_full_time.unix()}:R>`
				}`,
				inline: true,
			},
			{
				name: "예비 개척력",
				value: `${emojis.reserved_stamina}${
					gameRecord.current_reserve_stamina
				}${gameRecord.is_reserve_stamina_full ? "(가득참)" : ""}`,
				inline: true,
			},
			{
				name: "시뮬 우주 점수",
				value: `${gameRecord.current_rogue_score} / ${gameRecord.max_rogue_score}`,
				inline: true,
			},
			{
				name: "화폐 전쟁 점수",
				value: `${gameRecord.grid_fight_weekly_cur} / ${gameRecord.grid_fight_weekly_max}`,
				inline: true,
			},
			{
				name: "전쟁의 여운",
				value: `${gameRecord.weekly_cocoon_cnt} / ${gameRecord.weekly_cocoon_limit}`,
				inline: true,
			},
			{
				name: `의뢰 파견 ${gameRecord.accepted_expedition_num} / ${gameRecord.total_expedition_num}`,
				value: expeditionTexts.join(" | "),
				inline: false,
			},
		)
		.setTimestamp();

	return embed;
}

export function playRecordEmbed(gameRecord: hoyolabType.GameRecord) {
	const embed = new EmbedBuilder()
		.setColor("White")
		.setTitle(`플레이 기록 (${gameRecord.nickname})`)
		.addFields(
			{
				name: "활동 일수",
				value: `${gameRecord.active_days}`,
				inline: true,
			},
			{ name: "\u200B", value: "\u200B", inline: true },
			{
				name: "개방된 캐릭터",
				value: `${gameRecord.avatar_num}`,
				inline: true,
			},
		);
	embed
		.addFields(
			{
				name: "총 획득한 전리품",
				value: `${gameRecord.chest_num}`,
				inline: true,
			},
			{ name: "\u200B", value: "\u200B", inline: true },
			{
				name: "업적 달성 개수",
				value: `${gameRecord.achievement_num}`,
				inline: true,
			},
		)
		.setTimestamp();
	return embed;
}

export async function chestDetailEmbed(
	chestDetail: hoyolabType.ChestDetail,
	selectedIndex: number,
	subjectId: string,
	cid: string,
) {
	const chest = chestDetail.chests[selectedIndex];

	const embed = new EmbedBuilder()
		.setColor("White")
		.setTitle(`전리품 상세 정보 (${chestDetail.nickname})`);

	const emoji = await emojiFromUrl(chest.icon);
	const chestFieldValue = chest.map_detail
		.map((map) => {
			return `- ${map.name}: **${map.cur} / ${map.max}**`;
		})
		.join("\n");

	const description = `## ${emoji}${chest.name} ${chest.cur} / ${chest.max}\n${chestFieldValue}`;
	embed.setDescription(description);

	// StringSelectMenu
	const select = new StringSelectMenuBuilder()
		.setCustomId(`chestDetail:${subjectId}:${cid}`)
		.setPlaceholder("지역을 선택해주세요!");

	const selectPromises = chestDetail.chests.map(async (chest, index) => {
		const chestEmoji = await emojiFromUrl(chest.icon);
		return {
			emoji: `${chestEmoji}`,
			label: `${chest.name}`,
			value: index.toString(),
			default: index === selectedIndex,
		};
	});

	const selectOptions = await Promise.all(selectPromises);
	for (const option of selectOptions) {
		select.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(option.label)
				.setValue(option.value)
				.setDefault(option.default)
				.setEmoji(option.emoji),
		);
	}

	const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
		select,
	);

	return { embed, row };
}

export async function achievementDetailEmbed(
	achievementDetail: hoyolabType.achievementDetail,
) {
	const embed = new EmbedBuilder()
		.setColor("White")
		.setTitle(`업적 상세 정보 (${achievementDetail.nickname})`)
		.addFields(
			{
				name: `${emojis.achive_gold}`,
				value: `${achievementDetail.gold_num}`,
				inline: true,
			},
			{
				name: `${emojis.achive_silver}`,
				value: `${achievementDetail.silver_num}`,
				inline: true,
			},
			{
				name: `${emojis.achive_cooper}`,
				value: `${achievementDetail.copper_num}`,
				inline: true,
			},
		)
		.setTimestamp();

	const achievementPromises = achievementDetail.achievements.map(
		async (achievement) => {
			const emoji = await emojiFromUrl(achievement.icon);
			return {
				name: `${emoji}${achievement.name}`,
				value: `${achievement.cur} / ${achievement.max}`,
				inline: true,
			};
		},
	);

	const achievementFields = await Promise.all(achievementPromises);
	for (const field of achievementFields) {
		embed.addFields(field);
	}

	embed.addFields({
		name: "총 업적 개수",
		value: `${achievementDetail.achievement_num}`,
		inline: false,
	});
	return embed;
}

export function endContentEmbed(challengeRecord: hoyolabType.EndContentRecord) {
	const embed = new EmbedBuilder()
		.setColor("White")
		.setTitle(`빛 따라 금 찾아 전적 (${challengeRecord.nickname})`)
		.setDescription(
			`- 이상중재 전적: ${
				challengeRecord.challengeRecord.peak
					? `${challengeRecord.challengeRecord.peak.current_progress} / ${challengeRecord.challengeRecord.peak.total_progress}`
					: "미오픈"
			}\n- 혼돈의 기억 전적: ${
				challengeRecord.challengeRecord.chaos
					? `${challengeRecord.challengeRecord.chaos.current_progress} / ${challengeRecord.challengeRecord.chaos.total_progress}`
					: "미오픈"
			}\n- 허구 이야기 전적: ${
				challengeRecord.challengeRecord.story
					? `${challengeRecord.challengeRecord.story.current_progress} / ${challengeRecord.challengeRecord.story.total_progress}`
					: "미오픈"
			}\n- 종말의 환영 전적: ${
				challengeRecord.challengeRecord.boss
					? `${challengeRecord.challengeRecord.boss.current_progress} / ${challengeRecord.challengeRecord.boss.total_progress}`
					: "미오픈"
			}`,
		)
		.setTimestamp();

	return embed;
}

export function menuSelectUI(cur: string, subjectId: string, cid: string) {
	const select = new StringSelectMenuBuilder()
		.setCustomId(`menuSelect:${subjectId}:${cid}`)
		.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel("메인 프로필")
				.setDescription("메인 프로필을 확인합니다.")
				.setValue("mainprofile")
				.setDefault(cur === "mainprofile"),
			new StringSelectMenuOptionBuilder()
				.setLabel("플레이 기록")
				.setDescription("플레이 기록을 확인합니다.")
				.setValue("playrecord")
				.setDefault(cur === "playrecord"),
			new StringSelectMenuOptionBuilder()
				.setLabel("빛 따라 금 찾아 전적")
				.setDescription("이상중재, 혼돈, 허구, 종말 전적을 확인합니다.")
				.setValue("endcontentrecord")
				.setDefault(cur === "endcontentrecord"),
			new StringSelectMenuOptionBuilder()
				.setLabel("우주 전쟁 전적")
				.setDescription("화폐 전쟁 및 차분화 우주 전적을 확인합니다.")
				.setValue("weeklycontentrecord")
				.setDefault(cur === "weeklycontentrecord"),
		)
		.setPlaceholder("클릭하여 메뉴를 선택해주세요!");

	return select;
}

export function notExistEmbed() {
	const embed = new EmbedBuilder()
		.setColor("Red")
		.setDescription("조회하신 유저의 연동된 계정 정보가 없습니다.");
	return embed;
}

export function expiredEmbed() {
	const embed = new EmbedBuilder()
		.setColor("Red")
		.setDescription("조회하신 유저의 토큰이 만료되었습니다.");
	return embed;
}

export async function setupAccountLinkCollector(
	msg: Message | InteractionResponse,
	subjectId: string,
	existingData?: { uid: string; ltuid: string; ltoken: string },
) {
	const collector = msg.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: 600_000,
	});

	collector.on("collect", async (i: ButtonInteraction) => {
		if (i.user.id !== subjectId) {
			const embed = new EmbedBuilder()
				.setColor("Red")
				.setTitle("권한 없음")
				.setDescription(
					`계정 연동은 계정의 주체(<@${subjectId}>)만 사용할 수 있습니다.`,
				);
			await i.reply({ embeds: [embed], ephemeral: true });
			return;
		}
		if (i.customId === "linkaccount") {
			const modal = new ModalBuilder()
				.setCustomId("linkaccountmodal")
				.setTitle("계정 연동 정보 입력");

			const uidInput = new TextInputBuilder()
				.setCustomId("uidinput")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("게임 uid를 입력해주세요")
				.setRequired(true);

			const ltuidInput = new TextInputBuilder()
				.setCustomId("ltuidinput")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("ltuid_v2 값을 입력해주세요")
				.setRequired(true);

			const ltokenInput = new TextInputBuilder()
				.setCustomId("ltokeninput")
				.setStyle(TextInputStyle.Short)
				.setPlaceholder("ltoken_v2 값을 입력해주세요")
				.setRequired(true);

			// 기존 데이터가 있으면 기본값으로 설정
			if (existingData) {
				uidInput.setValue(existingData.uid);
				ltuidInput.setValue(existingData.ltuid);
				ltokenInput.setValue(existingData.ltoken);
			}

			const uidLabel = new LabelBuilder()
				.setLabel("UID")
				.setTextInputComponent(uidInput);
			const ltuidLabel = new LabelBuilder()
				.setLabel("LTUID")
				.setTextInputComponent(ltuidInput);
			const ltokenLabel = new LabelBuilder()
				.setLabel("LTOKEN")
				.setTextInputComponent(ltokenInput);

			modal.addLabelComponents(uidLabel, ltuidLabel, ltokenLabel);

			await i.showModal(modal);
		} else if (i.customId === "linkguide") {
			await i.followUp({
				content: "연동 가이드는 아직 구현되지 않은 기능입니다.",
				flags: MessageFlags.Ephemeral,
			});
		}
	});

	collector.on("end", async (_, reason: string) => {
		if (reason === "time") {
			const embed = new EmbedBuilder()
				.setColor("Red")
				.setTitle("계정 연동 시간 만료")
				.setDescription("계정 연동 시간이 만료되었습니다. 다시 시도해주세요.");
			await msg.edit({ embeds: [embed], components: [] });
		}
	});
}
