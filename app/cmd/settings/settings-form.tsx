'use client';

import { User, Lock, Bell, Save, Loader2, DollarSign, CreditCard } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LunaCard } from '@/components/luna/card';
import { LunaInput } from '@/components/luna/input';
import { LunaButton } from '@/components/luna/button';
import { LunaSwitch } from '@/components/luna/switch';
import { useState } from 'react';
import { updatePassword } from '@/lib/auth/actions';

interface AdminSettingsFormProps {
  initialProfile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
  initialPaymentSettings: Record<string, any>;
}

export function AdminSettingsForm({ initialProfile, initialPaymentSettings }: AdminSettingsFormProps) {
  // Profile state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(initialProfile.first_name || '');
  const [lastName, setLastName] = useState(initialProfile.last_name || '');
  const [email] = useState(initialProfile.email || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(
    initialPaymentSettings.notify_email !== undefined ? initialPaymentSettings.notify_email : true
  );
  const [securityAlerts, setSecurityAlerts] = useState(
    initialPaymentSettings.notify_security !== undefined ? initialPaymentSettings.notify_security : true
  );
  const [weeklyReports, setWeeklyReports] = useState(
    initialPaymentSettings.notify_weekly_reports !== undefined ? initialPaymentSettings.notify_weekly_reports : false
  );
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);

  // Platform payment settings state
  const [savingPaymentSettings, setSavingPaymentSettings] = useState(false);
  const [paymentSettingsError, setPaymentSettingsError] = useState<string | null>(null);
  const [paymentSettingsSuccess, setPaymentSettingsSuccess] = useState<string | null>(null);

  const [bankName, setBankName] = useState(initialPaymentSettings.bank_name || '');
  const [bankAccountName, setBankAccountName] = useState(initialPaymentSettings.bank_account_name || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(initialPaymentSettings.bank_account_number || '');
  const [creditsPerDollar, setCreditsPerDollar] = useState(String(initialPaymentSettings.credits_per_dollar || '100'));
  const [cashbackPercentage, setCashbackPercentage] = useState(String(initialPaymentSettings.cashback_percentage || '10'));
  const [paymentMethodCredits, setPaymentMethodCredits] = useState(initialPaymentSettings.payment_method_credits || false);
  const [paymentMethodBankTransfer, setPaymentMethodBankTransfer] = useState(initialPaymentSettings.payment_method_bank_transfer || false);
  const [paymentMethodDigiWallet, setPaymentMethodDigiWallet] = useState(initialPaymentSettings.payment_method_digiWallet || false);
  const [paymentMethodCreditCard, setPaymentMethodCreditCard] = useState(initialPaymentSettings.payment_method_credit_card || false);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, phone }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to update profile'); setIsSaving(false); return; }
      setSuccess('Profile updated successfully!');
      setIsSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError('Failed to update profile'); setIsSaving(false); }
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError('Please fill in all password fields'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters long'); return; }
    setIsUpdatingPassword(true);
    const result = await updatePassword(currentPassword, newPassword);
    if (!result.success) { setPasswordError(result.error || 'Failed to update password'); setIsUpdatingPassword(false); return; }
    setPasswordSuccess('Password updated successfully!');
    setNewPassword(''); setConfirmPassword(''); setCurrentPassword('');
    setIsUpdatingPassword(false);
    setTimeout(() => setPasswordSuccess(null), 3000);
  };

  // Handle notification settings update
  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    setNotificationError(null);
    setNotificationSuccess(null);
    try {
      const response = await fetch('/api/payments/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { notify_email: emailNotifications, notify_security: securityAlerts, notify_weekly_reports: weeklyReports } }),
      });
      const data = await response.json();
      if (!response.ok) { setNotificationError(data.error || 'Failed to save notification settings'); setSavingNotifications(false); return; }
      setNotificationSuccess('Notification settings saved!');
      setSavingNotifications(false);
      setTimeout(() => setNotificationSuccess(null), 3000);
    } catch (err) { setNotificationError('Failed to save notification settings'); setSavingNotifications(false); }
  };

  // Handle payment settings update
  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPaymentSettings(true);
    setPaymentSettingsError(null);
    setPaymentSettingsSuccess(null);
    try {
      const response = await fetch('/api/payments/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            bank_name: bankName, bank_account_name: bankAccountName, bank_account_number: bankAccountNumber,
            credits_per_dollar: parseInt(creditsPerDollar) || 100, cashback_percentage: parseFloat(cashbackPercentage) || 10,
            payment_method_credits: paymentMethodCredits, payment_method_bank_transfer: paymentMethodBankTransfer,
            payment_method_digiWallet: paymentMethodDigiWallet, payment_method_credit_card: paymentMethodCreditCard,
          }
        }),
      });
      const data = await response.json();
      if (!response.ok) { setPaymentSettingsError(data.error || 'Failed to update payment settings'); setSavingPaymentSettings(false); return; }
      setPaymentSettingsSuccess('Payment settings updated successfully!');
      setSavingPaymentSettings(false);
      setTimeout(() => setPaymentSettingsSuccess(null), 3000);
    } catch (err) { setPaymentSettingsError('Failed to update payment settings'); setSavingPaymentSettings(false); }
  };

  return (
    <div>
      <AdminPageHeader title="Settings" description="Manage your account preferences and security" />

      <div className="space-y-6 max-w-4xl">
        {error && (<div className="bg-red-50 border border-red-200 rounded-md p-4"><p className="text-sm text-red-800">{error}</p></div>)}
        {success && (<div className="bg-green-50 border border-green-200 rounded-md p-4"><p className="text-sm text-green-800">{success}</p></div>)}

        {/* Profile Settings */}
        <LunaCard>
          <form onSubmit={handleProfileUpdate}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-md bg-luna-blue/10 flex items-center justify-center"><User className="w-5 h-5 text-luna-blue" /></div>
                <div>
                  <h2 className="text-lg font-semibold text-luna-gray-900">Profile Settings</h2>
                  <p className="text-sm text-luna-gray-600">Update your personal information</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-luna-gray-700 mb-2">First Name</label>
                    <LunaInput placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-luna-gray-700 mb-2">Last Name</label>
                    <LunaInput placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-luna-gray-700 mb-2">Email Address</label>
                  <LunaInput type="email" placeholder="admin@lunacareers.com" value={email} disabled />
                  <p className="text-xs text-luna-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-luna-gray-700 mb-2">Phone Number</label>
                  <LunaInput type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="flex justify-end">
                  <LunaButton variant="primary" type="submit" disabled={isSaving}>
                    {isSaving ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : (<><Save className="w-4 h-4" />Save Changes</>)}
                  </LunaButton>
                </div>
              </div>
            </div>
          </form>
        </LunaCard>

        {/* Security Settings */}
        <LunaCard>
          <form onSubmit={handlePasswordUpdate}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-md bg-luna-blue/10 flex items-center justify-center"><Lock className="w-5 h-5 text-luna-blue" /></div>
                <div>
                  <h2 className="text-lg font-semibold text-luna-gray-900">Security</h2>
                  <p className="text-sm text-luna-gray-600">Manage your password and security preferences</p>
                </div>
              </div>
              {passwordError && (<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4"><p className="text-sm text-red-800">{passwordError}</p></div>)}
              {passwordSuccess && (<div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4"><p className="text-sm text-green-800">{passwordSuccess}</p></div>)}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-luna-gray-700 mb-2">Current Password</label>
                  <LunaInput type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-luna-gray-700 mb-2">New Password</label>
                    <LunaInput type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-luna-gray-700 mb-2">Confirm Password</label>
                    <LunaInput type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-luna-gray-500">Password must be at least 8 characters long</p>
                <div className="flex justify-end">
                  <LunaButton variant="primary" type="submit" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? (<><Loader2 className="w-4 h-4 animate-spin" />Updating...</>) : (<><Lock className="w-4 h-4" />Update Password</>)}
                  </LunaButton>
                </div>
              </div>
            </div>
          </form>
        </LunaCard>

        {/* Notification Settings */}
        <LunaCard>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-md bg-luna-blue/10 flex items-center justify-center"><Bell className="w-5 h-5 text-luna-blue" /></div>
              <div>
                <h2 className="text-lg font-semibold text-luna-gray-900">Notifications</h2>
                <p className="text-sm text-luna-gray-600">Configure how you receive notifications</p>
              </div>
            </div>
            {notificationError && (<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4"><p className="text-sm text-red-800">{notificationError}</p></div>)}
            {notificationSuccess && (<div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4"><p className="text-sm text-green-800">{notificationSuccess}</p></div>)}
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-luna-border-default">
                <div><p className="font-medium text-luna-gray-900">Email Notifications</p><p className="text-sm text-luna-gray-600">Receive email updates about platform activity</p></div>
                <LunaSwitch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-luna-border-default">
                <div><p className="font-medium text-luna-gray-900">Security Alerts</p><p className="text-sm text-luna-gray-600">Get notified about security events</p></div>
                <LunaSwitch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
              </div>
              <div className="flex items-center justify-between py-3">
                <div><p className="font-medium text-luna-gray-900">Weekly Reports</p><p className="text-sm text-luna-gray-600">Receive weekly platform analytics reports</p></div>
                <LunaSwitch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
              </div>
              <div className="flex justify-end pt-2">
                <LunaButton variant="primary" onClick={handleSaveNotifications} disabled={savingNotifications}>
                  {savingNotifications ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : (<><Save className="w-4 h-4" />Save Notification Settings</>)}
                </LunaButton>
              </div>
            </div>
          </div>
        </LunaCard>

        {/* Platform Payment Settings */}
        <LunaCard>
          <form onSubmit={handleSavePaymentSettings}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-md bg-luna-blue/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-luna-blue" /></div>
                <div>
                  <h2 className="text-lg font-semibold text-luna-gray-900">Platform Payment Settings</h2>
                  <p className="text-sm text-luna-gray-600">Manage bank account information and payment methods</p>
                </div>
              </div>
              {paymentSettingsError && (<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"><p className="text-sm text-red-600">{paymentSettingsError}</p></div>)}
              {paymentSettingsSuccess && (<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md"><p className="text-sm text-green-600">{paymentSettingsSuccess}</p></div>)}
              <div className="space-y-6">
                {/* Bank Account Information */}
                <div>
                  <h3 className="text-sm font-semibold text-luna-gray-900 mb-3">Bank Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium text-luna-gray-700 mb-2">Bank Name</label><LunaInput type="text" placeholder="Luna Careers Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} /></div>
                    <div><label className="block text-sm font-medium text-luna-gray-700 mb-2">Account Name</label><LunaInput type="text" placeholder="Luna Careers Ltd" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} /></div>
                    <div><label className="block text-sm font-medium text-luna-gray-700 mb-2">Account Number</label><LunaInput type="text" placeholder="1234567890" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} /></div>
                  </div>
                </div>
                {/* Credit System Settings */}
                <div>
                  <h3 className="text-sm font-semibold text-luna-gray-900 mb-3">Credit System Settings</h3>
                  <div className="bg-luna-blue-50 border border-luna-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-luna-gray-700 mb-2">Credits Per Dollar</label>
                        <LunaInput type="number" min="1" step="1" placeholder="100" value={creditsPerDollar} onChange={(e) => setCreditsPerDollar(e.target.value)} />
                        <p className="text-xs text-luna-gray-600 mt-1">How many credits equal $1</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-luna-gray-700 mb-2">Cashback Percentage</label>
                        <LunaInput type="number" min="0" max="100" step="0.1" placeholder="10" value={cashbackPercentage} onChange={(e) => setCashbackPercentage(e.target.value)} />
                        <p className="text-xs text-luna-gray-600 mt-1">Percentage of purchase returned as credits</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-md p-3 border border-luna-border-default">
                      <p className="text-xs text-luna-gray-600 mb-1">Examples:</p>
                      <ul className="text-xs text-luna-gray-700 space-y-0.5">
                        <li>• $10 course = {parseInt(creditsPerDollar || '100') * 10} credits</li>
                        <li>• $50 module = {parseInt(creditsPerDollar || '100') * 50} credits</li>
                        <li>• {parseFloat(cashbackPercentage || '10')}% cashback on $50 = {Math.round(parseInt(creditsPerDollar || '100') * 50 * (parseFloat(cashbackPercentage || '10') / 100))} credits earned</li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* Payment Methods */}
                <div>
                  <h3 className="text-sm font-semibold text-luna-gray-900 mb-3">Enabled Payment Methods</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-luna-border-default">
                      <div><p className="font-medium text-luna-gray-900">Credit Wallet Payments</p><p className="text-sm text-luna-gray-600">Allow users to pay with learning credits</p></div>
                      <LunaSwitch checked={paymentMethodCredits} onCheckedChange={setPaymentMethodCredits} />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-luna-border-default">
                      <div><p className="font-medium text-luna-gray-900">Bank Transfer Payments</p><p className="text-sm text-luna-gray-600">Allow users to pay via bank transfer (requires admin approval)</p></div>
                      <LunaSwitch checked={paymentMethodBankTransfer} onCheckedChange={setPaymentMethodBankTransfer} />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-luna-border-default">
                      <div><p className="font-medium text-luna-gray-900">DigiWallet Payments</p><p className="text-sm text-luna-gray-600">Allow users to pay with DigiWallet mobile payment</p></div>
                      <LunaSwitch checked={paymentMethodDigiWallet} onCheckedChange={setPaymentMethodDigiWallet} />
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div><p className="font-medium text-luna-gray-900">Credit Card Payments</p><p className="text-sm text-luna-gray-600">Allow users to pay with credit/debit cards</p></div>
                      <LunaSwitch checked={paymentMethodCreditCard} onCheckedChange={setPaymentMethodCreditCard} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <LunaButton variant="primary" type="submit" disabled={savingPaymentSettings}>
                    {savingPaymentSettings ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : (<><Save className="w-4 h-4" />Save Payment Settings</>)}
                  </LunaButton>
                </div>
              </div>
            </div>
          </form>
        </LunaCard>
      </div>
    </div>
  );
}
