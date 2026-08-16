import React from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">
              L
            </div>
            <span className="font-semibold text-lg tracking-tight">LoopBack</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-400">
              Logged in as <span className="text-white font-medium">{user?.full_name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome to LoopBack. Your recruitment data will live here.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder Cards */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-medium mb-1">Active Applications</h3>
            <p className="text-3xl font-bold text-indigo-400">0</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-medium mb-1">Interviews Scheduled</h3>
            <p className="text-3xl font-bold text-indigo-400">0</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-medium mb-1">Offers Received</h3>
            <p className="text-3xl font-bold text-indigo-400">0</p>
          </div>
        </div>
      </main>
    </div>
  );
};
