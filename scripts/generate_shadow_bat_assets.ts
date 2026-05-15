import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type BatFrame = 'idle_1' | 'idle_2' | 'fly_1' | 'fly_2' | 'attack';

const outDir = join(process.cwd(), 'public', 'assets', 'generated', 'monsters', 'shadow_bat');

function svg(content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="80" viewBox="0 0 96 80">
  <defs>
    <filter id="eyeGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="body" cx="50%" cy="42%" r="55%">
      <stop offset="0" stop-color="#5a3978"/>
      <stop offset="0.58" stop-color="#261834"/>
      <stop offset="1" stop-color="#0a0710"/>
    </radialGradient>
  </defs>
  <rect width="96" height="80" fill="none"/>
  ${content}
</svg>`;
}

function bat(frame: BatFrame) {
  const second = frame.endsWith('2');
  const attack = frame === 'attack';
  const fly = frame.startsWith('fly');
  const bob = frame === 'idle_2' ? 2 : frame === 'idle_1' ? -1 : 0;
  const wingLift = attack ? 15 : fly ? second ? -9 : 10 : second ? 2 : -2;
  const bodyY = attack ? 38 : 36 + bob;
  const mouth = attack ? `<path d="M45 ${bodyY + 9} L48 ${bodyY + 17} L51 ${bodyY + 9}" fill="#d8cfff" opacity="0.88"/>` : '';
  const attackTrail = attack ? `<path d="M54 25 C68 26, 78 35, 84 47" fill="none" stroke="#c45cff" stroke-width="5" stroke-linecap="round" opacity="0.5"/>` : '';
  return `
  <ellipse cx="48" cy="62" rx="25" ry="7" fill="#030208" opacity="0.45"/>
  <path d="M45 ${bodyY - 10}
           C31 ${bodyY - 22}, 20 ${bodyY - wingLift}, 7 ${bodyY - 18}
           C19 ${bodyY - 1}, 28 ${bodyY + 7}, 43 ${bodyY + 2}Z"
        fill="#1b1028" stroke="#6d3e9a" stroke-width="2.3"/>
  <path d="M51 ${bodyY - 10}
           C65 ${bodyY - 22}, 76 ${bodyY - wingLift}, 89 ${bodyY - 18}
           C77 ${bodyY - 1}, 68 ${bodyY + 7}, 53 ${bodyY + 2}Z"
        fill="#1b1028" stroke="#6d3e9a" stroke-width="2.3"/>
  <path d="M20 ${bodyY - wingLift + 3} L32 ${bodyY - 1} L38 ${bodyY + 1}" fill="none" stroke="#39204f" stroke-width="3" opacity="0.9"/>
  <path d="M76 ${bodyY - wingLift + 3} L64 ${bodyY - 1} L58 ${bodyY + 1}" fill="none" stroke="#39204f" stroke-width="3" opacity="0.9"/>
  <ellipse cx="48" cy="${bodyY}" rx="${attack ? 15 : 13}" ry="${attack ? 16 : 14}" fill="url(#body)" stroke="#8b54c8" stroke-width="2.5"/>
  <path d="M37 ${bodyY - 13} L31 ${bodyY - 24} L43 ${bodyY - 17} Z" fill="#21122f" stroke="#6d3e9a" stroke-width="1.8"/>
  <path d="M59 ${bodyY - 13} L65 ${bodyY - 24} L53 ${bodyY - 17} Z" fill="#21122f" stroke="#6d3e9a" stroke-width="1.8"/>
  <circle cx="43" cy="${bodyY - 2}" r="3" fill="#2a0715"/>
  <circle cx="53" cy="${bodyY - 2}" r="3" fill="#2a0715"/>
  <circle cx="43" cy="${bodyY - 2}" r="1.8" fill="#ff4f8d" filter="url(#eyeGlow)"/>
  <circle cx="53" cy="${bodyY - 2}" r="1.8" fill="#bd61ff" filter="url(#eyeGlow)"/>
  ${mouth}
  ${attackTrail}
  `;
}

mkdirSync(outDir, { recursive: true });

(['idle_1', 'idle_2', 'fly_1', 'fly_2', 'attack'] as BatFrame[]).forEach((frame) => {
  writeFileSync(join(outDir, `bat_${frame}.svg`), svg(bat(frame)), 'utf8');
});

console.log(`Generated 5 shadow bat SVG assets in ${outDir}`);
