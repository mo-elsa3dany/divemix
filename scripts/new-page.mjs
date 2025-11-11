import fs from 'fs';
import path from 'path';
const name = process.argv[2];
if (!name) {
  console.error('Usage: npm run new:page <route-name>');
  process.exit(1);
}
const dir = path.join('src', 'app', name);
const file = path.join(dir, 'page.tsx');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  file,
  `export default function Page(){\n  return (\n    <main className="mx-auto max-w-3xl p-8 space-y-3">\n      <h1 className="text-2xl font-semibold">${name.replace(/[-_]/g, ' ')}</h1>\n      <p>New page.</p>\n    </main>\n  );\n}\n`,
);
console.log('Created', file);
