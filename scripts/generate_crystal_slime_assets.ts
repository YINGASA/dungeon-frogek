import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type SlimeFrame = 'idle_1' | 'idle_2' | 'move_1' | 'move_2';

const outDir = join(process.cwd(), 'public', 'assets', 'generated', 'monsters', 'crystal_slime');

function svg(content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <defs>
    <radialGradient id="body" cx="45%" cy="35%" r="62%">
      <stop offset="0" stop-color="#c6fff7" stop-opacity="0.94"/>
      <stop offset="0.45" stop-color="#43e7d1" stop-opacity="0.76"/>
      <stop offset="1" stop-color="#126d82" stop-opacity="0.9"/>
    </radialGradient>
    <filter id="coreGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="96" height="96" fill="none"/>
  ${content}
</svg>`;
}

function body(frame: SlimeFrame) {
  const moving = frame.startsWith('move');
  const second = frame.endsWith('2');
  const shape = moving
    ? second ? { rx: 33, top: 29, bottom: 78, core: 55, shadow: 31 } : { rx: 28, top: 19, bottom: 74, core: 48, shadow: 25 }
    : second ? { rx: 30, top: 24, bottom: 78, core: 52, shadow: 28 } : { rx: 29, top: 22, bottom: 76, core: 50, shadow: 27 };
  const faceY = shape.core - 11;
  const left = second ? 29 : 32;
  const right = second ? 67 : 64;
  return `
  <ellipse cx="48" cy="78" rx="${shape.shadow}" ry="8" fill="#031017" opacity="0.46"/>
  <path d="M${48 - shape.rx} ${53}
           C${48 - shape.rx} ${33}, ${33} ${shape.top}, 48 ${shape.top}
           C64 ${shape.top}, ${48 + shape.rx} 34, ${48 + shape.rx} 54
           C${48 + shape.rx - 1} 72, 64 ${shape.bottom}, 48 ${shape.bottom}
           C31 ${shape.bottom}, ${48 - shape.rx} 72, ${48 - shape.rx} 53Z"
        fill="url(#body)" stroke="#b7fff7" stroke-width="3" opacity="0.94"/>
  <path d="M27 ${44 + (second ? 2 : 0)} C36 30, 53 28, 66 ${41 + (second ? 1 : 0)}" fill="none" stroke="#f0fffb" stroke-width="4" opacity="0.24"/>
  <path d="M${left} ${shape.core - 5} L48 ${shape.core - 21} L${right} ${shape.core - 5} L57 ${shape.core + 16} L39 ${shape.core + 16} Z"
        fill="#31f4de" stroke="#e4ffff" stroke-width="2.5" filter="url(#coreGlow)"/>
  <path d="M48 ${shape.core - 18} L54 ${shape.core - 3} L48 ${shape.core + 13} L42 ${shape.core - 3} Z" fill="#ffffff" opacity="0.78"/>
  <circle cx="38" cy="${faceY}" r="3.2" fill="#062939"/>
  <circle cx="59" cy="${faceY}" r="3.2" fill="#062939"/>
  <path d="M38 ${faceY + 12} Q48 ${faceY + (second ? 17 : 14)} 59 ${faceY + 11}" fill="none" stroke="#062e42" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
  <path d="M22 ${61 + (second ? 1 : 0)} C12 60, 12 70, 26 71" fill="#5bf6e5" opacity="0.32"/>
  <path d="M74 ${61 + (second ? 1 : 0)} C84 60, 84 70, 70 71" fill="#5bf6e5" opacity="0.32"/>
  `;
}

mkdirSync(outDir, { recursive: true });

(['idle_1', 'idle_2', 'move_1', 'move_2'] as SlimeFrame[]).forEach((frame) => {
  writeFileSync(join(outDir, `slime_${frame}.svg`), svg(body(frame)), 'utf8');
});

console.log(`Generated 4 crystal slime SVG assets in ${outDir}`);
