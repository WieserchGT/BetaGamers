import { Client, GatewayIntentBits } from "discord.js";
import { Bot } from "./structs/Bot";
import * as fs from "node:fs";
import * as path from "node:path";
import express from 'express';

// 1. PRIMERO: Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoints
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Discord Bot',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 2. INICIAR el servidor web PRIMERO
const server = app.listen(PORT, () => {
  console.log(`✅ Health check server running on port ${PORT}`);
});

// 3. LUEGO el código del debug file
const logsDir = path.join(process.cwd(), 'logs');
const lastDebugPath = path.join(logsDir, 'last-debug.log');
try {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  if (fs.existsSync(lastDebugPath)) fs.unlinkSync(lastDebugPath);
  fs.writeFileSync(lastDebugPath, `[start] ${new Date().toISOString()}\n`);
  process.env.LAST_DEBUG_PATH = lastDebugPath;
} catch (err) {
  console.error('Error setting up debug file:', err);
}

// 4. FINALMENTE el bot
export const bot = new Bot(
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ]
  })
);

// 5. Asegurarse de que el bot se INICIE
bot.start().catch(console.error);

// 6. Manejar cierre graceful
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    bot.client.destroy();
    process.exit(0);
  });
});
