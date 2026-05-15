import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = path.resolve('public/assets/generated/dungeon');

const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">${body}</svg>`;

const glow = `<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;

const assets: Record<string, string> = {
  'floor.svg': svg(`
    <rect width="64" height="64" fill="#0d1728"/>
    <rect x="1" y="1" width="30" height="30" fill="#121f33" stroke="#21354f"/>
    <rect x="32" y="1" width="31" height="30" fill="#0f1b2c" stroke="#21354f"/>
    <rect x="1" y="32" width="30" height="31" fill="#101c2e" stroke="#21354f"/>
    <rect x="32" y="32" width="31" height="31" fill="#142238" stroke="#21354f"/>
    <path d="M8 20h12M42 14h9M15 47h10M44 50h12" stroke="#2f4765" stroke-width="2" opacity=".6"/>
  `),
  'wall.svg': svg(`
    <rect width="64" height="64" rx="8" fill="#26314b"/>
    <rect x="5" y="5" width="54" height="54" rx="7" fill="#303c59" stroke="#5a6f98" stroke-width="3"/>
    <path d="M8 22h48M8 42h48M22 8v16M42 24v18M28 42v14" stroke="#1d263a" stroke-width="3"/>
    <path d="M10 11h18M36 53h16" stroke="#7f95bd" stroke-width="2" opacity=".45"/>
  `),
  'door_closed.svg': svg(`
    <rect width="64" height="64" rx="8" fill="#16243a"/>
    <rect x="12" y="6" width="40" height="52" rx="5" fill="#25364f" stroke="#60799f" stroke-width="3"/>
    <path d="M20 14h24M20 50h24" stroke="#162235" stroke-width="4"/>
    <circle cx="44" cy="32" r="4" fill="#7d8da8"/>
  `),
  'door_open.svg': svg(`
    ${glow}
    <rect width="64" height="64" rx="8" fill="#10243a"/>
    <ellipse cx="32" cy="32" rx="22" ry="29" fill="#28f1d0" opacity=".24" filter="url(#glow)"/>
    <path d="M18 8h28v48H18z" fill="#19314b" stroke="#76fff0" stroke-width="3"/>
    <path d="M26 12c18 8 18 32 0 40" fill="none" stroke="#9ffff5" stroke-width="4"/>
  `),
  'crystal_01.svg': svg(`
    ${glow}
    <rect width="64" height="64" fill="none"/>
    <path d="M32 4 12 54h40z" fill="#36f0df" stroke="#caffff" stroke-width="3" filter="url(#glow)"/>
    <path d="M32 4v50M22 54l10-50 10 50" stroke="#0a7f95" stroke-width="2" opacity=".55"/>
  `),
  'crystal_02.svg': svg(`
    ${glow}
    <rect width="64" height="64" fill="none"/>
    <path d="M28 7 9 50l25 8 21-31z" fill="#4aa8ff" stroke="#d8ffff" stroke-width="3" filter="url(#glow)"/>
    <path d="M28 7 34 58M9 50l46-23" stroke="#145b85" stroke-width="2" opacity=".5"/>
  `),
  'chest_closed.svg': svg(`
    <rect width="64" height="64" fill="none"/>
    <rect x="9" y="25" width="46" height="27" rx="4" fill="#8b521e" stroke="#e8bf72" stroke-width="3"/>
    <path d="M12 25c4-14 36-14 40 0" fill="#b36a24" stroke="#f3d18b" stroke-width="3"/>
    <rect x="27" y="29" width="10" height="12" rx="2" fill="#39e7e0" stroke="#eaffff" stroke-width="2"/>
    <path d="M12 38h40" stroke="#44200c" stroke-width="3"/>
  `),
  'chest_open.svg': svg(`
    ${glow}
    <rect width="64" height="64" fill="none"/>
    <path d="M13 24c6-18 34-18 40 0l-7 8H20z" fill="#b36a24" stroke="#f3d18b" stroke-width="3"/>
    <rect x="9" y="33" width="46" height="20" rx="4" fill="#8b521e" stroke="#e8bf72" stroke-width="3"/>
    <circle cx="32" cy="29" r="10" fill="#39e7e0" opacity=".35" filter="url(#glow)"/>
  `),
  'potion_hp.svg': svg(`
    <rect width="64" height="64" fill="none"/>
    <rect x="26" y="8" width="12" height="12" rx="2" fill="#dbe8ff"/>
    <path d="M22 20h20l9 26c2 7-3 12-10 12H23c-7 0-12-5-10-12z" fill="#ff456f" stroke="#ffdbe4" stroke-width="3"/>
    <path d="M22 39h20M32 30v18M23 39h18" stroke="#fff" stroke-width="4" opacity=".75"/>
  `),
  'attack_crystal.svg': svg(`
    ${glow}
    <rect width="64" height="64" fill="none"/>
    <path d="M32 4 12 32l20 28 20-28z" fill="#ff6538" stroke="#ffe0b2" stroke-width="3" filter="url(#glow)"/>
    <path d="M32 4v56M12 32h40" stroke="#8f2010" stroke-width="3" opacity=".45"/>
  `),
  'defense_charm.svg': svg(`
    ${glow}
    <rect width="64" height="64" fill="none"/>
    <path d="M32 7 52 16v17c0 13-8 22-20 27-12-5-20-14-20-27V16z" fill="#2b8cff" stroke="#d9ffff" stroke-width="3" filter="url(#glow)"/>
    <path d="M24 34h16M32 24v22" stroke="#eaffff" stroke-width="5" stroke-linecap="round"/>
  `)
};

await fs.mkdir(outDir, { recursive: true });
await Promise.all(Object.entries(assets).map(([file, content]) => fs.writeFile(path.join(outDir, file), content, 'utf8')));
console.log(`Generated ${Object.keys(assets).length} dungeon SVG assets in ${outDir}`);
