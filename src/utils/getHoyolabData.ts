import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type * as hoyolabType from "../types/hoyolabType";
import {
	FetchType,
	fetchDataFromHoyolab,
	fetchGameRecord,
} from "./fetchHoyolab";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

export async function getGameRecord(
	uid: string,
	ltuid: string,
	ltoken: string,
) {
	const userInfo = await fetchDataFromHoyolab(
		FetchType.USERINFO,
		uid,
		ltuid,
		ltoken,
	);
	const gameRecord = await fetchGameRecord(ltuid, ltoken);
	const liveNote = await fetchDataFromHoyolab(
		FetchType.LIVENOTE,
		uid,
		ltuid,
		ltoken,
	);

	if (
		!userInfo ||
		userInfo.retcode !== 0 ||
		!userInfo.data ||
		!gameRecord ||
		gameRecord.retcode !== 0 ||
		!gameRecord.data ||
		!liveNote ||
		liveNote.retcode !== 0 ||
		!liveNote.data
	) {
		return null;
	}

	const hsrGameRecord = gameRecord.data.list.find(
		(game: unknown) => (game as { game_id: number }).game_id === 6,
	);

	const processedUserData = {
		nickname: hsrGameRecord.nickname,
		level: hsrGameRecord.level,
		region: hsrGameRecord.region_name.replace(" Server", ""),
		profile_icon: userInfo.data.cur_head_icon_url,
		profile_frame: userInfo.data.head_icon_frame_url,
		active_days: userInfo.data.stats.active_days,
		avatar_num: userInfo.data.stats.avatar_num,
		achievement_num: userInfo.data.stats.achievement_num,
		season_title: userInfo.data.stats.season_title,
		abyss_process: userInfo.data.stats.abyss_process,
		phone_background_image: userInfo.data.phone_background_image_url,
		current_stamina: liveNote.data.current_stamina,
		max_stamina: liveNote.data.max_stamina,
		current_reserve_stamina: liveNote.data.current_reserve_stamina,
		is_reserve_stamina_full: liveNote.data.is_reserve_stamina_full,
		current_train_score: liveNote.data.current_train_score,
		max_train_score: liveNote.data.max_train_score,
		current_time: dayjs(liveNote.data.current_ts * 1000).tz(),
		stamina_full_time: dayjs(liveNote.data.stamina_full_ts * 1000).tz(),
		grid_fight_weekly_cur: liveNote.data.grid_fight_weekly_cur,
		grid_fight_weekly_max: liveNote.data.grid_fight_weekly_max,
		current_rogue_score: liveNote.data.current_rogue_score,
		max_rogue_score: liveNote.data.max_rogue_score,
		expeditions: liveNote.data.expeditions.map(
			(expedition: hoyolabType.RowExpedition) => {
				return {
					name: expedition.name,
					icon: expedition.item_url,
					status: expedition.status,
					remaining_time: expedition.remaining_time,
					finish_time:
						expedition.remaining_time !== 0
							? dayjs(expedition.finish_ts * 1000).tz()
							: null,
				};
			},
		),
		accepted_expedition_num: liveNote.data.accepted_epedition_num,
		total_expedition_num: liveNote.data.total_expedition_num,
		weekly_cocoon_cnt: liveNote.data.weekly_cocoon_cnt,
		weekly_cocoon_limit: liveNote.data.weekly_cocoon_limit,
		chest_num: userInfo.data.stats.chest_num,
	} as hoyolabType.GameRecord;

	return processedUserData;
}

export async function getChestDetail(
	uid: string,
	ltuid: string,
	ltoken: string,
) {
	const userInfo = await fetchDataFromHoyolab(
		FetchType.USERINFO,
		uid,
		ltuid,
		ltoken,
	);
	const chests_data = await fetchDataFromHoyolab(
		FetchType.CHESTS,
		uid,
		ltuid,
		ltoken,
	);
	const gameRecord = await fetchGameRecord(ltuid, ltoken);
	if (
		!chests_data ||
		chests_data.retcode !== 0 ||
		!chests_data.data ||
		!userInfo ||
		userInfo.retcode !== 0 ||
		!userInfo.data ||
		!gameRecord ||
		gameRecord.retcode !== 0 ||
		!gameRecord.data
	) {
		return null;
	}

	const hsrGameRecord = gameRecord.data.list.find(
		(game: unknown) => (game as { game_id: number }).game_id === 6,
	);

	return {
		nickname: hsrGameRecord.nickname,
		chest_num: userInfo.data.stats.chest_num,
		chests: chests_data.data.world_list.map((world: hoyolabType.World) => {
			return {
				name: world.name,
				cur: world.world_cur,
				max: world.world_max,
				icon: world.icon,
				map_detail: world.map_entrances.map((map) => {
					return {
						name: map.name,
						cur: map.cur_chest,
						max: map.max_chest,
					};
				}),
			};
		}),
	} as hoyolabType.ChestDetail;
}

