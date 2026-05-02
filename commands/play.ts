import { joinVoiceChannel } from "@discordjs/voice";
import type { DiscordGatewayAdapterCreator } from "@discordjs/voice";
import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { bot } from "../index.ts";
import { MusicQueue } from "../structs/MusicQueue.ts";
import { Song } from "../structs/Song.ts";
import { i18n as i18nConfig } from "../utils/i18n.ts";
import { playlistPattern } from "../utils/patterns.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription(i18nConfig.__("play.description"))
    .addStringOption((option) => 
      option.setName("song")
        .setDescription("The song you want to play")
        .setRequired(true)
    ),
  cooldown: 3,
  permissions: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
  
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isCommand() || interaction.deferred || interaction.replied) {
      return;
    }

    try {
      await interaction.deferReply();
    } catch (error: any) {
      if (error.code === 10062) return;
      return;
    }

    const argSongName = interaction.options.getString("song");
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const { channel } = guildMember!.voice;

    if (!channel) {
      return interaction.editReply({ content: i18nConfig.__("play.errorNotChannel") });
    }

    const queue = bot.queues.get(interaction.guild!.id);

    if (queue && channel.id !== queue.connection.joinConfig.channelId) {
      return interaction.editReply({
        content: i18nConfig.__mf("play.errorNotInSameChannel", { user: bot.client.user!.username })
      });
    }

    if (!argSongName) {
      return interaction.editReply({ 
        content: i18nConfig.__mf("play.usageReply", { prefix: bot.prefix })
      });
    }

    if (playlistPattern.test(argSongName)) {
      await interaction.editReply("🎵 Lista de reproducción detectada");
      return;
    }

    try {
      const song = await Song.from(argSongName, argSongName);
      
      if (!song) {
        return interaction.editReply({ 
          content: i18nConfig.__mf("play.errorNoResults", { url: `<${argSongName}>` })
        });
      }

      if (queue) {
        queue.enqueue(song);
        return interaction.editReply({ 
          content: i18nConfig.__mf("play.queueAdded", { title: song.title, author: interaction.user.id })
        });
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
      
      return interaction.editReply({ 
        content: i18nConfig.__mf("play.startedPlaying", { title: song.title })
      });
    } catch (error: any) {
      console.error("Error en comando play:", error);
      
      if (error.name === "NoResults" || error.message?.includes("No se encontraron resultados")) {
        return interaction.editReply({ 
          content: i18nConfig.__mf("play.errorNoResults", { url: `<${argSongName}>` })
        });
      }

      if (error.message?.includes("Sign in to confirm")) {
        return interaction.editReply({ 
          content: "❌ YouTube está bloqueando las descargas. El bot se está actualizando para solucionarlo."
        });
      }

      return interaction.editReply({ 
        content: '❌ Error al procesar la canción.' 
      });
    }
  }
};