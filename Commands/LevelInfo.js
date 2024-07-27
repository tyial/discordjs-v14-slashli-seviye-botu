const { EmbedBuilder, SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { JsonDatabase } = require("wio.db")
const GuildDatas = new JsonDatabase({ databasePath: "./Database/Guilds.json" })
const puppeteer = require('puppeteer');

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("seviye-bilgi")
    .setDescription("Bu sunucudaki seviyen hakkında bilgi alabilmek için bu komutu kullanabilirsiniz.")
    .addUserOption(option =>
      option.setName('üye-seçim')
        .setDescription('Başka bir üyenin bu sunucudaki seviye bilgisi için üyeyi etiketleyebilirsiniz.')
        .setRequired(false)),

  async run(client, interaction) {
    await interaction.deferReply();

    if (!GuildDatas.get(`${interaction.guild.id}.LevelSystem.Configure.InfoChannelID`) || !GuildDatas.get(`${interaction.guild.id}.LevelSystem.Configure.Mode`)) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription("Seviye sistemi bu sunucuda ayarlı olmadığı için bu işlemi gerçekleştiremiyorum. Ayarlandıktan sonra tekrar deneyiniz.")
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })],
        ephemeral: true
      })
    }

    const targetUser = interaction.options.getUser('üye-seçim') || interaction.user;
    if (targetUser.bot) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription("Bir botun seviyesini sorgulayamazsın.")
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })],
        ephemeral: true
      });
    }
    const userId = targetUser.id;
    const guildId = interaction.guild.id;
    const key = `${guildId}.LevelSystem.Users.${userId}`;

    let userData = GuildDatas.get(key);

    if (!userData) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription("Bu kullanıcıya ait seviye bilgisi bulunamadı.")
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      });
    }

    let xpToNextLevel = userData.level === 0 ? 50 : userData.level === 1 ? 100 : 100 * userData.level;
    const xpRemaining = xpToNextLevel - userData.xp;
    const progressPercentage = Math.floor((userData.xp / xpToNextLevel) * 100);

    const levels = GuildDatas.get(`${guildId}.LevelSystem.Users`) || {};
    let users = Object.keys(levels).map(userId => ({
      userId,
      level: levels[userId].level,
      xp: levels[userId].xp
    })).sort((a, b) => {
      if (b.level === a.level) {
        return b.xp - a.xp;
      }
      return b.level - a.level;
    });

    const guildMembers = await interaction.guild.members.fetch();
    users = users.filter(user => guildMembers.has(user.userId));

    const userRank = users.findIndex(user => user.userId === userId) + 1;
    const newLevel = userData.level + 1;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seviye Bilgisi</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            background: #7289da;
            border-radius: 20px;
            padding: 20px;
            width: 500px;
            text-align: center;
            position: relative;
            background-image: url('https://i.hizliresim.com/1oa0fiq.png');
            background-size: cover;
            background-position: center;
          }
          .avatar {
            border: 5px solid #ff0000;
            border-radius: 50%;
            width: 100px;
            height: 100px;
          }
          .username {
            font-size: 24px;
            font-weight: bold;
            margin-top: 10px;
          }
          .rank {
            position: absolute;
            top: 10px;
            right: 20px;
            font-size: 24px;
            font-weight: bold;
            color: yellow;
          }
          .level-info {
            font-size: 18px;
            margin: 10px 0;
          }
          .progress-bar {
            background-color: #4caf50;
            height: 30px;
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
          }
          .progress {
            height: 100%;
            width: ${progressPercentage}%;
            background-color: #1e90ff;
            text-align: center;
            line-height: 30px;
            color: white;
          }
          .xp-info {
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="rank">#${userRank}</div>
          <img src="${targetUser.displayAvatarURL({ format: 'png' })}" alt="Avatar" class="avatar">
          <div class="username">${targetUser.username}</div>
          <div class="level-info">Seviye ${userData.level} | ${userData.xp} XP</div>
          <div class="progress-bar">
            <div class="progress">${progressPercentage}%</div>
          </div>
          <div class="xp-info">${newLevel}. seviyeye ulaşmak için ${xpRemaining} XP kaldı!</div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.setViewport({ width: 550, height: 300 });
    const screenshotBuffer = await page.screenshot({ omitBackground: true });
    await browser.close();

    const attachment = new AttachmentBuilder(screenshotBuffer, { name: 'level-info.png' });

    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setColor("#00FF00")
        .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055689381617754.png", name: "Seviye Bilgi Kartı!" })
        .setDescription(`Kullanıcının seviye bilgi kartı aşağıdadır.`)
        .setImage('attachment://level-info.png')
        .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })], files: [attachment]
    });
  }
};
