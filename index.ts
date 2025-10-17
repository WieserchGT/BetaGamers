import express from 'express'; // ✅ AGREGA ESTA IMPORTACIÓN

// ✅ AGREGA ESTE CÓDIGO DEL SERVIDOR EXPRESS
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Bot is running' });
});

app.listen(PORT, () => {
    console.log(`✅ Health check server running on port ${PORT}`);
});

// TU CÓDIGO ORIGINAL (todo lo que ya tienes):
import { Client, GatewayIntentBits } from "discord.js";
import { Bot } from "./structs/Bot";
import * as fs from "node:fs";
import * as path from "node:path";

// Prepare a fresh debug file on each start
const logsDir = path.join(process.cwd(), 'logs');
const lastDebugPath = path.join(logsDir, 'last-debug.log');
try {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  if (fs.existsSync(lastDebugPath)) fs.unlinkSync(lastDebugPath);
  fs.writeFileSync(lastDebugPath, `[start] ${new Date().toISOString()}\n`);
  process.env.LAST_DEBUG_PATH = lastDebugPath;
} catch (err) {
}

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
