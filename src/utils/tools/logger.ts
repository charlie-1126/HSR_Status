import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import fs from "fs";
import path from "path";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

const logsDir = path.join(__dirname, "../../logs");
const logFilePath = path.join(logsDir, "log.txt");

// logs 폴더가 없으면 생성
if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir, { recursive: true });
}

// 로그 파일이 너무 커지지 않도록 최신 5MB만 유지
function checkLogFileSize() {
	if (fs.existsSync(logFilePath)) {
		const stats = fs.statSync(logFilePath);
		const maxSize = 5 * 1024 * 1024; // 5MB

		if (stats.size > maxSize) {
			// 파일을 읽어서 최신 로그만 유지
			const content = fs.readFileSync(logFilePath, "utf-8");
			const lines = content.split("\n");

			// 대략 절반 정도의 최신 로그만 유지
			const keepLines = Math.floor(lines.length / 2);
			const newContent = lines.slice(-keepLines).join("\n");

			fs.writeFileSync(logFilePath, newContent, "utf-8");
			console.log(`로그 파일 크기 초과로 오래된 로그를 정리했습니다.`);
		}
	}
}

/**
 * 상세 로그를 log.txt 파일에 기록
 * @param tag - 로그 태그 (예: "Scheduler", "updateRotationData")
 * @param message - 로그 메시지
 */
export function logToFile(tag: string, message: string) {
	checkLogFileSize();

	const timestamp = dayjs().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
	const logMessage = `[${timestamp}] [${tag}] ${message}\n`;

	fs.appendFileSync(logFilePath, logMessage, "utf-8");
}

/**
 * 에러 로그를 파일에 기록
 * @param tag - 로그 태그
 * @param message - 에러 메시지
 * @param error - 에러 객체 (선택)
 */
export function logError(tag: string, message: string, error?: any) {
	checkLogFileSize();

	const timestamp = dayjs().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
	let logMessage = `[${timestamp}] [${tag}] ERROR: ${message}`;

	if (error) {
		logMessage += `\n${error.stack || error}`;
	}

	logMessage += "\n";

	fs.appendFileSync(logFilePath, logMessage, "utf-8");
	console.error(`[${tag}] ERROR: ${message}`, error);
}
