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

test('eclipse dates are converted to IST and include UTC/IST greatest times', () => {
  const events = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'events.json'), 'utf8'));
  const shifted = events.find((event) => event.eclipse_utc === '2027-02-20T23:14:06.000Z');

  assert.ok(shifted, 'expected the 20 Feb 2027 UTC penumbral eclipse');
  assert.equal(shifted.date, '2027-02-21');
  assert.equal(shifted.eclipse_ist, '2027-02-21T04:44:06+05:30');
  assert.match(
    shifted.description_short,
    /Greatest eclipse 21 Feb 2027, 04:44 IST \(20 Feb 2027, 23:14 UTC\)/,
  );
});
