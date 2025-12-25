import fs from "node:fs";
import path from "node:path";
import type { APIEmoji } from "discord.js";
import { REST } from "discord.js";
import { logToFile } from "./logger";
import "dotenv/config";
import crypto from "node:crypto";
import http from "node:http";
import https from "node:https";

const TOKEN =
	(process.env.NODE_ENV === "development"
		? process.env.TESTBOT_TOKEN
		: process.env.TOKEN) || "";
const CLIENT_ID =
	(process.env.NODE_ENV === "development"
		? process.env.TESTBOT_CLIENT_ID
		: process.env.CLIENT_ID) || "";
const EMOJI_DIR = path.join(__dirname, "../..", "emoji");
const EMOJI_URL_DIR = path.join(EMOJI_DIR, "url");

async function registerEmojis() {
	const rest = new REST().setToken(TOKEN);
	const uploadedEmojis = (await rest.get(
		`/applications/${CLIENT_ID}/emojis`,
	)) as {
		items: APIEmoji[];
	};

	// emoji/url 폴더가 없으면 생성
	if (!fs.existsSync(EMOJI_URL_DIR)) {
		fs.mkdirSync(EMOJI_URL_DIR, { recursive: true });
	}

	// emoji 폴더와 emoji/url 폴더의 파일들을 모두 가져오기
	const emojis = fs.readdirSync(EMOJI_DIR);
	const urlEmojis = fs.readdirSync(EMOJI_URL_DIR);

	for (const emoji of uploadedEmojis.items) {
		const emojiNames = emojis.map((v) => {
			if (v.endsWith(".ts")) return "";
			return v.split(".")[0];
		});
		const urlEmojiNames = urlEmojis.map((v) => v.split(".")[0]);
		const allEmojiNames = [...emojiNames, ...urlEmojiNames];

		if (!allEmojiNames.includes(emoji.name + "")) {
			await rest.delete(`/applications/${CLIENT_ID}/emojis/${emoji.id}`);
			logToFile("emojiManager", `Deleted ${emoji.name} emoji`);
		}
	}

	// emoji 폴더의 파일들 업로드
	for (const emoji of emojis) {
		if (emoji.endsWith(".ts")) continue;

		// 디렉토리는 스킵
		const emojiPath = path.join(EMOJI_DIR, emoji);
		if (fs.statSync(emojiPath).isDirectory()) continue;

		const emojiName = emoji.split(".")[0];
		if (!uploadedEmojis.items.find((v) => v.name === emojiName)) {
			const base64 = fs.readFileSync(emojiPath).toString("base64");
			await rest.post(`/applications/${CLIENT_ID}/emojis`, {
				body: {
					image: `data:image/${emoji.split(".")[1] === "png" ? "png" : "gif"};base64,${base64}`,
					name: emojiName,
				},
			});
			logToFile("emojiManager", `Uploaded ${emojiName} emoji`);
		}
	}

	// emoji/url 폴더의 파일들 업로드
	for (const emoji of urlEmojis) {
		const emojiName = emoji.split(".")[0];
		if (!uploadedEmojis.items.find((v) => v.name === emojiName)) {
			const base64 = fs
				.readFileSync(path.join(EMOJI_URL_DIR, emoji))
				.toString("base64");
			await rest.post(`/applications/${CLIENT_ID}/emojis`, {
				body: {
					image: `data:image/${emoji.split(".")[1] === "png" ? "png" : "gif"};base64,${base64}`,
					name: emojiName,
				},
			});
			logToFile("emojiManager", `Uploaded ${emojiName} emoji from url folder`);
		}
	}

	const res = (await rest.get(`/applications/${CLIENT_ID}/emojis`)) as {
		items: APIEmoji[];
	};
	let typeFile = "export interface EmojiInterface {\n";
	let emojiFile = "import { EmojiInterface } from './emojiInterface';\n\n";
	emojiFile += "export const emojis: EmojiInterface = {\n";

	res.items.forEach((v) => {
		if (!v.name || !v.available) return;
		const emojiString = `<${v.animated ? "a" : ""}:${v.name}:${v.id}>`;
		typeFile += `  "${v.name}": string;\n`;
		emojiFile += `  "${v.name}": "${emojiString}",\n`;
	});
	typeFile += "}";
	emojiFile += "};\n";

	fs.writeFileSync(path.join(EMOJI_DIR, "emojiInterface.ts"), typeFile);
	fs.writeFileSync(path.join(EMOJI_DIR, "emojis.ts"), emojiFile);
}

async function downloadImage(url: string, filepath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const protocol = url.startsWith("https") ? https : http;
		const file = fs.createWriteStream(filepath);

		protocol
			.get(url, (response) => {
				response.pipe(file);
				file.on("finish", () => {
					file.close();
					resolve();
				});
			})
			.on("error", (err) => {
				fs.unlink(filepath, () => {});
				reject(err);
			});
	});
}

async function emojiFromUrl(url: string): Promise<string> {
	const rest = new REST().setToken(TOKEN);

	// emoji/url 폴더가 없으면 생성
	if (!fs.existsSync(EMOJI_URL_DIR)) {
		fs.mkdirSync(EMOJI_URL_DIR, { recursive: true });
	}

	const emojiName = crypto.createHash("md5").update(url).digest("hex");

	// URL에서 확장자 추출
	const urlParts = url.split("/");
	const fullFileName = urlParts[urlParts.length - 1];
	const fileExt = fullFileName.split(".")[1] || "png";

	const filePath = path.join(EMOJI_URL_DIR, `${emojiName}.${fileExt}`);

	// 이미 파일이 존재하면 등록된 이모지 찾아서 반환
	if (fs.existsSync(filePath)) {
		const uploadedEmojis = (await rest.get(
			`/applications/${CLIENT_ID}/emojis`,
		)) as {
			items: APIEmoji[];
		};
		const emoji = uploadedEmojis.items.find((v) => v.name === emojiName);

		if (emoji) {
			return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
		}
	}

	// 파일이 없으면 다운로드 (emoji/url 폴더에 저장)
	await downloadImage(url, filePath);
	logToFile(
		"emojiManager",
		`Downloaded ${emojiName}.${fileExt} from ${url} to url folder`,
	);

	// Discord에 이모지 등록
	const base64 = fs.readFileSync(filePath).toString("base64");
	const newEmoji = (await rest.post(`/applications/${CLIENT_ID}/emojis`, {
		body: {
			image: `data:image/${fileExt === "png" ? "png" : "gif"};base64,${base64}`,
			name: emojiName,
		},
	})) as APIEmoji;

	logToFile("emojiManager", `Uploaded ${emojiName} emoji`);

	// 마크다운 형식으로 반환
	return `<${newEmoji.animated ? "a" : ""}:${newEmoji.name}:${newEmoji.id}>`;
}

export { registerEmojis, emojiFromUrl };
