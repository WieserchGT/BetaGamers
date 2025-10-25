// deploy-commands.ts
import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config();

const token = process.env.TOKEN!;
const clientId = process.env.CLIENT_ID!;

const commands: any[] = [];

// Cargar comandos desde la carpeta commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => 
    file.endsWith('.js') || file.endsWith('.ts')
);

console.log(`📁 Encontrados ${commandFiles.length} archivos de comandos:`);

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    console.log(`🔍 Procesando: ${file}`);
    
    try {
        const commandModule = require(filePath);
        const command = commandModule.default || commandModule;
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ Comando cargado: ${command.data.name}`);
        } else {
            console.log(`⚠️  El comando en ${filePath} no tiene 'data' o 'execute'`);
        }
    } catch (error) {
        console.error(`❌ Error cargando comando ${file}:`, error);
    }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`🔄 Registrando ${commands.length} comandos de aplicación...`);

        const data: any = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log(`✅ ${data.length} comandos registrados exitosamente en Discord!`);
        console.log('📝 Comandos registrados:');
        data.forEach((cmd: any) => console.log(`   - ${cmd.name}`));
        
    } catch (error) {
        console.error('❌ Error registrando comandos:', error);
    }
})();