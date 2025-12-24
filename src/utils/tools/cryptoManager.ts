import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.AES_KEY || "", "hex");

function encrypt(text: string) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return {
        iv: iv.toString("hex"),
        content: encrypted,
        authTag: authTag,
    };
}

function decrypt(encryptedObj: { iv: string; content: string; authTag: string }) {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(encryptedObj.iv, "hex"));

    decipher.setAuthTag(Buffer.from(encryptedObj.authTag, "hex"));

    let decrypted = decipher.update(encryptedObj.content, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

export { encrypt, decrypt };
