import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  CheckSquare, 
  BarChart3, 
  User, 
  LogOut,
  Menu,
  X,
  Calendar,
  History
} from 'lucide-react';
import { useState } from 'react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Save current path for page persistence
  React.useEffect(() => {
    if (location.pathname !== '/login' && location.pathname !== '/register') {
      localStorage.setItem('intendedPath', location.pathname);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'History', href: '/task-history', icon: History },
  ];

  // Helper function to check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)} 
        />
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-semibold text-gray-900">Task Manager</h1>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 ${
                    active
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-6 w-6 transition-colors duration-200 ${
                    active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Mobile User Profile Section */}
          <div className="border-t border-gray-200 p-4">
            <Link 
              to="/profile" 
              className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="flex-shrink-0">
                {user?.profile_picture ? (
                  <img 
                    src={user.profile_picture}
                    alt="Profile" 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-semibold text-gray-900">Task Manager</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 ${
                    active
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`mr-3 h-6 w-6 transition-colors duration-200 ${
                    active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <Link 
              to="/profile" 
              className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            >
              <div className="flex-shrink-0">
                {user?.profile_picture ? (
                  <img 
                    src={user.profile_picture}
                    alt="Profile" 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-gray-100 rounded-md transition-colors duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
            Task Manager
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 