export async function getAchievementDetail(
	uid: string,
	ltuid: string,
	ltoken: string,
) {
	const userInfo = await fetchDataFromHoyolab(
		FetchType.USERINFO,
		uid,
		ltuid,
		ltoken,
	);
	const achievement_data = await fetchDataFromHoyolab(
		FetchType.ACHIEVEMENT,
		uid,
		ltuid,
		ltoken,
	);
	const gameRecord = await fetchGameRecord(ltuid, ltoken);
	if (
		!achievement_data ||
		achievement_data.retcode !== 0 ||
		!achievement_data.data ||
		!userInfo ||
		userInfo.retcode !== 0 ||
		!userInfo.data ||
		!gameRecord ||
		gameRecord.retcode !== 0 ||
		!gameRecord.data
	) {
		return null;
	}

	const hsrGameRecord = gameRecord.data.list.find(
		(game: unknown) => (game as { game_id: number }).game_id === 6,
	);
	return {
		nickname: hsrGameRecord.nickname,
		achievement_num: userInfo.data.stats.achievement_num,
		gold_num: achievement_data.data.gold_num,
		silver_num: achievement_data.data.silver_num,
		copper_num: achievement_data.data.copper_num,
		achievements: achievement_data.data.list.map(
			(achieve: hoyolabType.RowAchievement) => {
				return {
					name: achieve.name,
					icon: achieve.icon,
					cur: achieve.cur,
					max: achieve.max,
				};
			},
		),
	} as hoyolabType.achievementDetail;
}

export async function getCharacterList(
	uid: string,
	ltuid: string,
	ltoken: string,
) {
	const characters_data = await fetchDataFromHoyolab(
		FetchType.CHARACTERS,
		uid,
		ltuid,
		ltoken,
	).then((res) => res.data.avatar_list);
	if (!characters_data) {
		return null;
	}

	const characters = characters_data.map((char: hoyolabType.RowCharacter) => {
		const skills = char.skills.map((skill) => {
			return {
				remake: skill.remake,
				pointType: skill.point_type,
				icon: skill.item_url,
				level: skill.level,
				anchor: Number(skill.anchor.replace("Point", "")),
				is_activated: skill.is_activated,
			};
		});
		if (char.servant_detail) {
			const servant_skills = char.servant_detail.servant_skills.map((skill) => {
				return {
					remake: skill.remake,
					pointType: skill.point_type,
					icon: skill.item_url,
					level: skill.level,
					anchor: Number(skill.anchor.replace("Point", "")),
					is_activated: skill.is_activated,
				};
			});
			skills.push(...servant_skills);
		}
		return {
			name: char.name,
			image: char.image,
			icon: char.icon,
			level: char.level,
			element: char.element_id,
			base_type: char.base_type,
			ranks: char.ranks.map((rank) => {
				return {
					is_unlocked: rank.is_unlocked,
					pos: rank.pos,
					icon: rank.icon,
				};
			}),
			equip: char.equip
				? {
						name: char.equip.name,
						rank: char.equip.rank,
						level: char.equip.level,
						icon: char.equip.icon,
						rarity: char.equip.rarity,
					}
				: null,
			properties: char.properties.map((prop) => {
				return {
					property_type: prop.property_type,
					base: Number(prop.base),
					add: Number(prop.add),
					final: Number(prop.final),
				};
			}),
			skills: skills,
			relics: char.relics.map((relic) => {
				return {
					icon: relic.icon,
					level: relic.level,
					rarity: relic.rarity,
					pos: relic.pos,
					main_property: {
						property_type: relic.main_property.property_type,
						value: relic.main_property.value,
					},
					properties: relic.properties.map((prop) => {
						return {
							property_type: prop.property_type,
							times: prop.times - 1,
							value: prop.value,
						};
					}),
				};
			}),
			ornaments: char.ornaments.map((ornament) => {
				return {
					icon: ornament.icon,
					level: ornament.level,
					rarity: ornament.rarity,
					pos: ornament.pos,
					main_property: {
						property_type: ornament.main_property.property_type,
						value: ornament.main_property.value,
					},
					properties: ornament.properties.map((prop) => {
						return {
							property_type: prop.property_type,
							times: prop.times - 1,
							value: prop.value,
						};
					}),
				};
			}),
		} as hoyolabType.Character;
	});
	return characters as hoyolabType.Character[];
}

export async function getEndContentRecord(
	uid: string,
	ltuid: string,
	ltoken: string,
) {
	const actCalendar = await fetchDataFromHoyolab(
		FetchType.ACTCALENDAR,
		uid,
		ltuid,
		ltoken,
	);
	const gameRecord = await fetchGameRecord(ltuid, ltoken);
	if (
		!actCalendar ||
		actCalendar.retcode !== 0 ||
		!actCalendar.data ||
		!gameRecord ||
		gameRecord.retcode !== 0 ||
		!gameRecord.data
	) {
		return null;
	}

	const hsrGameRecord = gameRecord.data.list.find(
		(game: unknown) => (game as { game_id: number }).game_id === 6,
	);
	const challenge_list = actCalendar.data.challenge_list || [];
	const challengeRecord: hoyolabType.challengeRecord = {
		peak: null,
		boss: null,
		story: null,
		chaos: null,
	};
	for (const challenge of challenge_list) {
		if (challenge.status === "challengeStatusUnopened") continue;
		if (challenge.challenge_type === "ChallengeTypePeak") {
			challengeRecord.peak = {
				current_progress: challenge.current_progress,
				total_progress: challenge.total_progress,
				rank_icon: challenge.challenge_peak_rank_icon,
				rank_icon_type: challenge.challenge_peak_rank_icon_type,
			};
		} else if (challenge.challenge_type === "ChallengeTypeBoss") {
			challengeRecord.boss = {
				current_progress: challenge.current_progress,
				total_progress: challenge.total_progress,
			};
		} else if (challenge.challenge_type === "ChallengeTypeStory") {
			challengeRecord.story = {
				current_progress: challenge.current_progress,
				total_progress: challenge.total_progress,
			};
		} else if (challenge.challenge_type === "ChallengeTypeChasm") {
			challengeRecord.chaos = {
				current_progress: challenge.current_progress,
				total_progress: challenge.total_progress,
			};
		}
	}

	return {
		nickname: hsrGameRecord.nickname,
		challengeRecord: challengeRecord,
	};
}
