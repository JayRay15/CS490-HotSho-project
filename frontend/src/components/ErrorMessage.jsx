import PropTypes from 'prop-types';

/**
 * ErrorMessage Component
 * Displays error messages in a consistent, user-friendly format
 */
export default function ErrorMessage({ 
  error, 
  onRetry, 
  onDismiss,
  className = "" 
}) {
  if (!error) return null;

  const isNetworkError = error.customError?.isNetworkError || false;
  const canRetry = error.customError?.canRetry || false;
  const message = error.customError?.message || error.message || "An error occurred";
  const fieldErrors = error.customError?.errors || [];

  return (
    <div className={`rounded-lg border border-red-300 bg-red-50 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-heading font-medium text-red-800">
            {isNetworkError ? "Network Error" : "Error"}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
            
            {/* Display field-specific validation errors */}
            {fieldErrors.length > 0 && (
              <ul className="mt-2 list-disc list-inside space-y-1">
                {fieldErrors.map((fieldError, index) => (
                  <li key={index}>
                    <span className="font-medium">{fieldError.field}:</span>{" "}
                    {fieldError.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-3">
            {canRetry && onRetry && (
              <button
                onClick={onRetry}
                className="text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm font-medium text-red-800 hover:text-red-900"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>

        {/* Dismiss X button */}
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

ErrorMessage.propTypes = {
  error: PropTypes.object,
  onRetry: PropTypes.func,
  onDismiss: PropTypes.func,
  className: PropTypes.string
};

/**
 * Inline field error component for form fields
 */
export function FieldError({ error, fieldName }) {
  if (!error?.customError?.errors) return null;

  const fieldError = error.customError.errors.find(
    (err) => err.field === fieldName
  );

  if (!fieldError) return null;

  return (
    <p className="mt-1 text-sm text-red-600">
      {fieldError.message}
    </p>
  );
}

FieldError.propTypes = {
  error: PropTypes.object,
  fieldName: PropTypes.string.isRequired
};
