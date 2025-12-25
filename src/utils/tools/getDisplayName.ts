import type { Guild, GuildMember, User } from "discord.js";

export async function getDisplayName(
	user: User,
	guild: Guild | null,
): Promise<string> {
	let name = "";
	let member: GuildMember | null = null;
	if (guild) {
		try {
			member = await guild.members.fetch(user.id);
		} catch {}
		name = member?.nickname || member?.user.displayName || user.displayName;
	} else {
		name = user.displayName;
	}
	return name;
}
