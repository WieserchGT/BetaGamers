import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder, TextChannel } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";
import { playlistPattern } from "../utils/patterns";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription(i18n.__("play.description"))
    .addStringOption((option) => option.setName("song").setDescription("The song you want to play").setRequired(true)),
  cooldown: 3,
  permissions: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
  async execute(interaction: ChatInputCommandInteraction, input: string) {
    // ✅ RESPONDER INMEDIATAMENTE - mover deferReply al inicio
    await interaction.deferReply();

    let argSongName = interaction.options.getString("song");
    if (!argSongName) argSongName = input;

    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const { channel } = guildMember!.voice;

    if (!channel) {
      return interaction.editReply({ content: i18n.__("play.errorNotChannel") }).catch(console.error);
    }

    const queue = bot.queues.get(interaction.guild!.id);

    if (queue && channel.id !== queue.connection.joinConfig.channelId) {
      return interaction.editReply({
        content: i18n.__mf("play.errorNotInSameChannel", { user: bot.client.user!.username })
      }).catch(console.error);
    }

    if (!argSongName) {
      return interaction.editReply({ 
        content: i18n.__mf("play.usageReply", { prefix: bot.prefix }) 
      }).catch(console.error);
    }

    const url = argSongName;

    // Start the playlist if playlist url was provided
    if (playlistPattern.test(url)) {
      await interaction.editReply("🔗 Link is playlist").catch(console.error);
      return bot.slashCommandsMap.get("playlist")!.execute(interaction, "song");
    }

    let song;

    try {
      song = await Song.from(url, url);
    } catch (error: any) {
      console.error(error);

      if (error.name == "NoResults") {
        return interaction.editReply({ 
          content: i18n.__mf("play.errorNoResults", { url: `<${url}>` }) 
        }).catch(console.error);
      }

      if (error.name == "InvalidURL") {
        return interaction.editReply({ 
          content: i18n.__mf("play.errorInvalidURL", { url: `<${url}>` }) 
        }).catch(console.error);
      }

      return interaction.editReply({ 
        content: i18n.__("common.errorCommand") 
      }).catch(console.error);
    }

    if (queue) {
      queue.enqueue(song);
      
      // ✅ Usar editReply en lugar de deleteReply + send
      return interaction.editReply({ 
        content: i18n.__mf("play.queueAdded", { title: song.title, author: interaction.user.id }) 
      }).then(() => {
        // Opcional: eliminar el mensaje después de unos segundos
        setTimeout(() => {
          interaction.deleteReply().catch(console.error);
        }, 5000);
      }).catch(console.error);
    }

    const newQueue = new MusicQueue({
      interaction,
      textChannel: interaction.channel! as TextChannel,
      connection: joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
      })
    });

    bot.queues.set(interaction.guild!.id, newQueue);
    newQueue.enqueue(song);
    
    // ✅ Usar editReply para confirmación
    return interaction.editReply({ 
      content: i18n.__mf("play.startedPlaying", { title: song.title }) 
    }).then(() => {
      setTimeout(() => {
        interaction.deleteReply().catch(console.error);
      }, 5000);
    }).catch(console.error);
  }
};
