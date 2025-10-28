import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clearall")
    .setDescription("Elimina TODOS los mensajes del canal desde siempre")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "❌ Solo los administradores pueden usar este comando.",
        ephemeral: true
      });
    }

    const channel = interaction.channel as TextChannel;

    if (!channel || !('bulkDelete' in channel)) {
      return interaction.reply({
        content: "❌ Este comando solo funciona en canales de texto.",
        ephemeral: true
      });
    }

    const warningEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle("⚠️ ADVERTENCIA: Eliminación Total")
      .setDescription(`Estás a punto de eliminar **TODOS** los mensajes del canal <#${channel.id}> desde su creación.\n\n**Importante:**\n- Mensajes recientes: Eliminación rápida\n- Mensajes antiguos: Eliminación más lenta\n- Esto puede tardar si hay muchos mensajes`)
      .addFields(
        { name: "Canal", value: `<#${channel.id}>`, inline: true },
        { name: "Solicitado por", value: `<@${interaction.user.id}>`, inline: true }
      )
      .setFooter({ text: "Esta acción NO se puede deshacer" })
      .setTimestamp();

    const confirmRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_clearall')
          .setLabel('✅ Sí, eliminar TODO')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_clearall')
          .setLabel('❌ Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );

    const response = await interaction.reply({
      embeds: [warningEmbed],
      components: [confirmRow],
      ephemeral: true,
      fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000
    });

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        return buttonInteraction.reply({
          content: '❌ Solo quien ejecutó el comando puede confirmar.',
          ephemeral: true
        });
      }

      if (buttonInteraction.customId === 'cancel_clearall') {
        await buttonInteraction.update({
          content: '❌ Eliminación cancelada.',
          embeds: [],
          components: []
        });
        return;
      }

      await buttonInteraction.update({
        content: '🗑️ Iniciando eliminación total...',
        embeds: [],
        components: []
      });

      let totalDeleted = 0;

      try {
        let deletedInBatch = 0;
        let batchCount = 0;

        do {
          deletedInBatch = 0;
          const messages = await channel.messages.fetch({ limit: 100 });
          
          if (messages.size === 0) break;

          try {
            const deleted = await channel.bulkDelete(messages, true);
            deletedInBatch = deleted.size;
            totalDeleted += deletedInBatch;
            batchCount++;

            if (batchCount % 5 === 0) {
              await interaction.editReply({
                content: `🗑️ Eliminando... ${totalDeleted} mensajes borrados.`
              });
            }

            if (deletedInBatch > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            break;
          }

        } while (deletedInBatch === 100);

        let oldMessages = await channel.messages.fetch({ limit: 100 });
        
        if (oldMessages.size > 0) {
          await interaction.editReply({
            content: `🗑️ ${totalDeleted} mensajes eliminados. Continuando con mensajes antiguos...`
          });

          let oldDeleted = 0;
          
          while (oldMessages.size > 0) {
            for (const message of oldMessages.values()) {
              try {
                await message.delete();
                oldDeleted++;
                totalDeleted++;

                if (oldDeleted % 10 === 0) {
                  await interaction.editReply({
                    content: `🗑️ Total: ${totalDeleted} mensajes eliminados...`
                  });
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              } catch (error) {
                console.error("Error eliminando mensaje:", error);
              }
            }

            oldMessages = await channel.messages.fetch({ limit: 100 });
            
            if (oldMessages.size === 0) break;
            
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        await interaction.editReply({
          content: `✅ Canal limpiado completamente: **${totalDeleted}** mensajes eliminados.`
        });

        setTimeout(async () => {
          try {
            await interaction.deleteReply();
          } catch (error) {
            console.error("Error al eliminar respuesta:", error);
          }
        }, 15000);

      } catch (error: any) {
        console.error("Error en clearall:", error);
        
        await interaction.editReply({
          content: `❌ Error durante la eliminación. Se eliminaron ${totalDeleted || 0} mensajes antes del error.`
        });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        try {
          await interaction.editReply({
            content: '⏱️ Tiempo agotado. Eliminación cancelada.',
            embeds: [],
            components: []
          });
        } catch (error) {
          console.error("Error al actualizar mensaje:", error);
        }
      }
    });
  }
};