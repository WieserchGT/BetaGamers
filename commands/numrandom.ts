import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseRange(text: string): { min: number; max: number } | null {
  const fullText = text.toLowerCase().trim();
  
  const patterns = [
    /del\s+(\d+)\s+al?\s+(\d+)/,
    /entre\s+(\d+)\s+y\s+(\d+)/,
    /de\s+(\d+)\s+a\s+(\d+)/,
    /(\d+)\s*-\s*(\d+)/,
    /(\d+)\s+al?\s+(\d+)/,
    /desde\s+(\d+)\s+hasta\s+(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = fullText.match(pattern);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      
      if (!isNaN(min) && !isNaN(max) && min <= max) {
        return { min, max };
      }
    }
  }

  return null;
}

export default {
  data: new SlashCommandBuilder()
    .setName('numrandom')
    .setDescription('Genera un numero aleatorio en el rango que especifiques')
    .addStringOption(option =>
      option
        .setName('rango')
        .setDescription('Especifica el rango (ej: 1-100, del 1 al 50, entre 234 y 786)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const rangoInput = interaction.options.getString('rango', true);
    const result = parseRange(rangoInput);

    if (!result) {
      await interaction.reply({
        content: '❌ No pude entender el rango. Intenta con:\n' +
                 '• `1-100`\n' +
                 '• `del 1 al 100`\n' +
                 '• `entre 500 y 1500`\n' +
                 '• `de 234 a 786`\n' +
                 '• `desde 234 hasta 786`',
        ephemeral: true
      });
      return;
    }

    const { min, max } = result;
    const randomNum = getRandomNumber(min, max);

    await interaction.reply({
      content: `🎲 **Número aleatorio entre ${min} y ${max}:** \`${randomNum}\``
    });
  }
};