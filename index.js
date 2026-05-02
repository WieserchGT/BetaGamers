require('dotenv/config');

const fs = require('node:fs');
const path = require('node:path');

const distEntry = path.join(__dirname, 'dist', 'index.js');

if (fs.existsSync(distEntry)) {
	require(distEntry);
} else {
	try {
		require('ts-node/register/transpile-only');
		require('./index.ts');
	} catch (error) {
		console.error('No se pudo iniciar el bot: dist/index.js no existe y ts-node no esta disponible.');
		console.error(error);
		process.exit(1);
	}
}
