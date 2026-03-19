const readline = require('readline');

// Mock the firebase module
jest.mock('../../config/firebase', () => {
  const mockSnapshot = {
    empty: false,
    size: 3,
    forEach: jest.fn(callback => {
      // Mock 3 documents
      ['doc1', 'doc2', 'doc3'].forEach(id => {
        callback({ ref: { id } });
      });
    })
  };
  
  const mockBatch = {
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(true)
  };
  
  return {
    admin: {
      app: jest.fn().mockReturnValue({
        delete: jest.fn().mockResolvedValue(true)
      })
    },
    db: {
      collection: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSnapshot)
      }),
      batch: jest.fn().mockReturnValue(mockBatch)
    },
    subscriptionStore: {}
  };
});

// Create mock functions for readline
const mockQuestion = jest.fn();
const mockClose = jest.fn();
const mockCreateInterface = jest.fn().mockReturnValue({
  question: mockQuestion,
  close: mockClose
});

// Mock readline module
jest.mock('readline', () => ({
  createInterface: mockCreateInterface
}));

// Mock process.exit to prevent tests from ending
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
// Mock console.log and console.error
const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('purge-firebase.js', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // Restore mocks after all tests
    mockExit.mockRestore();
    mockLog.mockRestore();
    mockError.mockRestore();
  });
  
  test('should purge data with user confirmation', async () => {
    // Setup the mock to return "DELETE ALL DATA"
    mockQuestion.mockImplementation((query, callback) => callback('DELETE ALL DATA'));
    
    // Import the script itself (this will execute the main function)
    jest.isolateModules(() => {
      require('../../purge-firebase');
    });
    
    // Allow the script to execute
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify the readline interface was created
    expect(mockCreateInterface).toHaveBeenCalled();
    
    // Verify console output
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('WARNING'));
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Found 3 documents to delete'));
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Successfully deleted all 3 documents'));
    
    // Verify process exit was called
    expect(mockExit).toHaveBeenCalledWith(0);
  });
  
  test('should purge data with force mode', async () => {
    // Save original process.argv
    const originalArgv = process.argv;
    
    // Mock process.argv to include --force flag
    process.argv = [...originalArgv, '--force'];
    
    // Import the script with isolation
    jest.isolateModules(() => {
      require('../../purge-firebase');
    });
    
    // Allow the script to execute
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify force mode message
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Force mode enabled'));
    
    // Restore original process.argv
    process.argv = originalArgv;
  });
  
  test('should cancel operation if confirmation fails', async () => {
    // Setup the mock to return "NO" for this test
    mockQuestion.mockImplementation((query, callback) => callback('NO'));
    
    // Import the script with isolation
    jest.isolateModules(() => {
      require('../../purge-firebase');
    });
    
    // Allow the script to execute
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify cancellation message
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Operation canceled'));
  });
});