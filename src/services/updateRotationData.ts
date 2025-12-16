import { fetchActCalendar } from "../utils/fetchEvent";
import { getOffset, setOffset } from "./getOffset";
import { updateAllMessages } from "./updateMessages";
import { Client } from "discord.js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { logToFile, logError } from "../utils/logger";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

// 이전 데이터를 저장하기 위한 변수
let previousCalendarData: any = null;

export async function updateRotationData(client?: Client) {
    try {
        const response = await fetchActCalendar();
        if (response.message !== "OK") {
            logError("updateRotationData", `API 요청 실패: ${response.message}`);
            return;
        }

        const offsetData = getOffset();
        const now = dayjs();
        const calendar = response.data;

        // API 데이터 변경 확인
        let needsUpdate = false;

        if (previousCalendarData) {
            // 게임 버전 변경 확인
            if (previousCalendarData.cur_game_version !== calendar.cur_game_version) {
                logToFile(
                    "updateRotationData",
                    `게임 버전 변경 감지: ${previousCalendarData.cur_game_version} -> ${calendar.cur_game_version}`
                );
                needsUpdate = true;
            }

            // 이벤트 수 변경 확인
            if (
                previousCalendarData.challenge_list.length !== calendar.challenge_list.length ||
                previousCalendarData.avatar_card_pool_list.length !== calendar.avatar_card_pool_list.length
            ) {
                logToFile("updateRotationData", "이벤트 또는 워프 수 변경 감지");
                needsUpdate = true;
            }
        } else {
            // 첫 실행 시 데이터 저장만 하고 업데이트는 스케줄러가 처리
            previousCalendarData = calendar;
        }

        // 이전 데이터 업데이트
        if (needsUpdate) {
            previousCalendarData = calendar;
        }

        // 버전 업데이트 날짜 확인 및 오프셋 만료 처리
        let offsetExpired = false;

        // versionUpdate 체크
        if (offsetData.versionUpdate && now.isAfter(dayjs(offsetData.versionUpdate))) {
            setOffset("versionUpdate", null);
            offsetExpired = true;
        }

        // nextversionUpdate 체크
        if (offsetData.nextversionUpdate && now.isAfter(dayjs(offsetData.nextversionUpdate))) {
            setOffset("nextversionUpdate", null);
            offsetExpired = true;
        }

        // nextnextversionUpdate 체크
        if (offsetData.nextnextversionUpdate && now.isAfter(dayjs(offsetData.nextnextversionUpdate))) {
            setOffset("nextnextversionUpdate", null);
            offsetExpired = true;
        }

        // passEndTime 체크
        if (offsetData.passEndTime && now.isAfter(dayjs(offsetData.passEndTime))) {
            setOffset("passEndTime", null);
            offsetExpired = true;
        }

        // previewProgramTime 체크
        if (offsetData.previewProgramTime && now.isAfter(dayjs(offsetData.previewProgramTime))) {
            setOffset("previewProgramTime", null);
            offsetExpired = true;
        }

        if (offsetExpired) {
            logToFile("updateRotationData", "만료된 오프셋을 정리했습니다.");
            needsUpdate = true;
        }

        // 데이터가 변경되었으면 메시지 업데이트
        if (needsUpdate && client) {
            logToFile("updateRotationData", "데이터 변경 감지 - 메시지 업데이트 시작");
            await updateAllMessages(client);
        } else if (needsUpdate) {
            logToFile("updateRotationData", "데이터 변경 감지되었으나 클라이언트가 없어 메시지 업데이트를 건너뜁니다.");
        }
    } catch (error) {
        logError("updateRotationData", "오류 발생", error);
    }
}
