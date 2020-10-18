import dotenv from "dotenv";
import { Client, TextChannel, VoiceChannel } from "discord.js";

dotenv.config();

const { BOT_TOKEN, LOGS_CHANNEL_ID, VOICE_CHANNEL_ID } = process.env;

const DISCORD_CLIENT = new Client();

DISCORD_CLIENT.on("ready", () => {
    console.log(`Logged in as ${DISCORD_CLIENT.user.tag}!`);
});

function getStringAfterSubstring(parentString, substring) {
    return parentString.substring(parentString.indexOf(substring) + substring.length);
}

const usersSpeaking: { [key: string]: { speaking: boolean; startTime: number; totalTime: number } } = {};

DISCORD_CLIENT.on("message", async (messsage) => {
    // prevent the bot from responding itself
    if (messsage.author.id !== DISCORD_CLIENT.user.id) {
        const logsChannel = DISCORD_CLIENT.channels.cache.get(LOGS_CHANNEL_ID) as TextChannel;
        const voiceChannel = DISCORD_CLIENT.channels.cache.get(VOICE_CHANNEL_ID) as VoiceChannel;

        if (!voiceChannel && !logsChannel) return console.error("Os canais necessários para operar não foram encontrados!");

        const log = (args) => {
            console.log(args);
            return logsChannel.send(args);
        };

        if (messsage.content.toLocaleLowerCase() === "v") {
            voiceChannel
                .join()
                .then((connection) => {
                    log("Conectado ao canal de voz com sucesso!");

                    connection.on("disconnect", () => {
                        log("Disconectado do canal de voz!");
                    });

                    connection.on("speaking", (user, speaking) => {
                        const isSpeaking = speaking && !!speaking.bitfield;

                        if (!usersSpeaking[user.id]) {
                            usersSpeaking[user.id] = { speaking: isSpeaking, startTime: 0, totalTime: 0 };
                        }

                        if (isSpeaking) {
                            usersSpeaking[user.id].startTime = new Date().getTime();
                        } else {
                            usersSpeaking[user.id].totalTime += (new Date().getTime() - usersSpeaking[user.id].startTime) / 1000;
                            usersSpeaking[user.id].startTime = 0;
                        }

                        log(
                            `${user} ${isSpeaking ? "começou a falar" : "parou de falar"} ${
                                !isSpeaking ? `tempo total falado ${usersSpeaking[user.id].totalTime}` : ""
                            }`
                        );
                    });
                })
                .catch((e) => {
                    console.error(e);
                });
        }
    }
});

DISCORD_CLIENT.login(BOT_TOKEN);
