/**
 * Development Helper Functions
 * These functions help with testing and development
 */

export const clearMockSession = () => {
  localStorage.removeItem('mock_user');
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  console.log('🧹 Mock session cleared');
  window.location.reload();
};

export const checkBackendStatus = async () => {
  try {
    const response = await fetch('http://localhost:8000/health');
    if (response.ok) {
      const data = await response.json();
      console.log('🔍 Backend Status:', data);
      return data;
    } else {
      console.log('❌ Backend not responding');
      return null;
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error);
    return null;
  }
};

export const getCurrentAuthMode = () => {
  const mockUser = localStorage.getItem('mock_user');
  const realToken = localStorage.getItem('access_token');
  
  if (realToken) {
    return 'real';
  } else if (mockUser) {
    return 'mock';
  } else {
    return 'none';
  }
};

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).devHelpers = {
    clearMockSession,
    checkBackendStatus,
    getCurrentAuthMode
  };
} 