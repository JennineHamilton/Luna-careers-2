import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna/card';
import { LunaButton } from '@/components/luna/button';
import { Ban, LogOut, Mail } from 'lucide-react';
import Link from 'next/link';

export default async function SuspendedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not authenticated, redirect to login
  if (!user) {
    redirect('/login');
  }

  // If user is not suspended, redirect to their dashboard
  const isSuspended = user.user_metadata?.is_suspended || false;
  if (!isSuspended) {
    const accountType = user.user_metadata?.account_type || 'personal';
    const currentContext = user.user_metadata?.current_context || 'personal';

    let dashboardPath = '/u/dashboard';
    if (accountType === 'platformAdmin') {
      dashboardPath = '/cmd/dashboard';
    } else if (accountType === 'organization') {
      dashboardPath = '/org/dashboard';
    } else if (accountType === 'hybrid') {
      dashboardPath = currentContext === 'organization' ? '/org/dashboard' : '/u/dashboard';
    }

    redirect(dashboardPath);
  }

  const params = await searchParams;
  const suspensionReason = params.reason || user.user_metadata?.suspension_reason || 'Your account has been suspended.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-luna-gray-50 p-4">
      <LunaCard className="max-w-md w-full">
        <LunaCardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-luna-error/10 rounded-full flex items-center justify-center mb-4">
            <Ban className="w-8 h-8 text-luna-error" />
          </div>
          <LunaCardTitle className="text-2xl">Account Suspended</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-luna-gray-700">
              Your account has been temporarily suspended and you cannot access the platform at this time.
            </p>

            {suspensionReason && (
              <div className="mt-4 p-4 bg-luna-gray-100 rounded-lg">
                <p className="text-sm font-medium text-luna-gray-900 mb-1">Reason:</p>
                <p className="text-sm text-luna-gray-700">{suspensionReason}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-luna-gray-600 text-center">
              If you believe this is a mistake or would like to appeal this suspension, please contact our support team.
            </p>

            <div className="flex flex-col gap-2">
              <Link
                href="mailto:support@lunacareers.com"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luna-blue focus-visible:ring-offset-2 border border-luna-blue text-luna-blue hover:bg-luna-blue hover:text-white bg-transparent px-4 py-2 text-base w-full"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </Link>

              <form action="/auth/signout" method="post" className="w-full">
                <LunaButton
                  type="submit"
                  variant="ghost"
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </LunaButton>
              </form>
            </div>
          </div>
        </LunaCardContent>
      </LunaCard>
    </div>
  );
}

