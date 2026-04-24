'use client';

import React, { use, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getContactLines, normalizeCompanySettings } from '@/lib/company-settings';

const activities = [
  { id: 'wildlife', title: 'Wildlife Safari', description: 'Explore world-famous national parks and reserves.', image: 'https://picsum.photos/id/1015/600/400' },
  { id: 'cultural', title: 'Cultural Experiences', description: 'Discover Kenya through villages, traditions, and festivals.', image: 'https://picsum.photos/id/1005/600/400' },
  { id: 'beach', title: 'Beach Holidays', description: 'Combine safari adventure with time on Kenya’s coastline.', image: 'https://picsum.photos/id/1016/600/400' },
  { id: 'mountain', title: 'Mountain Climbing', description: 'Trek Kenya’s scenic highlands and mountain routes.', image: 'https://picsum.photos/id/133/600/400' },
  { id: 'bird', title: 'Bird Watching', description: 'Plan a route around top birding destinations.', image: 'https://picsum.photos/id/201/600/400' },
  { id: 'hiking', title: 'Hiking and Nature Walks', description: 'Enjoy guided outdoor experiences in stunning landscapes.', image: 'https://picsum.photos/id/1018/600/400' },
  { id: 'camping', title: 'Camping and Glamping', description: 'Choose between rugged camping and luxury glamping.', image: 'https://picsum.photos/id/133/600/400' },
  { id: 'cycling', title: 'Cycling Tours', description: 'Experience Kenya on two wheels with scenic cycling routes.', image: 'https://picsum.photos/id/160/600/400' },
];

