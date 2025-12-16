import { Client, Collection, GatewayIntentBits, Events, ClientEvents, ChatInputCommandInteraction } from "discord.js";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { deployCommands } from "./deploy-commands";

// .env 파일 로드
config();

// 데이터 폴더 생성
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// 명령어 배포 및 등록

// 클라이언트 인스턴스 생성
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

interface Command {
    data: {
        name: string;
    };
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

//명령어 배포 (개발 모드가 아닐 때만)
if (process.env.NODE_ENV !== "development") {
    deployCommands()
        .then((success) => {
            if (success) {
                console.log("명령어 배포 완료!");
            } else {
                console.error("명령어 배포 실패!");
            }
        })
        .catch((error) => {
            console.error("명령어 배포 중 오류 발생:", error);
        });
}

// 명령어를 저장할 컬렉션
const commands = new Collection<string, Command>();

// 명령어 파일 로드
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
    // release 하위 폴더의 명령어 파일
    const releasePath = path.join(commandsPath, "release");
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
                import(filePath).then((module) => {
                    const command = module.default;
                    if ("data" in command && "execute" in command) {
                        commands.set(command.data.name, command);
                    } else {
                        console.warn(`${filePath} 명령어에 필요한 "data" 또는 "execute" 속성이 없습니다.`);
                    }
                });
            }
        }
    }

    // commands/test 폴더의 명령어 파일
    const testPath = path.join(commandsPath, "test");
    if (fs.existsSync(testPath)) {
        const commandFiles = fs.readdirSync(testPath).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
        for (const file of commandFiles) {
            const filePath = path.join(testPath, file);
            import(filePath).then((module) => {
                const command = module.default;
                if ("data" in command && "execute" in command) {
                    commands.set(command.data.name, command);
                } else {
                    console.warn(`${filePath} 명령어에 필요한 "data" 또는 "execute" 속성이 없습니다.`);
                }
            });
        }
    }
}

// 이벤트 파일 로드
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    import(filePath).then((module) => {
        const event = module.default;
        if (!event || !event.name) return;
        if (event.once) {
            client.once(event.name as keyof ClientEvents, (...args) => event.execute(...args));
        } else {
            client.on(event.name as keyof ClientEvents, (...args) => event.execute(...args));
        }
    });
}

// 상호작용 이벤트 처리
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
        console.error(`${interaction.commandName} 명령어를 찾을 수 없습니다.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`명령어 실행 중 오류 발생:`, error);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "명령어 실행 중 오류가 발생했습니다!",
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: "명령어 실행 중 오류가 발생했습니다!",
                ephemeral: true,
            });
        }
    }
});

// 봇 로그인
client.login(process.env.TOKEN).catch((error) => {
    console.error("봇 로그인 오류:", error);
    process.exit(1);
});

// 프로세스 에러 처리
process.on("unhandledRejection", (error) => {
    console.error("처리되지 않은 Promise 거부:", error);
});

// commands 컬렉션 내보내기 (다른 파일에서 명령어 목록에 접근할 수 있도록)
export { commands };
