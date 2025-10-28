# UC-012: API Error Handling - Implementation Guide

## Summary
This implementation provides consistent, user-friendly error handling across the entire application, meeting all acceptance criteria for UC-012.

## Features Implemented

### ✅ Backend Error Handling

#### 1. Standardized Error Response Format
All API errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "timestamp": "2025-10-28T12:34:56.789Z",
  "errorCode": 2001,
  "errors": [
    {
      "field": "email",
      "message": "A valid email address is required",
      "value": "invalid-email"
    }
  ]
}
```

#### 2. Error Codes System
Organized error codes for easy identification:
- **1xxx**: Authentication & Authorization errors
- **2xxx**: Validation errors
- **3xxx**: Resource errors (not found, duplicates)
- **5xxx**: Server errors
- **6xxx**: Network errors

See `backend/src/utils/responseFormat.js` for complete list.

#### 3. Global Error Handler Middleware
Located at `backend/src/middleware/errorHandler.js`

Features:
- Catches all uncaught errors
- Logs 500+ errors server-side with full context
- Returns generic messages for 500 errors (hides internal details)
- Handles common error types:
  - Mongoose validation errors
  - Duplicate key errors (MongoDB)
  - Cast errors (invalid ObjectId)
  - JWT errors
  - Custom application errors

#### 4. Field-Specific Validation Errors
Controllers now return detailed field validation:
- List of specific fields with issues
- User-friendly messages per field
- Original value that caused error

Example from `authController.js`:
```javascript
const { response, statusCode } = validationErrorResponse(
  "Invalid email address",
  [{ field: 'email', message: 'A valid email address is required', value: email }]
);
```

#### 5. Duplicate Email Handling
- Returns 409 status code
- Error code 3003 (DUPLICATE_ENTRY)
- Clear message: "An account with this email already exists"
- Includes field-specific error details

### ✅ Frontend Error Handling

#### 1. Axios Interceptors
Enhanced `frontend/src/api/axios.js` with:
- Response interceptor that standardizes all errors
- Automatic error categorization (network, server, validation)
- Retry capability detection
- Timeout configuration (15 seconds)

#### 2. Error Display Components

**ErrorMessage Component** (`frontend/src/components/ErrorMessage.jsx`)
- Displays errors in consistent, user-friendly format
- Shows field-specific validation errors
- Provides retry button for retryable errors
- Dismissible with X button

**ErrorBoundary Component** (`frontend/src/components/ErrorBoundary.jsx`)
- Catches JavaScript errors in component tree
- Prevents entire app from crashing
- Shows fallback UI with recovery options
- Logs errors for debugging (dev mode shows details)

**FieldError Component**
- Inline error messages for form fields
- Automatically extracts field-specific errors
- Red text formatting for visibility

#### 3. Network Error Handling with Retry
- Automatic detection of network errors
- `retryRequest()` helper function
- Exponential backoff (1s, 2s, 4s delays)
- Configurable retry attempts
- User-friendly "Try Again" buttons

#### 4. Page-Level Error Handling

**Dashboard** (`frontend/src/pages/auth/Dashboard.jsx`)
- Error state management
- Retry functionality on failures
- Loading states during retry
- Graceful handling of 404 (auto-register)

**Profile** (`frontend/src/pages/auth/Profile.jsx`)
- Form validation error display
- Field-specific error messages
- Success/error state management
- Network error handling with retry

## Testing

### Running Tests

1. **Start the backend server:**
   ```powershell
   cd backend
   npm install
   npm run dev
   ```

2. **Run the error handling test suite:**
   ```powershell
   node backend/test_scripts/test-error-handling.js
   ```

### Test Coverage

The test script verifies:
1. ✅ 200 Success responses have correct format
2. ✅ 404 Not Found errors return standardized format
3. ✅ 401 Unauthorized errors include error codes
4. ✅ 400 Validation errors list field-specific issues
5. ✅ Network timeouts are handled gracefully
6. ✅ Invalid JSON requests return appropriate errors

### Manual Testing Scenarios

#### Test 1: Duplicate Email Registration
1. Register a user with an email
2. Try to register again with same email
3. **Expected**: 409 error with message "An account with this email already exists"
4. **Verify**: Field error shows for email field

#### Test 2: Validation Errors
1. Go to Profile page
2. Clear email field or enter invalid email
3. Click Save
4. **Expected**: Red error message with specific field errors listed
5. **Verify**: Inline error appears under email field

#### Test 3: Network Error with Retry
1. Stop the backend server
2. Try to save profile or load dashboard
3. **Expected**: Network error message with "Try Again" button
4. **Verify**: Can retry when server is back online

#### Test 4: Unauthorized Access
1. Clear browser storage (localStorage)
2. Try to access /dashboard without login
3. **Expected**: Redirect to login
4. With invalid token, expect 401 error with clear message

#### Test 5: 404 Not Found
1. Navigate to non-existent API endpoint
2. **Expected**: 404 error with message "Cannot GET /api/nonexistent"
3. **Verify**: Includes errorCode field

## Acceptance Criteria Verification

| Criteria | Status | Implementation |
|----------|--------|----------------|
| All API errors return standardized JSON format | ✅ | `responseFormat.js`, `errorHandler.js` |
| Error responses include error code and user-friendly message | ✅ | All responses include `errorCode` and `message` |
| Validation errors list specific field issues | ✅ | `validationErrorResponse()` function |
| 500 errors logged server-side but return generic message | ✅ | `errorHandler.js` logs details, returns generic message |
| Duplicate email registration shows appropriate error | ✅ | `authController.js` - 409 with DUPLICATE_ENTRY code |
| Form validation errors displayed clearly to users | ✅ | `ErrorMessage` and `FieldError` components |
| Network errors handled gracefully with retry options | ✅ | Axios interceptors + `retryRequest()` function |

## API Error Response Examples

### Success Response
```json
{
  "success": true,
  "message": "User registered successfully",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "data": { /* user data */ }
}
```

### Validation Error (400)
```json
{
  "success": false,
  "message": "Missing required fields",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "errorCode": 2001,
  "errors": [
    {
      "field": "company",
      "message": "company is required",
      "value": null
    },
    {
      "field": "position",
      "message": "position is required",
      "value": null
    }
  ]
}
```

### Duplicate Error (409)
```json
{
  "success": false,
  "message": "An account with this email already exists",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "errorCode": 3003,
  "errors": [
    {
      "field": "email",
      "message": "This email is already registered",
      "value": "user@example.com"
    }
  ]
}
```

### Unauthorized Error (401)
```json
{
  "success": false,
  "message": "Unauthorized: Invalid or missing authentication token",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "errorCode": 1001
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "User not found",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "errorCode": 3001
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "An unexpected error occurred. Please try again later.",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "errorCode": 5001
}
```

## Files Modified/Created

### Backend
- ✅ `src/utils/responseFormat.js` - Enhanced with error codes and validation errors
- ✅ `src/middleware/errorHandler.js` - New global error handler
- ✅ `src/middleware/checkJwt.js` - Updated with standardized errors
- ✅ `src/controllers/authController.js` - Enhanced error handling
- ✅ `src/controllers/userController.js` - Enhanced error handling
- ✅ `src/controllers/profileController.js` - Enhanced error handling
- ✅ `src/server.js` - Integrated error middleware
- ✅ `test_scripts/test-error-handling.js` - New test suite

### Frontend
- ✅ `src/api/axios.js` - Added interceptors and retry logic
- ✅ `src/components/ErrorMessage.jsx` - New error display component
- ✅ `src/components/ErrorBoundary.jsx` - New error boundary
- ✅ `src/pages/auth/Dashboard.jsx` - Enhanced with error handling
- ✅ `src/pages/auth/Profile.jsx` - Enhanced with error handling
- ✅ `src/App.jsx` - Wrapped with ErrorBoundary

## Usage Examples

### Backend - Creating Error Responses

```javascript
// Simple error
const { response, statusCode } = errorResponse(
  "User not found", 
  404, 
  ERROR_CODES.NOT_FOUND
);
return sendResponse(res, response, statusCode);

