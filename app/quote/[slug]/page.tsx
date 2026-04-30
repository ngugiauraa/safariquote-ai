'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { use } from 'react';

type CompanyInfoResponse = {
  success: boolean;
  name?: string;
  logo_url?: string | null;
  contact_email?: string | null;
  themeColor?: string | null;
  whiteLabelForm?: boolean;
};

const activities = [
  {
    id: 'wildlife',
    title: 'Wildlife Safari',
    description: 'Explore world-famous National Parks and Reserves (eg Maasai Mara, Amboseli, and Tsavo) to witness the incredible diversity of Flora and Fauna.',
    image: 'https://picsum.photos/id/1015/600/400'
  },
  {
    id: 'cultural',
    title: 'Cultural Experiences',
    description: 'Visit traditional Maasai villages to experience their unique culture, traditions, and vibrant ceremonies. Attend cultural festivals showcasing the diversity of Kenya\'s ethnic groups.',
    image: 'https://picsum.photos/id/1005/600/400'
  },
  {
    id: 'beach',
    title: 'Beach Holidays',
    description: 'Kenya has a beautiful coastline with 1,750 kms of white sandy beaches. Relax on the pristine beaches along the Kenyan coast (including Lamu, Diani, Malindi, and Watamu) and engage in a variety of water sports (snorkeling, diving, and kite surfing).',
    image: 'https://picsum.photos/id/1016/600/400'
  },
  {
    id: 'mountain',
    title: 'Mountain Climbing',
    description: 'Enjoys Kenya’s mountains including a trek to the summit of Mt Kenya, Africa\'s second-highest peak. The experience offers breathtaking views and a challenging adventure.',
    image: 'https://picsum.photos/id/133/600/400'
  },
  {
    id: 'bird',
    title: 'Bird Watching',
    description: 'Kenya is a paradise for bird enthusiasts with numerous bird species in various locations e.g. Lake Nakuru and Lake Bogoria.',
    image: 'https://picsum.photos/id/201/600/400'
  },
  {
    id: 'hiking',
    title: 'Hiking and Nature Walks',
    description: 'Explore scenic landscapes and diverse ecosystems through hiking trails and nature walks in several locations across the country.',
    image: 'https://picsum.photos/id/1018/600/400'
  },
  {
    id: 'camping',
    title: 'Camping and Glamping',
    description: 'Experience the beauty of the outdoors by camping in national parks or indulge in luxury camping (glamping) for a comfortable yet immersive experience.',
    image: 'https://picsum.photos/id/133/600/400'
  },
  {
    id: 'cycling',
    title: 'Cycling Tours',
    description: 'Enjoy a more immersive travel experience through undertaking cycling tours, exploring the countryside and interacting with local communities.',
    image: 'https://picsum.photos/id/160/600/400'
  },
  {
    id: 'historical',
    title: 'Historical and Archeological Tours',
    description: 'Visit historical sites like Fort Jesus in Mombasa or the ancient Swahili town of Lamu (UNESCO World Heritage Sites).',
    image: 'https://picsum.photos/id/101/600/400'
  },
  {
    id: 'fishing',
    title: 'Fishing',
    description: 'Enjoy deep-sea fishing in the Indian Ocean or try freshwater fishing in the country\'s lakes, known for their abundance of fish species.',
    image: 'https://picsum.photos/id/201/600/400'
  },
  {
    id: 'photography',
    title: 'Photography Safaris',
    description: 'Capture the stunning landscapes, diverse wildlife, and vibrant cultures through photography safaris, led by experienced guides.',
    image: 'https://picsum.photos/id/251/600/400'
  },
  {
    id: 'museums',
    title: 'National Museums and Art Galleries',
    description: 'Explore Nairobi\'s National Museum and other cultural institutions to learn about Kenya\'s history, art, and archaeology.',
    image: 'https://picsum.photos/id/29/600/400'
  },
  {
    id: 'horseback',
    title: 'Horse Back Safaris',
    description: 'Experience the thrill of a safari on horseback, allowing you to traverse terrains that may be inaccessible by traditional safari vehicles. This provides a more immersive and up-close encounter with Kenya\'s abundant wildlife.',
    image: 'https://picsum.photos/id/1005/600/400'
  }
];

