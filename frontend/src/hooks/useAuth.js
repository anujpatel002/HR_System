import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { getProfile, setCredentials } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  };
};