// Validation error with field details
const { response, statusCode } = validationErrorResponse(
  "Missing required fields",
  [
    { field: 'email', message: 'Email is required', value: null },
    { field: 'name', message: 'Name is required', value: null }
  ]
);
return sendResponse(res, response, statusCode);

// Using asyncHandler wrapper (automatically catches errors)
export const myController = asyncHandler(async (req, res) => {
  // Any thrown error will be caught by global error handler
  const user = await User.findById(req.params.id);
  if (!user) throw new Error('User not found');
  // ...
});
```

### Frontend - Handling Errors

```javascript
import api, { retryRequest, getErrorMessage, getValidationErrors } from '../api/axios';
import ErrorMessage from '../components/ErrorMessage';

function MyComponent() {
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      // Option 1: Direct call
      await api.post('/api/users/me', data);
      
      // Option 2: With retry
      await retryRequest(() => api.post('/api/users/me', data));
      
    } catch (err) {
      setError(err);
      
      // Extract user-friendly message
      const message = getErrorMessage(err);
      
      // Get field-specific errors
      const fieldErrors = getValidationErrors(err);
    }
  };

  return (
    <div>
      <ErrorMessage
        error={error}
        onRetry={handleSubmit}
        onDismiss={() => setError(null)}
      />
      {/* Your form */}
    </div>
  );
}
```

## Best Practices

1. **Always use asyncHandler** for async route handlers to ensure errors are caught
2. **Provide specific error codes** to help frontend distinguish error types
3. **Include field details** for validation errors to enable inline error display
4. **Log server errors** with full context for debugging
5. **Return generic messages** for 500 errors to avoid exposing internals
6. **Use retry logic** for network-related errors
7. **Display errors prominently** but allow users to dismiss them
8. **Validate early** to catch errors before expensive operations

## Troubleshooting

### Backend Issues
- **Errors not caught**: Ensure route handlers use `asyncHandler` wrapper
- **Missing error codes**: Import `ERROR_CODES` from responseFormat.js
- **Validation not working**: Check Mongoose schema has `required` fields

### Frontend Issues
- **Errors not displaying**: Check error state is passed to `ErrorMessage` component
- **Retry not working**: Verify error has `canRetry` flag set
- **Field errors not showing**: Use `FieldError` component with correct field name

## Future Enhancements

1. Error logging service integration (Sentry, LogRocket)
2. Error analytics dashboard
3. User error reporting feature
4. Localization of error messages
5. Rate limiting error responses
6. More specific error codes for business logic errors
