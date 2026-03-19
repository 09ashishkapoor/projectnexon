// Mock Firebase configuration for tests
jest.mock('../../config/firebase', () => require('../../config/firebase.test'));

// Mock node-fetch
jest.mock('node-fetch');
const fetch = require('node-fetch');

const { handler } = require('../../netlify/functions/checkStatus');

describe('checkStatus function', () => {
  beforeEach(() => {
    process.env.RECAPTCHA_SECRET = 'dummy_secret';
    jest.clearAllMocks();
  });

  const baseHeaders = {
    'user-agent': 'test-agent',
  };

  it('should return subscription details for a valid email with proper CAPTCHA', async () => {
    // Mock a successful reCAPTCHA v3 response with proper score and action
    fetch.default.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        score: 0.9
      }),
    });
    
    // Mock Firebase to return subscription data
    const mockTithis = ['Ashtami', 'Purnima', 'Ekadashi'];
    require('../../config/firebase').subscriptionStore.get.mockResolvedValue(
      JSON.stringify(mockTithis)
    );

    const event = {
      httpMethod: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        email: 'test@gmail.com',
        'g-recaptcha-response': 'dummy_token',
      }),
    };
    
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    
    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).toContain('Subscription found');
    expect(responseBody.email).toBe('test@gmail.com');
    expect(responseBody.subscribedTithis).toEqual(mockTithis);
    expect(responseBody.active).toBe(true);
  });

  it('should return 404 for email not found in database', async () => {
    // Mock reCAPTCHA verification
    fetch.default.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        score: 0.9
      }),
    });
    
    // Mock Firebase to return null (no subscription found)
    require('../../config/firebase').subscriptionStore.get.mockResolvedValue(null);

    const event = {
      httpMethod: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        email: 'nonexistent@gmail.com',
        'g-recaptcha-response': 'dummy_token',
      }),
    };
    
    const response = await handler(event);
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).message).toContain('No subscription found');
  });

  it('should accept test-token without verifying CAPTCHA', async () => {
    // Don't mock fetch since it shouldn't be called
    
    // Mock Firebase to return subscription data
    const mockTithis = ['Ashtami', 'Purnima'];
    require('../../config/firebase').subscriptionStore.get.mockResolvedValue(
      JSON.stringify(mockTithis)
    );

    const event = {
      httpMethod: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        email: 'test@gmail.com',
        'g-recaptcha-response': 'test-token',
      }),
    };
    
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(fetch.default).not.toHaveBeenCalled();
  });

  it('should return 400 if CAPTCHA verification fails due to low score', async () => {
    fetch.default.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        score: 0.3 // Below threshold
      }),
    });

    const event = {
      httpMethod: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        email: 'test@gmail.com',
        'g-recaptcha-response': 'dummy_token',
      }),
    };
    
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toContain('potentially automated');
  });

  it('should return 400 if email format is invalid', async () => {
    const event = {
      httpMethod: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        email: 'invalid-email',
        'g-recaptcha-response': 'test-token',
      }),
    };
    
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toContain('Invalid email');
  });
});