import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction
} from "discord.js";
import play from "play-dl";
import { bot } from "..";
import { i18n } from "../utils/i18n";

export default {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription(i18n.__("search.description"))
    .addStringOption((option) =>
      option.setName("query").setDescription(i18n.__("search.optionQuery")).setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString("query", true);
    const member = interaction.guild!.members.cache.get(interaction.user.id);

    if (!member?.voice.channel)
      return interaction.reply({ content: i18n.__("search.errorNotChannel"), ephemeral: true }).catch(console.error);

    const search = query;

    await interaction.reply("⏳ Loading...").catch(console.error);

    let results: any[] = [];

    try {
      // Usar play-dl para buscar
      results = await play.search(search, { limit: 10 });
    } catch (error) {
      console.error(error);
      interaction.editReply({ content: i18n.__("common.errorCommand") }).catch(console.error);
      return;
    }

    if (!results || !results[0]) {
      interaction.editReply({ content: i18n.__("search.noResults") });
      return;
    }

    const options = results.map((video, index) => {
      const duration = video.durationInSec ? 
        `${Math.floor(video.durationInSec / 60)}:${Math.floor(video.durationInSec % 60).toString().padStart(2, '0')}` : 
        "N/A";
      
      return {
        label: video.title ? (video.title.length > 100 ? video.title.substring(0, 97) + "..." : video.title) : "Sin título",
        value: index.toString(),
        description: `Duración: ${duration}`
      };
    });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("search-select")
        .setPlaceholder("Selecciona una canción")
        .setMinValues(1)
        .setMaxValues(1) // Cambiado a 1 para evitar múltiples ejecuciones
        .addOptions(options)
    );

    const followUp = await interaction.followUp({
      content: "🎵 Elige una canción para reproducir:",
      components: [row]
    });

    followUp
      .awaitMessageComponent({
        time: 30000
      })
      .then((selectInteraction) => {
        if (!(selectInteraction instanceof StringSelectMenuInteraction)) return;

        const selectedIndex = parseInt(selectInteraction.values[0]);
        const selectedVideo = results[selectedIndex];

        selectInteraction.update({ content: `⏳ Cargando: **${selectedVideo.title}**`, components: [] });

        // Ejecutar el comando play con la URL seleccionada
        bot.slashCommandsMap
          .get("play")!
          .execute(interaction, selectedVideo.url)
          .catch((error: any) => {
            console.error("Error ejecutando play:", error);
            selectInteraction.editReply({ content: "❌ Error al reproducir la canción seleccionada." });
          });
      })
      .catch((error) => {
        console.error("Error en selección:", error);
        interaction.editReply({ content: "⏰ Tiempo de selección agotado." }).catch(console.error);
      });
  }
};