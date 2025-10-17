import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder
} from "discord.js";
import { i18n } from "../utils/i18n";

export default {
  data: new SlashCommandBuilder().setName("invite").setDescription("Envía un link de invitación para el bot"),
  execute(interaction: ChatInputCommandInteraction) {
    const inviteEmbed = new EmbedBuilder().setTitle("¡Invítame a tu servidor!");

    // return interaction with embed and button to invite the bot
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Invitar")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/api/oauth2/authorize?client_id=${
            interaction.client.user!.id
          }&permissions=8&scope=bot%20applications.commands`
        )
    );

    return interaction.reply({ embeds: [inviteEmbed], components: [actionRow] }).catch(console.error);
  }
};