export default function QuotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyContactEmail, setCompanyContactEmail] = useState('');
  const [themeColor, setThemeColor] = useState('#0f766e');
  const [whiteLabelForm, setWhiteLabelForm] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch company logo and name
  useEffect(() => {
    fetch(`/api/company/info?slug=${slug}`)
      .then(res => res.json())
      .then((data: CompanyInfoResponse) => {
        if (data.success) {
          setCompanyName(data.name || slug);
          setCompanyLogo(data.logo_url || '');
          setCompanyContactEmail(data.contact_email || '');
          setThemeColor(data.themeColor || '#0f766e');
          setWhiteLabelForm(Boolean(data.whiteLabelForm));
        }
      })
      .catch(() => {
        setCompanyName(slug);
      });
  }, [slug]);

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
    notes: ''
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const toggleActivity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.includes(id)
        ? prev.activities.filter(a => a !== id)
        : [...prev.activities, id]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setTimeout(() => {
      toast.success("Quote generated successfully!");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader style={{ borderTop: `4px solid ${themeColor}` }}>
            <div className="flex items-center gap-4 mb-6">
              {companyLogo && <img src={companyLogo} alt="Company Logo" className="h-12 w-auto" />}
              <div>
                <CardTitle className="text-3xl">{companyName || slug}</CardTitle>
                <p className="text-sm text-gray-400">{whiteLabelForm ? 'Travel Quote Form' : 'Powered by SafariQuote AI'}</p>
              </div>
            </div>
            {companyContactEmail && (
              <p className="text-sm" style={{ color: themeColor }}>
                Contact this company directly: {companyContactEmail}
              </p>
            )}
            <div className="text-center text-sm text-gray-500">Step {step} of 7</div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Step 1: Traveler Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 1 of 7 - Traveler Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>First Name</Label><Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                  <div><Label>Last Name</Label><Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
                </div>
                <div><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div><Label>Phone / Mobile</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Country of Origin</Label><Input value={formData.countryOrigin} onChange={e => setFormData({...formData, countryOrigin: e.target.value})} /></div>
                  <div><Label>Nationality</Label><Input value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} /></div>
                </div>
              </div>
            )}

            {/* Step 2: Dates */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 2 of 7 - Travel Dates</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Expected Date of Arrival</Label>
                    <Input type="date" value={formData.arrivalDate} onChange={e => setFormData({...formData, arrivalDate: e.target.value})} />
                  </div>
                  <div>
                    <Label>Expected Date of Departure</Label>
                    <Input type="date" value={formData.departureDate} onChange={e => setFormData({...formData, departureDate: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Pax */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 3 of 7 - Pax Details</h3>
                <div>
                  <Label>Number of Adults (18+)</Label>
                  <Input type="number" value={formData.adults} onChange={e => setFormData({...formData, adults: parseInt(e.target.value)||0})} />
                </div>
                <div>
                  <Label>Are there any children?</Label>
                  <Select value={formData.hasChildren ? "yes" : "no"} onValueChange={v => setFormData({...formData, hasChildren: v==="yes"})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.hasChildren && (
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Children 12+ years</Label><Input type="number" value={formData.children12Plus} onChange={e => setFormData({...formData, children12Plus: parseInt(e.target.value)||0})} /></div>
                    <div><Label>Children under 12 years</Label><Input type="number" value={formData.childrenUnder12} onChange={e => setFormData({...formData, childrenUnder12: parseInt(e.target.value)||0})} /></div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Activities */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 4 of 7 - Activities List</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activities.map((act) => (
                    <div key={act.id} className="border rounded-2xl overflow-hidden hover:shadow-md transition">
                      <img src={act.image} alt={act.title} className="w-full h-48 object-cover" />
                      <div className="p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.activities.includes(act.id)}
                            onChange={() => toggleActivity(act.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <strong>{act.title}</strong>
                            <p className="text-sm text-gray-600 mt-1 leading-tight">{act.description}</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Label>Other activities (optional)</Label>
                  <Input value={formData.otherActivities} onChange={e => setFormData({...formData, otherActivities: e.target.value})} />
                </div>
                <div>
                  <Label>Do you have any preferred destination? (optional)</Label>
                  <Input value={formData.preferredDestination} onChange={e => setFormData({...formData, preferredDestination: e.target.value})} />
                </div>
              </div>
            )}

            {/* Step 5: Accommodation & Transport */}
            {step === 5 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 5 of 7 - Accommodation & Transport</h3>
                <div>
                  <Label>Accommodation Preference</Label>
                  <Select value={formData.accommodation} onValueChange={v => setFormData({...formData, accommodation: v})}>
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
                  <Select value={formData.transport} onValueChange={v => setFormData({...formData, transport: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Non in particular (Tour operator to propose)</SelectItem>
                      <SelectItem value="minivan">Private Minivan</SelectItem>
                      <SelectItem value="4x4">Private 4x4</SelectItem>
                      <SelectItem value="air">Private Air Charter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 6: Diet, Health & Budget */}
            {step === 6 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 6 of 7 - Diet, Health & Budgets</h3>
                <div>
                  <Label>Special dietary requirements?</Label>
                  <Textarea value={formData.specialDiet} onChange={e => setFormData({...formData, specialDiet: e.target.value})} placeholder="Vegetarian, halal, etc." />
                </div>
                <div>
                  <Label>Health instances to bring to the tour operator?</Label>
                  <Textarea value={formData.healthNotes} onChange={e => setFormData({...formData, healthNotes: e.target.value})} placeholder="Allergies, motion sickness, etc." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preferred Currency</Label>
                    <Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Budget Estimate Per Adult (in selected currency)</Label>
                    <Input type="number" value={formData.budgetPerAdult} onChange={e => setFormData({...formData, budgetPerAdult: e.target.value})} />
                  </div>
                </div>
                {formData.hasChildren && (
                  <div>
                    <Label>Budget Estimate Per Child</Label>
                    <Input type="number" value={formData.budgetPerChild} onChange={e => setFormData({...formData, budgetPerChild: e.target.value})} />
                  </div>
                )}
              </div>
            )}

            {/* Step 7: Review & Submit */}
            {step === 7 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 7 of 7 - Review and Submit</h3>
                
                <div className="bg-gray-50 p-6 rounded-xl space-y-4 text-sm">
                  <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Travel Dates:</strong> {formData.arrivalDate} to {formData.departureDate}</p>
                  <p><strong>Adults:</strong> {formData.adults} {formData.hasChildren && `| Children: ${formData.children12Plus + formData.childrenUnder12}`}</p>
                  <p><strong>Activities:</strong> {formData.activities.length > 0 ? formData.activities.join(', ') : 'None selected'}</p>
                  <p><strong>Accommodation:</strong> {formData.accommodation}</p>
                  <p><strong>Transport:</strong> {formData.transport}</p>
                  <p><strong>Currency:</strong> {formData.currency}</p>
                  <p><strong>Budget per Adult:</strong> {formData.budgetPerAdult} {formData.currency}</p>
                </div>

                <Button onClick={handleSubmit} disabled={loading} className="w-full py-6 text-lg" style={{ backgroundColor: themeColor }}>
                  {loading ? "Generating your quote..." : "Submit & Get Instant Quote"}
                </Button>
              </div>
            )}

            {/* Bottom Navigation */}
            <div className="flex justify-between pt-8">
              {step > 1 && <Button variant="outline" onClick={prevStep}>Previous</Button>}
              {step < 7 && <Button onClick={nextStep} style={{ backgroundColor: themeColor }}>Next</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
