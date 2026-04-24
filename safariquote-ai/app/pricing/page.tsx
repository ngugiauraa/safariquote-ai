export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Simple Pricing</h1>
          <p className="text-xl text-gray-400">Start with 14 days free. No credit card required.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="bg-gray-900 rounded-3xl p-8 border border-gray-700">
            <h3 className="text-2xl font-semibold mb-2">Starter</h3>
            <p className="text-5xl font-bold mb-2">KSh 1,500</p>
            <p className="text-gray-400 mb-8">per month</p>
            
            <div className="text-sm text-gray-400 mb-8">
              One-time setup fee: KSh 3,000
            </div>

            <ul className="space-y-4 mb-10 text-gray-300">
              <li>✓ Unlimited quotes</li>
              <li>✓ Dashboard access</li>
              <li>✓ Manage vehicles & hotels</li>
              <li>✓ Basic support</li>
            </ul>

            <a href="/dashboard" className="block text-center bg-white text-black py-4 rounded-2xl font-semibold">
              Start 14-Day Free Trial
            </a>
          </div>

          {/* Professional - Most Popular */}
          <div className="bg-white text-black rounded-3xl p-8 border-2 border-yellow-400 relative scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-1 rounded-full text-sm font-bold">
              MOST POPULAR
            </div>
            <h3 className="text-2xl font-semibold mb-2">Professional</h3>
            <p className="text-5xl font-bold mb-2">KSh 2,500</p>
            <p className="text-gray-500 mb-8">per month</p>
            
            <div className="text-sm text-gray-500 mb-8">
              One-time setup fee: KSh 3,000
            </div>

            <ul className="space-y-4 mb-10">
              <li>✓ Everything in Starter</li>
              <li>✓ Custom logo & branding</li>
              <li>✓ Google Sheet integration</li>
              <li>✓ Priority support</li>
            </ul>

            <a href="/dashboard" className="block text-center bg-black text-white py-4 rounded-2xl font-semibold">
              Start 14-Day Free Trial
            </a>
          </div>

          {/* Special Offer */}
          <div className="bg-gray-900 rounded-3xl p-8 border border-green-500">
            <h3 className="text-2xl font-semibold mb-2 text-green-400">Special Launch Offer</h3>
            <p className="text-4xl font-bold mb-2">KSh 6,000</p>
            <p className="text-gray-400 mb-8">for 5 months Starter Plan</p>
            
            <p className="text-sm text-green-400 mb-8">
              (Only KSh 1,200/month) • Setup fee waived for first 10 clients
            </p>

            <ul className="space-y-4 mb-10 text-gray-300">
              <li>✓ Unlimited quotes</li>
              <li>✓ Dashboard access</li>
              <li>✓ Vehicles & hotels management</li>
            </ul>

            <a href="/dashboard" className="block text-center bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-semibold">
              Claim Special Offer
            </a>
          </div>
        </div>

        <div className="text-center mt-16 text-gray-400 text-sm">
          14 days free trial • Cancel anytime • No credit card required to start
        </div>
      </div>
    </div>
  );
}