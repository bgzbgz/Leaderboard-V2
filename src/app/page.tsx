'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check for admin access codes first
      if (accessCode === 'ADMIN001' || accessCode === 'FASTTRACK_ADMIN') {
        router.push('/admin');
        return;
      }

      // Check teams table
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (teamData && !teamError) {
        router.push(`/client?code=${accessCode}`);
        return;
      }

      // Check associates table
      const { data: associateData, error: associateError } = await supabase
        .from('associates')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (associateData && !associateError) {
        router.push(`/associate?code=${accessCode}`);
        return;
      }

      // If not found in either table
      setError('Invalid access code');
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Fast Track Logo */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="Fast Track Leaderboard" 
              className="h-24 w-auto"
            />
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-lg p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="accessCode"
                className="block text-black text-sm font-medium mb-3 font-body"
              >
                Enter your access code
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-4 py-3 bg-white text-black rounded-lg border-2 border-black focus:outline-none focus:ring-2 focus:ring-red-500 text-base font-body"
                placeholder="Enter access code"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-body bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium text-base hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-heading"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  CHECKING...
                </div>
              ) : (
                'VIEW LEADERBOARD'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="text-gray-400 text-xs font-body">
            Enter your unique access code to view your dashboard
          </div>
        </div>
      </div>
    </div>
  );
}
