import PropTypes from 'prop-types';
import Icon from './Icon';

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
          <Icon name="XCircle" size="md" className="text-red-400" />
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
              <Icon name="X" size="md" className="text-red-500" />
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
