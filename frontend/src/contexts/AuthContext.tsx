import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  


  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        
        // Check for existing session
        const token = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user');

        console.log('🔍 Token found:', !!token);
        console.log('🔍 Saved user found:', !!savedUser);

        // Only restore user if both token and user data exist
        if (token && savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            // Basic validation - check if user data has required fields
            if (userData && userData.id && userData.email) {
              setUser(userData);
              console.log('✅ User restored from localStorage');
            } else {
              console.log('❌ Invalid user data - clearing storage');
              localStorage.removeItem('access_token');
              localStorage.removeItem('user');
              setUser(null);
            }
          } catch (parseError) {
            console.error('❌ Error parsing user data:', parseError);
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          console.log('ℹ️ No valid session found - user not authenticated');
          // Clear any partial data
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error during auth initialization:', error);
        // Clear everything on error
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        console.log('✅ Auth initialization complete');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Always use real authentication - no more mock fallback
      try {
        console.log('🔐 Attempting login...');
        const response: AuthResponse = await authAPI.login({ email, password });
        console.log('✅ Login successful, saving token and user');
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
      } catch (error: any) {
        console.error('❌ Login failed:', error);
        throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (userData: any) => {
    // Always use real authentication - no more mock fallback
      try {
        console.log('📝 Attempting registration...');
        const response: AuthResponse = await authAPI.register(userData);
        console.log('✅ Registration successful, saving token and user');
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
      } catch (error: any) {
        console.error('❌ Registration failed:', error);
        throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = () => {
    console.log('🚪 Logging out, clearing storage');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('mock_user');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    console.log('🔄 Updating user in context and localStorage');
    console.log('📊 New user data:', {
      userId: userData.id,
      userName: userData.full_name,
      hasProfilePicture: !!userData.profile_picture,
      profilePictureLength: userData.profile_picture?.length || 0,
      profilePicturePreview: userData.profile_picture?.substring(0, 100) + '...' || 'None'
    });
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('✅ User updated in context and localStorage');
  };

  // Set up periodic token refresh (every 12 hours)
  useEffect(() => {
    if (user) {
      const refreshInterval = setInterval(async () => {
        try {
          const refreshResponse = await authAPI.refreshToken();
          localStorage.setItem('access_token', refreshResponse.access_token);
          console.log('🔄 Token refreshed automatically');
        } catch (error) {
          console.error('❌ Automatic token refresh failed:', error);
          // Don't logout immediately, let the 401 interceptor handle it
        }
      }, 12 * 60 * 60 * 1000); // 12 hours

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 