import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { updateAllMessages } from "../../services/updateMessages";

export default {
	data: new SlashCommandBuilder()
		.setName("forceupdate")
		.setDescription(
			"모든 서버의 로테이션 메시지를 즉시 업데이트합니다. (개발자 전용)",
		),
	async execute(interaction: ChatInputCommandInteraction) {
		// 개발자 ID 확인 (환경변수에서 가져오기)
		const developerId = process.env.DEVELOPER_ID;

		if (!developerId || interaction.user.id !== developerId) {
			await interaction.reply({
				content: "❌ 이 명령어는 개발자만 사용할 수 있습니다.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		try {
			await updateAllMessages(interaction.client);

			const successEmbed = new EmbedBuilder()
				.setColor("Green")
				.setTitle("✅ 강제 업데이트 완료")
				.setDescription("모든 서버의 로테이션 메시지가 업데이트되었습니다.")
				.setTimestamp();

			await interaction.editReply({ embeds: [successEmbed] });
		} catch (error) {
			console.error("강제 업데이트 실패:", error);

			const errorEmbed = new EmbedBuilder()
				.setColor("Red")
				.setTitle("❌ 강제 업데이트 실패")
				.setDescription(`오류가 발생했습니다:\n\`\`\`${error}\`\`\``)
				.setTimestamp();

			await interaction.editReply({ embeds: [errorEmbed] });
		}
	},
};
