import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type SlimeFrame = 'idle_1' | 'idle_2' | 'move_1' | 'move_2';

const outDir = join(process.cwd(), 'public', 'assets', 'generated', 'monsters', 'crystal_slime');

function svg(content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <defs>
    <radialGradient id="body" cx="45%" cy="35%" r="62%">
      <stop offset="0" stop-color="#b7fff5" stop-opacity="0.92"/>
      <stop offset="0.45" stop-color="#42e5cf" stop-opacity="0.78"/>
      <stop offset="1" stop-color="#137b8a" stop-opacity="0.92"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="96" height="96" fill="none"/>
  ${content}
</svg>`;
}

function body(frame: SlimeFrame) {
  const isMove = frame.startsWith('move');
  const alt = frame.endsWith('2');
  const squish = isMove ? alt ? { x: 2, y: 4, cy: 51 } : { x: -2, y: -2, cy: 47 } : alt ? { x: 1, y: 2, cy: 50 } : { x: 0, y: 0, cy: 49 };
  const eyeY = squish.cy - 5;
  const coreY = squish.cy + 4;
  const leftShard = alt ? 30 : 33;
  const rightShard = alt ? 66 : 63;
  return `
  <ellipse cx="48" cy="76" rx="${28 + squish.x}" ry="8" fill="#041018" opacity="0.42"/>
  <path d="M18 ${54 + squish.y}
           C18 34, 34 22, 48 22
           C66 22, 80 36, 79 ${55 + squish.y}
           C78 73, 63 81, 48 81
           C31 81, 18 72, 18 ${54 + squish.y}Z"
        fill="url(#body)" stroke="#a9fff5" stroke-width="3" opacity="0.93"/>
  <path d="M28 ${43 + squish.y} C36 30, 52 28, 64 ${40 + squish.y}" fill="none" stroke="#e8fffb" stroke-width="4" opacity="0.22"/>
  <path d="M${leftShard} ${coreY - 4} L48 ${coreY - 18} L${rightShard} ${coreY - 4} L56 ${coreY + 15} L40 ${coreY + 15} Z"
        fill="#38f3df" stroke="#dcffff" stroke-width="2.4" filter="url(#glow)"/>
  <path d="M48 ${coreY - 16} L53 ${coreY - 3} L48 ${coreY + 13} L43 ${coreY - 3} Z" fill="#ffffff" opacity="0.72"/>
  <circle cx="38" cy="${eyeY}" r="3.2" fill="#072635"/>
  <circle cx="59" cy="${eyeY}" r="3.2" fill="#072635"/>
  <path d="M39 ${eyeY + 11} Q48 ${eyeY + (alt ? 16 : 14)} 58 ${eyeY + 10}" fill="none" stroke="#083047" stroke-width="3" stroke-linecap="round" opacity="0.72"/>
  <path d="M20 ${61 + squish.y} C12 ${59 + squish.y}, 11 ${68 + squish.y}, 25 ${70 + squish.y}" fill="#3de7d4" opacity="0.36"/>
  <path d="M76 ${61 + squish.y} C84 ${60 + squish.y}, 85 ${68 + squish.y}, 71 ${71 + squish.y}" fill="#3de7d4" opacity="0.36"/>
  `;
}

mkdirSync(outDir, { recursive: true });
(['idle_1', 'idle_2', 'move_1', 'move_2'] as SlimeFrame[]).forEach((frame) => {
  writeFileSync(join(outDir, `slime_${frame}.svg`), svg(body(frame)), 'utf8');
});

console.log(`Generated 4 crystal slime SVG assets in ${outDir}`);
