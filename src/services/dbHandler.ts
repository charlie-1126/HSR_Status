import { updateMessage_db } from "./dbConnect";

// 타입 정의
interface UpdateMessage {
    guildId: string;
    channelId: string;
    MessageId: string;
}

function getUpdateMessage(guildId: string): UpdateMessage | undefined {
    return updateMessage_db.prepare("SELECT channelId, MessageId FROM updateMessage WHERE guildId = ?").get(guildId) as
        | UpdateMessage
        | undefined;
}

function setupdateMessage(guildId: string, channelId: string, MessageId: string): void {
    const existing = updateMessage_db.prepare(`SELECT 1 FROM updateMessage WHERE guildId = ?`).get(guildId);
    if (existing) {
        updateMessage_db
            .prepare(
                `
            UPDATE updateMessage
            SET channelId = ?, MessageId = ?
            WHERE guildId = ?
        `
            )
            .run(channelId, MessageId, guildId);
    } else {
        updateMessage_db
            .prepare(
                `
            INSERT INTO updateMessage (guildId, channelId, MessageId)
            VALUES (?, ?, ?)
        `
            )
            .run(guildId, channelId, MessageId);
    }
}

// 모든 업데이트 메시지 정보 조회
function getAllUpdateMessages(): UpdateMessage[] {
    return updateMessage_db.prepare("SELECT guildId, channelId, MessageId FROM updateMessage").all() as UpdateMessage[];
}

// 특정 guildId의 업데이트 메시지 정보 삭제
function deleteUpdateMessage(guildId: string): void {
    updateMessage_db.prepare("DELETE FROM updateMessage WHERE guildId = ?").run(guildId);
}

export { getUpdateMessage, setupdateMessage, getAllUpdateMessages, deleteUpdateMessage };
