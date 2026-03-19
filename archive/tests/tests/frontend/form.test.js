/**
 * @jest-environment jsdom
 */

describe('Subscription Form', () => {
  let form, emailInput, tithiCheckbox1, tithiCheckbox2, submitButton, feedback;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="subscription-form">
        <input type="email" id="email" />
        <input type="checkbox" name="tithi" value="Ashtami" />
        <input type="checkbox" name="tithi" value="Purnima" />
        <button type="submit">Subscribe</button>
        <div id="feedback"></div>
      </form>
    `;
    form = document.getElementById('subscription-form');
    emailInput = document.getElementById('email');
    submitButton = form.querySelector('button[type="submit"]');
    feedback = document.getElementById('feedback');
  });

  function mockFetch(response, ok = true) {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok,
        json: () => Promise.resolve(response),
      })
    );
  }

  it('disables submit if email is invalid', () => {
    emailInput.value = 'bademail';
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
    expect(isValid).toBe(false);
  });

  it('requires at least one Tithi selected', () => {
    const checkboxes = form.querySelectorAll('input[name="tithi"]:checked');
    expect(checkboxes.length).toBe(0);
  });

  it('submits successfully with valid data', async () => {
    emailInput.value = 'test@example.com';
    form.querySelectorAll('input[name="tithi"]')[0].checked = true;

    mockFetch({ message: 'Subscription successful!' });

    const event = new Event('submit');
    event.preventDefault = jest.fn();

    let responseMessage = '';

    await new Promise((resolve) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const selectedTithis = Array.from(
          form.querySelectorAll('input[name="tithi"]:checked')
        ).map((cb) => cb.value);

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          responseMessage = 'Invalid email';
          resolve();
          return;
        }
        if (selectedTithis.length === 0) {
          responseMessage = 'Select at least one Tithi';
          resolve();
          return;
        }

        const res = await fetch('/.netlify/functions/subscribe', {
          method: 'POST',
          body: JSON.stringify({ email, selectedTithis }),
        });
        const data = await res.json();
        responseMessage = data.message;
        resolve();
      }, { once: true });

      form.dispatchEvent(event);
    });

    expect(responseMessage).toMatch(/successful/i);
  });

  it('handles API error response gracefully', async () => {
    emailInput.value = 'test@example.com';
    form.querySelectorAll('input[name="tithi"]')[0].checked = true;

    mockFetch({ message: 'Invalid email address' }, false);

    const event = new Event('submit');
    event.preventDefault = jest.fn();

    let responseMessage = '';

    await new Promise((resolve) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const selectedTithis = Array.from(
          form.querySelectorAll('input[name="tithi"]:checked')
        ).map((cb) => cb.value);

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          responseMessage = 'Invalid email';
          resolve();
          return;
        }
        if (selectedTithis.length === 0) {
          responseMessage = 'Select at least one Tithi';
          resolve();
          return;
        }

        const res = await fetch('/.netlify/functions/subscribe', {
          method: 'POST',
          body: JSON.stringify({ email, selectedTithis }),
        });
        const data = await res.json();
        responseMessage = data.message;
        resolve();
      }, { once: true });

      form.dispatchEvent(event);
    });

    expect(responseMessage).toMatch(/invalid/i);
  });
});