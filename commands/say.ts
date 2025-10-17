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
  execute(interaction: ChatInputCommandInteraction) {
    const mensaje = interaction.options.getString("mensaje", true);
    
    // Verificar que el mensaje no esté vacío
    if (!mensaje) {
      return interaction.reply({ 
        content: "Debes proporcionar un mensaje para que lo repita.", 
        ephemeral: true 
      });
    }

    // Eliminar el mensaje del comando (opcional)
    interaction.deferReply({ ephemeral: true })
      .then(() => interaction.deleteReply())
      .catch(console.error);

    // Enviar el mensaje
    interaction.channel?.send(mensaje).catch(console.error);
  }
};
