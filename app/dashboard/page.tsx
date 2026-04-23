'use client';

import { useUser, useOrganization } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';

export default function CompanyDashboard() {
  const { user } = useUser();
  const { organization } = useOrganization();

  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Vehicles
  const [vehicles, setVehicles] = useState([
    { type: 'van', daily_rate_kes: 25000 },
    { type: 'lc79', daily_rate_kes: 35000 },
    { type: 'coaster', daily_rate_kes: 45000 }
  ]);

  // Hotels
  const [hotels, setHotels] = useState([
    { destination: 'Maasai Mara', name: 'Mara Serena Safari Lodge', nightly_rate_kes: 18000 },
    { destination: 'Amboseli', name: 'Amboseli Serena Safari Lodge', nightly_rate_kes: 16000 },
    { destination: 'Tsavo', name: 'Voi Safari Lodge', nightly_rate_kes: 12000 }
  ]);

  useEffect(() => {
    if (organization?.name) setCompanyName(organization.name);
    if (user?.emailAddresses?.[0]?.emailAddress) {
      setContactEmail(user.emailAddresses[0].emailAddress);
    }
  }, [organization, user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization?.id) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabaseAdmin.storage
        .from('logos')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrlData.publicUrl);
      toast.success("Logo uploaded successfully!");
    } catch (err: any) {
      toast.error("Failed to upload logo: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const saveCompanySettings = async () => {
    if (!organization?.id) {
      toast.error("Organization not found");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/company/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerk_org_id: organization.id,
          name: companyName,
          logo_url: logoUrl,
          contact_email: contactEmail,
          sheet_id: sheetId,
          vehicles,
          hotels
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("✅ All settings saved successfully!");

        // Send welcome email
        if (contactEmail) {
          await fetch('/api/send-welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyName: companyName || organization.name,
              contactEmail: contactEmail,
              quoteSlug: (companyName || organization.name).toLowerCase().replace(/[^a-z0-9]/g, '-'),
              dashboardLink: 'https://safariquote-ai.vercel.app/dashboard'
            }),
          });
        }
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addVehicle = () => {
    setVehicles([...vehicles, { type: 'new', daily_rate_kes: 30000 }]);
  };

  const updateVehicle = (index: number, field: string, value: any) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setVehicles(updated);
  };

  const addHotel = () => {
    setHotels([...hotels, { destination: 'New Destination', name: 'New Hotel', nightly_rate_kes: 15000 }]);
  };

  const updateHotel = (index: number, field: string, value: any) => {
    const updated = [...hotels];
    updated[index] = { ...updated[index], [field]: value };
    setHotels(updated);
  };

  if (!user || !organization) {
    return <div className="p-12 text-center">Please sign in and create an organization.</div>;
  }

   return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">Company Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Managing: <strong>{companyName || organization?.name}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Company Branding */}
          <Card>
            <CardHeader>
              <CardTitle>Company Branding & Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
                
             <div>
               <Label>Upload Company Logo</Label>
               <Input 
               type="file" 
               accept="image/*" 
               onChange={handleLogoUpload} 
               disabled={uploading}
             />
             {uploading && <p className="text-sm text-blue-600 mt-1">Uploading logo...</p>}
             {logoUrl && (
             <div className="mt-4">
            <img src={logoUrl} alt="Company Logo" className="h-24 object-contain border rounded" />
          </div>
          )}
             </div>
              <div>
                <Label>Contact Email</Label>
                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
              <div>
                <Label>Google Sheet ID</Label>
                <Input value={sheetId} onChange={(e) => setSheetId(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicles & Daily Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vehicles.map((vehicle, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>Type</Label>
                    <Input 
                      value={vehicle.type} 
                      onChange={(e) => updateVehicle(index, 'type', e.target.value)} 
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Daily Rate (KES)</Label>
                    <Input 
                      type="number" 
                      value={vehicle.daily_rate_kes} 
                      onChange={(e) => updateVehicle(index, 'daily_rate_kes', parseInt(e.target.value) || 0)} 
                    />
                  </div>
                </div>
              ))}
              <Button onClick={addVehicle} variant="outline" className="w-full">+ Add Vehicle</Button>
            </CardContent>
          </Card>

          {/* Hotels */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Hotels & Nightly Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hotels.map((hotel, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-end border-b pb-4">
                  <div>
                    <Label>Destination</Label>
                    <Input 
                      value={hotel.destination} 
                      onChange={(e) => updateHotel(index, 'destination', e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label>Hotel Name</Label>
                    <Input 
                      value={hotel.name} 
                      onChange={(e) => updateHotel(index, 'name', e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label>Nightly Rate (KES)</Label>
                    <Input 
                      type="number" 
                      value={hotel.nightly_rate_kes} 
                      onChange={(e) => updateHotel(index, 'nightly_rate_kes', parseInt(e.target.value) || 0)} 
                    />
                  </div>
                </div>
              ))}
              <Button onClick={addHotel} variant="outline" className="w-full">+ Add Hotel</Button>
            </CardContent>
          </Card>
        </div>

        {/* Save Button - Moved to bottom, full width */}
        <div className="mt-10">
          <Button onClick={saveCompanySettings} disabled={saving} className="w-full py-8 text-lg font-semibold">
            {saving ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}