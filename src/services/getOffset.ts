import fs from "fs";
import path from "path";

// 데이터 파일 생성(data/offset.json)
const dataDir = path.join(__dirname, "../../data");
const offsetFilePath = path.join(dataDir, "offset.json");
if (!fs.existsSync(offsetFilePath)) {
    const initialOffsetData = {
        battleStart: "2025-12-05 05:00",
        nextversionUpdate: null,
        versionUpdate: null,
        nextnextversionUpdate: null,
        passEndTime: null,
        previewProgramTime: null,
    };
    fs.writeFileSync(offsetFilePath, JSON.stringify(initialOffsetData, null, 4), "utf-8");
}

function getOffset() {
    const rawData = fs.readFileSync(offsetFilePath, "utf-8");
    const offsetData = JSON.parse(rawData);
    return offsetData;
}

function setOffset(key: string, value: string | null) {
    const offsetData = getOffset();
    offsetData[key] = value;
    fs.writeFileSync(offsetFilePath, JSON.stringify(offsetData, null, 4), "utf-8");
}

export { getOffset, setOffset };
