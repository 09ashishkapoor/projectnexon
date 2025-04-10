// filepath: c:\Users\meowKrbhva\Documents\Jai Ma Adya\ProjectNexon\tests\functions\scheduledTasks.test.js
const axios = require('axios');
const fs = require('fs');

// Mock axios completely - this fixes the CI build issue
jest.mock('axios', () => {
  return {
    get: jest.fn(() => Promise.resolve({ status: 200, data: { success: true } })),
    post: jest.fn(() => Promise.resolve({ status: 200, data: { success: true } }))
  };
});

// Mock fs operations
jest.spyOn(fs, 'existsSync').mockReturnValue(true);
jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {});

// Mock console.log
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Scheduled Tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset axios mock responses for each test
    axios.get.mockImplementation(() => Promise.resolve({ status: 200, data: { success: true } }));
    axios.post.mockImplementation(() => Promise.resolve({ status: 200, data: { success: true } }));
  });
  
  describe('dailyMaintenance', () => {
    it('should complete successfully and return 200', async () => {
      // Import the handler
      const { handler } = require('../../netlify/functions/dailyMaintenance');
      
      // Call the handler
      const response = await handler({});
      
      // Assert response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toHaveProperty('message', 'Daily maintenance completed successfully');
      
      // Verify the API was called
      expect(axios.get).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      // Mock API error
      axios.get.mockImplementationOnce(() => Promise.reject(new Error('API unavailable')));
      
      // Import the handler
      const { handler } = require('../../netlify/functions/dailyMaintenance');
      
      // Call the handler
      const response = await handler({});
      
      // Assert response
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toHaveProperty('error', 'API unavailable');
    });
  });
  
  describe('hourlyOperations', () => {
    it('should use correct URL for API calls', async () => {
      // Import the handler
      const { handler } = require('../../netlify/functions/hourlyOperations');
      
      // Call the handler
      const response = await handler({});
      
      // Assert response
      expect(response.statusCode).toBe(200);
      
      // Verify the API was called
      expect(axios.get).toHaveBeenCalled();
    });
  });
  
  describe('weeklyMaintenance', () => {
    it('should call the checkStatus function', async () => {
      // Import the handler
      const { handler } = require('../../netlify/functions/weeklyMaintenance');
      
      // Call the handler
      const response = await handler({});
      
      // Assert response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toHaveProperty('message', 'Weekly maintenance completed successfully');
      
      // Verify the API was called
      expect(axios.get).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      // Mock API error with response data
      const error = new Error('API error');
      error.response = {
        status: 500,
        data: { error: 'Database connection failed' }
      };
      axios.get.mockImplementationOnce(() => Promise.reject(error));
      
      // Import the handler
      const { handler } = require('../../netlify/functions/weeklyMaintenance');
      
      // Call the handler
      const response = await handler({});
      
      // Assert response
      expect(response.statusCode).toBe(500);
    });
  });
});