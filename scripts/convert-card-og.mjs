import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, '..', 'images', 'business-card-og.png');
const dstWebp = path.resolve(__dirname, '..', 'images', 'business-card-og.webp');
const dstJpg = path.resolve(__dirname, '..', 'images', 'business-card-og.jpg');

const w = await sharp(src).webp({ quality: 88 }).toFile(dstWebp);
const j = await sharp(src).resize(1200, 630).jpeg({ quality: 88, mozjpeg: true }).toFile(dstJpg);

console.log('webp:', w.size, 'jpg:', j.size);
