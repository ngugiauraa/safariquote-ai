import Link from 'next/link';
import { pricingPlans } from '@/lib/pricing';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Simple Pricing</h1>
          <p className="text-xl text-gray-400">Start with 14 days free. No credit card required.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={plan.featured ? 'bg-white text-black rounded-3xl p-8 border-2 border-yellow-400 relative scale-105' : 'bg-gray-900 rounded-3xl p-8 border border-gray-700'}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-1 rounded-full text-sm font-bold">
                  {plan.badge}
                </div>
              )}
              <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
              <p className={plan.featured ? 'text-sm text-gray-600 mb-3' : 'text-sm text-gray-400 mb-3'}>
                {plan.description}
              </p>
              <p className="text-5xl font-bold mb-2">{plan.price}</p>
              <p className={plan.featured ? 'text-gray-500 mb-8' : 'text-gray-400 mb-8'}>per month</p>

              {plan.setupFee && (
                <div className={plan.featured ? 'text-sm text-gray-500 mb-8' : 'text-sm text-gray-400 mb-8'}>
                  {plan.setupFee}
                </div>
              )}

              <p className={plan.featured ? 'text-sm font-medium mb-4 text-gray-700' : 'text-sm font-medium mb-4 text-gray-200'}>
                {plan.idealFor}
              </p>

              <ul className={plan.featured ? 'space-y-4 mb-6' : 'space-y-4 mb-6 text-gray-300'}>
                {plan.included.map((feature) => (
                  <li key={feature}>Included: {feature}</li>
                ))}
              </ul>

              {plan.excluded && plan.excluded.length > 0 && (
                <ul className={plan.featured ? 'space-y-2 mb-10 text-gray-500' : 'space-y-2 mb-10 text-red-300'}>
                  {plan.excluded.map((feature) => (
                    <li key={feature}>Not included: {feature}</li>
                  ))}
                </ul>
              )}

              <Link
                href={`/dashboard?plan=${plan.tier}`}
                className={plan.featured ? 'block text-center bg-black text-white py-4 rounded-2xl font-semibold' : 'block text-center bg-white text-black py-4 rounded-2xl font-semibold'}
              >
                {plan.ctaLabel}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 text-gray-400 text-sm">
          14 days free trial • Cancel anytime • No credit card required to start
        </div>
      </div>
    </div>
  );
}
