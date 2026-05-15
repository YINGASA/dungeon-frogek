import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Direction = 'down' | 'up' | 'left' | 'right';
type Frame = 'idle' | '1' | '2';

const outDir = join(process.cwd(), 'public', 'assets', 'generated', 'characters', 'hunter');

function svg(content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="leather" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#26344d"/>
      <stop offset="1" stop-color="#0b101c"/>
    </linearGradient>
    <linearGradient id="cape" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#633052"/>
      <stop offset="1" stop-color="#17111f"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" fill="none"/>
  ${content}
</svg>`;
}

function sword(x1: number, y1: number, x2: number, y2: number, width = 5) {
  return `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f4f8ff" stroke-width="${width}" stroke-linecap="round"/>
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8ffcff" stroke-width="1.5" stroke-linecap="round"/>
  <rect x="${x1 - 5}" y="${y1 - 2}" width="10" height="4" rx="2" fill="#b88647"/>`;
}

function charm(cx: number, cy: number) {
  return `
  <path d="M${cx} ${cy - 8} L${cx + 8} ${cy} L${cx} ${cy + 9} L${cx - 8} ${cy} Z" fill="#30f3de" stroke="#d4ffff" stroke-width="2.2" filter="url(#glow)"/>
  <circle cx="${cx}" cy="${cy}" r="2.3" fill="#ffffff"/>`;
}

function legs(direction: Direction, frame: Frame) {
  const step = frame === '1' ? -4 : frame === '2' ? 4 : 0;
  if (direction === 'left' || direction === 'right') {
    return `
    <path d="M45 65 L${39 + step} 82" stroke="#20293d" stroke-width="7" stroke-linecap="round"/>
    <path d="M56 64 L${62 - step} 81" stroke="#20293d" stroke-width="7" stroke-linecap="round"/>`;
  }
  return `
  <path d="M40 65 L${36 + step} 82" stroke="#20293d" stroke-width="7" stroke-linecap="round"/>
  <path d="M56 65 L${60 - step} 82" stroke="#20293d" stroke-width="7" stroke-linecap="round"/>`;
}

function body(direction: Direction, frame: Frame) {
  const bob = frame === 'idle' ? 0 : frame === '1' ? -1 : 1;
  const arm = frame === '1' ? 3 : frame === '2' ? -3 : 0;
  if (direction === 'up') {
    return `
    <ellipse cx="48" cy="78" rx="24" ry="10" fill="#050812" opacity="0.45"/>
    <path d="M28 ${29 + bob} Q48 11 68 ${29 + bob} L65 75 Q48 90 31 75 Z" fill="url(#cape)" stroke="#8b4d78" stroke-width="2.4"/>
    ${legs(direction, frame)}
    <path d="M35 ${35 + bob} Q48 25 61 ${35 + bob} L58 69 Q48 77 38 69 Z" fill="url(#leather)" stroke="#70809f" stroke-width="2.4"/>
    <circle cx="48" cy="${27 + bob}" r="11.5" fill="#2b3345" stroke="#8394b5" stroke-width="2.2"/>
    <path d="M36 ${23 + bob} Q48 11 60 ${23 + bob} Q48 29 36 ${23 + bob}Z" fill="#121927"/>
    <path d="M35 ${43 + bob} L${22 + arm} 57" stroke="#6d3756" stroke-width="8" stroke-linecap="round"/>
    <path d="M61 ${43 + bob} L${74 - arm} 57" stroke="#6d3756" stroke-width="8" stroke-linecap="round"/>
    <path d="M38 39 Q48 31 58 39" stroke="#9ec3ff" stroke-width="2" opacity="0.55"/>
    ${charm(48, 61)}
    `;
  }
  if (direction === 'left') {
    return `
    <ellipse cx="48" cy="78" rx="24" ry="10" fill="#050812" opacity="0.45"/>
    <path d="M64 ${28 + bob} Q42 12 25 ${37 + bob} L28 73 Q46 88 66 70 Z" fill="url(#cape)" stroke="#8b4d78" stroke-width="2.4"/>
    ${legs(direction, frame)}
    <path d="M58 ${34 + bob} Q39 27 30 ${43 + bob} L35 69 Q48 78 62 67 Z" fill="url(#leather)" stroke="#70809f" stroke-width="2.4"/>
    <circle cx="39" cy="${29 + bob}" r="10.5" fill="#2b3345" stroke="#8394b5" stroke-width="2.2"/>
    <path d="M34 ${23 + bob} Q43 17 52 ${25 + bob} L37 ${28 + bob} Z" fill="#121927"/>
    <path d="M37 ${47 + bob} L${20 - arm} 47" stroke="#263147" stroke-width="8" stroke-linecap="round"/>
    <path d="M57 ${47 + bob} L${68 + arm} 60" stroke="#263147" stroke-width="7" stroke-linecap="round"/>
    ${charm(43, 55)}
    ${sword(22 - arm, 45, 5, 30, 5)}
    `;
  }
  if (direction === 'right') {
    return `
    <ellipse cx="48" cy="78" rx="24" ry="10" fill="#050812" opacity="0.45"/>
    <path d="M32 ${28 + bob} Q54 12 71 ${37 + bob} L68 73 Q50 88 30 70 Z" fill="url(#cape)" stroke="#8b4d78" stroke-width="2.4"/>
    ${legs(direction, frame)}
    <path d="M38 ${34 + bob} Q57 27 66 ${43 + bob} L61 69 Q48 78 34 67 Z" fill="url(#leather)" stroke="#70809f" stroke-width="2.4"/>
    <circle cx="57" cy="${29 + bob}" r="10.5" fill="#2b3345" stroke="#8394b5" stroke-width="2.2"/>
    <path d="M62 ${23 + bob} Q53 17 44 ${25 + bob} L59 ${28 + bob} Z" fill="#121927"/>
    <path d="M59 ${47 + bob} L${76 + arm} 47" stroke="#263147" stroke-width="8" stroke-linecap="round"/>
    <path d="M39 ${47 + bob} L${28 - arm} 60" stroke="#263147" stroke-width="7" stroke-linecap="round"/>
    ${charm(53, 55)}
    ${sword(74 + arm, 45, 91, 30, 5)}
    `;
  }
  return `
  <ellipse cx="48" cy="78" rx="24" ry="10" fill="#050812" opacity="0.45"/>
  <path d="M31 ${28 + bob} Q48 14 65 ${28 + bob} L62 73 Q48 86 34 73 Z" fill="url(#cape)" stroke="#8b4d78" stroke-width="2.4"/>
  ${legs(direction, frame)}
  <path d="M34 ${35 + bob} Q48 24 62 ${35 + bob} L59 68 Q48 77 37 68 Z" fill="url(#leather)" stroke="#70809f" stroke-width="2.4"/>
  <circle cx="48" cy="${27 + bob}" r="11.5" fill="#2b3345" stroke="#8394b5" stroke-width="2.2"/>
  <path d="M36 ${24 + bob} Q48 14 60 ${24 + bob} L55 ${30 + bob} Q48 26 41 ${30 + bob} Z" fill="#121927"/>
  <circle cx="44" cy="${29 + bob}" r="2" fill="#d9f6ff"/><circle cx="52" cy="${29 + bob}" r="2" fill="#d9f6ff"/>
  <path d="M35 ${45 + bob} L${24 - arm} 57" stroke="#263147" stroke-width="8" stroke-linecap="round"/>
  <path d="M61 ${45 + bob} L${72 + arm} 58" stroke="#263147" stroke-width="8" stroke-linecap="round"/>
  ${charm(48, 55)}
  ${sword(71 + arm, 51, 84 + arm, 72, 5)}
  `;
}

mkdirSync(outDir, { recursive: true });

(['down', 'up', 'left', 'right'] as Direction[]).forEach((direction) => {
  writeFileSync(join(outDir, `hunter_${direction}.svg`), svg(body(direction, 'idle')), 'utf8');
  writeFileSync(join(outDir, `hunter_${direction}_1.svg`), svg(body(direction, '1')), 'utf8');
  writeFileSync(join(outDir, `hunter_${direction}_2.svg`), svg(body(direction, '2')), 'utf8');
});

console.log(`Generated 12 hunter SVG assets in ${outDir}`);
