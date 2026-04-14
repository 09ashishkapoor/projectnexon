const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const validationDir = path.join(repoRoot, 'test', 'validation');

const filesToCheck = [
  'app.js',
  'generate_events.js',
  'playwright.config.js',
  'test/app.test.js',
  'test/generate_events.test.js',
];

if (fs.existsSync(validationDir)) {
  filesToCheck.push(
    ...fs.readdirSync(validationDir)
      .filter((file) => file.endsWith('.js'))
      .sort()
      .map((file) => path.join('test', 'validation', file))
  );
}

filesToCheck.forEach((file) => {
  execFileSync(process.execPath, ['--check', file], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
});

console.log(`Syntax check passed for ${filesToCheck.length} JavaScript files.`);
