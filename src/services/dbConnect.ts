import Database from "better-sqlite3";

const dbPaths = {
    updateMessage: "data/updateMessage.db",
    userData: "data/userData.db",
};

export const updateMessage_db = new Database(dbPaths.updateMessage);
export const userData_db = new Database(dbPaths.userData);

export function initDB() {
    updateMessage_db
        .prepare(
            `
        CREATE TABLE IF NOT EXISTS updateMessage (
            guildId TEXT PRIMARY KEY,
            channelId TEXT,
            MessageId TEXT
        )
    `
        )
        .run();

    userData_db
        .prepare(
            `
        CREATE TABLE IF NOT EXISTS userData (
            userId TEXT PRIMARY KEY,
            uid TEXT,
            ltuid TEXT,
            ltoken TEXT,
            public BOOLEAN DEFAULT 0
        )
    `
        )
        .run();
}

initDB();
