import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { CreditCard, Building, PiggyBank, TrendingUp, Shield, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function Products() {
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-finora-primary to-finora-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Banking Products</h1>
          <p className="text-xl mb-8">Discover the full range of Finora banking products designed for your financial success</p>
        </div>
      </section>

      {/* Personal Banking Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Personal Banking</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <Building className="w-12 h-12 text-finora-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4">Checking Accounts</h3>
              <p className="text-gray-600 mb-6">Flexible checking accounts with online banking, mobile deposit, and fee-free ATM access.</p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>• No monthly maintenance fees</li>
                <li>• Mobile check deposit</li>
                <li>• Debit card included</li>
                <li>• Online & mobile banking</li>
              </ul>
              <Button onClick={() => setLocation("/dashboard")} className="w-full bg-finora-primary hover:bg-finora-dark">Learn More</Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <PiggyBank className="w-12 h-12 text-finora-secondary mb-4" />
              <h3 className="text-xl font-semibold mb-4">Savings Accounts</h3>
              <p className="text-gray-600 mb-6">High-yield savings accounts to help your money grow with competitive interest rates.</p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>• High interest rates</li>
                <li>• No minimum balance</li>
                <li>• Automatic savings programs</li>
                <li>• FDIC insured</li>
              </ul>
              <Button onClick={() => setLocation("/dashboard")} className="w-full bg-finora-secondary hover:bg-finora-dark">Open Account</Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <CreditCard className="w-12 h-12 text-finora-accent mb-4" />
              <h3 className="text-xl font-semibold mb-4">Credit Cards</h3>
              <p className="text-gray-600 mb-6">Rewarding credit cards with cashback, travel rewards, and low interest rates.</p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>• Up to 5% cashback</li>
                <li>• No annual fee options</li>
                <li>• Travel rewards programs</li>
                <li>• Fraud protection</li>
              </ul>
              <Button onClick={() => setLocation("/dashboard")} className="w-full bg-finora-accent hover:bg-finora-dark">Apply Now</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Business Banking Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Business Banking</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <Users className="w-12 h-12 text-finora-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4">Business Checking</h3>
              <p className="text-gray-600 mb-6">Streamlined business checking accounts with advanced online banking features.</p>
              <Button onClick={() => setLocation("/business")} className="bg-finora-primary hover:bg-finora-dark">Learn More</Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8">
              <TrendingUp className="w-12 h-12 text-finora-secondary mb-4" />
              <h3 className="text-xl font-semibold mb-4">Business Loans</h3>
              <p className="text-gray-600 mb-6">Flexible financing solutions to help your business grow and succeed.</p>
              <Button onClick={() => setLocation("/business")} className="bg-finora-secondary hover:bg-finora-dark">Apply Today</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Investment & Wealth Management</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Shield className="w-12 h-12 text-finora-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-4">CDs & Money Market</h3>
              <p className="text-gray-600 mb-4">Secure your savings with competitive rates on certificates of deposit and money market accounts.</p>
              <Button onClick={() => setLocation("/investing")} variant="outline" className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                View Rates
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <TrendingUp className="w-12 h-12 text-finora-secondary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-4">Investment Services</h3>
              <p className="text-gray-600 mb-4">Professional investment management and financial planning services for your future.</p>
              <Button onClick={() => setLocation("/investing")} variant="outline" className="border-finora-secondary text-finora-secondary hover:bg-finora-secondary hover:text-white">
                Get Started
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Building className="w-12 h-12 text-finora-accent mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-4">Retirement Planning</h3>
              <p className="text-gray-600 mb-4">Plan for your retirement with IRAs, 401(k) rollovers, and retirement planning services.</p>
              <Button onClick={() => setLocation("/investing")} variant="outline" className="border-finora-accent text-finora-accent hover:bg-finora-accent hover:text-white">
                Plan Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Finora Bank. All rights reserved. Member FDIC.</p>
        </div>
      </footer>
    </div>
  );
}