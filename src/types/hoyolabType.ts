import type dayjs from "dayjs";

export interface challengeRecord {
	peak: {
		current_progress: number;
		total_progress: number;
		rank_icon: string;
		rank_icon_type: string;
	} | null;
	boss: { current_progress: number; total_progress: number } | null;
	story: { current_progress: number; total_progress: number } | null;
	chaos: { current_progress: number; total_progress: number } | null;
}

export interface Rank {
	is_unlocked: boolean;
	pos: number;
	icon: string;
}
export interface Property {
	property_type: number;
	base: number;
	add: number;
	final: number;
}
export interface Skill {
	remake: string;
	pointType: number;
	icon: string;
	level: number;
	anchor: number;
	is_activated: boolean;
}

export interface Relic {
	icon: string;
	level: number;
	rarity: number;
	pos: number;
	main_property: { property_type: number; value: string };
	properties: { property_type: number; times: number; value: string }[];
}

export interface Character {
	name: string;
	image: string;
	icon: string;
	level: number;
	element: number;
	base_type: number;
	ranks: Rank[];
	equip: {
		name: string;
		rank: number;
		level: number;
		icon: string;
		rarity: number;
	} | null;
	properties: Property[];
	skills: Skill[];
	relics: Relic[];
	ornaments: Relic[];
}

export interface GameRecord {
	nickname: string;
	level: number;
	region: string;
	profile_icon: string;
	profile_frame: string;
	active_days: number;
	avatar_num: number;
	achievement_num: number;
	chest_num: number;
	season_title: string;
	abyss_process: string;
	phone_background_image: string;
	current_stamina: number;
	max_stamina: number;
	current_reserve_stamina: number;
	is_reserve_stamina_full: boolean;
	current_train_score: number;
	max_train_score: number;
	current_time: dayjs.Dayjs;
	stamina_full_time: dayjs.Dayjs;
	grid_fight_weekly_cur: number;
	grid_fight_weekly_max: number;
	current_rogue_score: number;
	max_rogue_score: number;
	expeditions: {
		name: string;
		icon: string;
		status: string;
		remaining_time: number;
		finish_time: dayjs.Dayjs | null;
	}[];
	accepted_expedition_num: number;
	total_expedition_num: number;
	weekly_cocoon_cnt: number;
	weekly_cocoon_limit: number;
}

export interface Chest {
	name: string;
	cur: number;
	max: number;
	icon: string;
	map_detail: {
		name: string;
		cur: number;
		max: number;
	}[];
}

export interface ChestDetail {
	nickname: string;
	chest_num: number;
	chests: Chest[];
}

export interface World {
	name: string;
	world_cur: number;
	world_max: number;
	icon: string;
	map_entrances: {
		name: string;
		cur_chest: number;
		max_chest: number;
	}[];
}

export interface RowCharacter {
	name: string;
	image: string;
	icon: string;
	level: number;
	element_id: number;
	base_type: number;
	ranks: { is_unlocked: boolean; pos: number; icon: string }[];
	equip: {
		name: string;
		rank: number;
		level: number;
		icon: string;
		rarity: number;
	} | null;
	properties: {
		property_type: number;
		base: string;
		add: string;
		final: string;
	}[];
	skills: {
		remake: string;
		point_type: number;
		item_url: string;
		level: number;
		anchor: string;
		is_activated: boolean;
	}[];
	servant_detail: {
		servant_skills: {
			remake: string;
			point_type: number;
			item_url: string;
			level: number;
			anchor: string;
			is_activated: boolean;
		}[];
	};
	relics: {
		icon: string;
		level: number;
		rarity: number;
		pos: number;
		main_property: { property_type: number; value: string };
		properties: { property_type: number; times: number; value: string }[];
	}[];
	ornaments: {
		icon: string;
		level: number;
		rarity: number;
		pos: number;
		main_property: { property_type: number; value: string };
		properties: { property_type: number; times: number; value: string }[];
	}[];
}

export interface RowExpedition {
	name: string;
	item_url: string;
	status: string;
	remaining_time: number;
	finish_ts: number;
}

export interface RowAchievement {
	name: string;
	icon: string;
	cur: number;
	max: number;
}

export interface achievementDetail {
	nickname: string;
	achievement_num: number;
	gold_num: number;
	silver_num: number;
	copper_num: number;
	achievements: {
		name: string;
		icon: string;
		cur: number;
		max: number;
	}[];
}
