const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { JsonDatabase } = require("wio.db")
const GuildDatas = new JsonDatabase({ databasePath: "./Database/Guilds.json" })
const MAX_LEVEL = 1000;

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('seviye-sil')
    .setDescription('Belirtilen kullanıcıdan belirtilen miktarda seviye siler.')
    .addUserOption(option =>
      option.setName('üye-seçim')
        .setDescription("Seviyesini silmek istediğiniz kullanıcıyı seçiniz.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('seviye-seçim')
        .setDescription('Silmek istediğiniz seviye miktarını giriniz.')
        .setRequired(true)
    ),

  async run(client, interaction) {
    const userId = interaction.options.getUser('üye-seçim').id;
    const targetUser = interaction.options.getUser('üye-seçim') || interaction.user;
    let levelToRemove = interaction.options.getInteger('seviye-seçim');

    if (!GuildDatas.get(`${interaction.guild.id}.LevelSystem.Configure.InfoChannelID`) || !GuildDatas.get(`${interaction.guild.id}.LevelSystem.Configure.Mode`)) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription("Seviye sistemi bu sunucuda ayarlı olmadığı için bu işlemi gerçekleştiremiyorum. Ayarlandıktan sonra tekrar deneyiniz.")
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      })
    }

    if (!interaction.guild.members.cache.get(userId)) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription("Bu kullanıcı bu sunucuda bulunamadı.")
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      })
    }

    if (targetUser.bot) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription("Bir bota seviye silme işlemi yapamam.")
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      })
    }

    if (!Number.isInteger(levelToRemove) || levelToRemove <= 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription(`Geçersiz seviye miktarı. Lütfen 1 ile ${MAX_LEVEL} arasında bir değer girin.`)
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      })
    }

    const guildId = interaction.guild.id;
    let userLevels = GuildDatas.get(`${guildId}.LevelSystem.Users.${userId}`);

    if (!userLevels || userLevels.level === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription(`Belirtilen kullanıcıya ait seviye bulunamadı.`)
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      })
    }

    if (levelToRemove > userLevels.level) {
      const HighErrorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
        .setDescription(`Belirtilen miktardan fazla seviye silme işlemi yapamazsınız. Kullanıcının mevcut seviyesi: ${userLevels.level}`)
        .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` });
      return interaction.reply({
        embeds: [HighErrorEmbed]
      });
    }

    userLevels.level -= levelToRemove;

    GuildDatas.set(`${guildId}.LevelSystem.Users.${userId}`, userLevels);

    const SuccessEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055689381617754.png", name: "Başarılı!" })
      .setDescription(`Başarıyla ${levelToRemove} seviye sildiniz. Yeni seviye: ${userLevels.level}`)
      .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })
    interaction.reply({
      embeds: [SuccessEmbed]
    });
  }
};