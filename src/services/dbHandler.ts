import { decrypt, encrypt } from "../utils/tools/cryptoManager";
import { updateMessage_db, userData_db } from "./dbConnect";

// 타입 정의
interface UpdateMessage {
	guildId: string;
	channelId: string;
	MessageId: string;
}

function getUpdateMessage(guildId: string): UpdateMessage | undefined {
	return updateMessage_db
		.prepare("SELECT channelId, MessageId FROM updateMessage WHERE guildId = ?")
		.get(guildId) as UpdateMessage | undefined;
}

function setupdateMessage(
	guildId: string,
	channelId: string,
	MessageId: string,
): void {
	const existing = updateMessage_db
		.prepare(`SELECT 1 FROM updateMessage WHERE guildId = ?`)
		.get(guildId);
	if (existing) {
		updateMessage_db
			.prepare(
				`
            UPDATE updateMessage
            SET channelId = ?, MessageId = ?
            WHERE guildId = ?
        `,
			)
			.run(channelId, MessageId, guildId);
	} else {
		updateMessage_db
			.prepare(
				`
            INSERT INTO updateMessage (guildId, channelId, MessageId)
            VALUES (?, ?, ?)
        `,
			)
			.run(guildId, channelId, MessageId);
	}
}

// 모든 업데이트 메시지 정보 조회
function getAllUpdateMessages(): UpdateMessage[] {
	return updateMessage_db
		.prepare("SELECT guildId, channelId, MessageId FROM updateMessage")
		.all() as UpdateMessage[];
}

// 특정 guildId의 업데이트 메시지 정보 삭제
function deleteUpdateMessage(guildId: string): void {
	updateMessage_db
		.prepare("DELETE FROM updateMessage WHERE guildId = ?")
		.run(guildId);
}

// 사용자 정보 저장
function saveUserData(
	userId: string,
	uid: string,
	ltuid: string,
	ltoken: string,
	publicStatus: boolean = false,
): void {
	const encryptedLtoken = encrypt(ltoken);
	const savedLtoken = `${encryptedLtoken.iv}:${encryptedLtoken.authTag}:${encryptedLtoken.content}`;
	const existing = userData_db
		.prepare(`SELECT 1 FROM userData WHERE userId = ?`)
		.get(userId);
	if (existing) {
		userData_db
			.prepare(
				`
            UPDATE userData
            SET uid = ?, ltuid = ?, ltoken = ?, public = ?
            WHERE userId = ?
        `,
			)
			.run(uid, ltuid, savedLtoken, publicStatus == true ? 1 : 0, userId);
	} else {
		userData_db
			.prepare(
				`
            INSERT INTO userData (userId, uid, ltuid, ltoken, public)
            VALUES (?, ?, ?, ?, ?)
        `,
			)
			.run(userId, uid, ltuid, savedLtoken, publicStatus == true ? 1 : 0);
	}
}

// 사용자 공개 설정 변경
function setUserPublicStatus(
	userId: string,
	publicStatus: boolean = false,
): void {
	userData_db
		.prepare(
			`
        UPDATE userData
        SET public = ?
        WHERE userId = ?
    `,
		)
		.run(publicStatus == true ? 1 : 0, userId);
}

// 사용자 정보 조회
function getUserData(
	userId: string,
): { uid: string; ltuid: string; ltoken: string; public: boolean } | null {
	const row = userData_db
		.prepare("SELECT uid, ltuid, ltoken, public FROM userData WHERE userId = ?")
		.get(userId) as
		| { uid: string; ltuid: string; ltoken: string; public: boolean }
		| undefined;
	if (!row) {
		return null;
	}
	const [iv, authTag, content] = row.ltoken.split(":");
	const decryptedLtoken = decrypt({ iv, authTag, content });
	return {
		uid: row.uid,
		ltuid: row.ltuid,
		ltoken: decryptedLtoken,
		public: row.public,
	};
}

export {
	getUpdateMessage,
	setupdateMessage,
	getAllUpdateMessages,
	deleteUpdateMessage,
	saveUserData,
	getUserData,
	setUserPublicStatus,
};
