const { Client, GatewayIntentBits } = require("discord.js");
const Config = require("./Config.js");
require("advanced-logs");
const allIntents = Object.values(GatewayIntentBits);
const client = new Client({
    intents: [allIntents]
});
const { JsonDatabase } = require("wio.db")
const GuildDatas = new JsonDatabase({ databasePath: "./Database/Guilds.json" })
require("./Utils/eventLoader.js")(client)
require("./Utils/slashHandler.js")(client)

// LevelUpdater ------------------------------------------------------------------------------------------------

const { Events } = require("discord.js");

// module.exports = (client) => {
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    const userId = message.author.id;
    const guildId = message.guild.id;
    const infoChannelID = GuildDatas.get(`${guildId}.LevelSystem.Configure.InfoChannelID`);
    const configureMode = GuildDatas.get(`${guildId}.LevelSystem.Configure.Mode`);

    if (infoChannelID == null || configureMode == null) return;

    const key = `${guildId}.LevelSystem.Users.${userId}`;

    let userData = GuildDatas.get(key) || { xp: 0, level: 0 };

    let xpGained;
    switch (configureMode.toLowerCase()) {
        case 'easy':
            xpGained = Math.floor(Math.random() * 7) + 4;
            break;
        case 'middle':
            xpGained = Math.floor(Math.random() * 5) + 3;
            break;
        case 'hard':
            xpGained = Math.floor(Math.random() * 4) + 2;
            break;
        default:
            xpGained = Math.floor(Math.random() * 10) + 1;
            break;
    }

    userData.xp += xpGained;

    let xpToNextLevel;
    if (userData.level === 0) {
        xpToNextLevel = 50;
    } else if (userData.level === 1) {
        xpToNextLevel = 100;
    } else {
        xpToNextLevel = 100 * userData.level;
    }

    if (userData.xp >= xpToNextLevel) {
        userData.level += 1;
        userData.xp = 0;
        message.guild.channels.cache.get(infoChannelID).send(`Tebrikler ${message.author}, seviye atladın! Yeni seviyen: **${userData.level}**`);
    }

    GuildDatas.set(key, userData);
});
// };

// LevelUpdater ------------------------------------------------------------------------------------------------

// CrashHandler ------------------------------------------------------------------------------------------------
process.on('unhandledRejection', (reason, p) => {
    console.error(reason);
});
process.on("uncaughtException", (err, origin) => {
    console.error(' [AntiCrash] :: Uncaught Exception/Catch');
})
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error(' [AntiCrash] :: Uncaught Exception/Catch (MONITOR)');
});
// CrashHandler ------------------------------------------------------------------------------------------------

client.login(Config.Token);