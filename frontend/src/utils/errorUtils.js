// Standardized error message extraction
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Check if error is related to authentication
export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};

// Check if error is a validation error
export const isValidationError = (error) => {
  return error.response?.status === 400;
};