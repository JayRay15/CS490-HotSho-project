// Mock for @clerk/express
// This mock is automatically used when jest.mock('@clerk/express') is called

let mockGetUserImpl = null;
let mockGetUserCalls = [];

export const mockGetUser = async (userId) => {
  mockGetUserCalls.push(userId);
  if (mockGetUserImpl) {
    return mockGetUserImpl(userId);
  }
  // Default mock response
  return {
    id: userId,
    fullName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    primaryEmailAddress: { emailAddress: `${userId}@test.com` },
    emailAddresses: [{ emailAddress: `${userId}@test.com` }],
    imageUrl: 'https://test.com/avatar.jpg'
  };
};

// Helper functions for tests to control mock behavior
mockGetUser.mockResolvedValue = (value) => {
  if (typeof value === 'function') {
    mockGetUserImpl = value;
  } else {
    mockGetUserImpl = () => Promise.resolve(value);
  }
};

mockGetUser.mockRejectedValue = (error) => {
  mockGetUserImpl = () => Promise.reject(error);
};

mockGetUser.mockClear = () => {
  mockGetUserImpl = null;
  mockGetUserCalls = [];
};

mockGetUser.mock = {
  get calls() {
    return mockGetUserCalls.map(userId => [userId]);
  }
};

export const clerkClient = {
  users: {
    getUser: mockGetUser
  }
};
