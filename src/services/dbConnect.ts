import Database from "better-sqlite3";

const dbPaths = {
    updateMessage: "data/updateMessage.db",
};

export const updateMessage_db = new Database(dbPaths.updateMessage);

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
}

initDB();
