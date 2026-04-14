const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const TEMP_FIXTURES = [
  'generate_events.js',
  'tithis_2024_2030_basic.json',
  'eclipses_2024_2030.json',
];

function makeTempWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'projectnexon-generate-'));

  TEMP_FIXTURES.forEach((file) => {
    fs.copyFileSync(path.join(REPO_ROOT, file), path.join(workspace, file));
  });

  return workspace;
}

test('generate_events.js reproduces checked-in events.json', () => {
  const workspace = makeTempWorkspace();
  const expectedEvents = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'events.json'), 'utf8'));

  try {
    execFileSync(process.execPath, ['generate_events.js'], {
      cwd: workspace,
      stdio: 'pipe',
    });

    const generatedEvents = JSON.parse(fs.readFileSync(path.join(workspace, 'events.json'), 'utf8'));
    assert.deepStrictEqual(generatedEvents, expectedEvents);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
