const { EmbedBuilder, SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { JsonDatabase } = require("wio.db")
const GuildDatas = new JsonDatabase({ databasePath: "./Database/Guilds.json" })
const puppeteer = require('puppeteer');

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("seviye-liste")
    .setDescription("Bu sunucunun seviye listesini görüntülemek için bu komutu kullanabilirsiniz."),

  async run(client, interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const levels = GuildDatas.get(`${guildId}.LevelSystem.Users`) || {};

    if (!GuildDatas.get(`${interaction.guild.id}.LevelSystem.Configure.InfoChannelID`) || !GuildDatas.get(`${interaction.guild.id}.LevelSystem.Configure.Mode`)) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription("Seviye sistemi bu sunucuda ayarlı olmadığı için bu işlemi gerçekleştiremiyorum. Ayarlandıktan sonra tekrar deneyiniz.")
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      })
    }

    if (Object.keys(levels).length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription("Bu sunucuda henüz kimse seviye almamış.")
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      });
    }

    await interaction.deferReply();

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

    users = users.slice(0, 5);

    users = await Promise.all(users.map(async (user) => {
      const cachedUser = client.users.cache.get(user.userId);
      return {
        username: cachedUser.username,
        avatar: cachedUser.displayAvatarURL({ format: 'png' }),
        level: user.level,
        xp: user.xp
      };
    }));

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seviye Listesi</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
          }
    
          .sa {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
            flex-direction: column;
          }
    
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
    
          .top-three {
            display: flex;
            justify-content: center;
            width: 100%;
            max-width: 600px;
            margin-bottom: 20px;
          }
    
          .top-three .user {
            text-align: center;
            padding: 10px;
            margin: 0 5px;
            border-radius: 10px;
            background-color: #23272a;
            border: 2px solid white;
            background: radial-gradient(circle at bottom right, rgba(219, 219, 219, 0.5), transparent);
          }
    
          .top-three .user:nth-child(1) {
            background-color: #FFD700; /* Altın rengi */
            order: 2;
            width: 150px;
          }
    
          .top-three .user:nth-child(2) {
            background-color: silver;
            order: 1;
            width: 120px;
          }
    
          .top-three .user:nth-child(3) {
            background-color: #cd7f32;
            order: 3;
            width: 120px;
          }
    
          .top-three .user img {
            border-radius: 50%;
            width: 80px;
            height: 80px;
          }
    
          .user h3 {
            font-size: 16px;
            font-weight: bold;
            overflow: hidden;
            text-overflow: ellipsis;
          }
    
          .user p {
            font-size: 14px;
            white-space: nowrap;
          }
    
          .top-three .user .rank-number {
            font-size: 24px;
            color: #ffffff;
            font-weight: bold;
            top: 5px;
            left: 5px;
          }
    
          .rankings {
            width: 100%;
            max-width: 600px;
          }
    
          .ranking {
            display: flex;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            border-radius: 10px;
            background-color: #23272a;
            border: 2px solid white;
            background: radial-gradient(circle at top left, rgba(21, 125, 125, 0.5), transparent);
          }
    
          .ranking img {
            border-radius: 50%;
            width: 40px;
            height: 40px;
            margin-right: 10px;
          }
    
          .ranking .info {
            display: flex;
            flex-direction: column;
          }
    
          .ranking h4 {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
          }
    
          .ranking p {
            margin: 2px 0;
            font-size: 14px;
          }
          
          .ranking .rank-number {
            font-size: 24px;
            color: #ffffff;
            font-weight: bold;
            margin-right: 10px;
          }
    
          aquastrong {
            color: aqua;
          }
    
          yellowstrong {
            color: yellow;
          }
        </style>
      </head>
      <body>
      <div class="sa">
        <div class="container">
          <div class="top-three">
            ${users.slice(0, 3).map((user, index) => `
              <div class="user" style="background-color: ${index === 0 ? '#FFD700' : index === 1 ? 'silver' : '#cd7f32'};">
                <img src="${user.avatar}" alt="${user.username}">
                <h3>${user.username}</h3>
                <p>${user.level}. seviye, ${user.xp} xp</p>
                <p class="rank-number">#${index + 1}</p>
              </div>
            `).join('')}
          </div>
          <div class="rankings">
            ${users.slice(3).map((user, index) => `
              <div class="ranking">
                <div class="rank-number">#${index + 4}</div>
                <img src="${user.avatar}" alt="${user.username}">
                <div class="info">
                  <h4>${user.username}</h4>
                  <p><aquastrong>${user.level}.</aquastrong> <yellowstrong>seviye,</yellowstrong> <aquastrong>${user.xp}</aquastrong> <yellowstrong>xp</yellowstrong></p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.setViewport({ width: 550, height: 430 });
    const screenshotBuffer = await page.screenshot({ omitBackground: true });
    await browser.close();

    const attachment = new AttachmentBuilder(screenshotBuffer, { name: 'level-list.png' });

    const userData = GuildDatas.get(`${guildId}.LevelSystem.Users.${userId}`);
    const SuccessEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055689381617754.png", name: `Sunucudaki İlk 5 Kişinin Seviye Listesi!` })
      .setDescription(`Sunucunun ilk 5 kişinin seviye bilgileri aşağıdaki gibidir.`)
      .setImage('attachment://level-list.png')
      .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })
    if (userData) {
      SuccessEmbed.setDescription(`${userData.level.toString()}. seviye, ${userData.xp.toString()} xp ile sunucudaki sıralaman #${userRank}`);
    }
    await interaction.editReply({ embeds: [SuccessEmbed], files: [attachment] });
  }
};