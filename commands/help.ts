import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from "discord.js";

// Definir interfaz para los comandos
interface CommandInfo {
  name: string;
  description: string;
}

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("📚 Muestra todos los comandos disponibles"),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();

      // Obtener comandos directamente del cliente
      const commands = interaction.client.slashCommands;
      
      if (!commands || commands.size === 0) {
        await interaction.editReply("❌ No hay comandos disponibles.");
        return;
      }

      console.log(`🔍 Help encontró ${commands.size} comandos:`);
      commands.forEach((cmd, name) => {
        console.log(` - ${name}: ${cmd.data.description}`);
      });

      // Crear categorías automáticamente con tipos explícitos
      const musicCommands: CommandInfo[] = [];
      const funCommands: CommandInfo[] = [];
      const utilityCommands: CommandInfo[] = [];
      const otherCommands: CommandInfo[] = [];

      // Clasificar comandos automáticamente
      commands.forEach((cmd, name) => {
        const commandInfo: CommandInfo = {
          name: `**/${name}**`,
          description: cmd.data.description
        };

        const descLower = cmd.data.description.toLowerCase();
        const nameLower = name.toLowerCase();

        // Detectar categorías por nombre y descripción
        if (nameLower.includes('play') || nameLower.includes('pause') || 
            nameLower.includes('skip') || nameLower.includes('queue') || 
            nameLower.includes('volume') || nameLower.includes('stop') ||
            nameLower.includes('nowplaying') || nameLower.includes('loop') || 
            nameLower.includes('lyrics') || descLower.includes('música') ||
            descLower.includes('music') || descLower.includes('canción')) {
          musicCommands.push(commandInfo);
        } 
        else if (nameLower.includes('caracola') || nameLower.includes('8ball') || 
                 nameLower.includes('say') || nameLower.includes('numrandom') ||
                 descLower.includes('divertido') || descLower.includes('juego') ||
                 descLower.includes('pregunta') || descLower.includes('magia')) {
          funCommands.push(commandInfo);
        }
        else if (nameLower.includes('clear') || nameLower.includes('move') || 
                 nameLower.includes('remove') || nameLower.includes('search') ||
                 nameLower.includes('shuffle') || descLower.includes('limpiar') ||
                 descLower.includes('buscar') || descLower.includes('eliminar')) {
          utilityCommands.push(commandInfo);
        }
        else {
          otherCommands.push(commandInfo);
        }
      });

      // Función para formatear comandos en horizontal
      const formatCommandsCompact = (commandList: CommandInfo[]): string => {
        return commandList.map(cmd => 
          `${cmd.name} • ${cmd.description}`
        ).join('\n');
      };

      // Embed principal
      const helpEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("📚 Centro de Ayuda - BetaGaming")
        .setDescription(`**¡Hola ${interaction.user.username}!** 👋\n\nAquí tienes todos los comandos disponibles organizados por categorías:\n\n**Total de comandos:** ${commands.size}`)
        .setThumbnail("https://github.com/WieserchGT/BetaGamers/blob/main/BetaGaming.jpg?raw=true")
        .setFooter({ 
          text: "BetaGaming™ - Usa los botones para navegar entre categorías", 
          iconURL: "https://github.com/WieserchGT/BetaGamers/blob/main/BetaGaming.jpg?raw=true" 
        })
        .setTimestamp();

      // Agregar campos en formato horizontal
      if (musicCommands.length > 0) {
        helpEmbed.addFields({
          name: `🎵 Música [${musicCommands.length}]`,
          value: formatCommandsCompact(musicCommands),
          inline: false
        });
      }

      if (funCommands.length > 0) {
        helpEmbed.addFields({
          name: `🎮 Diversión [${funCommands.length}]`,
          value: formatCommandsCompact(funCommands),
          inline: false
        });
      }

      if (utilityCommands.length > 0) {
        helpEmbed.addFields({
          name: `🔧 Utilidad [${utilityCommands.length}]`,
          value: formatCommandsCompact(utilityCommands),
          inline: false
        });
      }

      if (otherCommands.length > 0) {
        helpEmbed.addFields({
          name: `📋 Otros [${otherCommands.length}]`,
          value: formatCommandsCompact(otherCommands),
          inline: false
        });
      }

      // Botones interactivos
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('music_help')
            .setLabel(`🎵 Música`)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('fun_help')
            .setLabel(`🎮 Diversión`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('util_help')
            .setLabel(`🔧 Utilidad`)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('all_help')
            .setLabel('📚 Todos')
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.editReply({ 
        embeds: [helpEmbed], 
        components: [row] 
      });

      // Colector para botones
      const message = await interaction.fetchReply();
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000
      });

      collector.on('collect', async (buttonInteraction) => {
        if (buttonInteraction.user.id !== interaction.user.id) {
          await buttonInteraction.reply({
            content: '❌ Este menú de ayuda no es para ti.',
            flags: 64
          });
          return;
        }

        let categoryEmbed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setThumbnail("https://github.com/WieserchGT/BetaGamers/blob/main/BetaGaming.jpg?raw=true")
          .setFooter({ 
            text: "BetaGaming™ - Sistema de Ayuda", 
            iconURL: "https://github.com/WieserchGT/BetaGamers/blob/main/BetaGaming.jpg?raw=true" 
          })
          .setTimestamp();

        switch (buttonInteraction.customId) {
          case 'music_help':
            categoryEmbed
              .setTitle(`🎵 Comandos de Música [${musicCommands.length}]`)
              .setDescription(formatCommandsCompact(musicCommands))
              .setColor(0x1DB954);
            break;

          case 'fun_help':
            categoryEmbed
              .setTitle(`🎮 Comandos Cagados [${funCommands.length}]`)
              .setDescription(formatCommandsCompact(funCommands))
              .setColor(0xFF69B4);
            break;

          case 'util_help':
            categoryEmbed
              .setTitle(`🔧 Comandos de Utilidad [${utilityCommands.length}]`)
              .setDescription(formatCommandsCompact(utilityCommands))
              .setColor(0xFFFF00);
            break;

          case 'all_help':
            categoryEmbed = helpEmbed;
            break;
        }

        await buttonInteraction.update({ embeds: [categoryEmbed] });
      });

      collector.on('end', async () => {
        try {
          const disabledRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('music_help_disabled')
                .setLabel('🎵 Música')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId('fun_help_disabled')
                .setLabel('🎮 Diversión')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId('util_help_disabled')
                .setLabel('🔧 Utilidad')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId('all_help_disabled')
                .setLabel('📚 Todos')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            );

          await interaction.editReply({ components: [disabledRow] });
        } catch (error) {
          // Ignorar errores si el mensaje ya fue editado
        }
      });

    } catch (error) {
      console.error('Error en comando help:', error);
      try {
        await interaction.editReply({
          content: "❌ Ocurrió un error al mostrar la ayuda. Intenta nuevamente."
        });
      } catch {
        await interaction.reply({
          content: "❌ Ocurrió un error al mostrar la ayuda.",
          flags: 64
        });
      }
    }
  }
};