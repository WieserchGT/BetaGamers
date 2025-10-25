import { Client, GatewayIntentBits, Collection, ActivityType } from "discord.js";
import { Bot } from "./structs/Bot";
import * as fs from "node:fs";
import * as path from "node:path";
import express from 'express';

// Extender tipos de Discord.js
declare module "discord.js" {
  interface Client {
    slashCommands: Collection<string, any>;
  }
}

// Configuración básica
const app = express();
const PORT = process.env.PORT || 3000;

// Servidor Express mínimo
app.get('/', (req, res) => res.json({ status: 'OK', service: 'Discord Bot' }));
app.get('/health', (req, res) => res.json({ status: 'OK' }));

const server = app.listen(PORT, () => {
  console.log(`✅ Health check server en puerto ${PORT}`);
});

// Cliente Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  presence: {
    activities: [{ name: 'música 🎵', type: ActivityType.Listening }],
    status: 'online'
  }
});

// Colección de comandos
client.slashCommands = new Collection();

// ==================== CARGA DE COMANDOS ====================

async function loadSlashCommands() {
  console.log('🔧 Cargando comandos...');
  
  // Path absoluto desde la raíz del proyecto
  const commandsPath = path.join(process.cwd(), 'dist', 'commands');
  
  console.log(`🔍 Buscando en: ${commandsPath}`);
  
  if (!fs.existsSync(commandsPath)) {
    console.error('❌ No se encontró dist/commands');
    return 0;
  }

  // Obtener archivos .js (excluir .map)
  const commandFiles = fs.readdirSync(commandsPath).filter(file => 
    file.endsWith('.js') && !file.endsWith('.map')
  );

  console.log(`📁 Encontrados ${commandFiles.length} archivos .js`);

  let loadedCount = 0;
  
  for (const file of commandFiles) {
    try {
      const filePath = path.join(commandsPath, file);
      
      // Cargar comando
      const commandModule = require(filePath);
      const command = commandModule.default || commandModule;
      
      // Verificar estructura del comando
      if (command && command.data && command.execute) {
        client.slashCommands.set(command.data.name, command);
        console.log(`✅ ${command.data.name}`);
        loadedCount++;
      } else {
        console.log(`⚠️  ${file} - estructura inválida`);
      }
    } catch (error: any) {
      console.error(`❌ Error cargando ${file}:`, error.message);
    }
  }
  
  console.log(`🎉 ${loadedCount}/${commandFiles.length} comandos cargados`);
  return loadedCount;
}

// ==================== EVENTOS PRINCIPALES ====================

// Cuando el bot se conecta
client.once('ready', async () => {
  console.log(`🎉 ${client.user!.tag} conectado a Discord!`);
  
  // Cargar comandos
  await loadSlashCommands();
  
  console.log(`📊 Servidores: ${client.guilds.cache.size}`);
  console.log(`👥 Usuarios: ${client.users.cache.size}`);
  console.log(`🔧 Comandos: ${client.slashCommands.size}`);
  
  // Actualizar presencia
  client.user!.setPresence({
    activities: [{ name: `${client.guilds.cache.size} servidores | /play`, type: ActivityType.Listening }],
    status: 'online'
  });
});

// Manejar interacciones de comandos
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  
  if (!command) {
    console.error(`❌ Comando no encontrado: ${interaction.commandName}`);
    return;
  }

  try {
    console.log(`🔧 Ejecutando: /${interaction.commandName}`);
    await command.execute(interaction);
    console.log(`✅ /${interaction.commandName} ejecutado`);
  } catch (error: any) {
    console.error(`💥 Error en ${interaction.commandName}:`, error);
    
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply('❌ Error ejecutando el comando.');
      } else {
        await interaction.reply('❌ Error ejecutando el comando.');
      }
    } catch (replyError) {
      // Ignorar errores de respuesta
    }
  }
});

// ==================== MANEJO DE ERRORES ====================

process.on('unhandledRejection', (error) => {
  console.error('🚨 UNHANDLED REJECTION:', error);
});

process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  setTimeout(() => process.exit(1), 1000);
});

// Apagado graceful
process.on('SIGINT', async () => {
  console.log('\n📴 Apagando...');
  server.close();
  if (client.isReady()) client.destroy();
  setTimeout(() => process.exit(0), 3000);
});

// ==================== INICIALIZACIÓN ====================

console.log('🚀 Inicializando bot...');

// Inicializar bot
export const bot = new Bot(client);

// Iniciar sesión
client.login(process.env.TOKEN).catch((error) => {
  console.error('❌ Error iniciando sesión:', error);
  process.exit(1);
});

// Mensaje de inicio completo
setTimeout(() => {
  if (client.isReady()) {
    console.log('\n══════════════════════════════════════════════════');
    console.log('🤖 BOT INICIALIZADO CORRECTAMENTE');
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`🔧 Comandos: ${client.slashCommands.size}`);
    console.log('══════════════════════════════════════════════════\n');
  }
}, 2000);