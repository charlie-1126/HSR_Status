import { fetchActCalendar } from "./fetchEvent";
import { getOffset, setOffset } from "../services/getOffset";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Seoul");

async function getTimeData() {
    const response = await fetchActCalendar();
    if (response.message != "OK") {
        return { error: true, data: `API 요청에 실패했습니다.\n\nError code: ${response.message}` };
    }

    const offsetData = getOffset();

    // 전투 로테이션 정보(간접적)
    const now = dayjs();
    const start = dayjs.tz(offsetData.battleStart, "Asia/Seoul");
    const diffDays = now.diff(start, "day", true);
    const cycle = Math.floor(diffDays / 14);
    const battleUpdateTime: Record<string, ReturnType<typeof dayjs>> = {};

    battleUpdateTime["currencyWar"] = start.add(cycle * 14, "day");
    if (battleUpdateTime["currencyWar"].isBefore(now)) {
        battleUpdateTime["currencyWar"] = battleUpdateTime["currencyWar"].add(14, "day");
    }

    battleUpdateTime["simulation"] = start.add(cycle * 14 + 7, "day");
    if (battleUpdateTime["simulation"].isBefore(now)) {
        battleUpdateTime["simulation"] = battleUpdateTime["simulation"].add(14, "day");
    }

    const calendar = response.data;
    const gameversion = calendar.cur_game_version;

    let versionUpdate; // 이번 버전업 날짜(간접적)
    let nextversionUpdate = dayjs(); // 다음 버전업 날짜(간접적)
    let nextnextversionUpdate = null; // 다다음 버전업 날짜(간접적)
    const challenges: Record<string, { startTime: ReturnType<typeof dayjs>; endTime: ReturnType<typeof dayjs> }> = {};
    for (const event of calendar.challenge_list) {
        if (event.challenge_type == "ChallengeTypePeak") {
            versionUpdate = dayjs(event.time_info.start_ts * 1000)
                .tz("Asia/Seoul")
                .set("hour", 12)
                .set("minute", 0)
                .set("second", 0);
            nextversionUpdate = dayjs(event.time_info.end_ts * 1000)
                .tz("Asia/Seoul")
                .set("hour", 12)
                .set("minute", 0)
                .set("second", 0);
        }
        if (event.status != "challengeStatusUnopened") {
            challenges[event.challenge_type] = {
                startTime: dayjs(event.time_info.start_ts * 1000).tz("Asia/Seoul"),
                endTime: dayjs(event.time_info.end_ts * 1000).tz("Asia/Seoul"),
            };
        }
    }

    // 오프셋 우선 사용 (만료 확인 및 처리)
    if (offsetData.versionUpdate) {
        const offsetVersionUpdate = dayjs(offsetData.versionUpdate);
        if (now.isBefore(offsetVersionUpdate)) {
            versionUpdate = offsetVersionUpdate;
        } else {
            setOffset("versionUpdate", null);
        }
    }

    if (offsetData.nextversionUpdate) {
        const offsetNextVersionUpdate = dayjs(offsetData.nextversionUpdate);
        if (now.isBefore(offsetNextVersionUpdate)) {
            nextversionUpdate = offsetNextVersionUpdate;
        } else {
            setOffset("nextversionUpdate", null);
        }
    }

    if (offsetData.nextnextversionUpdate) {
        const offsetNextNextVersionUpdate = dayjs(offsetData.nextnextversionUpdate);
        if (now.isBefore(offsetNextNextVersionUpdate)) {
            nextnextversionUpdate = offsetNextNextVersionUpdate;
        } else {
            setOffset("nextnextversionUpdate", null);
        }
    }

    // 워프 정보(고정적)
    const warpTime = [];
    for (const warp of calendar.avatar_card_pool_list) {
        const characters = [];
        for (const char of warp.avatar_list) {
            if (char.rarity == "5") {
                characters.push(char.item_name);
            }
        }
        warpTime.push({
            id: warp.id,
            gameversion: warp.version,
            startTime: dayjs(warp.time_info.start_ts * 1000).tz("Asia/Seoul"),
            endTime: dayjs(warp.time_info.end_ts * 1000).tz("Asia/Seoul"),
            characters: characters,
        });
    }
    warpTime.sort((a, b) => a.endTime.valueOf() - b.endTime.valueOf());
    if (warpTime.length > 0 && warpTime[warpTime.length - 1].gameversion != gameversion) {
        const calculatedNextNextVersion = warpTime[warpTime.length - 1].endTime
            .add(1, "d")
            .set("hour", 12)
            .set("minute", 0)
            .set("second", 0);

        // 오프셋이 없을 때만 계산된 값 사용
        if (!offsetData.nextnextversionUpdate || now.isAfter(dayjs(offsetData.nextnextversionUpdate))) {
            nextnextversionUpdate = calculatedNextNextVersion;
        }
    }

    // 공훈 정보
    let passEndTime: ReturnType<typeof dayjs>;

    if (offsetData.passEndTime) {
        const offsetPassEndTime = dayjs(offsetData.passEndTime);
        if (now.isBefore(offsetPassEndTime)) {
            passEndTime = offsetPassEndTime;
        } else {
            setOffset("passEndTime", null);
            passEndTime = nextversionUpdate.subtract(2, "d").set("hour", 4).set("minute", 59).set("second", 59);
        }
    } else {
        passEndTime = nextversionUpdate.subtract(2, "d").set("hour", 4).set("minute", 59).set("second", 59);
    }

    if (now.isAfter(passEndTime) && nextnextversionUpdate != null) {
        passEndTime = nextnextversionUpdate.subtract(2, "d").set("hour", 4).set("minute", 59).set("second", 59);
    }

    // 프리뷰 방송 정보
    let previewProgramTime: ReturnType<typeof dayjs>;

    if (offsetData.previewProgramTime) {
        const offsetPreviewProgramTime = dayjs(offsetData.previewProgramTime);
        if (now.isBefore(offsetPreviewProgramTime)) {
            previewProgramTime = offsetPreviewProgramTime;
        } else {
            setOffset("previewProgramTime", null);
            previewProgramTime = nextversionUpdate.subtract(12, "d").set("hour", 20).set("minute", 30).set("second", 0);
        }
    } else {
        previewProgramTime = nextversionUpdate.subtract(12, "d").set("hour", 20).set("minute", 30).set("second", 0);
    }

    if (now.isAfter(previewProgramTime) && nextnextversionUpdate != null) {
        previewProgramTime = nextnextversionUpdate.subtract(12, "d").set("hour", 20).set("minute", 30).set("second", 0);
    }

    // 리셋 시간(고정적)
    let dailyResetTime = dayjs().tz("Asia/Seoul").set("hour", 5).set("minute", 0).set("second", 0);
    if (dayjs().isAfter(dailyResetTime)) {
        dailyResetTime = dailyResetTime.add(1, "d");
    }
    const weeklyResetTime = dailyResetTime.set("date", dailyResetTime.date() + ((7 - dailyResetTime.day() + 1) % 7));

    return {
        error: false,
        data: {
            gameversion: gameversion,
            versionUpdate: nextversionUpdate,
            previewProgramTime: previewProgramTime,
            passEndTime: passEndTime,
            warpTime: warpTime.filter((i) => {return now.isAfter(i.startTime)}),
            bossEndTime: challenges["ChallengeTypeBoss"].endTime,
            storyEndTime: challenges["ChallengeTypeStory"].endTime,
            chaosEndTime: challenges["ChallengeTypeChasm"].endTime,
            peakEndTime: challenges["ChallengeTypePeak"].endTime.tz("Asia/Seoul").set("hour", 12),
            currencyWarUpdateTime: battleUpdateTime["currencyWar"],
            simulationUpdateTime: battleUpdateTime["simulation"],
            dailyResetTime: dailyResetTime,
            weeklyResetTime: weeklyResetTime,
        },
    };
}

