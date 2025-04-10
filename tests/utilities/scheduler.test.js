// filepath: c:\Users\meowKrbhva\Documents\Jai Ma Adya\ProjectNexon\tests\utilities\scheduler.test.js
const path = require('path');
const fs = require('fs');

// Create storage for callbacks
const scheduledCallbacks = {};

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Mock node-schedule
jest.mock('node-schedule', () => ({
  scheduleJob: jest.fn((cronExpression, callback) => {
    // Store the callback for testing
    scheduledCallbacks[cronExpression] = callback;
    return { cancel: jest.fn() };
  })
}));

// Mock fs.appendFileSync to prevent actual file writing
jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {});

// Mock fs.existsSync
jest.spyOn(fs, 'existsSync').mockImplementation(() => true);

// Mock fs.mkdirSync
jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});

// Mock console.log to prevent actual logging but allow capture for testing
const mockConsoleLog = jest.fn();
jest.spyOn(console, 'log').mockImplementation((...args) => {
  mockConsoleLog(...args);
});

describe('scheduler.js', () => {
  let scheduler;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the module cache to reload the scheduler module
    jest.resetModules();
    
    // Clear the stored callbacks
    Object.keys(scheduledCallbacks).forEach(key => delete scheduledCallbacks[key]);
    
    // Load the scheduler module
    scheduler = require('../../scheduler');
  });

  test('should initialize correctly', () => {
    // Verify the log message when starting
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Scheduler started successfully'));
    
    // Check that the directories are checked
    expect(fs.existsSync).toHaveBeenCalled();
    
    // Verify that scheduleJob was called the correct number of times
    const nodeSchedule = require('node-schedule');
    expect(nodeSchedule.scheduleJob).toHaveBeenCalledTimes(4);
  });

  test('should run daily task successfully', async () => {
    // Reset the mocks to ensure we're starting fresh
    mockConsoleLog.mockClear();
    axios.get.mockClear();
    
    // Mock axios to return a successful response for the daily task
    axios.get.mockResolvedValue({ status: 200, data: { success: true } });
    
    // Get the daily task callback (0 0 * * *)
    const dailyCallback = scheduledCallbacks['0 0 * * *'];
    expect(dailyCallback).toBeDefined();
    
    // Execute the daily task callback
    await dailyCallback();
    
    // Verify the API was called correctly
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/cron/daily');
    
    // Verify the log message
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Task completed with status: 200'));
  });

  test('should run hourly task successfully', async () => {
    // Reset the mocks to ensure we're starting fresh
    mockConsoleLog.mockClear();
    axios.get.mockClear();
    
    // Mock axios to return a successful response for the hourly task
    axios.get.mockResolvedValue({ status: 200, data: { success: true } });
    
    // Get the hourly task callback (0 * * * *)
    const hourlyCallback = scheduledCallbacks['0 * * * *'];
    expect(hourlyCallback).toBeDefined();
    
    // Execute the hourly task callback
    await hourlyCallback();
    
    // Verify the API was called correctly
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/cron/hourly');
    
    // Verify the log message
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Task completed with status: 200'));
  });

  test('should run tithi reminder task successfully', async () => {
    // Reset the mocks to ensure we're starting fresh
    mockConsoleLog.mockClear();
    axios.post.mockClear();
    
    // Save the original NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    
    // Set NODE_ENV to development for testing
    process.env.NODE_ENV = 'development';
    
    // Mock axios to return a successful response for the reminder task
    axios.post.mockResolvedValue({ 
      status: 200, 
      data: { 
        message: 'Reminder process complete. Successful: 5, Failed: 0', 
        totalSubscribers: 5 
      } 
    });
    
    // Get the tithi reminder task callback (0 9 * * *)
    const reminderCallback = scheduledCallbacks['0 9 * * *'];
    expect(reminderCallback).toBeDefined();
    
    // Execute the reminder task callback
    await reminderCallback();
    
    // Verify the API was called correctly with the development URL
    expect(axios.post).toHaveBeenCalledWith('http://localhost:8888/.netlify/functions/sendReminders');
    
    // Verify the log messages
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Reminder task completed with status: 200'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Reminder summary: Reminder process complete. Successful: 5, Failed: 0'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Total subscribers notified: 5'));
    
    // Reset the mocks for production test
    mockConsoleLog.mockClear();
    axios.post.mockClear();
    
    // Set NODE_ENV to production for production URL test
    process.env.NODE_ENV = 'production';
    
    // Mock axios again for production test
    axios.post.mockResolvedValue({ 
      status: 200, 
      data: { 
        message: 'Reminder process complete. Successful: 10, Failed: 0', 
        totalSubscribers: 10 
      } 
    });
    
    // Execute the reminder task callback again
    await reminderCallback();
    
    // Verify the production URL was used
    expect(axios.post).toHaveBeenCalledWith('https://simpletithireminder.netlify.app/.netlify/functions/sendReminders');
    
    // Restore the original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  test('should handle errors gracefully', async () => {
    // Reset the mocks to ensure we're starting fresh
    mockConsoleLog.mockClear();
    axios.get.mockClear();
    
    // Mock axios to throw an error for the daily task
    axios.get.mockRejectedValue(new Error('API connection failed'));
    
    // Get the daily task callback
    const dailyCallback = scheduledCallbacks['0 0 * * *'];
    expect(dailyCallback).toBeDefined();
    
    // Execute the callback which should now throw an error
    await dailyCallback();
    
    // Verify the error was logged properly
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Error executing daily task: API connection failed'));
  });

  test('should handle more detailed API errors', async () => {
    // Reset the mocks to ensure we're starting fresh
    mockConsoleLog.mockClear();
    axios.post.mockClear();
    
    // Mock axios to throw an error with response data
    const error = new Error('API error');
    error.response = {
      status: 500,
      data: { error: 'Internal server error' }
    };
    axios.post.mockRejectedValue(error);
    
    // Get the reminder task callback
    const reminderCallback = scheduledCallbacks['0 9 * * *'];
    expect(reminderCallback).toBeDefined();
    
    // Execute the callback which should throw an error with response data
    await reminderCallback();
    
    // Verify both error message and error response data were logged
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Error executing tithi reminder task: API error'));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Error response data: {"error":"Internal server error"}'));
  });

  test('should run weekly maintenance task successfully', async () => {
    // Reset the mocks to ensure we're starting fresh
    mockConsoleLog.mockClear();
    axios.get.mockClear();
    
    // Set NODE_ENV to development for testing
    process.env.NODE_ENV = 'development';
    
    // Mock axios to return a successful response for the maintenance task
    axios.get.mockResolvedValue({ status: 200, data: { success: true } });
    
    // Get the weekly maintenance task callback (0 1 * * 0)
    const maintenanceCallback = scheduledCallbacks['0 1 * * 0'];
    expect(maintenanceCallback).toBeDefined();
    
    // Execute the maintenance task callback
    await maintenanceCallback();
    
    // Verify the API was called correctly
    expect(axios.get).toHaveBeenCalledWith('http://localhost:8888/.netlify/functions/checkStatus');
    
    // Verify the log message
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Maintenance task completed with status: 200'));
  });
});