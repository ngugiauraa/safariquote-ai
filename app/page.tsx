export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-6xl font-bold mb-6">SafariQuote AI</h1>
        <p className="text-2xl text-gray-400 mb-10">
          Instant safari quotes for Kenyan travel companies
        </p>
        
        <div className="space-x-4">
          <a 
            href="/dashboard" 
            className="bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg inline-block hover:bg-gray-200"
          >
            Company Dashboard
          </a>
          
          <a 
            href="/quote/test-company" 
            className="border border-white px-8 py-4 rounded-xl font-semibold text-lg inline-block hover:bg-white hover:text-black"
          >
            Try Quote Form
          </a>
        </div>

        <p className="text-gray-500 mt-12 text-sm">
          For travel companies in Kenya • Maasai Mara • Amboseli • Tsavo • etc.
        </p>
      </div>
    </div>
  );
}