const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('assets/js/database.js', 'utf8') + '\nthis.allRecettes = allRecettes;', ctx);

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name).split(path.sep).join('/')]);

const disk = new Set(walk('images'));
const used = new Set(ctx.allRecettes.map(r => r.image));

console.log('Référencées dans database.js mais absentes (casse exacte) :');
[...used].filter(f => !disk.has(f)).forEach(f => console.log('  ', f));
console.log('Sur le disque mais jamais utilisées :');
[...disk].filter(f => !used.has(f)).forEach(f => console.log('  ', f));