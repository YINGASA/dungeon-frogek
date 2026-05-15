import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type GuardianFrame =
  | 'idle_1'
  | 'idle_2'
  | 'walk_1'
  | 'walk_2'
  | 'melee'
  | 'shoot'
  | 'phase2_idle_1'
  | 'phase2_idle_2'
  | 'phase2_melee'
  | 'phase2_shoot';

const outDir = join(process.cwd(), 'public', 'assets', 'generated', 'boss', 'crystal_guardian');

function svg(width: number, height: number, content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#39445a"/>
      <stop offset="0.55" stop-color="#202633"/>
      <stop offset="1" stop-color="#0b0f18"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#84785f"/>
      <stop offset="1" stop-color="#342f28"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="none"/>
  ${content}
</svg>`;
}

function core(cx: number, cy: number, phase2: boolean, pulse: number) {
  const main = phase2 ? '#ff4fa3' : '#37e9ff';
  const edge = phase2 ? '#ffd0ec' : '#d8ffff';
  return `
  <circle cx="${cx}" cy="${cy}" r="${18 + pulse}" fill="${main}" opacity="0.24" filter="url(#glow)"/>
  <path d="M${cx} ${cy - 21} L${cx + 19} ${cy} L${cx} ${cy + 22} L${cx - 19} ${cy} Z" fill="${main}" stroke="${edge}" stroke-width="3" filter="url(#glow)"/>
  <path d="M${cx} ${cy - 15} L${cx + 9} ${cy} L${cx} ${cy + 15} L${cx - 9} ${cy} Z" fill="#ffffff" opacity="0.62"/>`;
}

function guardian(frame: GuardianFrame) {
  const phase2 = frame.startsWith('phase2');
  const baseFrame = frame.replace('phase2_', '') as Exclude<GuardianFrame, 'phase2_idle_1' | 'phase2_idle_2' | 'phase2_melee' | 'phase2_shoot'>;
  const second = frame.endsWith('2');
  const melee = baseFrame === 'melee';
  const shoot = baseFrame === 'shoot';
  const walk = baseFrame.startsWith('walk');
  const pulse = second || shoot ? 3 : 0;
  const armLift = melee ? -30 : walk ? second ? -8 : 6 : 0;
  const leftArm = melee ? 31 : 23;
  const rightArm = melee ? 98 : 105;
  const glow = phase2 ? '#ff4fa3' : '#37e9ff';
  return `
  <ellipse cx="64" cy="120" rx="45" ry="12" fill="#03050b" opacity="0.5"/>
  <path d="M38 34 L64 16 L91 35 L85 61 L43 61 Z" fill="url(#stone)" stroke="#8a95aa" stroke-width="3"/>
  <path d="M49 30 L64 22 L80 30 L76 47 L52 47 Z" fill="#111827" stroke="${glow}" stroke-width="2" opacity="0.82"/>
  <circle cx="64" cy="37" r="6" fill="${glow}" filter="url(#glow)"/>
  <path d="M37 58 L91 58 L101 101 Q64 123 27 101 Z" fill="url(#stone)" stroke="#8a95aa" stroke-width="3"/>
  <path d="M44 68 L84 68 L78 105 Q64 113 50 105 Z" fill="url(#metal)" stroke="#a99b77" stroke-width="2.4" opacity="0.9"/>
  ${core(64, 85, phase2, pulse)}
  <path d="M39 63 L${leftArm} ${78 + armLift} L${melee ? 18 : 23} ${98 + armLift}" stroke="#2b3345" stroke-width="18" stroke-linecap="round"/>
  <path d="M89 63 L${rightArm} ${78 + (shoot ? -10 : -armLift)} L${shoot ? 119 : melee ? 111 : 105} ${shoot ? 74 : 99 - armLift}" stroke="#2b3345" stroke-width="18" stroke-linecap="round"/>
  <path d="M41 105 L35 133" stroke="#252d3e" stroke-width="18" stroke-linecap="round"/>
  <path d="M87 105 L93 133" stroke="#252d3e" stroke-width="18" stroke-linecap="round"/>
  <path d="M24 24 L34 45 L18 43 Z" fill="${glow}" opacity="0.78" filter="url(#glow)"/>
  <path d="M104 24 L94 45 L110 43 Z" fill="${glow}" opacity="0.78" filter="url(#glow)"/>
  ${melee ? `<path d="M18 74 C38 84, 50 101, 55 119" fill="none" stroke="${phase2 ? '#ff9acb' : '#8ffcff'}" stroke-width="7" stroke-linecap="round" opacity="0.65"/>` : ''}
  ${shoot ? `<path d="M86 84 C102 82, 116 84, 126 91" fill="none" stroke="${phase2 ? '#ff9acb' : '#8ffcff'}" stroke-width="6" stroke-linecap="round" opacity="0.72"/>` : ''}
  `;
}

function crystalProjectile() {
  return `
  <circle cx="28" cy="28" r="20" fill="#6d58ff" opacity="0.16" filter="url(#glow)"/>
  <path d="M28 5 L47 28 L28 51 L9 28 Z" fill="#4f8cff" stroke="#e1ffff" stroke-width="3"/>
  <path d="M28 11 L36 28 L28 45 L20 28 Z" fill="#ffffff" opacity="0.65"/>`;
}

function crystalSpike() {
  return `
  <ellipse cx="32" cy="58" rx="22" ry="6" fill="#040610" opacity="0.5"/>
  <path d="M32 7 L54 58 L10 58 Z" fill="#5d5bff" stroke="#dbe2ff" stroke-width="3"/>
  <path d="M32 14 L41 58 L24 58 Z" fill="#ff5fae" opacity="0.72"/>
  <path d="M18 28 L6 58 L25 58 Z" fill="#302269" stroke="#9c7dff" stroke-width="2"/>
  <path d="M46 28 L58 58 L39 58 Z" fill="#302269" stroke="#9c7dff" stroke-width="2"/>`;
}

mkdirSync(outDir, { recursive: true });

([
  'idle_1',
  'idle_2',
  'walk_1',
  'walk_2',
  'melee',
  'shoot',
  'phase2_idle_1',
  'phase2_idle_2',
  'phase2_melee',
  'phase2_shoot'
] as GuardianFrame[]).forEach((frame) => {
  writeFileSync(join(outDir, `guardian_${frame}.svg`), svg(128, 144, guardian(frame)), 'utf8');
});
writeFileSync(join(outDir, 'crystal_projectile.svg'), svg(56, 56, crystalProjectile()), 'utf8');
writeFileSync(join(outDir, 'crystal_spike.svg'), svg(64, 64, crystalSpike()), 'utf8');

console.log(`Generated 12 crystal guardian SVG assets in ${outDir}`);
