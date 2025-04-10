// filepath: c:\Users\meowKrbhva\Documents\Jai Ma Adya\ProjectNexon\tests\functions\scheduledTasks.test.js
const axios = require('axios');
const fs = require('fs');

// Mock axios
jest.mock('axios');

// Mock fs operations
jest.spyOn(fs, 'existsSync').mockReturnValue(true);
jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {});

// Mock console.log
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Scheduled Tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('dailyMaintenance', () => {
    it('should complete successfully and return 200', async () => {
      // Mock successful API response
      axios.get.mockResolvedValueOnce({ status: 200, data: { success: true } });
      
      // Import the handler
      const { handler } = require('../../netlify/functions/dailyMaintenance');
      
      // Call the handler
      const response = await handler({});
      
      // Assert response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toHaveProperty('message', 'Daily maintenance completed successfully');
      
      // Verify the API was called
      expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/cron/daily');
    });
    
    it('should handle errors gracefully', async () => {
      // Mock API error
      axios.get.mockRejectedValueOnce(new Error('API unavailable'));
      
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
    it('should use development URL in dev environment', async () => {
      // Set development environment
      process.env.NODE_ENV = 'development';
      
      // Mock successful API response
      axios.get.mockResolvedValueOnce({ status: 200, data: { success: true } });
      
      // Import the handler
      const { handler } = require('../../netlify/functions/hourlyOperations');
      
      // Call the handler
      const response = await handler({});
      
      // Assert response
      expect(response.statusCode).toBe(200);
      
      // Verify the API was called with development URL
      expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/cron/hourly');
    });
    
    it('should use production URL in production environment', async () => {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      // Mock successful API response
      axios.get.mockResolvedValueOnce({ status: 200, data: { success: true } });
      
      // Import the handler
      const { handler } = require('../../netlify/functions/hourlyOperations');
      
      // Call the handler
      const response = await handler({});
      
      // Assert response
      expect(response.statusCode).toBe(200);
      
      // Verify the API was called with production URL
      expect(axios.get).toHaveBeenCalledWith('https://simpletithireminder.netlify.app/api/cron/hourly');
      
      // Reset environment
      process.env.NODE_ENV = 'test';
    });
  });
  
  describe('weeklyMaintenance', () => {
    it('should call the checkStatus function', async () => {
      // Set development environment
      process.env.NODE_ENV = 'development';
      
      // Mock successful API response
      axios.get.mockResolvedValueOnce({ 
        status: 200, 
        data: { databaseStatus: 'healthy' } 
      });
      
      // Import the handler
      const { handler } = require('../../netlify/functions/weeklyMaintenance');
      
      // Call the handler
      const response = await handler({});
      
      // Assert response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toHaveProperty('message', 'Weekly maintenance completed successfully');
      
      // Verify the API was called with correct path
      expect(axios.get).toHaveBeenCalledWith('http://localhost:8888/.netlify/functions/checkStatus');
      
      // Reset environment
      process.env.NODE_ENV = 'test';
    });
    
    it('should log detailed error information when available', async () => {
      // Mock API error with response data
      const error = new Error('API error');
      error.response = {
        status: 500,
        data: { error: 'Database connection failed' }
      };
      axios.get.mockRejectedValueOnce(error);
      
      // Spy on the logMessage function
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Import the handler
      const { handler } = require('../../netlify/functions/weeklyMaintenance');
      
      // Call the handler
      const response = await handler({});
      
      // Assert response
      expect(response.statusCode).toBe(500);
      
      // Verify detailed error was logged
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error response data:'));
    });
  });
});