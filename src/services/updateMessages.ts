import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
	type Client,
	DiscordAPIError,
	EmbedBuilder,
	type Message,
	TextChannel,
} from "discord.js";
import { formatTime, getTimeData } from "../utils/getTimeData";
import { logger } from "../utils/logger";
import {
	deleteUpdateMessage,
	getAllUpdateMessages,
	setupdateMessage,
} from "./dbHandler";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

export async function updateAllMessages(client: Client) {
	try {
		logger.info("updateAllMessages: 메시지 업데이트 시작");

		const allMessages = getAllUpdateMessages();

		if (allMessages.length === 0) {
			logger.info("updateAllMessages: 업데이트할 메시지가 없습니다.");
			return;
		}

		// 로테이션 데이터 가져오기
		const timedata = await getTimeData();
		if (timedata.error) {
			logger.error(
				`updateAllMessages: 타임 데이터 가져오기 실패 ${timedata.data}`,
			);
			return;
		}

		const embed = new EmbedBuilder()
			.setColor("White")
			.setDescription(formatTime(timedata))
			.setTimestamp()
			.setFooter({
				text: `version ${
					typeof timedata.data === "string"
						? timedata.data
						: timedata.data.gameversion
				}`,
			});

		let updatedCount = 0;
		let recreatedCount = 0;
		let deletedCount = 0;

		for (const msgData of allMessages) {
			try {
				// 채널 가져오기
				const channel = await client.channels
					.fetch(msgData.channelId)
					.catch(() => null);

				// 채널이 삭제되었거나 접근할 수 없는 경우
				if (!channel) {
					logger.info(
						`updateAllMessages: 채널을 찾을 수 없음: ${msgData.channelId} - DB에서 삭제`,
					);
					deleteUpdateMessage(msgData.guildId);
					deletedCount++;
					continue;
				}

				// 텍스트 채널인지 확인
				if (!channel.isTextBased() || !(channel instanceof TextChannel)) {
					logger.info(
						`updateAllMessages: 텍스트 채널이 아님: ${msgData.channelId} - DB에서 삭제`,
					);
					deleteUpdateMessage(msgData.guildId);
					deletedCount++;
					continue;
				}

				// 메시지 가져오기
				let message: Message | null = null;
				try {
					message = await channel.messages.fetch(msgData.MessageId);
				} catch (error: unknown) {
					// 메시지가 삭제된 경우
					if (error instanceof DiscordAPIError) {
						if (error.code === 10008) {
							try {
								// Unknown Message
								logger.info(
									`updateAllMessages: 메시지를 찾을 수 없음: ${msgData.MessageId} - 새로 생성`,
								);

								// 새 메시지 생성
								const newMessage = await channel.send({ embeds: [embed] });

								// DB 업데이트
								setupdateMessage(
									msgData.guildId,
									msgData.channelId,
									newMessage.id,
								);
								recreatedCount++;
								continue;
							} catch (error: unknown) {
								if (error instanceof DiscordAPIError) {
									if (error.code === 50013 || error.code === 50001) {
										logger.error(
											`updateAllMessages: 권한 없음: ${msgData.channelId} - 메시지 생성 실패`,
										);
										deleteUpdateMessage(msgData.guildId);
										deletedCount++;
										continue;
									} else {
										throw error;
									}
								}
							}
						} else {
							throw error;
						}
					}
				}

				// 메시지 업데이트
				if (message) {
					try {
						await message.edit({ embeds: [embed] });
						updatedCount++;
					} catch (error: unknown) {
						if (error instanceof DiscordAPIError) {
							if (error.code === 50013 || error.code === 50001) {
								logger.error(
									`updateAllMessages: 권한 없음: ${msgData.channelId} - 메시지 수정 실패`,
								);
								logger.error(error);
								deleteUpdateMessage(msgData.guildId);
								deletedCount++;
							} else {
								throw error;
							}
						}
					}
				}
			} catch (error) {
				logger.error(
					`updateAllMessages: 메시지 처리 중 오류 (channelId: ${msgData.channelId})`,
				);
				logger.error(error);
			}
		}

		logger.info(
			`updateAllMessages: 완료 - 업데이트: ${updatedCount}, 재생성: ${recreatedCount}, 삭제: ${deletedCount}`,
		);
	} catch (error) {
		logger.error("updateAllMessages: 오류 발생");
		logger.error(error);
	}
}
