import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef } from 'react';
import { getProfile, setCredentials } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Only check once per session to avoid repeated API calls
    if (!hasCheckedAuth.current && !isAuthenticated && !isLoading) {
      hasCheckedAuth.current = true;
      dispatch(getProfile()).catch(() => {
        // Silently fail if not authenticated
      });
    }
  }, [dispatch, isAuthenticated, isLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  };
};