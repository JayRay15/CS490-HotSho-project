/**
 * ValidationPanel Component (UC-053)
 * Displays validation results with categorized issues
 */

import React from 'react';
import PropTypes from 'prop-types';
import Card from '../Card';
import Button from '../Button';

const ValidationPanel = ({ validation, onClose, onFixIssue }) => {
  if (!validation) return null;

  const { isValid, errors = [], warnings = [], summary, pageCount } = validation;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getIssuesByType = (issues) => {
    const grouped = {};
    issues.forEach(issue => {
      const type = issue.type || 'other';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(issue);
    });
    return grouped;
  };

  const renderIssue = (issue, index) => {
    const { type, field, message, severity, context, replacements, section } = issue;
    
    return (
      <div 
        key={index}
        className={`p-3 rounded-lg border ${getSeverityColor(severity)} mb-2`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            {getSeverityIcon(severity)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm capitalize">
                {type === 'contact_info' ? 'Contact Information' : type.replace('_', ' ')}
                {field && ` - ${field}`}
              </p>
              {section && (
                <span className="text-xs px-2 py-0.5 bg-white rounded">
                  {section}
                </span>
              )}
            </div>
            <p className="text-sm mb-2">{message}</p>
            
            {context && (
              <div className="text-xs bg-white p-2 rounded border border-gray-200 mb-2">
                <span className="font-medium">Context: </span>
                <span className="font-mono">{context}</span>
              </div>
            )}
            
            {replacements && replacements.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium mb-1">Suggestions:</p>
                <div className="flex flex-wrap gap-1">
                  {replacements.map((replacement, idx) => (
                    <button
                      key={idx}
                      onClick={() => onFixIssue && onFixIssue(issue, replacement)}
                      className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                    >
                      {replacement}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-heading font-semibold">Resume Validation Results</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Close validation panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Summary Card */}
      <div className={`p-4 rounded-lg mb-4 ${isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {isValid ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h4 className={`text-lg font-semibold ${isValid ? 'text-green-800' : 'text-red-800'}`}>
              {isValid ? 'Resume Validation Passed!' : 'Resume Validation Found Issues'}
            </h4>
            <p className={`text-sm ${isValid ? 'text-green-700' : 'text-red-700'}`}>
              {summary?.totalErrors || 0} error{summary?.totalErrors !== 1 ? 's' : ''} and {summary?.totalWarnings || 0} warning{summary?.totalWarnings !== 1 ? 's' : ''} found
            </p>
            {pageCount && (
              <p className="text-sm text-gray-600 mt-1">
                Resume length: {pageCount} page{pageCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Errors Section */}
      {errors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Errors ({errors.length}) - Must Fix Before Export
          </h4>
          <div className="space-y-2">
            {Object.entries(getIssuesByType(errors)).map(([type, typeErrors]) => (
              <div key={type}>
                <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                  {type.replace('_', ' ')} ({typeErrors.length})
                </h5>
                {typeErrors.map((error, idx) => renderIssue(error, `error-${type}-${idx}`))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-yellow-700 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Warnings ({warnings.length}) - Recommended to Fix
          </h4>
          <div className="space-y-2">
            {Object.entries(getIssuesByType(warnings)).map(([type, typeWarnings]) => (
              <div key={type}>
                <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                  {type.replace('_', ' ')} ({typeWarnings.length})
                </h5>
                {typeWarnings.map((warning, idx) => renderIssue(warning, `warning-${type}-${idx}`))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {isValid && errors.length === 0 && warnings.length === 0 && (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-lg font-medium text-gray-800">Perfect! Your resume looks great.</p>
          <p className="text-sm text-gray-600 mt-1">You can now export your resume.</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {!isValid && (
          <Button variant="primary" onClick={onClose}>
            Fix Issues
          </Button>
        )}
      </div>
    </Card>
  );
};

ValidationPanel.propTypes = {
  validation: PropTypes.shape({
    isValid: PropTypes.bool.isRequired,
    errors: PropTypes.array,
    warnings: PropTypes.array,
    pageCount: PropTypes.number,
    summary: PropTypes.shape({
      totalErrors: PropTypes.number,
      totalWarnings: PropTypes.number,
      contactInfoValid: PropTypes.bool,
      grammarIssues: PropTypes.number,
    }),
  }),
  onClose: PropTypes.func.isRequired,
  onFixIssue: PropTypes.func,
};

export default ValidationPanel;
