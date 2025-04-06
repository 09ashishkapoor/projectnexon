jest.mock('@netlify/blobs', () => ({
  getStore: () => ({
    setJSON: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('node-fetch', () => jest.fn());

const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');

const { handler } = require('../../netlify/functions/subscribe');

describe('subscribe function', () => {
  beforeEach(() => {
    process.env.RECAPTCHA_SECRET = 'dummy_secret';
    fetch.mockReset();
  });

  const baseBody = {
    selectedTithis: ['Ashtami', 'Purnima'],
    'g-recaptcha-response': 'dummy_token',
  };

  it('should return 200 on successful subscription with valid CAPTCHA and domain', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'test@gmail.com',
        ...baseBody,
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  it('should return 400 if CAPTCHA token is missing', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'test@gmail.com',
        selectedTithis: ['Ashtami'],
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toMatch(/captcha/i);
  });

  it('should return 400 if CAPTCHA verification fails', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 }));
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'test@gmail.com',
        ...baseBody,
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toMatch(/captcha/i);
  });

  it('should return 400 for disallowed email domain', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'user@unknown-domain.com',
        ...baseBody,
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toMatch(/major email providers/i);
  });
});