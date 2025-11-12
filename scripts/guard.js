/* eslint-disable @typescript-eslint/no-require-imports */
/* Fail the commit if junk files or heredoc markers slipped in */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.cwd(), 'src');
const BAD_PATTERNS = [
  /TSX~\b/i, // editor backup markers seen in your errors
  /^\s*TSX\s*$/m, // raw heredoc terminator left in code
  /^\s*cat\s+>\s+/m, // pasted shell redirections into source
  /<</, // stray heredoc operator
  /~$/, // any file ending with ~
];

let badFiles = [];
function scan(p) {
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const f of fs.readdirSync(p)) scan(path.join(p, f));
  } else {
    const rel = path.relative(process.cwd(), p);
    if (rel.endsWith('~')) {
      badFiles.push(rel);
      return;
    }
    const text = fs.readFileSync(p, 'utf8');
    if (BAD_PATTERNS.some((rx) => rx.test(text))) badFiles.push(rel);
  }
}
if (fs.existsSync(ROOT)) scan(ROOT);

if (badFiles.length) {
  console.error('\n✖ Blocked commit: remove junk from these files:\n');
  for (const f of badFiles) console.error('  -', f);
  console.error(
    '\nTip: open the file and delete lines like "TSX" / "TSX~" or any shell lines.\n',
  );
  process.exit(1);
} else {
  process.exit(0);
}
