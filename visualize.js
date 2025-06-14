const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const recipes = JSON.parse(fs.readFileSync(path.join(dataDir, 'recipes.json')));

let lines = ['digraph recipes {'];
for (const item of recipes) {
  for (const r of item.recipes || []) {
    lines.push(`  "${r[0]}" -> "${item.product}" [label="+ ${r[1]}"];`);
    lines.push(`  "${r[1]}" -> "${item.product}" [label="+ ${r[0]}"];`);
  }
}
lines.push('}');

console.log(lines.join('\n'));
