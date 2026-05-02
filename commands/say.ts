import { SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("El bot repite tu mensaje")
    .addStringOption(option =>
      option.setName("mensaje")
        .setDescription("El mensaje que quieres que repita")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has("Administrator")) {
      return interaction.reply({
        content: "❌ No tienes permisos para usar este comando.",
        ephemeral: true
      });
    }

    const mensaje = interaction.options.getString("mensaje", true);

    try {
      await interaction.deferReply();
      
      if (interaction.channel && 'send' in interaction.channel) {
        await interaction.channel.send({
          content: mensaje,
          allowedMentions: { parse: [] }
        });
        
        await interaction.deleteReply();
      } else {
        await interaction.editReply({
          content: "❌ No puedo enviar mensajes en este canal."
        });
      }
    } catch (error) {
      console.error("Error en comando say:", error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: "❌ Error al enviar el mensaje."
        });
      } else {
        await interaction.reply({
          content: "❌ Error al enviar el mensaje.",
          ephemeral: true
        });
      }
    }
  }
};
