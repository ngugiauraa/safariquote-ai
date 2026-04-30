'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { pricingPlans } from '@/lib/pricing';

type Review = {
  name: string;
  rating: number;
  comment: string;
};

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => setReviews(data));
  }, []);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !comment) return;

    setSubmitting(true);

    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rating, comment }),
    });

    toast.success('Thank you for your review!');

    const res = await fetch('/api/reviews');
    const data = await res.json();
    setReviews(data);

    setName('');
    setComment('');
    setRating(5);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="pt-24 pb-16 text-center px-6">
        <h1 className="text-6xl font-bold mb-6">SafariQuote AI</h1>
        <p className="text-2xl text-gray-400 max-w-2xl mx-auto">
          Instant safari quotes for Kenyan travel companies
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <a href="/dashboard" className="bg-white text-black px-10 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-200">
            Start 14 Day Free Trial
          </a>
          <Link href="/quote/test-company" className="border border-white px-10 py-4 rounded-2xl text-lg font-semibold hover:bg-white hover:text-black">
            Try Demo Quote
          </Link>
        </div>
      </div>

      <div className="bg-gray-900 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.featured ? 'bg-white text-black border-2 border-yellow-400 relative scale-105' : 'bg-gray-800 border-gray-700'}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-1 rounded-full text-sm font-bold">
                    {plan.badge}
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
                  <p className={plan.featured ? 'text-sm text-gray-600 mb-3' : 'text-sm text-gray-400 mb-3'}>
                    {plan.description}
                  </p>
                  <p className="text-5xl font-bold mb-2">
                    {plan.price}
                    <span className={plan.featured ? 'text-base font-normal text-gray-500' : 'text-base font-normal text-gray-400'}>
                      {plan.period}
                    </span>
                  </p>
                  {plan.setupFee && (
                    <p className={plan.featured ? 'text-sm text-gray-500 mb-8' : 'text-sm text-gray-400 mb-8'}>
                      {plan.setupFee}
                    </p>
                  )}
                  <p className={plan.featured ? 'text-sm font-medium mb-4 text-gray-700' : 'text-sm font-medium mb-4 text-gray-200'}>
                    {plan.idealFor}
                  </p>
                  <ul className={plan.featured ? 'space-y-3 mb-6' : 'space-y-3 mb-6 text-gray-300'}>
                    {plan.included.map((feature) => (
                      <li key={feature}>Included: {feature}</li>
                    ))}
                  </ul>
                  {plan.excluded && plan.excluded.length > 0 && (
                    <ul className={plan.featured ? 'space-y-2 mb-8 text-gray-500' : 'space-y-2 mb-8 text-red-300'}>
                      {plan.excluded.map((feature) => (
                        <li key={feature}>Not included: {feature}</li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/dashboard?plan=${plan.tier}`}
                    className={plan.featured ? 'block text-center bg-black text-white py-4 rounded-2xl font-semibold' : 'block text-center bg-gray-700 hover:bg-gray-600 py-4 rounded-2xl font-semibold'}
                  >
                    {plan.ctaLabel}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {reviews.length > 0 ? reviews.slice(0, 6).map((review, i) => (
              <Card key={i} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(review.rating)].map((_, starIndex) => (
                      <span key={starIndex} className="text-yellow-400 text-xl">★</span>
                    ))}
                  </div>
                  <p className="italic text-gray-300">&quot;{review.comment}&quot;</p>
                  <p className="mt-6 font-semibold">- {review.name}</p>
                </CardContent>
              </Card>
            )) : (
              <p className="text-center text-gray-500 col-span-3">No reviews yet. Be the first!</p>
            )}
          </div>

          <div className="max-w-xl mx-auto bg-gray-800 rounded-3xl p-10">
            <h3 className="text-2xl font-semibold text-center mb-8">Leave Your Review</h3>
            <form onSubmit={submitReview} className="space-y-6">
              <div>
                <Label>Your Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label>Rating</Label>
                <Select value={rating.toString()} onValueChange={(v) => setRating(parseInt(v, 10))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n} Stars</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Your Feedback</Label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} required />
              </div>
              <Button type="submit" disabled={submitting} className="w-full py-6">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="py-12 text-center text-gray-500 text-sm">
        SafariQuote AI © 2026 • Built for Kenyan Travel Companies
      </div>
    </div>
  );
}
