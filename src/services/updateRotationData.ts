import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { Client } from "discord.js";
import { getOffset, setOffset } from "../utils/getOffset";
import { getTimeData } from "../utils/getTimeData";
import { logger } from "../utils/logger";
import { updateAllMessages } from "./updateMessages";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.tz.setDefault("Asia/Seoul");

// 이전 데이터를 저장하기 위한 변수 (JSON 형식으로 저장)
let previousTimeData: string | null = null;

export async function updateRotationData(client?: Client) {
	try {
		// 현재 타임 데이터 가져오기
		const timedata = await getTimeData();
		if (timedata.error) {
			logger.error(
				`updateRotationData: 타임 데이터 가져오기 실패 ${timedata.data}`,
			);
			return;
		}

		// 타입 가드: data가 문자열이 아닌 객체인지 확인
		if (typeof timedata.data === "string") {
			logger.error(
				`updateRotationData: 타임 데이터가 문자열입니다: ${timedata.data}`,
			);
			return;
		}

		// dayjs 객체를 unix timestamp로 변환하여 비교 가능하게 만듦
		const dataForComparison = {
			gameversion: timedata.data.gameversion,
			versionUpdate: timedata.data.versionUpdate.unix(),
			previewProgramTime: timedata.data.previewProgramTime.unix(),
			passEndTime: timedata.data.passEndTime
				? timedata.data.passEndTime.unix()
				: null,
			warpTime: timedata.data.warpTime.map((w: any) => ({
				id: w.id,
				gameversion: w.gameversion,
				startTime: w.startTime.unix(),
				endTime: w.endTime.unix(),
				characters: w.characters,
			})),
			bossEndTime: timedata.data.bossEndTime.unix(),
			storyEndTime: timedata.data.storyEndTime.unix(),
			chaosEndTime: timedata.data.chaosEndTime.unix(),
			peakEndTime: timedata.data.peakEndTime
				? timedata.data.peakEndTime.unix()
				: null,
			currencyWarUpdateTime: timedata.data.currencyWarUpdateTime.unix(),
			simulationUpdateTime: timedata.data.simulationUpdateTime.unix(),
			dailyResetTime: timedata.data.dailyResetTime.unix(),
			weeklyResetTime: timedata.data.weeklyResetTime.unix(),
		};

		const currentTimeDataStr = JSON.stringify(dataForComparison);

		// 표시되는 데이터 변경 확인
		let needsUpdate = false;

		if (previousTimeData !== null) {
			// 이전 데이터와 현재 데이터 비교
			if (previousTimeData !== currentTimeDataStr) {
				logger.info("updateRotationData: 타임 데이터 변경 감지");
				needsUpdate = true;
			}
		} else {
			// 첫 실행 시 데이터 저장만 하고 업데이트는 스케줄러가 처리
			previousTimeData = currentTimeDataStr;
		}

		// 이전 데이터 업데이트
		if (needsUpdate) {
			previousTimeData = currentTimeDataStr;
		}

		const offsetData = getOffset();
		const now = dayjs().tz("Asia/Seoul");

		// 버전 업데이트 날짜 확인 및 오프셋 만료 처리
		let offsetExpired = false;

		// versionUpdate 체크
		if (
			offsetData.versionUpdate &&
			now.isSameOrAfter(dayjs.tz(offsetData.versionUpdate, "Asia/Seoul"))
		) {
			setOffset("versionUpdate", null);
			offsetExpired = true;
		}

		// nextversionUpdate 체크
		if (
			offsetData.nextversionUpdate &&
			now.isSameOrAfter(dayjs.tz(offsetData.nextversionUpdate, "Asia/Seoul"))
		) {
			setOffset("nextversionUpdate", null);
			offsetExpired = true;
		}

		// nextnextversionUpdate 체크
		if (
			offsetData.nextnextversionUpdate &&
			now.isSameOrAfter(
				dayjs.tz(offsetData.nextnextversionUpdate, "Asia/Seoul"),
			)
		) {
			setOffset("nextnextversionUpdate", null);
			offsetExpired = true;
		}

		// passEndTime 체크
		if (
			offsetData.passEndTime &&
			now.isSameOrAfter(dayjs.tz(offsetData.passEndTime, "Asia/Seoul"))
		) {
			setOffset("passEndTime", null);
			offsetExpired = true;
		}

		// previewProgramTime 체크
		if (
			offsetData.previewProgramTime &&
			now.isSameOrAfter(dayjs.tz(offsetData.previewProgramTime, "Asia/Seoul"))
		) {
			setOffset("previewProgramTime", null);
			offsetExpired = true;
		}

		if (offsetExpired) {
			logger.info("updateRotationData: 만료된 오프셋을 정리했습니다.");
			needsUpdate = true;
		}

		// 데이터가 변경되었으면 메시지 업데이트
		if (needsUpdate && client) {
			logger.info(
				"updateRotationData: 데이터 변경 감지 - 메시지 업데이트 시작",
			);

			await updateAllMessages(client);
		} else if (needsUpdate) {
			logger.info(
				"updateRotationData: 데이터 변경 감지되었으나 클라이언트가 없어 메시지 업데이트를 건너뜁니다.",
			);
		}
	} catch (error) {
		logger.error(`updateRotationData: 오류 발생 `);
		logger.error(error);
	}
}
