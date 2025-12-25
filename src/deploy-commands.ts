import fs from "node:fs";
import path from "node:path";
import { REST, Routes } from "discord.js";
import "dotenv/config";
import { logger } from "./utils/logger";

const client_id =
	process.env.NODE_ENV === "development"
		? process.env.TESTBOT_CLIENT_ID
		: process.env.CLIENT_ID;

export async function deployCommands() {
	const releaseCommands: any[] = [];
	const testCommands: any[] = [];

	// release
	const releasePath = path.join(__dirname, "commands", "release");
	if (fs.existsSync(releasePath)) {
		const releaseFolders = fs
			.readdirSync(releasePath, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		for (const folder of releaseFolders) {
			const folderPath = path.join(releasePath, folder);
			const commandFiles = fs
				.readdirSync(folderPath)
				.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
			for (const file of commandFiles) {
				const filePath = path.join(folderPath, file);
				const module = await import(filePath);
				const command = module.default;
				if ("data" in command && "execute" in command) {
					releaseCommands.push(command.data.toJSON());
				} else {
					logger.warn(
						`${filePath} 명령어에 필요한 "data" 또는 "execute" 속성이 없습니다.`,
					);
				}
			}
		}
	}

	// test 폴더 내 모든 명령어 파일 수집
	const testPath = path.join(__dirname, "commands", "test");
	if (fs.existsSync(testPath)) {
		const commandFiles = fs
			.readdirSync(testPath)
			.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
		for (const file of commandFiles) {
			const filePath = path.join(testPath, file);
			const module = await import(filePath);
			const command = module.default;
			if ("data" in command && "execute" in command) {
				testCommands.push(command.data.toJSON());
			} else {
				logger.warn(
					`${filePath} 명령어에 필요한 "data" 또는 "execute" 속성이 없습니다.`,
				);
			}
		}
	}

	// REST API 인스턴스 생성
	const token =
		process.env.NODE_ENV === "development"
			? process.env.TESTBOT_TOKEN
			: process.env.TOKEN;
	if (!token) {
		logger.error("봇 토큰이 설정되지 않았습니다. .env 파일을 확인해주세요.");
		return false;
	}
	const rest = new REST({ version: "10" }).setToken(token);

	try {
		// 전역 명령어 등록
		if (releaseCommands.length > 0) {
			logger.info(`${releaseCommands.length}개의 전역 명령어를 등록 중...`);
			await rest.put(Routes.applicationCommands(client_id || ""), {
				body: releaseCommands,
			});
			logger.info("전역 명령어 등록 완료!");
		}

		// 테스트 서버 명령어 등록
		if (testCommands.length > 0) {
			logger.info(`${testCommands.length}개의 테스트 서버 명령어를 등록 중...`);
			await rest.put(
				Routes.applicationGuildCommands(
					client_id || "",
					process.env.GUILD_ID || "",
				),
				{
					body: testCommands,
				},
			);
			logger.info("테스트 서버 명령어 등록 완료!");
		}

		return true;
	} catch (error) {
		logger.error(`명령어 등록 중 오류 발생:`);
		logger.error(error);
		return false;
	}
}

// 직접 실행될 때 자동으로 명령어 배포 실행
if (require.main === module) {
	deployCommands().catch((error) => {
		logger.error("명령어 배포 실패:", error);
		process.exit(1);
	});
}
