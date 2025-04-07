// Mock Firebase configuration for tests
jest.mock('../../config/firebase', () => require('../../config/firebase.test'));

// Mock node-fetch properly
jest.mock('node-fetch');
const fetch = require('node-fetch');

const { handler } = require('../../netlify/functions/subscribe');

describe('subscribe function', () => {
  beforeEach(() => {
    process.env.RECAPTCHA_SECRET = 'dummy_secret';
    jest.clearAllMocks();
  });

  const baseBody = {
    selectedTithis: ['Ashtami', 'Purnima'],
    'g-recaptcha-response': 'dummy_token',
  };

  const baseHeaders = {
    'user-agent': 'test-agent',
  };

  it('should return 200 on successful subscription with valid CAPTCHA and domain', async () => {
    // Mock a successful reCAPTCHA v3 response with proper score and action
    const mockResponse = { 
      success: true, 
      score: 0.9, 
      action: 'submit' 
    };
    
    fetch.default.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const event = {
      httpMethod: 'POST',
      headers: baseHeaders,
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
      headers: baseHeaders,
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
    const mockResponse = { success: false };
    fetch.default.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const event = {
      httpMethod: 'POST',
      headers: baseHeaders,
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
    // Make sure to include a valid reCAPTCHA v3 response with score and action
    const mockResponse = { 
      success: true, 
      score: 0.9, 
      action: 'submit' 
    };
    
    fetch.default.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const event = {
      httpMethod: 'POST',
      headers: baseHeaders,
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