const inquirer = require('inquirer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const configPath = path.join(__dirname, 'config.json');

function loadConfig() {
  const defaults = { delay: 300, saveInterval: 10 };
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(configPath)) };
  } catch {
    return defaults;
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}

function runCmd(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true });
    p.on('close', code => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
}

async function main() {
  while (true) {
    const { action } = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'Choose an action',
      choices: [
        { name: 'Run bot', value: 'bot' },
        { name: 'Reset data', value: 'reset' },
        { name: 'Visualize graph', value: 'visualize' },
        { name: 'Configure settings', value: 'config' },
        { name: 'Exit', value: 'exit' },
      ],
    });

    if (action === 'exit') break;
    if (action === 'visualize') {
      await runCmd('node', [path.join(__dirname, 'visualize.js')]);
    } else if (action === 'reset') {
      await runCmd('node', [path.join(__dirname, 'reset.js')]);
    } else if (action === 'bot') {
      await runCmd('node', [path.join(__dirname, 'main.js')]);
    } else if (action === 'config') {
      let cfg = loadConfig();
      const answers = await inquirer.prompt([
        { type: 'number', name: 'delay', message: 'Delay between API calls (ms)', default: cfg.delay },
        { type: 'number', name: 'saveInterval', message: 'Save interval (new items)', default: cfg.saveInterval }
      ]);
      cfg = { ...cfg, ...answers };
      saveConfig(cfg);
      console.log('Configuration saved');
    }
  }
}

main();
