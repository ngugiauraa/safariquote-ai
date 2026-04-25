'use client';

import React from 'react';

import { useEffect, useState } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Import from your existing company-settings file
import {
  CompanyCustomizationSettings,
  normalizeCompanySettings,
  getQuoteFormUrl,
} from '@/lib/company-settings';

import { supabase } from '@/lib/supabase';
const defaultVehicles = [
  { type: 'van', daily_rate_kes: 25000 },
  { type: 'lc79', daily_rate_kes: 35000 },
  { type: 'coaster', daily_rate_kes: 45000 },
];

const defaultHotels = [
  { destination: 'Maasai Mara', name: 'Mara Serena Safari Lodge', nightly_rate_kes: 18000 },
  { destination: 'Amboseli', name: 'Amboseli Serena Safari Lodge', nightly_rate_kes: 16000 },
  { destination: 'Tsavo', name: 'Voi Safari Lodge', nightly_rate_kes: 12000 },
];

export default function CompanyDashboard() {
  const { user } = useUser();
  const { organization } = useOrganization();  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [quoteSlug, setQuoteSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);  const [vehicles, setVehicles] = useState(defaultVehicles);
  const [hotels, setHotels] = useState(defaultHotels);
  const [customizationSettings, setCustomizationSettings] =
    useState<CompanyCustomizationSettings>(() => normalizeCompanySettings({}));  const effectiveSettings = normalizeCompanySettings(customizationSettings, {
    logoUrl,
    contactEmail,
  });  useEffect(() => {
    if (!organization?.id) return;let cancelled = false;

fetch(`/api/company/info?clerkOrgId=${organization.id}`)
  .then(async (response) => {
    if (!response.ok) {
      return null;
    }

    return response.json();
  })
  .then((data) => {
    if (!data || cancelled) return;

    setCompanyName(data.name || organization.name || '');
    setLogoUrl(data.logo_url || '');
    setContactEmail(data.contact_email || user?.emailAddresses?.[0]?.emailAddress || '');
    setSheetId(data.sheet_id || '');
    setQuoteSlug(data.slug || '');
    setVehicles(data.vehicles?.length ? data.vehicles : defaultVehicles);
    setHotels(data.hotels?.length ? data.hotels : defaultHotels);
    setCustomizationSettings(
      normalizeCompanySettings(data.customization_settings, {
        logoUrl: data.logo_url,
        contactEmail: data.contact_email,
      })
    );
  })
  .catch(() => {
    // First-time setup is a valid state, so we stay quiet here.
  })
  .finally(() => {
    if (!cancelled) {
      setLoadingCompany(false);
    }
  });

return () => {
  cancelled = true;
};  }, [organization?.id, organization?.name, user?.emailAddresses]);  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization?.id) {
      toast.error('Please select a file.');
      return;
    }setUploading(true);

