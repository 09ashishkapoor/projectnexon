// Mock Firebase configuration for tests
const subscriptionStore = {
  set: jest.fn().mockResolvedValue(true),
  get: jest.fn().mockResolvedValue(JSON.stringify(['Ashtami', 'Purnima'])),
  delete: jest.fn().mockResolvedValue(true),
  list: jest.fn().mockResolvedValue(['test@gmail.com', 'user@outlook.com'])
};

module.exports = {
  admin: {},
  db: {},
  subscriptionStore
};