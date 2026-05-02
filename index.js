require('dotenv/config');

const fs = require('node:fs');
const path = require('node:path');

const distEntry = path.join(__dirname, 'dist', 'index.js');
const tsEntry = path.join(__dirname, 'index.ts');

if (fs.existsSync(distEntry)) {
	require(distEntry);
} else {
	import(tsEntry).catch((error) => {
		console.error('No se pudo iniciar el bot: dist/index.js no existe y no fue posible cargar index.ts.');
		console.error(error);
		process.exit(1);
	});
}