try {
  const fileExt = file.name.split('.').pop();
  const fileName = `${organization.id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(fileName);
  setLogoUrl(publicUrlData.publicUrl);
  toast.success('Logo uploaded successfully.');
} catch (error) {
  const message = error instanceof Error ? error.message : 'Upload failed.';
  toast.error(`Failed to upload logo: ${message}`);
} finally {
  setUploading(false);
}  };  const updateVehicle = (index: number, field: 'type' | 'daily_rate_kes', value: string | number) => {
    setVehicles((current) =>
      current.map((vehicle, vehicleIndex) =>
        vehicleIndex === index ? { ...vehicle, [field]: value } : vehicle
      )
    );
  };  const updateHotel = (
    index: number,
    field: 'destination' | 'name' | 'nightly_rate_kes',
    value: string | number
  ) => {
    setHotels((current) =>
      current.map((hotel, hotelIndex) =>
        hotelIndex === index ? { ...hotel, [field]: value } : hotel
      )
    );
  };  
  
  const saveCompanySettings = async () => {
    if (!organization?.id) {
      toast.error('Organization not found.');
      return;
    }

    setSaving(true);

    try {
      const fallbackCompanyName = companyName || organization.name || '';
      const fallbackContactEmail =
        contactEmail || user?.emailAddresses?.[0]?.emailAddress || '';

      const response = await fetch('/api/company/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerk_org_id: organization.id,
          name: fallbackCompanyName,
          logo_url: logoUrl,
          contact_email: fallbackContactEmail,
          sheet_id: sheetId,
          vehicles,
          hotels,
          customization_settings: effectiveSettings,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save company settings.');
      }

      setQuoteSlug(result.company?.slug || '');
      toast.success('Company settings saved successfully!');

      if (result.warning) {
        toast.warning(result.warning);
      }

      // Send welcome email if this is a new company
      if (result.created && result.company?.contact_email) {
        const welcomeResponse = await fetch('/api/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: result.company.name,
            contactEmail: result.company.contact_email,
            quoteSlug: result.company.slug,
            logoUrl: result.company.logo_url,
            customizationSettings: effectiveSettings,
          }),
        });

        const welcomeResult = await welcomeResponse.json();

        if (!welcomeResponse.ok || !welcomeResult.success) {
          console.warn('Welcome email failed but settings were saved:', welcomeResult.error);
          // Don't throw here - settings were saved successfully
        } else {
          toast.success('Welcome email sent with the company form URL.');
        }
      }
    } catch (error: any) {
      const message = error.message || 'Save failed.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

if (!user || !organization) {
    return <div className="p-12 text-center">Please sign in and create an organization.</div>;
  }  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 flex flex-col gap-3">
          <div>
            <h1 className="text-4xl font-bold">Company Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Managing: <strong>{companyName || organization.name}</strong>
            </p>
          </div>
          {quoteSlug ? (
            <p className="text-sm text-gray-600">
              Public quote form:{' '}
              <a className="font-medium text-teal-700 underline" href={getQuoteFormUrl(quoteSlug)} target="_blank" rel="noreferrer">
                {getQuoteFormUrl(quoteSlug)}
              </a>
            </p>
          ) : null}
          {loadingCompany ? <p className="text-sm text-gray-500">Loading saved company settings...</p> : null}
        </div>    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Plan, Branding, and Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Company Name</Label>
            <Input
              value={companyName || organization.name || ''}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div>
            <Label>Package</Label>
            <Select
              value={customizationSettings.packageTier}
              onValueChange={(value: CompanyCustomizationSettings['packageTier']) =>
                setCustomizationSettings((current) => ({ ...current, packageTier: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Upload Company Logo</Label>
            <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
            {uploading ? <p className="mt-1 text-sm text-blue-600">Uploading logo...</p> : null}
            {logoUrl ? (
              <div className="mt-4">
                <img src={logoUrl} alt="Company Logo" className="h-24 rounded border object-contain" />
              </div>
            ) : null}
          </div>

          <div>
            <Label>Contact Email</Label>
            <Input
              type="email"
              value={contactEmail || user?.emailAddresses?.[0]?.emailAddress || ''}
              onChange={(e) => {
                const value = e.target.value;
                setContactEmail(value);
                setCustomizationSettings((current) => ({
                  ...current,
                  contactInfo: { ...current.contactInfo, email: value },
                }));
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Phone</Label>
              <Input
                value={customizationSettings.contactInfo.phone}
                onChange={(e) =>
                  setCustomizationSettings((current) => ({
                    ...current,
                    contactInfo: { ...current.contactInfo, phone: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={customizationSettings.contactInfo.whatsapp}
                onChange={(e) =>
                  setCustomizationSettings((current) => ({
                    ...current,
                    contactInfo: { ...current.contactInfo, whatsapp: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={customizationSettings.contactInfo.website}
                onChange={(e) =>
                  setCustomizationSettings((current) => ({
                    ...current,
                    contactInfo: { ...current.contactInfo, website: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label>Google Sheet ID</Label>
              <Input value={sheetId} onChange={(e) => setSheetId(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Postal / Physical Address</Label>
            <Textarea
              value={customizationSettings.contactInfo.address}
              onChange={(e) =>
                setCustomizationSettings((current) => ({
                  ...current,
                  contactInfo: { ...current.contactInfo, address: e.target.value },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quote Form and Email Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Quote Form Intro</Label>
            <Textarea
              value={effectiveSettings.form.introText}
              onChange={(e) =>
                setCustomizationSettings((current) => ({
                  ...current,
                  form: { ...current.form, introText: e.target.value },
                }))
              }
            />
          </div>

          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={effectiveSettings.form.includeLogo}
                disabled={effectiveSettings.packageTier === 'starter'}
                onChange={(e) =>
                  setCustomizationSettings((current) => ({
                    ...current,
                    form: { ...current.form, includeLogo: e.target.checked },
                  }))
                }
              />
              Show logo on the public quote form
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={effectiveSettings.form.includeContactInfo}
                disabled={effectiveSettings.packageTier === 'starter'}
                onChange={(e) =>
                  setCustomizationSettings((current) => ({
                    ...current,
                    form: { ...current.form, includeContactInfo: e.target.checked },
                  }))
                }
              />
              Show contact info on the public quote form
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={effectiveSettings.email.includeLogo}
                disabled={effectiveSettings.packageTier === 'starter'}
                onChange={(e) =>
                  setCustomizationSettings((current) => ({
                    ...current,
                    email: { ...current.email, includeLogo: e.target.checked },
                  }))
                }
              />
              Show logo in inquiry / quote emails
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={effectiveSettings.email.includeContactInfo}
                onChange={(e) =>
                  setCustomizationSettings((current) => ({
                    ...current,
                    email: { ...current.email, includeContactInfo: e.target.checked },
                  }))
                }
              />
              Show contact info at the bottom of emails
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={effectiveSettings.email.includeCopyright}
                disabled={effectiveSettings.packageTier !== 'enterprise'}
                onChange={(e) =>
                  setCustomizationSettings((current) => ({
                    ...current,
                    email: { ...current.email, includeCopyright: e.target.checked },
                  }))
                }
              />
              Include SafariQuote AI copyright in emails
            </label>
          </div>

          <div>
            <Label>Email Subject Prefix</Label>
            <Input
              value={effectiveSettings.email.subjectPrefix}
              onChange={(e) =>
                setCustomizationSettings((current) => ({
                  ...current,
                  email: { ...current.email, subjectPrefix: e.target.value },
                }))
              }
            />
          </div>

          <div>
            <Label>Email Message</Label>
            <Textarea
              value={effectiveSettings.email.customMessage}
              onChange={(e) =>
                setCustomizationSettings((current) => ({
                  ...current,
                  email: { ...current.email, customMessage: e.target.value },
                }))
              }
            />
          </div>

          <div>
            <Label>Email Footer Note</Label>
            <Textarea
              value={effectiveSettings.email.footerNote}
              onChange={(e) =>
                setCustomizationSettings((current) => ({
                  ...current,
                  email: { ...current.email, footerNote: e.target.value },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Itinerary PDF Branding</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary Color</Label>
                <Input
                  type="color"
                  value={effectiveSettings.itinerary.theme.primaryColor}
                  onChange={(e) =>
                    setCustomizationSettings((current) => ({
                      ...current,
                      itinerary: {
                        ...current.itinerary,
                        theme: {
                          ...current.itinerary.theme,
                          primaryColor: e.target.value,
                        },
                      },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Accent Color</Label>
                <Input
                  type="color"
                  value={effectiveSettings.itinerary.theme.accentColor}
                  onChange={(e) =>
                    setCustomizationSettings((current) => ({
                      ...current,
                      itinerary: {
                        ...current.itinerary,
                        theme: {
                          ...current.itinerary.theme,
                          accentColor: e.target.value,
                        },
                      },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Text Color</Label>
                <Input
                  type="color"
                  value={effectiveSettings.itinerary.theme.textColor}
                  onChange={(e) =>
                    setCustomizationSettings((current) => ({
                      ...current,
                      itinerary: {
                        ...current.itinerary,
                        theme: {
                          ...current.itinerary.theme,
                          textColor: e.target.value,
                        },
                      },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Background Color</Label>
                <Input
                  type="color"
                  value={effectiveSettings.itinerary.theme.backgroundColor}
                  onChange={(e) =>
                    setCustomizationSettings((current) => ({
                      ...current,
                      itinerary: {
                        ...current.itinerary,
                        theme: {
                          ...current.itinerary.theme,
                          backgroundColor: e.target.value,
                        },
                      },
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={effectiveSettings.itinerary.includeLogo}
                  onChange={(e) =>
                    setCustomizationSettings((current) => ({
                      ...current,
                      itinerary: { ...current.itinerary, includeLogo: e.target.checked },
                    }))
                  }
                />
                Add logo to itinerary PDF
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={effectiveSettings.itinerary.includeContactInfo}
                  onChange={(e) =>
                    setCustomizationSettings((current) => ({
                      ...current,
                      itinerary: {
                        ...current.itinerary,
                        includeContactInfo: e.target.checked,
                      },
                    }))
                  }
                />
                Add company contact info to itinerary PDF
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={effectiveSettings.itinerary.includeCopyright}
                  disabled={effectiveSettings.packageTier !== 'enterprise'}
                  onChange={(e) =>
                    setCustomizationSettings((current) => ({
                      ...current,
                      itinerary: {
                        ...current.itinerary,
                        includeCopyright: e.target.checked,
                      },
                    }))
                  }
                />
                Include SafariQuote AI copyright in itinerary PDF
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label>Itinerary Intro</Label>
              <Textarea
                value={effectiveSettings.itinerary.customIntro}
                onChange={(e) =>
                  setCustomizationSettings((current) => ({
                    ...current,
                    itinerary: { ...current.itinerary, customIntro: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label>Itinerary Footer Note</Label>
              <Textarea
                value={effectiveSettings.itinerary.footerNote}
                onChange={(e) =>
                  setCustomizationSettings((current) => ({
                    ...current,
                    itinerary: { ...current.itinerary, footerNote: e.target.value },
                  }))
                }
              />
            </div>
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
                  onChange={(e) =>
                    updateVehicle(index, 'daily_rate_kes', Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          ))}
          <Button
            onClick={() =>
              setVehicles((current) => [...current, { type: 'new', daily_rate_kes: 30000 }])
            }
            variant="outline"
            className="w-full"
          >
            + Add Vehicle
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hotels & Nightly Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hotels.map((hotel, index) => (
            <div key={`${hotel.name}-${index}`} className="grid grid-cols-1 gap-4 border-b pb-4 md:grid-cols-3">
              <div>
                <Label>Destination</Label>
                <Input
                  value={hotel.destination}
                  onChange={(e) => updateHotel(index, 'destination', e.target.value)}
                />
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
                  onChange={(e) =>
                    updateHotel(index, 'nightly_rate_kes', Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          ))}
          <Button
            onClick={() =>
              setHotels((current) => [
                ...current,
                { destination: 'New Destination', name: 'New Hotel', nightly_rate_kes: 15000 },
              ])
            }
            variant="outline"
            className="w-full"
          >
            + Add Hotel
          </Button>
        </CardContent>
      </Card>
    </div>

    <div className="mt-10">
      <Button onClick={saveCompanySettings} disabled={saving} className="w-full py-8 text-lg font-semibold">
        {saving ? 'Saving...' : 'Save All Settings'}
      </Button>
    </div>
  </div>
</div>  );
} 

