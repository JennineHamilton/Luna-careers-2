'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LunaButton } from '@/components/luna/button';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna/card';

export default function DebugPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const checkUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/user');
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/debug/refresh-session', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Session refreshed! Redirecting to correct dashboard...');
        // Wait a moment for session to update
        setTimeout(() => {
          router.push(data.redirect_to);
          router.refresh();
        }, 500);
      } else {
        alert('Failed to refresh session: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      alert('Failed to refresh session');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-luna-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-luna-navy mb-8">Debug User Session</h1>

        <div className="space-y-4">
          <LunaCard>
            <LunaCardHeader>
              <LunaCardTitle>Check Current User Data</LunaCardTitle>
            </LunaCardHeader>
            <LunaCardContent>
              <LunaButton onClick={checkUser} loading={loading}>
                Check User Data
              </LunaButton>

              {userData && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-luna-gray-900 mb-2">Auth User:</h3>
                    <pre className="bg-luna-gray-100 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(userData.auth_user, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold text-luna-gray-900 mb-2">Database User:</h3>
                    <pre className="bg-luna-gray-100 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(userData.database_user, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold text-luna-gray-900 mb-2">Routing Info:</h3>
                    <pre className="bg-luna-gray-100 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(userData.routing_info, null, 2)}
                    </pre>
                  </div>

                  {userData.routing_info?.account_type === 'platformAdmin' && (
                    <div className="bg-luna-blue/10 border border-luna-blue p-4 rounded">
                      <p className="text-luna-blue font-semibold mb-2">
                        ✓ Your account_type is correct: platformAdmin
                      </p>
                      <p className="text-sm text-luna-gray-700">
                        Expected dashboard: {userData.routing_info.expected_dashboard}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </LunaCardContent>
          </LunaCard>

          <LunaCard>
            <LunaCardHeader>
              <LunaCardTitle>Refresh Session</LunaCardTitle>
            </LunaCardHeader>
            <LunaCardContent>
              <p className="text-sm text-luna-gray-600 mb-4">
                If your database shows platformAdmin but you're still being routed to /u/dashboard,
                click this button to force refresh your session from the database.
              </p>
              <LunaButton 
                onClick={refreshSession} 
                loading={refreshing}
                variant="primary"
              >
                Refresh Session & Redirect
              </LunaButton>
            </LunaCardContent>
          </LunaCard>

          <LunaCard>
            <LunaCardHeader>
              <LunaCardTitle>Manual Steps</LunaCardTitle>
            </LunaCardHeader>
            <LunaCardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-luna-gray-700">
                <li>Click "Check User Data" above to see your current session</li>
                <li>If account_type shows "platformAdmin", click "Refresh Session & Redirect"</li>
                <li>If that doesn't work, log out and log back in</li>
                <li>If still not working, clear browser cookies and try again</li>
              </ol>
            </LunaCardContent>
          </LunaCard>
        </div>
      </div>
    </div>
  );
}

