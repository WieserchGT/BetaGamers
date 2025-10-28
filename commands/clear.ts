import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Elimina una cantidad específica de mensajes del canal")
    .addIntegerOption(option =>
      option.setName("cantidad")
        .setDescription("Número de mensajes a eliminar (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: "❌ No tienes permisos para administrar mensajes.",
        ephemeral: true
      });
    }

    const cantidad = interaction.options.getInteger("cantidad", true);
    const channel = interaction.channel as TextChannel;

    if (!channel || !('bulkDelete' in channel)) {
      return interaction.reply({
        content: "❌ Este comando solo funciona en canales de texto.",
        ephemeral: true
      });
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      const mensajesBorrados = await channel.bulkDelete(cantidad, true);

      await interaction.editReply({
        content: `🗑️ Se eliminaron **${mensajesBorrados.size}** mensajes correctamente.`
      });

      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (error) {
          console.error("Error al eliminar respuesta:", error);
        }
      }, 5000);

    } catch (error: any) {
      console.error("Error en comando clear:", error);
      
      await interaction.editReply({
        content: "❌ Error al eliminar mensajes. Los mensajes mayores a 14 días no pueden ser eliminados en masa."
      });
    }
  }
};