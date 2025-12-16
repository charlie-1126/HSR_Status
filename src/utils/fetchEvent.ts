import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const ltuid_v2 = process.env.LTUID_V2;
const ltoken_v2 = process.env.LTOKEN_V2;
const uid = process.env.UID;

const DS_SALT = "6s25p5ox5y14umn1p61aqyyvbvvl3lrt";

function randomString() {
    let result = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const length = 6;

    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result;
}

function hashing(string: string) {
    return crypto.createHash("md5").update(string).digest("hex");
}

function generateDS() {
    const time = (Date.now() / 1000).toFixed(0);
    const random = randomString();
    const hash = hashing(`salt=${DS_SALT}&t=${time}&r=${random}`);

    return `${time},${random},${hash}`;
}

async function fetchActCalendar() {
    const url = "https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/get_act_calender";

    const params = {
        server: "prod_official_asia",
        role_id: uid,
    };

    const headers = {
        Cookie: `ltuid_v2=${ltuid_v2}; ltoken_v2=${ltoken_v2}`,
        DS: generateDS(),
        "x-rpc-app_version": "1.5.0",
        "x-rpc-client_type": "5",
        "x-rpc-language": "ko-kr",
    };

    try {
        const response = await axios.get(url, {
            params,
            headers,
        });

        return response.data;
    } catch (err: any) {
        console.error("API 요청 오류:", err.response?.data || err);
    }
}

fetchActCalendar();
export { fetchActCalendar };