function formatTime(timedata: Awaited<ReturnType<typeof getTimeData>>): string {
    if (timedata.error) {
        return typeof timedata.data === "string" ? timedata.data : "";
    }

    if (typeof timedata.data === "string") {
        return timedata.data;
    }

    const data = timedata.data;
    return `## 대규모 업데이트\n- 버전 업데이트: <t:${data.versionUpdate.unix()}:R>\n- 프리뷰 스페셜 프로그램: <t:${data.previewProgramTime.unix()}:R>\n- 무명의 공훈 종료: <t:${data.passEndTime.unix()}:R>\n\n## 워프\n${data.warpTime.length > 0 ? data.warpTime
        .map((warp: any) => `- ${warp.characters.join(", ")} 픽업 종료: <t:${warp.endTime.unix()}:R>`)
        .join(
            "\n"
        ) : "- 현재 진행중인 워프가 없습니다."}\n\n## 빛 따라 금 찾아\n- 종말의 환영 업데이트: <t:${data.bossEndTime.unix()}:R>\n- 허구 이야기 업데이트: <t:${data.storyEndTime.unix()}:R>\n- 혼돈의 기억 업데이트: <t:${data.chaosEndTime.unix()}:R>\n- 이상 중재 업데이트: <t:${data.peakEndTime.unix()}:R>\n\n## 우주 분쟁\n- 화폐 전쟁 업데이트: <t:${data.currencyWarUpdateTime.unix()}:R>\n- 차분화 우주 업데이트: <t:${data.simulationUpdateTime.unix()}:R>\n\n## 리셋\n- 일일 리셋: <t:${data.dailyResetTime.unix()}:R>\n- 주간 리셋: <t:${data.weeklyResetTime.unix()}:R>\n\n-# version ${
        data.gameversion
    }\n-# last updated at <t:${dayjs().unix()}:s>`;
}

export { getTimeData, formatTime };
