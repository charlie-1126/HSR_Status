import { EmbedBuilder, Events, type ModalSubmitInteraction } from "discord.js";
import { saveUserData } from "../services/dbHandler";
import { fetchUserInfo } from "../utils/fetchHoyolab";

export default {
	name: Events.InteractionCreate,
	async execute(interaction: ModalSubmitInteraction) {
		if (!interaction.isModalSubmit()) return;
		if (interaction.customId === "linkaccountmodal") {
			const uid = interaction.fields.getTextInputValue("uidinput");
			const ltuid = interaction.fields.getTextInputValue("ltuidinput");
			const ltoken = interaction.fields.getTextInputValue("ltokeninput");
			// 유효한 계정인지 확인
			const userInfo = await fetchUserInfo(uid, ltuid, ltoken);
			if (userInfo && userInfo.retcode === 0 && userInfo.data) {
				// 계정 정보 저장
				saveUserData(interaction.user.id, uid, ltuid, ltoken);

				// 원래 메시지 업데이트
				if (interaction.message) {
					const successEmbed = new EmbedBuilder()
						.setColor("Green")
						.setTitle("계정 연동 완료")
						.setDescription("계정 연동이 성공적으로 완료되었습니다!");
					await interaction.message.edit({
						embeds: [successEmbed],
						components: [],
					});
				}
				await interaction.deferUpdate();
			} else {
				const embed = new EmbedBuilder()
					.setColor("Red")
					.setTitle("계정 연동 실패")
					.setDescription(
						"입력하신 정보가 올바르지 않거나 유효하지 않습니다. 다시 시도해주세요.",
					);
				await interaction.reply({ embeds: [embed], ephemeral: true });
			}
		}
	},
};
