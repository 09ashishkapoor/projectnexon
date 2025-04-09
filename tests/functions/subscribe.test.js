// Mock Firebase configuration for tests
jest.mock('../../config/firebase', () => require('../../config/firebase.test'));

// Mock node-fetch properly
jest.mock('node-fetch');
const fetch = require('node-fetch');

// The subscribe function uses fetch directly to call Brevo API, so no need to mock a Brevo SDK

const { handler } = require('../../netlify/functions/subscribe');

describe('subscribe function', () => {
  beforeEach(() => {
    process.env.RECAPTCHA_SECRET = 'dummy_secret';
    process.env.BREVO_API_KEY = 'dummy_brevo_key';
    process.env.SENDER_EMAIL = 'test@example.com';
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
    fetch.default.mockImplementation((url, options) => {
      // Mock reCAPTCHA response
      if (url.includes('google.com/recaptcha')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            score: 0.9, 
            action: 'submit' 
          }),
        });
      }
      
      // Mock Brevo API response for email
      if (url.includes('api.brevo.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messageId: 'mock-email-id' }),
        });
      }
      
      return Promise.reject(new Error('Unknown fetch call'));
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
    // Check that the success message includes confirmation email notification
    expect(JSON.parse(response.body).message).toContain('confirmation email');
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
    fetch.default.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false }),
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
    fetch.default.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        score: 0.9, 
        action: 'submit' 
      }),
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