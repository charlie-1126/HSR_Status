import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

const logsDir = path.join(__dirname, "../../logs");
const logFilePath = path.join(logsDir, "log.txt");

// logs 폴더가 없으면 생성
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// 로그 파일이 너무 커지지 않도록 주기적으로 정리 (10MB 이상이면 백업 후 새로 시작)
function checkLogFileSize() {
    if (fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath);
        if (stats.size > 10 * 1024 * 1024) {
            // 10MB
            const backupPath = path.join(logsDir, `log_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.txt`);
            fs.renameSync(logFilePath, backupPath);
            console.log(`로그 파일이 백업되었습니다: ${backupPath}`);
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

    const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss");
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

    const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss");
    let logMessage = `[${timestamp}] [${tag}] ERROR: ${message}`;

    if (error) {
        logMessage += `\n${error.stack || error}`;
    }

    logMessage += "\n";

    fs.appendFileSync(logFilePath, logMessage, "utf-8");
    console.error(`[${tag}] ERROR: ${message}`, error);
}
