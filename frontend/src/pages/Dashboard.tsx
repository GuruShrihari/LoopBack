import React from 'react';
import { Layout } from '../components/Layout';

export const Dashboard = () => {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome to LoopBack. Your recruitment data will live here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group">
          <h3 className="text-lg font-medium mb-1 text-gray-300">Active Applications</h3>
          <p className="text-3xl font-bold text-indigo-400 group-hover:scale-105 transform origin-left transition-transform">0</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group">
          <h3 className="text-lg font-medium mb-1 text-gray-300">Interviews Scheduled</h3>
          <p className="text-3xl font-bold text-indigo-400 group-hover:scale-105 transform origin-left transition-transform">0</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group">
          <h3 className="text-lg font-medium mb-1 text-gray-300">Offers Received</h3>
          <p className="text-3xl font-bold text-indigo-400 group-hover:scale-105 transform origin-left transition-transform">0</p>
        </div>
      </div>
    </Layout>
  );
};
