
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { JsonDatabase } = require("wio.db")
const GuildDatas = new JsonDatabase({ databasePath: "./Database/Guilds.json" })
const MAX_LEVEL = 1000;

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('seviye-ekle')
    .setDescription('Belirtilen kullanıcıya belirtilen miktarda seviye ekler.')
    .addUserOption(option =>
      option.setName('üye-seçim')
        .setDescription('Seviye eklemek istediğiniz kullanıcıyı seçiniz.')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('seviye-seçim')
        .setDescription('Eklemek istediğiniz seviye miktarını yazınız. (1-1000)')
        .setRequired(true)
    ),

  async run(client, interaction) {
    const userId = interaction.options.getUser('üye-seçim')?.id || interaction.user.id;
    const targetUser = interaction.options.getUser('üye-seçim') || interaction.user;
    let levelToAdd = interaction.options.getInteger('seviye-seçim');

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
          .setDescription("Bir bota seviye ekleme işlemi yapamam.")
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      })
    }

    if (!Number.isInteger(levelToAdd) || levelToAdd <= 0 || levelToAdd > MAX_LEVEL) {
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

    if (!userLevels) {
      userLevels = { level: 0, xp: 0 };
    }

    const currentLevel = userLevels.level;
    const remainingLevels = MAX_LEVEL - currentLevel;

    if (currentLevel >= MAX_LEVEL) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
          .setDescription(`Kullanıcının seviyesi zaten ${MAX_LEVEL} veya üzerinde olduğundan daha fazla seviye eklenemez.`)
          .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })]
      })
    }

    if (levelToAdd > remainingLevels) {
      levelToAdd = remainingLevels;
    }

    const newLevel = currentLevel + levelToAdd;
    userLevels.level = newLevel;

    GuildDatas.set(`${guildId}.LevelSystem.Users.${userId}`, userLevels);
    const SuccessEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055689381617754.png", name: "Başarılı!" })
      .setDescription(`Başarıyla ${levelToAdd} seviye eklediniz. Yeni seviye: ${newLevel}`)
      .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` });
    interaction.reply({
      embeds: [SuccessEmbed]
    });
  }
};