/**
 * Bank Transfer Modal
 * Modal for users to submit bank transfer payment proof
 */

'use client';

import { useState, useEffect } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaDialogFooter,
  LunaButton,
  LunaInput,
  LunaInputLabel,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, AlertCircle, CheckCircle2, Upload, Copy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDollars, formatCredits } from '@/lib/utils/credit-conversion';

interface BankTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  contentId: string;
  contentType: 'module' | 'course' | 'program';
  contentTitle: string;
  amountUSD: number;
  amountCredits?: number;
}

interface BankingInfo {
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_routing_number: string;
  bank_swift_code: string;
  bank_payment_instructions: string;
}

export function BankTransferModal({
  open,
  onOpenChange,
  onSuccess,
  contentId,
  contentType,
  contentTitle,
  amountUSD,
  amountCredits = 0,
}: BankTransferModalProps) {
  console.log('🏦 BankTransferModal render', { open });

  const [loading, setLoading] = useState(false);
  const [loadingBankInfo, setLoadingBankInfo] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bankingInfo, setBankingInfo] = useState<BankingInfo | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [creditsPerDollar, setCreditsPerDollar] = useState(100);

  // Form fields
  const [userBankName, setUserBankName] = useState('');
  const [userAccountHolder, setUserAccountHolder] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [amountPaid, setAmountPaid] = useState(amountUSD.toString());

  // Fetch banking information
  useEffect(() => {
    const fetchBankingInfo = async () => {
      if (!open) return;

      setLoadingBankInfo(true);
      try {
        const response = await fetch('/api/payments/settings');
        if (response.ok) {
          const data = await response.json();
          setBankingInfo({
            bank_name: data.settings.bank_name || '',
            bank_account_name: data.settings.bank_account_name || '',
            bank_account_number: data.settings.bank_account_number || '',
            bank_routing_number: data.settings.bank_routing_number || '',
            bank_swift_code: data.settings.bank_swift_code || '',
            bank_payment_instructions: data.settings.bank_payment_instructions || '',
          });
          setCreditsPerDollar(parseInt(data.settings.credits_per_dollar) || 100);
        }
      } catch (error) {
        console.error('Failed to fetch banking info:', error);
        setError('Failed to load banking information');
      } finally {
        setLoadingBankInfo(false);
      }
    };

    fetchBankingInfo();
  }, [open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, WebP) or PDF file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingReceipt(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to upload files');
        return;
      }

      // Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload receipt');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);

      setReceiptUrl(publicUrl);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('An error occurred while uploading');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!userBankName || !userAccountHolder || !transactionReference || !amountPaid) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(amountPaid) <= 0) {
      setError('Amount paid must be greater than 0');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/payments/bank-transfer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_type: contentType,
          enrollment_id: contentId,
          user_bank_name: userBankName,
          user_account_holder: userAccountHolder,
          transaction_reference: transactionReference,
          amount_paid: parseFloat(amountPaid),
          receipt_image_url: receiptUrl || null,
          amount_credits: amountCredits,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
          onSuccess?.();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit bank transfer');
      }
    } catch (err) {
      console.error('Error submitting bank transfer:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess(false);
    setUserBankName('');
    setUserAccountHolder('');
    setTransactionReference('');
    setAmountPaid(amountUSD.toString());
    setReceiptUrl('');
    onOpenChange(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle>Bank Transfer Payment</LunaDialogTitle>
          <LunaDialogDescription>
            Complete your enrollment for <strong>{contentTitle}</strong> via bank transfer
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody>
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Payment submitted successfully!</strong>
                <p className="mt-1 text-sm">
                  Your bank transfer submission is pending admin approval. You will be notified once it's reviewed.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Banking Information */}
              {loadingBankInfo ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-luna-blue" />
                </div>
              ) : bankingInfo ? (
                <div className="space-y-6">
                  {/* Payment Amount */}
                  <div className="bg-luna-blue-50 border border-luna-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-luna-gray-900 mb-2">Payment Amount</h3>
                    <div className="text-2xl font-bold text-luna-blue">
                      {formatDollars(amountUSD)}
                    </div>
                    <p className="text-xs text-luna-gray-600 mt-1">
                      ({formatCredits(Math.round(amountUSD * creditsPerDollar))} credits equivalent)
                    </p>
                    {amountCredits > 0 && (
                      <p className="text-xs text-luna-gray-600 mt-1">
                        (Hybrid payment: {formatCredits(amountCredits)} credits + {formatDollars(amountUSD)} cash)
                      </p>
                    )}
                  </div>

                  {/* Platform Banking Details */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-5 h-5 text-luna-blue" />
                      <h3 className="text-sm font-semibold text-luna-gray-900">
                        Transfer to this account
                      </h3>
                    </div>

                    {/* Three fields in one row */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-luna-gray-600 block mb-1">Bank Name</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-luna-gray-900">{bankingInfo.bank_name}</span>
                          <button
                            onClick={() => copyToClipboard(bankingInfo.bank_name)}
                            className="text-luna-blue hover:text-luna-blue-dark"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-luna-gray-600 block mb-1">Account Name</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-luna-gray-900">{bankingInfo.bank_account_name}</span>
                          <button
                            onClick={() => copyToClipboard(bankingInfo.bank_account_name)}
                            className="text-luna-blue hover:text-luna-blue-dark"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-luna-gray-600 block mb-1">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-luna-gray-900 font-mono">{bankingInfo.bank_account_number}</span>
                          <button
                            onClick={() => copyToClipboard(bankingInfo.bank_account_number)}
                            className="text-luna-blue hover:text-luna-blue-dark"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {bankingInfo.bank_payment_instructions && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <p className="text-xs text-luna-gray-600">
                          <strong>Note:</strong> {bankingInfo.bank_payment_instructions}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* User Payment Details Form */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-luna-gray-900">
                      Enter your payment details
                    </h3>

                    {/* Row 1: Bank Name and Account Holder Name */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <LunaInputLabel htmlFor="userBankName">Your Bank Name *</LunaInputLabel>
                        <LunaInput
                          id="userBankName"
                          value={userBankName}
                          onChange={(e) => setUserBankName(e.target.value)}
                          placeholder="e.g., Chase Bank"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <LunaInputLabel htmlFor="userAccountHolder">Account Holder Name *</LunaInputLabel>
                        <LunaInput
                          id="userAccountHolder"
                          value={userAccountHolder}
                          onChange={(e) => setUserAccountHolder(e.target.value)}
                          placeholder="Name on your bank account"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Row 2: Transaction Reference and Payment Amount */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <LunaInputLabel htmlFor="transactionReference">Transaction Reference *</LunaInputLabel>
                        <LunaInput
                          id="transactionReference"
                          value={transactionReference}
                          onChange={(e) => setTransactionReference(e.target.value)}
                          placeholder="Transaction ID from your bank"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <LunaInputLabel htmlFor="amountPaid">Payment Amount (USD) *</LunaInputLabel>
                        <LunaInput
                          id="amountPaid"
                          type="number"
                          step="0.01"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Row 3: Upload field */}
                    <div>
                      <LunaInputLabel htmlFor="receipt">Payment Receipt (Optional)</LunaInputLabel>
                      <div className="mt-1">
                        <label
                          htmlFor="receipt"
                          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-luna-blue hover:bg-luna-blue-50 transition-colors"
                        >
                          {uploadingReceipt ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-luna-blue" />
                              <span className="text-sm text-luna-gray-600">Uploading...</span>
                            </>
                          ) : receiptUrl ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-600">Receipt uploaded</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-luna-gray-600" />
                              <span className="text-sm text-luna-gray-600">
                                Click to upload receipt (Image or PDF, max 5MB)
                              </span>
                            </>
                          )}
                        </label>
                        <input
                          id="receipt"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                          onChange={handleFileUpload}
                          disabled={loading || uploadingReceipt}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load banking information. Please try again later.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </LunaDialogBody>

        <LunaDialogFooter>
          <LunaButton
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {success ? 'Close' : 'Cancel'}
          </LunaButton>
          {!success && (
            <LunaButton
              type="submit"
              disabled={loading || loadingBankInfo || !bankingInfo}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Payment Proof'
              )}
            </LunaButton>
          )}
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}


