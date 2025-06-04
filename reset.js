const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

let resetRecipe = fs.readFileSync(path.join(dataDir, 'RESET_RECIPE.json'));
fs.writeFileSync(path.join(dataDir, 'recipes.json'), resetRecipe);

fs.writeFileSync(path.join(dataDir, 'failed_recipes.json'), '[]');

if (process.argv.length > 2)
    fs.appendFileSync(path.join(__dirname, 'main.log'), 'Reason: ' + process.argv.slice(2).join(' ') + '\n');
