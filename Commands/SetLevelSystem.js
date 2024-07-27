const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { JsonDatabase } = require("wio.db")
const GuildDatas = new JsonDatabase({ databasePath: "./Database/Guilds.json" })

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('seviye-sistemi-ayarla')
    .setDescription('Rank sistemini ayarlar.')
    .addStringOption(option =>
      option.setName('mod-seçim')
        .setDescription('Mod seçimi yapınız.')
        .setRequired(true)
        .addChoices(
          { name: 'Easy', name_localizations: { "tr": "Kolay" }, value: 'easy' },
          { name: 'Middle', name_localizations: { "tr": "Orta" }, value: 'middle' },
          { name: 'Hard', name_localizations: { "tr": "Zor" }, value: 'hard' },
        ))
    .addChannelOption(option =>
      option.setName('kanal-seçimi')
        .setDescription('Bilgi kanalını seçiniz.')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)),

  async run(client, interaction) {
    if (GuildDatas.get(`${interaction.guild.id}.LevelSystem.Configure.InfoChannelID`) || GuildDatas.get(`${interaction.guild.id}.LevelSystem.Configure.Mode`)) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription("Zaten seviye sistemi ayarlı!")
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      })
    }

    const mode = interaction.options.getString('mod-seçim');
    const channel = interaction.options.getChannel('kanal-seçimi');

    GuildDatas.set(`${interaction.guild.id}.LevelSystem.Configure`, { InfoChannelID: channel.id, Mode: mode });

    const SuccessEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055689381617754.png", name: "Başarılı!" })
      .setDescription(`Seviye sistemi ayarlandı! Mod: ${mode}, Bilgi Kanalı: ${channel.name}`)
      .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` });
    interaction.reply({
      embeds: [SuccessEmbed]
    });
  }
};