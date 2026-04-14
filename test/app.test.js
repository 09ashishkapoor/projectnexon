const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const REPO_ROOT = path.resolve(__dirname, '..');
const APP_JS = fs.readFileSync(path.join(REPO_ROOT, 'app.js'), 'utf8');
const EVENTS = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'events.json'), 'utf8'));

class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  add(...tokens) {
    const set = new Set(this._tokens());
    tokens.forEach((token) => set.add(token));
    this.element.className = [...set].join(' ');
  }

  remove(...tokens) {
    const removeSet = new Set(tokens);
    this.element.className = this._tokens().filter((token) => !removeSet.has(token)).join(' ');
  }

  contains(token) {
    return this._tokens().includes(token);
  }

  _tokens() {
    return this.element.className ? this.element.className.split(/\s+/).filter(Boolean) : [];
  }
}

class FakeElement {
  constructor(document, tagName, id = null) {
    this.ownerDocument = document;
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = '';
    this.dataset = {};
    this.attributes = new Map();
    this.children = [];
    this.eventListeners = new Map();
    this.style = {};
    this.parentNode = null;
    this.onclick = null;
    this.download = '';
    this.href = '';
    this.target = '';
    this.rel = '';
    this._innerHTML = '';
    this._textContent = '';
    this.classList = new FakeClassList(this);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value);
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter((candidate) => candidate !== child);
    child.parentNode = null;
    return child;
  }

  addEventListener(type, handler) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type).push(handler);
  }

  dispatchEvent(event) {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach((handler) => handler(event));
    if (event.type === 'click' && typeof this.onclick === 'function') {
      this.onclick(event);
    }
  }

  click() {
    if (this.tagName === 'A') {
      this.ownerDocument.lastDownload = {
        download: this.download,
        href: this.href,
        blob: this.ownerDocument.latestBlob,
      };
    }
    this.dispatchEvent({ type: 'click', preventDefault() {} });
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }
}

class FakeDocument {
  constructor() {
    this.readyState = 'loading';
    this.activeElement = null;
    this.latestBlob = null;
    this.lastDownload = null;
    this.revokedUrls = [];
    this.eventListeners = new Map();
    this.body = new FakeElement(this, 'body');
    this.elementsById = new Map();
    this.filterButtons = ['all', 'bhairava_ashtami', 'kali_amavasya', 'navaratri', 'eclipse'].map((filter, index) => {
      const button = new FakeElement(this, 'button');
      button.dataset.filter = filter;
      button.className = index === 0 ? 'filter-btn active' : 'filter-btn';
      return button;
    });

    [
      'upcoming-list',
      'year-sections',
      'export-btn',
      'modal-close',
      'modal-backdrop',
      'event-modal',
      'modal-tag',
      'modal-title',
      'modal-date',
      'modal-desc',
      'modal-significance',
      'modal-links',
      'modal-ics-btn',
    ].forEach((id) => {
      this.elementsById.set(id, new FakeElement(this, 'div', id));
    });

    this.getElementById('event-modal').setAttribute('hidden', '');
  }

  createElement(tagName) {
    return new FakeElement(this, tagName);
  }

  getElementById(id) {
    return this.elementsById.get(id);
  }

  querySelectorAll(selector) {
    if (selector === '.filter-btn') {
      return this.filterButtons;
    }
    return [];
  }

  addEventListener(type, handler) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type).push(handler);
  }

  dispatchEvent(event) {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach((handler) => handler(event));
  }
}

class FakeBlob {
  constructor(parts, options = {}) {
    this.parts = parts;
    this.type = options.type;
  }

  text() {
    return this.parts.join('');
  }
}

class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : ['2026-04-13T00:00:00Z']));
  }

  static now() {
    return new Date('2026-04-13T00:00:00Z').getTime();
  }
}

FixedDate.parse = Date.parse;
FixedDate.UTC = Date.UTC;

async function flush() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

async function bootApp(options = {}) {
  const document = new FakeDocument();
  let fetchCalls = 0;
  const sandbox = {
    document,
    window: {},
    console: options.consoleImpl || console,
    fetch: async (...args) => {
      fetchCalls += 1;
      if (options.fetchImpl) {
        return options.fetchImpl(...args);
      }
      return {
        ok: true,
        json: async () => EVENTS,
      };
    },
    Blob: FakeBlob,
    URL: {
      createObjectURL(blob) {
        document.latestBlob = blob;
        return 'blob:calendar';
      },
      revokeObjectURL(url) {
        document.revokedUrls.push(url);
      },
    },
    Date: FixedDate,
    setTimeout,
    clearTimeout,
  };

  vm.runInNewContext(APP_JS, sandbox, { filename: 'app.js' });
  document.dispatchEvent({ type: 'DOMContentLoaded' });
  await flush();

  return { document, fetchCalls };
}

