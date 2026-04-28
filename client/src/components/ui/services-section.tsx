import { useLocation } from "wouter";

export default function ServicesSection() {
  const [, setLocation] = useLocation();
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Helping people bank smarter</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow duration-200">
            <div className="w-16 h-16 bg-[#0A2D5E] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-piggy-bank text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Savings & ISAs</h3>
            <p className="text-gray-600 mb-4">High-yield savings accounts and ISAs to grow your money with FSCS protection.</p>
            <button
              onClick={() => setLocation("/products?category=savings")}
              className="text-[#0A2D5E] hover:underline font-medium"
            >
              Learn more →
            </button>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow duration-200">
            <div className="w-16 h-16 bg-[#C5003E] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Current Accounts</h3>
            <p className="text-gray-600 mb-4">Flexible current accounts designed for your everyday banking needs.</p>
            <button
              onClick={() => setLocation("/products?category=checking")}
              className="text-[#C5003E] hover:underline font-medium"
            >
              Learn more →
            </button>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow duration-200">
            <div className="w-16 h-16 bg-[#C5003E] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-credit-card text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Credit Cards</h3>
            <p className="text-gray-600 mb-4">Rewarding credit cards with cashback, travel rewards, and low rates.</p>
            <button
              onClick={() => setLocation("/products?category=credit-cards")}
              className="text-[#C5003E] hover:underline font-medium"
            >
              Learn more →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
