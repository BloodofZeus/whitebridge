import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Gift, Clock, Star, DollarSign } from "lucide-react";
import { useLocation } from "wouter";

export default function Promotions() {
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Current Promotions</h1>
          <p className="text-xl mb-8">Take advantage of our limited-time offers and special banking promotions</p>
        </div>
      </section>

      {/* Featured Promotions */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Featured Offers</h2>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-r from-finora-primary to-finora-dark rounded-lg shadow-xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Gift className="w-8 h-8 text-white opacity-20" />
              </div>
              <h3 className="text-2xl font-bold mb-4">New Account Bonus</h3>
              <p className="text-lg mb-6">Open a new checking account and get $200 when you set up direct deposit</p>
              <div className="flex items-center mb-6">
                <Clock className="w-5 h-5 mr-2" />
                <span className="text-sm">Offer expires December 31, 2025</span>
              </div>
              <Button onClick={() => setLocation("/dashboard")} className="bg-white text-finora-primary hover:bg-gray-100 font-semibold">
                Open Account
              </Button>
            </div>
            
            <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg shadow-xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Star className="w-8 h-8 text-white opacity-20" />
              </div>
              <h3 className="text-2xl font-bold mb-4">High-Yield Savings</h3>
              <p className="text-lg mb-6">Earn up to 4.50% APY on your savings with our promotional rate</p>
              <div className="flex items-center mb-6">
                <Clock className="w-5 h-5 mr-2" />
                <span className="text-sm">Rate guaranteed for first 12 months</span>
              </div>
              <Button onClick={() => setLocation("/dashboard")} className="bg-white text-green-700 hover:bg-gray-100 font-semibold">
                Start Saving
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* All Promotions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">All Current Offers</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <DollarSign className="w-8 h-8 text-finora-primary mr-3" />
                <h3 className="text-xl font-semibold">Credit Card Rewards</h3>
              </div>
              <p className="text-gray-600 mb-4">Get 5% cashback on all purchases for the first 3 months</p>
              <p className="text-sm text-gray-500 mb-4">Valid until: March 31, 2025</p>
              <Button onClick={() => setLocation("/dashboard")} variant="outline" className="w-full border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                Apply Now
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <Gift className="w-8 h-8 text-finora-secondary mr-3" />
                <h3 className="text-xl font-semibold">Student Account Special</h3>
              </div>
              <p className="text-gray-600 mb-4">Free checking for students with no monthly fees or minimum balance</p>
              <p className="text-sm text-gray-500 mb-4">Valid with student ID</p>
              <Button onClick={() => setLocation("/help")} variant="outline" className="w-full border-finora-secondary text-finora-secondary hover:bg-finora-secondary hover:text-white">
                Learn More
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <Star className="w-8 h-8 text-finora-accent mr-3" />
                <h3 className="text-xl font-semibold">Business Banking Deal</h3>
              </div>
              <p className="text-gray-600 mb-4">No monthly fees for 6 months on new business checking accounts</p>
              <p className="text-sm text-gray-500 mb-4">Valid until: June 30, 2025</p>
              <Button onClick={() => setLocation("/business")} variant="outline" className="w-full border-finora-accent text-finora-accent hover:bg-finora-accent hover:text-white">
                Open Account
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold">Mortgage Rate Special</h3>
              </div>
              <p className="text-gray-600 mb-4">Get 0.25% off your mortgage rate for first-time homebuyers</p>
              <p className="text-sm text-gray-500 mb-4">Subject to credit approval</p>
              <Button onClick={() => setLocation("/help")} variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                Get Quote
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <Gift className="w-8 h-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold">Refer a Friend</h3>
              </div>
              <p className="text-gray-600 mb-4">Earn $50 for each friend you refer who opens an account</p>
              <p className="text-sm text-gray-500 mb-4">No limit on referrals</p>
              <Button onClick={() => setLocation("/dashboard")} variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white">
                Refer Now
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <Star className="w-8 h-8 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold">Mobile Banking Bonus</h3>
              </div>
              <p className="text-gray-600 mb-4">Get $25 when you sign up for mobile banking and complete 5 transactions</p>
              <p className="text-sm text-gray-500 mb-4">New customers only</p>
              <Button onClick={() => setLocation("/dashboard")} variant="outline" className="w-full border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Terms and Conditions */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Important Information</h3>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <p className="text-sm text-gray-600 mb-4">
              <strong>Terms and Conditions Apply:</strong> All promotional offers are subject to approval and may be modified or withdrawn at any time. Account opening bonuses require qualifying activities and may take 60-90 days to post to your account.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Interest rates are variable and subject to change. Fees may apply for certain services. Please consult with a Finora representative for complete terms and conditions.
            </p>
            <p className="text-sm text-gray-600">
              Member FDIC. Equal Housing Lender. All deposits are insured up to applicable limits.
            </p>
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