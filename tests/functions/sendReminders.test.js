process.env.RESEND_API_KEY = 'test-api-key';
process.env.SENDER_EMAIL = 'test@sender.com';

jest.mock('@netlify/blobs', () => ({
  getStore: () => ({
    list: jest.fn().mockResolvedValue(['user1@example.com', 'user2@example.com']),
    get: jest.fn((email) => {
      if (email === 'user1@example.com') return Promise.resolve(['Ashtami']);
      if (email === 'user2@example.com') return Promise.resolve(['Purnima']);
      return Promise.resolve([]);
    }),
  }),
}));

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: 'mock-email-id' }),
      },
    })),
  };
});

const { handler } = require('../../netlify/functions/sendReminders');

const fs = require('fs');
const path = require('path');

const tithiDataPath = path.join(__dirname, '../../netlify/functions/data/tithis_2024_2030.json');

describe('sendReminders function', () => {
  beforeAll(() => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
      "2025": {
        "Ashtami": [{ date: "2025-04-07", full_name: "Chaitra Krishna Ashtami" }],
        "Purnima": [{ date: "2025-04-07", full_name: "Chaitra Purnima" }]
      }
    }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should send emails to matching subscribers', async () => {
    process.env.REMINDER_LEAD_DAYS = '2';
    const today = new Date('2025-04-05T00:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => today);

    const response = await handler();
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toMatch(/Emails sent/i);
  });

  it('should handle no Tithis found', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ "2025": {} }));
    const response = await handler();
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toMatch(/No Tithis found/i);
  });

  it('should handle no subscribers found', async () => {
    jest.mock('@netlify/blobs', () => ({
      getStore: () => ({
        list: jest.fn().mockResolvedValue([]),
        get: jest.fn().mockResolvedValue([]),
      }),
    }));
    const response = await handler();
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toMatch(/No Tithis found/i);
  });
});