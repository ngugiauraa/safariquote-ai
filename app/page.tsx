'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Home() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load reviews on mount
  useEffect(() => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => setReviews(data));
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

    toast.success("Thank you for your review!");

    // Refresh reviews
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
      {/* Hero */}
      <div className="pt-24 pb-16 text-center px-6">
        <h1 className="text-6xl font-bold mb-6">SafariQuote AI</h1>
        <p className="text-2xl text-gray-400 max-w-2xl mx-auto">
          Instant safari quotes for Kenyan travel companies
        </p>
        <div className="mt-10 space-x-4">
          <a href="/dashboard" className="bg-white text-black px-10 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-200">
            Company Dashboard
          </a>
          <a href="/quote/test-company" className="border border-white px-10 py-4 rounded-2xl text-lg font-semibold hover:bg-white hover:text-black">
            Try Demo Quote
          </a>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">What Our Users Say</h2>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {reviews.length > 0 ? (
              reviews.slice(0, 6).map((review, i) => (
                <Card key={i} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-xl">★</span>
                      ))}
                    </div>
                    <p className="italic text-gray-300">"{review.comment}"</p>
                    <p className="mt-6 font-semibold">- {review.name}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-3">No reviews yet. Be the first!</p>
            )}
          </div>

          {/* Submit Review Form */}
          <div className="max-w-xl mx-auto bg-gray-800 rounded-3xl p-10">
            <h3 className="text-2xl font-semibold text-center mb-8">Leave Your Review</h3>
            <form onSubmit={submitReview} className="space-y-6">
              <div>
                <Label>Your Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label>Rating</Label>
                <Select value={rating.toString()} onValueChange={(v) => setRating(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5,4,3,2,1].map(n => (
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
                {submitting ? "Submitting..." : "Submit Review"}
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