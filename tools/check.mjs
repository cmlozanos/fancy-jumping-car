import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const sw=readFileSync('sw.js','utf8');
for(const [,file] of sw.slice(sw.indexOf('const ASSETS'),sw.indexOf('];')).matchAll(/'([^']+)'/g))assert.ok(existsSync(file.split('?')[0]),file);
assert.match(sw,/startsWith\('fancy-jumping-car-'\)/);
assert.ok(!readFileSync('index.html','utf8').includes('unpkg.com'));
console.log('Super Kart: local assets and cache isolation verified');
