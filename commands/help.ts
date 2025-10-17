import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { i18n } from "../utils/i18n";
import { bot } from "../index";

export default {
  data: new SlashCommandBuilder().setName("help").setDescription("Muestra todos los comandos y descripciones"),
  async execute(interaction: CommandInteraction) {
    let commands = bot.slashCommandsMap;

    let helpEmbed = new EmbedBuilder()
      .setTitle(`Ayuda de ${interaction.client.user!.username}`)
      .setDescription("Listado de comandos")
      .setColor("#F8AA2A");

    commands.forEach((cmd) => {
      helpEmbed.addFields({
        name: `**${cmd.data.name}**`,
        value: `${cmd.data.description}`,
        inline: true
      });
    });

    helpEmbed.setTimestamp();

    return interaction.reply({ embeds: [helpEmbed] }).catch(console.error);
  }
};