test('app.js renders, filters, and exports current view', async () => {
  const { document, fetchCalls } = await bootApp();
  const upcomingList = document.getElementById('upcoming-list');
  const yearSections = document.getElementById('year-sections');
  const allButton = document.querySelectorAll('.filter-btn')[0];
  const eclipseButton = document.querySelectorAll('.filter-btn')[4];

  assert.equal(fetchCalls, 1);
  assert.equal(upcomingList.children.length, 8);
  assert.match(yearSections.children[0].children[0].textContent, /^2026$/);

  eclipseButton.click();
  const filteredYearCards = yearSections.children.flatMap((section) => section.children[1].children);

  assert.ok(eclipseButton.classList.contains('active'));
  assert.ok(upcomingList.children.every((card) => ['lunar_eclipse', 'solar_eclipse'].includes(card.dataset.cat)));
  assert.ok(filteredYearCards.length > 0);
  assert.ok(filteredYearCards.every((card) => ['lunar_eclipse', 'solar_eclipse'].includes(card.dataset.cat)));

  document.getElementById('export-btn').click();

  assert.equal(document.lastDownload.download, 'upasana-calendar.ics');
  const ics = document.lastDownload.blob.text();
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.doesNotMatch(ics, /SUMMARY:Kala Bhairava Ashtami/);
  assert.doesNotMatch(ics, /SUMMARY:Amavasya/);
  assert.match(ics, /Lunar Eclipse|Solar Eclipse/);
  assert.deepEqual(document.revokedUrls, ['blob:calendar']);

  allButton.click();
  const restoredYearCards = yearSections.children.flatMap((section) => section.children[1].children);

  assert.ok(allButton.classList.contains('active'));
  assert.ok(upcomingList.children.some((card) => !['lunar_eclipse', 'solar_eclipse'].includes(card.dataset.cat)));
  assert.ok(restoredYearCards.some((card) => !['lunar_eclipse', 'solar_eclipse'].includes(card.dataset.cat)));
  assert.ok(yearSections.children.length > 1);
});

test('app.js handles fetch failure without crashing', async () => {
  const errors = [];
  const { document } = await bootApp({
    fetchImpl: async () => ({ ok: false, status: 503 }),
    consoleImpl: {
      error: (...args) => errors.push(args.join(' ')),
    },
  });

  assert.match(document.getElementById('upcoming-list').innerHTML, /Could not load calendar data/);
  assert.equal(document.getElementById('year-sections').children.length, 0);
  assert.equal(errors.length, 1);
});

test('app.js opens and closes modal with selected event details', async () => {
  const { document } = await bootApp();
  document.querySelectorAll('.filter-btn')[1].click();
  const upcomingCard = document.getElementById('upcoming-list').children[0];
  const modal = document.getElementById('event-modal');

  upcomingCard.click();

  assert.equal(modal.getAttribute('hidden'), undefined);
  assert.equal(document.getElementById('modal-tag').textContent, 'Bhairava');
  assert.match(document.getElementById('modal-tag').className, /cat-bhairava_ashtami/);
  assert.equal(document.getElementById('modal-title').textContent, 'Kala Bhairava Ashtami');
  assert.match(document.getElementById('modal-date').textContent, /2026/);
  assert.match(document.getElementById('modal-desc').textContent, /Krishna Paksha Ashtami/);
  assert.match(document.getElementById('modal-significance').textContent, /Kala Bhairava/);
  assert.equal(document.getElementById('modal-links').children.length, 3);
  assert.equal(document.body.style.overflow, 'hidden');
  assert.equal(document.activeElement.id, 'modal-close');

  document.getElementById('modal-ics-btn').click();
  assert.equal(document.lastDownload.download, 'kala_bhairava_ashtami.ics');
  const singleEventIcs = document.lastDownload.blob.text();
  assert.match(singleEventIcs, /SUMMARY:Kala Bhairava Ashtami/);
  assert.equal((singleEventIcs.match(/BEGIN:VEVENT/g) || []).length, 1);

  document.getElementById('modal-close').click();
  assert.equal(modal.getAttribute('hidden'), '');

  upcomingCard.click();
  document.getElementById('modal-backdrop').click();
  assert.equal(modal.getAttribute('hidden'), '');

  upcomingCard.click();
  document.dispatchEvent({ type: 'keydown', key: 'Escape' });

  assert.equal(modal.getAttribute('hidden'), '');
  assert.equal(document.body.style.overflow, '');
});
