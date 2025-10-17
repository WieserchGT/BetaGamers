import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { i18n } from "../utils/i18n";

export default {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Haz que el bot repita tu mensaje")
    .addStringOption(option =>
      option
        .setName("mensaje")
        .setDescription("El mensaje que quieres que repita el bot")
        .setRequired(true)
    ),
  cooldown: 5,
  async execute(interaction: ChatInputCommandInteraction) {
    const mensaje = interaction.options.getString("mensaje", true);
    
    // Verificar que el mensaje no esté vacío
    if (!mensaje.trim()) {
      return interaction.reply({ 
        content: "Debes proporcionar un mensaje para que lo repita.", 
        ephemeral: true 
      });
    }

    try {
      // Primero responder y luego eliminar
      await interaction.reply({ content: "✅ Mensaje enviado", ephemeral: true });
      await interaction.deleteReply();
      
      // Enviar el mensaje al canal
      await interaction.channel?.send(mensaje);
    } catch (error) {
      console.error("Error en comando say:", error);
    }
  }
};
