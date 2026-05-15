import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type SkeletonFrame = 'idle_1' | 'idle_2' | 'walk_1' | 'walk_2' | 'attack';

const outDir = join(process.cwd(), 'public', 'assets', 'generated', 'monsters', 'skeleton_guard');

function svg(content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="112" viewBox="0 0 96 112">
  <defs>
    <filter id="eyeGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="armor" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8590a4"/>
      <stop offset="0.48" stop-color="#3b4350"/>
      <stop offset="1" stop-color="#171d28"/>
    </linearGradient>
  </defs>
  <rect width="96" height="112" fill="none"/>
  ${content}
</svg>`;
}

function sword(x1: number, y1: number, x2: number, y2: number, attack = false) {
  const w = attack ? 6 : 5;
  return `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#cfd6df" stroke-width="${w}" stroke-linecap="round"/>
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
  <rect x="${x1 - 5}" y="${y1 - 2}" width="10" height="4" rx="2" fill="#815f3a"/>`;
}

function bones(frame: SkeletonFrame) {
  const idle = frame.startsWith('idle');
  const walk = frame.startsWith('walk');
  const second = frame.endsWith('2');
  const bob = idle ? second ? 1 : -1 : walk ? second ? 2 : -2 : 0;
  const step = walk ? second ? 6 : -6 : 0;
  const attack = frame === 'attack';
  const headX = attack ? 52 : 48;
  const blade = attack
    ? sword(65, 51, 88, 36, true)
    : sword(65, 58 + bob, 75, 82 + bob);
  const slash = attack ? `<path d="M63 31 Q82 42 88 61" fill="none" stroke="#dbe7ff" stroke-width="5" stroke-linecap="round" opacity="0.72"/>` : '';
  return `
  <ellipse cx="48" cy="95" rx="23" ry="8" fill="#050810" opacity="0.45"/>
  <path d="M34 ${42 + bob} L62 ${42 + bob} L66 ${70 + bob} Q48 ${80 + bob} 30 ${70 + bob} Z" fill="url(#armor)" stroke="#9ba5b6" stroke-width="2.4"/>
  <rect x="38" y="${37 + bob}" width="20" height="9" rx="4" fill="#d7d2c6" stroke="#7a746a" stroke-width="2"/>
  <circle cx="${headX}" cy="${27 + bob}" r="15" fill="#d9d5c8" stroke="#7b776d" stroke-width="2.5"/>
  <path d="M${headX - 11} ${24 + bob} Q${headX} ${16 + bob} ${headX + 11} ${24 + bob} L${headX + 9} ${37 + bob} Q${headX} ${43 + bob} ${headX - 9} ${37 + bob} Z" fill="#ece8da" opacity="0.78"/>
  <circle cx="${headX - 5}" cy="${27 + bob}" r="3.4" fill="#16293b"/>
  <circle cx="${headX + 5}" cy="${27 + bob}" r="3.4" fill="#16293b"/>
  <circle cx="${headX - 5}" cy="${27 + bob}" r="2" fill="#66d7ff" filter="url(#eyeGlow)"/>
  <circle cx="${headX + 5}" cy="${27 + bob}" r="2" fill="#66d7ff" filter="url(#eyeGlow)"/>
  <path d="M${headX - 4} ${35 + bob} L${headX + 4} ${35 + bob}" stroke="#5d574f" stroke-width="2" stroke-linecap="round"/>
  <path d="M34 ${48 + bob} L23 ${58 + bob}" stroke="#d7d2c6" stroke-width="7" stroke-linecap="round"/>
  <path d="M62 ${48 + bob} L${attack ? 67 : 72} ${attack ? 52 : 60 + bob}" stroke="#d7d2c6" stroke-width="7" stroke-linecap="round"/>
  <path d="M35 ${73 + bob} L${33 + step} 94" stroke="#d7d2c6" stroke-width="7" stroke-linecap="round"/>
  <path d="M60 ${73 + bob} L${63 - step} 94" stroke="#d7d2c6" stroke-width="7" stroke-linecap="round"/>
  <path d="M29 ${43 + bob} L39 ${55 + bob} L31 ${62 + bob}" fill="#4a5364" stroke="#9ba5b6" stroke-width="2"/>
  <path d="M67 ${43 + bob} L57 ${55 + bob} L65 ${62 + bob}" fill="#4a5364" stroke="#9ba5b6" stroke-width="2"/>
  ${blade}
  ${slash}
  `;
}

mkdirSync(outDir, { recursive: true });

(['idle_1', 'idle_2', 'walk_1', 'walk_2', 'attack'] as SkeletonFrame[]).forEach((frame) => {
  writeFileSync(join(outDir, `skeleton_${frame}.svg`), svg(bones(frame)), 'utf8');
});

console.log(`Generated 5 skeleton guard SVG assets in ${outDir}`);
