'use client';

import { useUser, useOrganization } from '@clerk/nextjs';
import { ChangeEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getPlanConfig, pricingPlans, sanitizePlanTier, type PlanTier } from '@/lib/pricing';

type BillingStatus = 'inactive' | 'pending' | 'active';

type Vehicle = {
  type: string;
  daily_rate_kes: number;
};

type Hotel = {
  destination: string;
  name: string;
  nightly_rate_kes: number;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

function getBillingLabel(status: BillingStatus) {
  if (status === 'active') return 'Active';
  if (status === 'pending') return 'Payment pending';
  return 'Trial / unpaid';
}

function getRequestedPlanFromUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawPlan = new URLSearchParams(window.location.search).get('plan');
  return rawPlan ? sanitizePlanTier(rawPlan) : null;
}

export default function CompanyDashboard() {
  const { user } = useUser();
  const { organization } = useOrganization();

  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [activePlanTier, setActivePlanTier] = useState<PlanTier>('starter');
  const [selectedPlanTier, setSelectedPlanTier] = useState<PlanTier>(() => getRequestedPlanFromUrl() || 'starter');
  const [themeColor, setThemeColor] = useState('#0f766e');
  const [billingStatus, setBillingStatus] = useState<BillingStatus>('inactive');
  const [pendingPlanTier, setPendingPlanTier] = useState<PlanTier | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { type: 'van', daily_rate_kes: 25000 },
    { type: 'lc79', daily_rate_kes: 35000 },
    { type: 'coaster', daily_rate_kes: 45000 },
  ]);

  const [hotels, setHotels] = useState<Hotel[]>([
    { destination: 'Maasai Mara', name: 'Mara Serena Safari Lodge', nightly_rate_kes: 18000 },
    { destination: 'Amboseli', name: 'Amboseli Serena Safari Lodge', nightly_rate_kes: 16000 },
    { destination: 'Tsavo', name: 'Voi Safari Lodge', nightly_rate_kes: 12000 },
  ]);

  const resolvedCompanyName = companyName || organization?.name || '';
  const resolvedContactEmail = contactEmail || user?.emailAddresses?.[0]?.emailAddress || '';
  const activePlan = getPlanConfig(activePlanTier);
  const selectedPlan = getPlanConfig(selectedPlanTier);
  const isCurrentSelectionActive = selectedPlanTier === activePlanTier && billingStatus === 'active';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const message = params.get('message');

    if (paymentStatus === 'success') {
      toast.success(message || 'Payment verified successfully');
    } else if (paymentStatus === 'failed') {
      toast.error(message || 'Payment verification failed');
    }

    if (paymentStatus || message || params.get('plan')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!organization?.id) return;

    const loadCompanySettings = async () => {
      try {
        const response = await fetch(`/api/company/current?clerkOrgId=${organization.id}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          setLoadingSettings(false);
          return;
        }

        const company = result.company;
        const currentPlanTier = sanitizePlanTier(result.planTier);
        const requestedPlan = getRequestedPlanFromUrl();

        setActivePlanTier(currentPlanTier);
        setSelectedPlanTier(result.pendingPlanTier || requestedPlan || currentPlanTier);
        setThemeColor(result.themeColor || '#0f766e');
        setBillingStatus((result.billingStatus as BillingStatus) || 'inactive');
        setPendingPlanTier(result.pendingPlanTier || null);

        if (company?.name) setCompanyName(company.name);
        if (company?.logo_url) setLogoUrl(company.logo_url);
        if (company?.contact_email) setContactEmail(company.contact_email);
        if (company?.sheet_id) setSheetId(company.sheet_id);
        if (Array.isArray(company?.vehicles) && company.vehicles.length > 0) setVehicles(company.vehicles);
        if (Array.isArray(company?.hotels) && company.hotels.length > 0) setHotels(company.hotels);
      } catch {
        // Keep defaults for first-time setup.
      } finally {
        setLoadingSettings(false);
      }
    };

    void loadCompanySettings();
  }, [organization?.id]);

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization?.id) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('organizationId', organization.id);

      const response = await fetch('/api/company/logo', {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload logo');
      }

      setLogoUrl(result.publicUrl);
      toast.success('Logo uploaded successfully!');
    } catch (err: unknown) {
      toast.error(`Failed to upload logo: ${getErrorMessage(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const startPlanCheckout = async () => {
    if (!organization?.id) {
      toast.error('Organization not found');
      return;
    }

    setStartingCheckout(true);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier: selectedPlanTier }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.authorizationUrl) {
        throw new Error(result.error || 'Failed to start payment');
      }

      window.location.href = result.authorizationUrl;
    } catch (error: unknown) {
      toast.error(`Unable to start Paystack checkout: ${getErrorMessage(error)}`);
      setStartingCheckout(false);
    }
  };

  const saveCompanySettings = async () => {
    if (!organization?.id) {
      toast.error('Organization not found');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/company/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerk_org_id: organization.id,
          name: resolvedCompanyName,
          logo_url: logoUrl,
          contact_email: resolvedContactEmail,
          sheet_id: sheetId,
          themeColor,
          vehicles,
          hotels,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('All settings saved successfully!');

        if (result.isNewCompany && resolvedContactEmail) {
          await fetch('/api/send-welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyName: resolvedCompanyName,
              contactEmail: resolvedContactEmail,
              quoteSlug: result.slug,
              dashboardLink: 'https://safariquote-ai.vercel.app/dashboard',
            }),
          });
        }
      } else {
        toast.error(result.error || 'Failed to save');
      }
    } catch (err: unknown) {
      toast.error(`Failed to save: ${getErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const addVehicle = () => {
    setVehicles([...vehicles, { type: 'new', daily_rate_kes: 30000 }]);
  };

  const updateVehicle = (index: number, field: keyof Vehicle, value: Vehicle[keyof Vehicle]) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setVehicles(updated);
  };

  const addHotel = () => {
    setHotels([...hotels, { destination: 'New Destination', name: 'New Hotel', nightly_rate_kes: 15000 }]);
  };

  const updateHotel = (index: number, field: keyof Hotel, value: Hotel[keyof Hotel]) => {
    const updated = [...hotels];
    updated[index] = { ...updated[index], [field]: value };
    setHotels(updated);
  };

  if (!user || !organization) {
    return <div className="p-12 text-center">Please sign in and create an organization.</div>;
  }

  if (loadingSettings) {
    return <div className="p-12 text-center">Loading company settings...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">Company Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Managing: <strong>{resolvedCompanyName}</strong>
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Package Billing & Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-white p-4">
                <p className="text-sm text-gray-500">Current active plan</p>
                <p className="mt-1 text-2xl font-semibold">{activePlan.name}</p>
                <p className="mt-2 text-sm text-gray-600">{activePlan.description}</p>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <p className="text-sm text-gray-500">Billing status</p>
                <p className="mt-1 text-2xl font-semibold">{getBillingLabel(billingStatus)}</p>
                {pendingPlanTier && (
                  <p className="mt-2 text-sm text-amber-700">
                    Pending activation: {getPlanConfig(pendingPlanTier).name}
                  </p>
                )}
              </div>
              <div className="rounded-xl border bg-white p-4">
                <p className="text-sm text-gray-500">Selected checkout plan</p>
                <p className="mt-1 text-2xl font-semibold">{selectedPlan.name}</p>
                <p className="mt-2 text-sm text-gray-600">
                  Pay KSh {selectedPlan.initialChargeKes.toLocaleString()} now, then {selectedPlan.price}{selectedPlan.period}
                </p>
              </div>
            </div>

            <div>
              <Label>Choose Package to Activate</Label>
              <Select value={selectedPlanTier} onValueChange={(value) => setSelectedPlanTier(value as PlanTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pricingPlans.map((plan) => (
                    <SelectItem key={plan.tier} value={plan.tier}>
                      {plan.name} - KSh {plan.initialChargeKes.toLocaleString()} to start
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-sm text-gray-600">{selectedPlan.idealFor}</p>
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="mb-2 font-semibold">Included in {selectedPlan.name}</p>
                <ul className="space-y-1 text-gray-700">
                  {selectedPlan.included.map((feature) => (
                    <li key={feature}>Included: {feature}</li>
                  ))}
                </ul>
              </div>
              {selectedPlan.excluded && selectedPlan.excluded.length > 0 && (
                <div className="rounded-xl border p-4">
                  <p className="mb-2 font-semibold">Still locked on this package</p>
                  <ul className="space-y-1 text-gray-700">
                    {selectedPlan.excluded.map((feature) => (
                      <li key={feature}>Not included: {feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button
              onClick={startPlanCheckout}
              disabled={startingCheckout || (billingStatus === 'pending' && pendingPlanTier === selectedPlanTier) || isCurrentSelectionActive}
              className="w-full"
            >
              {isCurrentSelectionActive
                ? `Current plan already active: ${selectedPlan.name}`
                : billingStatus === 'pending' && pendingPlanTier === selectedPlanTier
                  ? `Waiting for ${selectedPlan.name} payment confirmation`
                  : startingCheckout
                    ? 'Redirecting to Paystack...'
                    : `Pay with Paystack for ${selectedPlan.name}`}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Company Branding & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Company Name</Label>
                <Input value={resolvedCompanyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>

              <div>
                <Label>Upload Company Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading || !activePlan.features.logoOnForm}
                />
                {!activePlan.features.logoOnForm && (
                  <p className="mt-1 text-sm text-amber-700">Upgrade to Professional or Enterprise to show your logo on the public quote form.</p>
                )}
                {uploading && <p className="mt-1 text-sm text-blue-600">Uploading logo...</p>}
                {logoUrl && activePlan.features.logoOnForm && (
                  <div className="mt-4">
                    <img src={logoUrl} alt="Company Logo" className="h-24 w-auto rounded border object-contain" />
                  </div>
                )}
              </div>

              <div>
                <Label>Contact Email</Label>
                <Input type="email" value={resolvedContactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                {!activePlan.features.contactDetailsOnForm && (
                  <p className="mt-1 text-sm text-amber-700">Starter keeps customer-facing contact details hidden on the quote form.</p>
                )}
              </div>

              <div>
                <Label>Google Sheet ID</Label>
                <Input value={sheetId} onChange={(e) => setSheetId(e.target.value)} disabled={!activePlan.features.googleSheetsSync} />
                {!activePlan.features.googleSheetsSync && (
                  <p className="mt-1 text-sm text-amber-700">Google Sheets syncing is available from Professional upward.</p>
                )}
              </div>

              <div>
                <Label>Quote Accent Color</Label>
                <Input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} disabled={!activePlan.features.customColorPalette} />
                {!activePlan.features.customColorPalette && (
                  <p className="mt-1 text-sm text-amber-700">Custom accent color is available on Enterprise.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicles & Daily Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vehicles.map((vehicle, index) => (
                <div key={`${vehicle.type}-${index}`} className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label>Type</Label>
                    <Input value={vehicle.type} onChange={(e) => updateVehicle(index, 'type', e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <Label>Daily Rate (KES)</Label>
                    <Input
                      type="number"
                      value={vehicle.daily_rate_kes}
                      onChange={(e) => updateVehicle(index, 'daily_rate_kes', parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                </div>
              ))}
              <Button onClick={addVehicle} variant="outline" className="w-full">+ Add Vehicle</Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Hotels & Nightly Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hotels.map((hotel, index) => (
                <div key={`${hotel.name}-${index}`} className="grid grid-cols-3 items-end gap-4 border-b pb-4">
                  <div>
                    <Label>Destination</Label>
                    <Input value={hotel.destination} onChange={(e) => updateHotel(index, 'destination', e.target.value)} />
                  </div>
                  <div>
                    <Label>Hotel Name</Label>
                    <Input value={hotel.name} onChange={(e) => updateHotel(index, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Nightly Rate (KES)</Label>
                    <Input
                      type="number"
                      value={hotel.nightly_rate_kes}
                      onChange={(e) => updateHotel(index, 'nightly_rate_kes', parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                </div>
              ))}
              <Button onClick={addHotel} variant="outline" className="w-full">+ Add Hotel</Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <Button onClick={saveCompanySettings} disabled={saving} className="w-full py-8 text-lg font-semibold">
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
