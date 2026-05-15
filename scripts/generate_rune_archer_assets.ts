import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type RuneFrame = 'idle_1' | 'idle_2' | 'cast_1' | 'cast_2' | 'attack' | 'projectile';

const outDir = join(process.cwd(), 'public', 'assets', 'generated', 'monsters', 'rune_archer');

function svg(width: number, height: number, content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="robe" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b46a8"/>
      <stop offset="0.52" stop-color="#211d56"/>
      <stop offset="1" stop-color="#080a1f"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="none"/>
  ${content}
</svg>`;
}

function rune(cx: number, cy: number, power: number) {
  const r = 8 + power;
  return `
  <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="#5f52ff" opacity="${0.12 + power * 0.03}" filter="url(#glow)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#94f2ff" stroke-width="2.2" opacity="0.9"/>
  <path d="M${cx} ${cy - r + 2} L${cx + r - 2} ${cy} L${cx} ${cy + r - 2} L${cx - r + 2} ${cy} Z" fill="#54e7ff" opacity="0.65"/>
  <circle cx="${cx}" cy="${cy}" r="3" fill="#ffffff"/>`;
}

function archer(frame: Exclude<RuneFrame, 'projectile'>) {
  const second = frame.endsWith('2');
  const cast = frame.startsWith('cast');
  const attack = frame === 'attack';
  const bob = second ? 2 : -1;
  const power = attack ? 4 : cast ? second ? 3 : 1 : 0;
  const armX = attack ? 70 : cast ? 66 : 60;
  const armY = attack ? 43 : cast ? 48 : 53 + bob;
  return `
  <ellipse cx="48" cy="86" rx="20" ry="7" fill="#040614" opacity="0.48"/>
  <path d="M32 ${31 + bob} Q48 18 64 ${31 + bob} L68 78 Q48 91 28 78 Z" fill="url(#robe)" stroke="#7180ff" stroke-width="2.4"/>
  <path d="M36 ${43 + bob} Q48 ${34 + bob} 60 ${43 + bob} L57 72 Q48 78 39 72 Z" fill="#151740" stroke="#7fdfff" stroke-width="1.8" opacity="0.7"/>
  <circle cx="48" cy="${28 + bob}" r="11" fill="#18204a" stroke="#7280ff" stroke-width="2.2"/>
  <path d="M37 ${25 + bob} Q48 ${15 + bob} 59 ${25 + bob} L55 ${32 + bob} Q48 ${29 + bob} 41 ${32 + bob} Z" fill="#090b22"/>
  <circle cx="44" cy="${29 + bob}" r="2.2" fill="#80eaff" filter="url(#glow)"/>
  <circle cx="52" cy="${29 + bob}" r="2.2" fill="#a68cff" filter="url(#glow)"/>
  <path d="M35 ${49 + bob} L24 ${60 + bob}" stroke="#252c73" stroke-width="7" stroke-linecap="round"/>
  <path d="M60 ${48 + bob} L${armX} ${armY}" stroke="#252c73" stroke-width="7" stroke-linecap="round"/>
  <path d="M38 76 L35 92" stroke="#161b4c" stroke-width="7" stroke-linecap="round"/>
  <path d="M58 76 L61 92" stroke="#161b4c" stroke-width="7" stroke-linecap="round"/>
  ${rune(armX + 7, armY - 3, power)}
  ${attack ? `<path d="M72 40 C82 40, 89 44, 94 50" fill="none" stroke="#8ffcff" stroke-width="4" stroke-linecap="round" opacity="0.68"/>` : ''}
  `;
}

function projectile() {
  return `
  <circle cx="24" cy="24" r="18" fill="#5b4dff" opacity="0.18" filter="url(#glow)"/>
  <circle cx="24" cy="24" r="13" fill="none" stroke="#97f4ff" stroke-width="2.4"/>
  <path d="M24 8 L38 24 L24 40 L10 24 Z" fill="#6258ff" stroke="#c6ffff" stroke-width="2"/>
  <path d="M24 13 L31 24 L24 35 L17 24 Z" fill="#ffffff" opacity="0.72"/>
  <circle cx="24" cy="24" r="3.5" fill="#94f2ff"/>
  `;
}

mkdirSync(outDir, { recursive: true });

(['idle_1', 'idle_2', 'cast_1', 'cast_2', 'attack'] as const).forEach((frame) => {
  writeFileSync(join(outDir, `rune_archer_${frame}.svg`), svg(96, 104, archer(frame)), 'utf8');
});
writeFileSync(join(outDir, 'rune_projectile.svg'), svg(48, 48, projectile()), 'utf8');

console.log(`Generated 6 rune archer SVG assets in ${outDir}`);
