import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  Colors
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Obtén el enlace para invitarme a tu servidor"),
  
  async execute(interaction: ChatInputCommandInteraction) {
    // Responder inmediatamente para evitar el timeout
    await interaction.deferReply();
    
    const client = interaction.client;
    const inviteURL = `https://discord.com/api/oauth2/authorize?client_id=${client.user!.id}&permissions=1644971949559&scope=bot%20applications.commands`;
    
    const inviteEmbed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("¡Invitación Disponible!")
      .setDescription(
        `¡Hola **${interaction.user.username}**!\n\n` +
        `¿Te gustaría invitarme a tu servidor? Contamos con musica e inteligencia .\n\n` +
        `¡Invitame haciendo clic en el botón de abajo!`
      )
      .setThumbnail(client.user!.displayAvatarURL({ size: 256 }))
      .setFooter({ 
        text: `Solicitado por ${interaction.user.tag}`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Invitar")
        .setStyle(ButtonStyle.Link)
        .setURL(inviteURL)
        .setEmoji("📨"),
      
      new ButtonBuilder()
        .setLabel("Sitio Web")
        .setStyle(ButtonStyle.Link)
        .setURL("https://wieserchgt.wixsite.com/wieserchgt")
        .setEmoji("🌐")
    );

    try {
      await interaction.editReply({ 
        embeds: [inviteEmbed], 
        components: [actionRow] 
      });
    } catch (error) {
      console.error("Error al ejecutar el comando invite:", error);
      
      try {
        await interaction.editReply({ 
          content: "Ocurrió un error al generar la invitación."
        });
      } catch (editError) {
        console.error("Error al editar la respuesta:", editError);
      }
    }
  }
};