export default function QuotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  type QuoteState = {
    itinerary: Array<{ day: number; title: string; description: string }>;
    pricingBreakdown: Record<string, number>;
    totalCostKES: number;
    top3Hotels: Array<{ name: string; reason: string }>;
    notes: string;
  } | null;

  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [formIntro, setFormIntro] = useState('');
  const [companyContactLines, setCompanyContactLines] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteState>(null);

  const [formData, setFormData] = useState({
    companySlug: slug,
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    countryOrigin: '',
    nationality: '',
    arrivalDate: '',
    departureDate: '',
    adults: 2,
    hasChildren: false,
    children12Plus: 0,
    childrenUnder12: 0,
    activities: [] as string[],
    otherActivities: '',
    preferredDestination: '',
    accommodation: 'midrange',
    transport: 'any',
    specialDiet: '',
    healthNotes: '',
    budgetPerAdult: '',
    budgetPerChild: '',
    currency: 'KES',
    notes: '',
  });

  useEffect(() => {
    fetch(`/api/company/info?slug=${slug}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Company not found.');
        }
        return payload;
      })
      .then((data) => {
        const settings = normalizeCompanySettings(data.customization_settings, {
          logoUrl: data.logo_url,
          contactEmail: data.contact_email,
        });

        setCompanyName(data.name || slug);
        setCompanyLogo(settings.form.includeLogo ? data.logo_url || '' : '');
        setFormIntro(settings.form.introText);
        setCompanyContactLines(
          settings.form.includeContactInfo ? getContactLines(settings.contactInfo) : []
        );
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Unable to load company details.';
        toast.error(message);
      });
  }, [slug]);

  const nextStep = () => setStep((current) => current + 1);
  const prevStep = () => setStep((current) => current - 1);

  const toggleActivity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.includes(id)
        ? prev.activities.filter((activity) => activity !== id)
        : [...prev.activities, id],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate quote.');
      }

      setQuote(result.quote);
      toast.success('Quote generated and emailed successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate quote.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <Card>
          <CardHeader>
            <div className="mb-6 flex items-center gap-4">
              {companyLogo ? <img src={companyLogo} alt="Company Logo" className="h-12 w-auto" /> : null}
              <div>
                <CardTitle className="text-3xl">{companyName || slug}</CardTitle>
                <p className="text-sm text-gray-500">Safari Quote Form</p>
              </div>
            </div>
            {formIntro ? <p className="rounded-xl bg-teal-50 p-4 text-sm text-teal-900">{formIntro}</p> : null}
            {companyContactLines.length > 0 ? (
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                <p className="mb-2 font-semibold">Contact details</p>
                {companyContactLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
            <div className="pt-4 text-center text-sm text-gray-500">Step {step} of 7</div>
          </CardHeader>

          <CardContent className="space-y-8">
            {step === 1 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Step 1 of 7 - Traveler Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>First Name</Label><Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} /></div>
                  <div><Label>Last Name</Label><Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} /></div>
                </div>
                <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div><Label>Phone / Mobile</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Country of Origin</Label><Input value={formData.countryOrigin} onChange={(e) => setFormData({ ...formData, countryOrigin: e.target.value })} /></div>
                  <div><Label>Nationality</Label><Input value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} /></div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Step 2 of 7 - Travel Dates</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div><Label>Expected Date of Arrival</Label><Input type="date" value={formData.arrivalDate} onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })} /></div>
                  <div><Label>Expected Date of Departure</Label><Input type="date" value={formData.departureDate} onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })} /></div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Step 3 of 7 - Pax Details</h3>
                <div>
                  <Label>Number of Adults (18+)</Label>
                  <Input type="number" value={formData.adults} onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div>
                  <Label>Are there any children?</Label>
                  <Select value={formData.hasChildren ? 'yes' : 'no'} onValueChange={(value) => setFormData({ ...formData, hasChildren: value === 'yes' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.hasChildren ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Children 12+ years</Label><Input type="number" value={formData.children12Plus} onChange={(e) => setFormData({ ...formData, children12Plus: parseInt(e.target.value, 10) || 0 })} /></div>
                    <div><Label>Children under 12 years</Label><Input type="number" value={formData.childrenUnder12} onChange={(e) => setFormData({ ...formData, childrenUnder12: parseInt(e.target.value, 10) || 0 })} /></div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Step 4 of 7 - Activities</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="overflow-hidden rounded-2xl border hover:shadow-md">
                      <img src={activity.image} alt={activity.title} className="h-48 w-full object-cover" />
                      <div className="p-4">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input type="checkbox" checked={formData.activities.includes(activity.id)} onChange={() => toggleActivity(activity.id)} className="mt-1" />
                          <div>
                            <strong>{activity.title}</strong>
                            <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div><Label>Other activities (optional)</Label><Input value={formData.otherActivities} onChange={(e) => setFormData({ ...formData, otherActivities: e.target.value })} /></div>
                <div><Label>Preferred destination (optional)</Label><Input value={formData.preferredDestination} onChange={(e) => setFormData({ ...formData, preferredDestination: e.target.value })} /></div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Step 5 of 7 - Accommodation and Transport</h3>
                <div>
                  <Label>Accommodation Preference</Label>
                  <Select value={formData.accommodation} onValueChange={(value) => setFormData({ ...formData, accommodation: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="midrange">Midrange</SelectItem>
                      <SelectItem value="luxury">Luxury (5+ Stars)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transportation Options</Label>
                  <Select value={formData.transport} onValueChange={(value) => setFormData({ ...formData, transport: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Tour operator to propose</SelectItem>
                      <SelectItem value="minivan">Private Minivan</SelectItem>
                      <SelectItem value="4x4">Private 4x4</SelectItem>
                      <SelectItem value="air">Private Air Charter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {step === 6 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Step 6 of 7 - Diet, Health, and Budget</h3>
                <div><Label>Special dietary requirements</Label><Textarea value={formData.specialDiet} onChange={(e) => setFormData({ ...formData, specialDiet: e.target.value })} placeholder="Vegetarian, halal, allergies, etc." /></div>
                <div><Label>Health notes</Label><Textarea value={formData.healthNotes} onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })} placeholder="Allergies, motion sickness, accessibility needs, etc." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preferred Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Budget per Adult</Label><Input type="number" value={formData.budgetPerAdult} onChange={(e) => setFormData({ ...formData, budgetPerAdult: e.target.value })} /></div>
                </div>
                {formData.hasChildren ? (
                  <div><Label>Budget per Child</Label><Input type="number" value={formData.budgetPerChild} onChange={(e) => setFormData({ ...formData, budgetPerChild: e.target.value })} /></div>
                ) : null}
              </div>
            ) : null}

            {step === 7 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Step 7 of 7 - Review and Submit</h3>
                <div className="space-y-3 rounded-xl bg-gray-50 p-6 text-sm">
                  <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Travel Dates:</strong> {formData.arrivalDate} to {formData.departureDate}</p>
                  <p><strong>Adults:</strong> {formData.adults}</p>
                  <p><strong>Children:</strong> {formData.children12Plus + formData.childrenUnder12}</p>
                  <p><strong>Activities:</strong> {formData.activities.length ? formData.activities.join(', ') : 'None selected'}</p>
                  <p><strong>Accommodation:</strong> {formData.accommodation}</p>
                  <p><strong>Transport:</strong> {formData.transport}</p>
                </div>

                <Button onClick={handleSubmit} disabled={loading} className="w-full py-6 text-lg">
                  {loading ? 'Generating your quote...' : 'Submit and Get Instant Quote'}
                </Button>
              </div>
            ) : null}

            <div className="flex justify-between pt-8">
              {step > 1 ? <Button variant="outline" onClick={prevStep}>Previous</Button> : <span />}
              {step < 7 ? <Button onClick={nextStep}>Next</Button> : null}
            </div>
          </CardContent>
        </Card>

        {quote ? (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quote Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg font-semibold">Estimated Total: KES {Number(quote.totalCostKES || 0).toLocaleString()}</p>
              <div className="space-y-3">
                {quote.itinerary?.map((day: { day: number; title: string; description: string }) => (
                  <div key={day.day} className="rounded-xl border p-4">
                    <p className="font-semibold">Day {day.day}: {day.title}</p>
                    <p className="text-sm text-gray-600">{day.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Your itinerary PDF has been emailed. If the company has a contact email configured, they also received the lead and PDF copy.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
