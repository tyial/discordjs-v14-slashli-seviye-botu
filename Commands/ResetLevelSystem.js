const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { JsonDatabase } = require("wio.db")
const GuildDatas = new JsonDatabase({ databasePath: "./Database/Guilds.json" })

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('seviye-sistemi-sıfırla')
    .setDescription('Rank sistemini sıfırlar.'),

  async run(client, interaction) {
    if (!GuildDatas.get(`${interaction.guild.id}.LevelSystem.Configure.InfoChannelID`) || !GuildDatas.get(`${interaction.guild.id}.LevelSystem.Configure.Mode`)) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription("Seviye sistemi zaten ayarlı değil!")
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      })
    }

    GuildDatas.set(`${interaction.guild.id}.LevelSystem.Configure`, { InfoChannelID: NaN, Mode: NaN });
    GuildDatas.delete(`${interaction.guild.id}.LevelSystem.Users`);
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor("#00FF00")
        .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055689381617754.png", name: "Başarılı!" })
        .setDescription(`Seviye sistemi başarıyla sıfırlandı!`)
        .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
    });
  }
};