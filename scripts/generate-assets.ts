import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = path.resolve('public/assets/generated');
const names = ['floor', 'wall', 'door', 'trap', 'chest', 'shop', 'portal', 'boss-floor', 'knight', 'mage', 'ranger', 'goblin', 'skeleton-archer', 'slime', 'cultist', 'data-demon-boss', 'slash', 'fireball', 'frost-nova', 'arrow', 'explosion', 'sword', 'armor', 'potion', 'gold', 'relic'];
const colors = ['#172033', '#3ee7c9', '#ffb84d', '#ff4f8b', '#7c8cff', '#7df06d'];

const makeSvg = (name: string, index: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
<rect width="96" height="96" rx="8" fill="#08111f"/>
<rect x="12" y="12" width="72" height="72" rx="6" fill="${colors[index % colors.length]}" stroke="${colors[(index + 2) % colors.length]}" stroke-width="4"/>
<path d="M20 58 L36 32 L48 54 L62 26 L78 60" fill="none" stroke="#f4fbff" stroke-width="5" stroke-linejoin="round"/>
<text x="48" y="89" text-anchor="middle" font-family="monospace" font-size="8" fill="#dff7ff">${name}</text>
</svg>`;

await fs.mkdir(outDir, { recursive: true });
await Promise.all(names.map((name, index) => fs.writeFile(path.join(outDir, `${name}.svg`), makeSvg(name, index))));
console.log(`Generated ${names.length} SVG assets in ${outDir}`);
