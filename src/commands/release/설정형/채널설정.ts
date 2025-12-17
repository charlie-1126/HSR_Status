import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    EmbedBuilder,
    PermissionFlagsBits,
} from "discord.js";
import { getTimeData, formatTime } from "../../../utils/getTimeData";
import { getUpdateMessage, setupdateMessage } from "../../../services/dbHandler";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

export default {
    data: new SlashCommandBuilder()
        .setName("채널설정")
        .setDescription("HSR 로테이션 공지 채널을 설정합니다.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption((option) =>
            option.setName("채널").setDescription("로테이션 공지를 보낼 채널을 선택하세요.").setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({
                content: "이 명령어는 서버 내에서만 사용할 수 있습니다.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // 관리자 권한 확인
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: "이 명령어는 관리자만 사용할 수 있습니다.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const channelId = interaction.options.getChannel("채널", true)?.id;
        const channel = interaction.client.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased() || channel.isDMBased()) {
            await interaction.reply({
                content: "서버 텍스트 채널을 선택해주세요.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
        const timedata = await getTimeData();
        if (timedata.error) {
            await interaction.reply({
                content: typeof timedata.data === "string" ? timedata.data : JSON.stringify(timedata.data),
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // 설정 저장
        const updateMessage = getUpdateMessage(interaction.guild.id);
        let isSending = updateMessage ? updateMessage.channelId != channelId : true;

        // 채널이 같더라도 메시지가 삭제되었는지 확인
        if (!isSending && updateMessage) {
            try {
                await channel.messages.fetch(updateMessage.MessageId);
            } catch (error) {
                // 메시지를 찾을 수 없으면 새로 보내야 함
                isSending = true;
            }
        }

        if (isSending) {
            try {
                const embed = new EmbedBuilder().setColor("White").setDescription(formatTime(timedata));
                const message = await channel.send({ embeds: [embed] });
                setupdateMessage(interaction.guild.id, channelId, message.id);
            } catch (error: any) {
                if (error.code === 50013 || error.code === 50001) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ 필수 권한 누락")
                        .setDescription(
                            `봇이 <#${channelId}> 채널에 메시지를 보낼 권한이 없습니다.\n\n**필수 권한:**\n- 채널 보기\n- 메시지 보내기\n- 링크 첨부\n\n**해결 방법:**\n채널 설정 → 권한 → 봇 역할에 위 권한을 허용해주세요.`
                        );

                    await interaction.reply({
                        embeds: [errorEmbed],
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }
                throw error;
            }
        }
        const successEmbed = new EmbedBuilder()
            .setColor("Green")
            .setDescription(`로테이션 공지 채널이 <#${channelId}>(으)로 설정되었습니다.`);
        await interaction.reply({ embeds: [successEmbed] });
    },
};
