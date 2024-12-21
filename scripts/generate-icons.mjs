import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = join(__dirname, '../logo/logo.png');
const outputDir = join(__dirname, '../public/icons');

// Criar diretório de saída se não existir
try {
  await mkdir(outputDir, { recursive: true });
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

// Gerar ícones para cada tamanho
for (const size of sizes) {
  try {
    await sharp(inputFile)
      .resize(size, size)
      .toFile(join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Generated ${size}x${size} icon`);
  } catch (err) {
    console.error(`Error generating ${size}x${size} icon:`, err);
  }
}
