import { Client, GatewayIntentBits, Collection, ActivityType } from "discord.js";
import { Bot } from "./structs/Bot.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import express from 'express';

declare module "discord.js" {
  interface Client {
    slashCommands: Collection<string, any>;
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.json({ status: 'OK', service: 'Discord Bot' }));
app.get('/health', (req, res) => res.json({ status: 'OK' }));

const server = app.listen(PORT, () => {
  console.log(`✅ Health check server en puerto ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  presence: {
    activities: [{ name: 'musica', type: ActivityType.Listening }],
    status: 'online'
  }
});

client.slashCommands = new Collection();

async function loadSlashCommands() {
  console.log('Cargando comandos...');

  const sourceCommandsPath = path.join(process.cwd(), 'commands');
  const distCommandsPath = path.join(process.cwd(), 'dist', 'commands');
  const isTsRuntime = __filename.endsWith('.ts');

  const commandsPath = isTsRuntime
    ? (fs.existsSync(sourceCommandsPath) ? sourceCommandsPath : distCommandsPath)
    : (fs.existsSync(distCommandsPath) ? distCommandsPath : sourceCommandsPath);

  console.log(`Buscando en: ${commandsPath}`);

  if (!fs.existsSync(commandsPath)) {
    console.error('No se encontro carpeta de comandos');
    return 0;
  }

  const useJsFiles = commandsPath.includes(`${path.sep}dist${path.sep}`);
  const commandFiles = fs.readdirSync(commandsPath).filter(file =>
    useJsFiles
      ? (file.endsWith('.js') && !file.endsWith('.map'))
      : file.endsWith('.ts')
  );

  console.log(`Encontrados ${commandFiles.length} archivos .js`);

  let loadedCount = 0;
  
  for (const file of commandFiles) {
    try {
      const filePath = path.join(commandsPath, file);
      
      const commandModule = await import(pathToFileURL(filePath).href);
      const command = commandModule.default || commandModule;
      
      if (command && command.data && command.execute) {
        client.slashCommands.set(command.data.name, command);
        console.log(`✅ ${command.data.name}`);
        loadedCount++;
      } else {
        console.log(`${file} - estructura invalida`);
      }
    } catch (error: any) {
      console.error(`Error cargando ${file}:`, error.message);
    }
  }
  
  console.log(`✅ ${loadedCount}/${commandFiles.length} comandos cargados`);
  return loadedCount;
}

client.once('ready', async () => {
  console.log(`✅ ${client.user!.tag} conectado a Discord`);
  
  await loadSlashCommands();
  
  console.log('BetaGaming ready');
  console.log(`Servidores: ${client.guilds.cache.size}`);
  console.log(`Usuarios: ${client.users.cache.size}`);
  console.log(`Comandos: ${client.slashCommands.size}`);
  
  client.user!.setPresence({
    activities: [{ name: `${client.guilds.cache.size} servidores | /play`, type: ActivityType.Listening }],
    status: 'online'
  });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  
  if (!command) {
    console.error(`Comando no encontrado: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error: any) {
    console.error(`Error en ${interaction.commandName}:`, error);
    
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply('Error ejecutando el comando.');
      } else {
        await interaction.reply({ content: 'Error ejecutando el comando.', ephemeral: true });
      }
    } catch (replyError) {
      console.error('Error al responder:', replyError);
    }
  }
});

process.on('unhandledRejection', (error) => {
  console.error('UNHANDLED REJECTION:', error);
});

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  setTimeout(() => process.exit(1), 1000);
});

process.on('SIGINT', async () => {
  console.log('\nApagando...');
  server.close();
  if (client.isReady()) client.destroy();
  setTimeout(() => process.exit(0), 3000);
});

console.log('Inicializando bot...');

export const bot = new Bot(client);

client.login(process.env.TOKEN).catch((error) => {
  console.error('Error iniciando sesion:', error);
  process.exit(1);
});