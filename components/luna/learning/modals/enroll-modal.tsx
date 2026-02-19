/**
 * Enroll Modal
 * Modal for enrolling in courses/programs with optional credit discount
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
  LunaCheckbox,
  LunaTabs,
  LunaTabsList,
  LunaTabsTrigger,
  LunaTabsContent,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, GraduationCap, Coins, AlertCircle, Wallet, Building2, CreditCard, Smartphone, Sparkles, Award, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BankTransferModal } from './bank-transfer-modal';
import { dollarsToCredits, formatDollars, formatCredits } from '@/lib/utils/credit-conversion';
import { CurrencyConverter } from '@/components/luna/currency-converter';
import { convertFromBZD } from '@/lib/utils/currency-conversion';
import { ScholarshipApplicationForm } from '@/components/luna/scholarships/scholarship-application-form';
import type { ScholarshipApplicationFormData, ScholarshipEligibilityResponse } from '@/types/scholarship';

type PaymentMethod = 'bank_transfer' | 'digiWallet' | 'credit_card';
type EnrollmentMethod = 'payment' | 'scholarship';

interface EnrollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  contentId: string;
  contentType: 'module' | 'course' | 'program';
  contentTitle: string;
  price: number; // Price in dollars (not credits)
  isFree: boolean;
  currentBalance?: number;
  initialCurrency?: string;
  initialDisplayPrice?: number;
}

export function EnrollModal({
  open,
  onOpenChange,
  onSuccess,
  contentId,
  contentType,
  contentTitle,
  price,
  isFree,
  currentBalance = 0,
  initialCurrency = 'BZD',
  initialDisplayPrice,
}: EnrollModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [applyCredits, setApplyCredits] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<Record<string, number | boolean>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [bankTransferModalOpen, setBankTransferModalOpen] = useState(false);
  const [creditsPerDollar, setCreditsPerDollar] = useState(100);
  const [cashbackPercentage, setCashbackPercentage] = useState(10);
  const [displayCurrency, setDisplayCurrency] = useState<string>(initialCurrency);
  const [displayPrice, setDisplayPrice] = useState<number>(initialDisplayPrice || price);

  // Scholarship state
  const [enrollmentMethod, setEnrollmentMethod] = useState<EnrollmentMethod>('payment');
  const [scholarshipEligibility, setScholarshipEligibility] = useState<ScholarshipEligibilityResponse | null>(null);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [scholarshipLoading, setScholarshipLoading] = useState(false);

  // Fetch payment settings and scholarship eligibility
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/payments/settings');
        if (response.ok) {
          const data = await response.json();
          setPaymentSettings(data.settings || {});
          setCreditsPerDollar(parseInt(String(data.settings.credits_per_dollar)) || 100);
          setCashbackPercentage(parseFloat(String(data.settings.cashback_percentage)) || 10);
        }
      } catch (error) {
        console.error('Failed to fetch payment settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    const checkScholarshipEligibility = async () => {
      if (isFree) return; // No scholarships for free content

      setLoadingEligibility(true);
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log('No session found, skipping scholarship eligibility check');
          setLoadingEligibility(false);
          return;
        }

        const response = await fetch(
          `/api/learning/scholarships/eligibility?content_type=${contentType}&content_id=${contentId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );
        if (response.ok) {
          const data: ScholarshipEligibilityResponse = await response.json();
          console.log('Scholarship Eligibility Response:', data);
          setScholarshipEligibility(data);
        } else {
          console.error('Scholarship eligibility check failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to check scholarship eligibility:', error);
      } finally {
        setLoadingEligibility(false);
      }
    };

    if (open) {
      fetchSettings();
      checkScholarshipEligibility();
      // Reset state when modal opens
      setApplyCredits(false);
      setError('');
      setEnrollmentMethod('payment');
      // Use initial currency if provided, otherwise reset to BZD
      setDisplayCurrency(initialCurrency);
      setDisplayPrice(initialDisplayPrice || price);
    }
  }, [open, price, initialCurrency, initialDisplayPrice, contentId, contentType, isFree]);

  // Calculate scholarship discount
  const scholarshipDiscountPercentage = scholarshipEligibility?.awarded_scholarship?.scholarships?.discount_percentage || 0;
  const scholarshipDiscountBZD = (price * scholarshipDiscountPercentage) / 100;
  const priceAfterScholarship = Math.max(0, price - scholarshipDiscountBZD);

  // Handle currency conversion (use discounted price if scholarship applied)
  const handleCurrencyChange = (currency: string, amount: number) => {
    setDisplayCurrency(currency);
    setDisplayPrice(amount);
  };

  // Calculate pricing with optional credit discount (always based on BZD price after scholarship)
  const priceInCredits = dollarsToCredits(priceAfterScholarship, creditsPerDollar);
  const maxCreditsToUse = Math.min(currentBalance, priceInCredits);
  const creditDiscountBZD = applyCredits ? (maxCreditsToUse / creditsPerDollar) : 0;
  const finalPriceBZD = Math.max(0, priceAfterScholarship - creditDiscountBZD);
  const creditsToUse = applyCredits ? maxCreditsToUse : 0;
  const creditsRemaining = currentBalance - creditsToUse;

  // Calculate cashback credits (based on original BZD price)
  const cashbackCredits = Math.round((price * (cashbackPercentage / 100)) * creditsPerDollar);

  // Convert amounts to display currency
  const originalPriceDisplay = convertFromBZD(price, displayCurrency);
  const scholarshipDiscountDisplay = convertFromBZD(scholarshipDiscountBZD, displayCurrency);
  const priceAfterScholarshipDisplay = convertFromBZD(priceAfterScholarship, displayCurrency);
  const creditDiscountDisplay = convertFromBZD(creditDiscountBZD, displayCurrency);
  const finalPriceDisplay = convertFromBZD(finalPriceBZD, displayCurrency);

  const handleScholarshipSubmit = async (formData: ScholarshipApplicationFormData) => {
    setScholarshipLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be logged in');
        setScholarshipLoading(false);
        return;
      }

      const response = await fetch('/api/learning/scholarships/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit scholarship application');
        setScholarshipLoading(false);
        return;
      }

      // Success! Close modal and show success message
      setScholarshipLoading(false);
      handleClose();
      onSuccess?.();
      // TODO: Show success toast/notification
    } catch (err) {
      console.error('Error submitting scholarship application:', err);
      setError('An error occurred. Please try again.');
      setScholarshipLoading(false);
    }
  };



  const handleEnroll = async () => {
    setError('');
    setLoading(true);

    console.log('🔍 handleEnroll called', {
      paymentMethod,
      isFree,
      applyCredits,
      finalPriceBZD,
      creditsToUse
    });

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be logged in');
        setLoading(false);
        return;
      }

      // For free content, enroll directly
      if (isFree) {
        const response = await fetch('/api/learning/enroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            content_id: contentId,
            content_type: contentType,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to enroll');
          setLoading(false);
          return;
        }

        // Success!
        setLoading(false);
        handleClose();
        onSuccess?.();
        return;
      }

      // For credit-only payment (credits fully cover the cost)
      if (applyCredits && finalPriceBZD === 0) {
        const response = await fetch('/api/learning/enroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            content_id: contentId,
            content_type: contentType,
            payment_method: 'credits',
            credits_used: creditsToUse,
            scholarship_id: scholarshipEligibility?.awarded_scholarship?.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to complete enrollment');
          setLoading(false);
          return;
        }

        // Success!
        setLoading(false);
        handleClose();
        onSuccess?.();
        return;
      }

      // For bank transfer, open BankTransferModal
      if (paymentMethod === 'bank_transfer') {
        console.log('🏦 Opening bank transfer modal');
        setLoading(false);
        setBankTransferModalOpen(true);
        console.log('🏦 Bank transfer modal state set to true');
        return;
      }

      // For DigiWallet and Credit Card, show coming soon
      if (paymentMethod === 'digiWallet' || paymentMethod === 'credit_card') {
        setError(`${paymentMethod === 'digiWallet' ? 'DigiWallet' : 'Credit Card'} payment is coming soon!`);
        setLoading(false);
        return;
      }

      // This shouldn't happen, but handle it
      setError('Please select a payment method');
      setLoading(false);
    } catch (err) {
      console.error('Error enrolling:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setError('');
    setApplyCredits(false);
    onOpenChange(false);
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-md">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Confirm Enrollment
          </LunaDialogTitle>
          <LunaDialogDescription>
            Review the details before enrolling
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Content Info */}
          <div className="bg-luna-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-luna-gray-500 uppercase tracking-wide">
              {contentType}
            </p>
            <h3 className="font-semibold text-lg">{contentTitle}</h3>
          </div>

          {/* Scholarship Applied Notice (compact) */}
          {!isFree && scholarshipEligibility?.awarded_scholarship && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              <div className="flex-1">
                <span className="text-sm font-medium text-green-900">
                  {scholarshipEligibility.awarded_scholarship.scholarships?.name} ({scholarshipDiscountPercentage}% off applied)
                </span>
              </div>
            </div>
          )}

          {/* Enrollment Method Tabs (Payment vs Scholarship) */}
          {!isFree &&
           !loadingSettings &&
           scholarshipEligibility?.existing_application?.status !== 'pending' && (
            <LunaTabs value={enrollmentMethod} onValueChange={(value) => setEnrollmentMethod(value as EnrollmentMethod)}>
              <LunaTabsList className="grid w-full grid-cols-2">
                <LunaTabsTrigger value="payment">
                  <Wallet className="w-4 h-4 mr-2" />
                  Payment
                </LunaTabsTrigger>
                <LunaTabsTrigger value="scholarship" disabled={!scholarshipEligibility?.eligible || loadingEligibility}>
                  <Award className="w-4 h-4 mr-2" />
                  Scholarship
                </LunaTabsTrigger>
              </LunaTabsList>

              {/* Payment Tab Content */}
              <LunaTabsContent value="payment" className="space-y-4 mt-4">
                {/* Pricing Section */}
                <div className="space-y-4">
              {/* Price Display */}
              <div className="bg-white border border-luna-border-default rounded-lg p-4 space-y-3">
                {/* Show scholarship discount breakdown if applicable */}
                {scholarshipDiscountPercentage > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-luna-gray-600">Original Price:</span>
                      <span className="text-luna-gray-500 line-through">${originalPriceDisplay.toFixed(2)} {displayCurrency}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Scholarship Discount ({scholarshipDiscountPercentage}%):</span>
                      <span className="text-green-600 font-medium">-${scholarshipDiscountDisplay.toFixed(2)} {displayCurrency}</span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-luna-gray-600">
                    {scholarshipDiscountPercentage > 0 ? 'Your Price:' : 'Price:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">
                      ${priceAfterScholarshipDisplay.toFixed(2)} {displayCurrency}
                    </span>
                    <CurrencyConverter
                      amountBZD={priceAfterScholarship}
                      onCurrencyChange={handleCurrencyChange}
                    />
                  </div>
                </div>

                {/* Apply Credits Checkbox */}
                {currentBalance > 0 && (
                  <div className="pt-3 border-t border-luna-border-light">
                    <div className="flex items-start gap-3">
                      <LunaCheckbox
                        id="apply-credits"
                        checked={applyCredits}
                        onCheckedChange={(checked) => setApplyCredits(checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="apply-credits"
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          <Wallet className="w-4 h-4 text-purple-600" />
                          Apply Learning Credits
                        </Label>
                        <p className="text-xs text-luna-gray-500 mt-1">
                          You have {formatCredits(currentBalance)} credits available
                          {applyCredits && ` (using ${formatCredits(creditsToUse)})`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                {applyCredits && creditDiscountBZD > 0 && (
                  <div className="pt-3 border-t border-luna-border-light space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-luna-gray-600">Credit Discount:</span>
                      <span className="text-green-600 font-medium">-${creditDiscountDisplay.toFixed(2)} {displayCurrency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Amount Due:</span>
                      <span className="text-xl font-bold text-luna-primary">
                        ${finalPriceDisplay.toFixed(2)} {displayCurrency}
                      </span>
                    </div>
                  </div>
                )}

                {/* Cashback Info */}
                <div className="pt-3 border-t border-luna-border-light">
                  <div className="flex items-start gap-2 bg-purple-50 rounded-md p-3">
                    <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-purple-900">
                        Earn {formatCredits(cashbackCredits)} credits upon completion!
                      </p>
                      <p className="text-xs text-purple-700 mt-0.5">
                        {cashbackPercentage}% cashback on original price
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection - Only show if there's a remaining balance */}
              {finalPriceBZD > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                    {/* Bank Transfer */}
                    {paymentSettings.payment_method_bank_transfer && (
                      <div className="flex items-center space-x-2 border border-luna-border-light rounded-lg p-3 hover:bg-luna-gray-50 cursor-pointer">
                        <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                        <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Bank Transfer</span>
                          </div>
                          <p className="text-xs text-luna-gray-500 mt-1">
                            Manual bank transfer (requires admin approval)
                          </p>
                        </Label>
                      </div>
                    )}

                    {/* DigiWallet */}
                    {paymentSettings.payment_method_digiWallet && (
                      <div className="flex items-center space-x-2 border border-luna-border-light rounded-lg p-3 hover:bg-luna-gray-50 cursor-pointer">
                        <RadioGroupItem value="digiWallet" id="digiWallet" />
                        <Label htmlFor="digiWallet" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-orange-600" />
                            <span className="font-medium">DigiWallet</span>
                          </div>
                          <p className="text-xs text-luna-gray-500 mt-1">
                            Pay with DigiWallet mobile payment
                          </p>
                        </Label>
                      </div>
                    )}

                    {/* Credit Card */}
                    {paymentSettings.payment_method_credit_card && (
                      <div className="flex items-center space-x-2 border border-luna-border-light rounded-lg p-3 hover:bg-luna-gray-50 cursor-pointer">
                        <RadioGroupItem value="credit_card" id="credit_card" />
                        <Label htmlFor="credit_card" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium">Credit Card</span>
                          </div>
                          <p className="text-xs text-luna-gray-500 mt-1">
                            Pay securely with credit/debit card
                          </p>
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>
              )}

              {/* Credits Fully Cover Payment Message */}
              {applyCredits && finalPriceBZD === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Wallet className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900">
                        Payment Fully Covered!
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Your learning credits will cover the entire cost. Click "Complete Enrollment" to proceed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
                </div>
              </LunaTabsContent>

              {/* Scholarship Tab Content */}
              <LunaTabsContent value="scholarship" className="mt-4">
                {loadingEligibility ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-luna-primary" />
                  </div>
                ) : scholarshipEligibility?.eligible ? (
                  <ScholarshipApplicationForm
                    contentId={contentId}
                    contentType={contentType}
                    contentTitle={contentTitle}
                    onSubmit={handleScholarshipSubmit}
                    onCancel={() => setEnrollmentMethod('payment')}
                    loading={scholarshipLoading}
                  />
                ) : (
                  <div className="bg-luna-gray-50 border border-luna-border-light rounded-lg p-4">
                    <p className="text-sm text-luna-gray-600">
                      {scholarshipEligibility?.reason || 'You are not eligible to apply for a scholarship at this time.'}
                    </p>
                  </div>
                )}
              </LunaTabsContent>
            </LunaTabs>
          )}

          {/* Free Content Message */}
          {isFree && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-900 font-medium">
                This content is free!
              </span>
            </div>
          )}
        </LunaDialogBody>

        {/* Only show footer buttons when not on scholarship tab or when showing awarded scholarship */}
        {(enrollmentMethod === 'payment' || isFree || scholarshipEligibility?.awarded_scholarship) && (
          <LunaDialogFooter>
            <LunaButton
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </LunaButton>
            <LunaButton
              type="submit"
              disabled={loading || loadingSettings}
              onClick={handleEnroll}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isFree ? (
                'Enroll for Free'
              ) : applyCredits && finalPriceBZD === 0 ? (
                'Complete Enrollment'
              ) : scholarshipEligibility?.awarded_scholarship ? (
                'Enroll with Scholarship'
              ) : paymentMethod === 'bank_transfer' ? (
                'Proceed to Bank Transfer'
              ) : (
                'Proceed to Payment'
              )}
            </LunaButton>
          </LunaDialogFooter>
        )}
      </LunaDialogContent>

      {/* Bank Transfer Modal */}
      <BankTransferModal
        open={bankTransferModalOpen}
        onOpenChange={setBankTransferModalOpen}
        onSuccess={() => {
          setBankTransferModalOpen(false);
          handleClose();
          onSuccess?.();
        }}
        contentId={contentId}
        contentType={contentType}
        contentTitle={contentTitle}
        amountUSD={finalPriceBZD}
        amountCredits={creditsToUse}
      />

    </LunaDialog>
  );
}

