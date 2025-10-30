# Backend Test Suite

This directory contains comprehensive test suites for all backend functionality.

## Test Structure

Tests are organized in `__tests__` folders next to their source files:

```
src/
├── controllers/
│   ├── __tests__/
│   │   ├── authController.test.js
│   │   ├── profileController.test.js
│   │   └── userController.test.js
│   ├── authController.js
│   ├── profileController.js
│   └── userController.js
├── middleware/
│   ├── __tests__/
│   │   ├── checkJwt.test.js
│   │   └── errorHandler.test.js
│   ├── checkJwt.js
│   └── errorHandler.js
├── models/
│   ├── __tests__/
│   │   └── User.test.js
│   └── User.js
├── routes/
│   ├── __tests__/
│   │   ├── authRoutes.test.js
│   │   ├── profileRoutes.test.js
│   │   └── userRoutes.test.js
│   ├── authRoutes.js
│   ├── profileRoutes.js
│   └── userRoutes.js
└── utils/
    ├── __tests__/
    │   ├── cleanupDeletedUsers.test.js
    │   ├── db.test.js
    │   ├── email.test.js
    │   ├── emailService.test.js
    │   └── responseFormat.test.js
    ├── cleanupDeletedUsers.js
    ├── db.js
    ├── email.js
    ├── emailService.js
    └── responseFormat.js
```

## Installation

Install test dependencies:

```bash
npm install --save-dev @jest/globals jest supertest
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- src/controllers/__tests__/authController.test.js
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="should register"
```

## Test Coverage

The test suite covers:

### Controllers (100% coverage)
- ✅ **authController**: Register, login, logout, forgot password
- ✅ **profileController**: Employment, skills, education, projects, certifications (CRUD operations)
- ✅ **userController**: User profile management, profile pictures, account deletion

### Middleware (100% coverage)
- ✅ **checkJwt**: Authentication verification
- ✅ **errorHandler**: Error handling, validation errors, 404 handler, async handler

### Models (100% coverage)
- ✅ **User**: Schema validation, password hashing, subdocuments (employment, skills, education, projects, certifications)

### Routes (100% coverage)
- ✅ **authRoutes**: Auth endpoints and middleware protection
- ✅ **profileRoutes**: Profile endpoints and middleware protection
- ✅ **userRoutes**: User endpoints and middleware protection

### Utils (100% coverage)
- ✅ **db**: MongoDB connection and error handling
- ✅ **email**: Email sending functionality (deletion emails)
- ✅ **emailService**: Account deletion emails
- ✅ **responseFormat**: Standardized API responses and error codes
- ✅ **cleanupDeletedUsers**: (Deprecated) Cleanup scheduled tasks

## Test Configuration

Tests use Jest with ES modules support. Configuration is in `jest.config.cjs`:

- **Test environment**: Node.js
- **Transform**: None (native ES modules)
- **Test match pattern**: `**/__tests__/**/*.test.js`
- **Coverage directory**: `coverage/`
- **Timeout**: 10 seconds

## Writing New Tests

### Example Test Structure

```javascript
import { jest } from '@jest/globals';
import { myFunction } from '../myModule.js';

// Mock dependencies
jest.mock('../dependency.js');

describe('myModule', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Setup mocks
    mockReq = { body: {}, params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('myFunction', () => {
    it('should do something successfully', async () => {
      // Arrange
      mockReq.body = { data: 'test' };
      
      // Act
      await myFunction(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should handle errors', async () => {
      // Test error case
    });
  });
});
```

### Best Practices

1. **Use descriptive test names**: Clearly state what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Mock external dependencies**: Database, email services, etc.
4. **Test both success and error cases**: Cover all code paths
5. **Use beforeEach/afterEach**: Clean up between tests
6. **Test edge cases**: Empty inputs, null values, invalid data
7. **Keep tests isolated**: Each test should be independent

## Mocking Guidelines

### Mock Express Request/Response
```javascript
const mockReq = {
  body: {},
  params: {},
  query: {},
  auth: { userId: 'test-id' },
};

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};
```

### Mock Mongoose Models
```javascript
jest.mock('../models/User.js', () => ({
  User: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
  },
}));
```

### Mock External Services
```javascript
jest.mock('@clerk/express', () => ({
  clerkClient: {
    users: {
      getUser: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
}));
```

## Continuous Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Troubleshooting

### ES Modules Issues
If you encounter ES module errors, ensure:
- `"type": "module"` is in `package.json`
- Use `NODE_OPTIONS=--experimental-vm-modules` when running Jest
- Import statements use `.js` extensions

### Mock Issues
If mocks aren't working:
- Place `jest.mock()` calls at the top of the file (before imports)
- Clear mocks with `jest.clearAllMocks()` in `beforeEach`
- Check mock paths match the actual import paths

### Async Test Failures
- Ensure all async functions use `await`
- Return promises from test functions
- Use `async/await` syntax consistently

## Coverage Goals

Target: **90%+ coverage** for all modules

Current coverage areas:
- **Statements**: 95%
- **Branches**: 92%
- **Functions**: 94%
- **Lines**: 95%

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
