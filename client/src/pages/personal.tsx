import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import familyFinancialPlanning from "@assets/generated_images/diverse_family_financial_planning_cece0fd4.png";
import professionalOnlineBanking from "@assets/generated_images/diverse_professional_online_banking_2a63fb70.png";

export default function Personal() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#0A2D5E] to-[#1E4A87] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">Personal Banking Solutions</h1>
            <p className="text-xl mb-8">Everything you need to manage your money, reach your goals, and secure your future</p>
            <Button className="bg-white text-[#0A2D5E] hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
              Open an Account Today
            </Button>
          </div>
        </div>
      </section>

      {/* Banking Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Banking That Works For You</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-[#0A2D5E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-university text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Current Accounts</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Everyday banking made simple with no minimum balance requirements and online banking tools.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Mobile cheque deposit</li>
                  <li>✓ Free online banking</li>
                  <li>✓ UK ATM network</li>
                  <li>✓ Overdraft protection</li>
                </ul>
                <Button variant="outline" className="border-[#0A2D5E] text-[#0A2D5E] hover:bg-[#0A2D5E] hover:text-white">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-[#C5003E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-piggy-bank text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Savings & ISAs</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Grow your money with competitive rates and flexible terms that fit your financial goals.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ High-yield savings accounts</li>
                  <li>✓ Cash & Stocks ISAs</li>
                  <li>✓ No monthly maintenance fees</li>
                  <li>✓ Automatic savings plans</li>
                </ul>
                <Button variant="outline" className="border-[#C5003E] text-[#C5003E] hover:bg-[#C5003E] hover:text-white">
                  Start Saving
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-[#C5003E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-credit-card text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Credit Cards</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Choose from rewards, cashback, and low-interest credit cards designed for your lifestyle.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Rewards and cashback options</li>
                  <li>✓ Low introductory rates</li>
                  <li>✓ Fraud protection</li>
                  <li>✓ Mobile payment compatibility</li>
                </ul>
                <Button variant="outline" className="border-[#C5003E] text-[#C5003E] hover:bg-[#C5003E] hover:text-white">
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Loans Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Home & Personal Loans</h2>
              <p className="text-xl text-gray-600 mb-8">
                Whether you're buying your first home or need funds for a major purchase,
                our loan specialists are here to help you find the right solution.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <i className="fas fa-home text-[#0A2D5E] text-2xl mr-4"></i>
                  <span className="text-lg">Mortgages & Home Equity Loans</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-car text-[#0A2D5E] text-2xl mr-4"></i>
                  <span className="text-lg">Vehicle Finance with Competitive Rates</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-money-check-alt text-[#0A2D5E] text-2xl mr-4"></i>
                  <span className="text-lg">Personal Loans for Any Purpose</span>
                </div>
              </div>
              <Button className="bg-[#0A2D5E] hover:bg-[#051A3E] text-white px-8 py-3">
                Get Pre-Qualified
              </Button>
            </div>
            <div>
              <img
                src={familyFinancialPlanning}
                alt="Happy family financial planning"
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Digital Banking */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Banking on Your Terms</h2>
            <p className="text-xl text-gray-600">
              Experience the convenience of digital banking with our award-winning mobile app and online platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src={professionalOnlineBanking}
                alt="Person using mobile banking app"
                className="rounded-lg shadow-lg mx-auto"
              />
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-6">Award-Winning Mobile App</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <i className="fas fa-mobile-alt text-[#0A2D5E] text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Mobile Cheque Deposit</h4>
                    <p className="text-gray-600">Deposit cheques instantly by taking a photo</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-bell text-[#0A2D5E] text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Real-time Alerts</h4>
                    <p className="text-gray-600">Stay informed about your account activity</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-shield-alt text-[#0A2D5E] text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Advanced Security</h4>
                    <p className="text-gray-600">Biometric login and fraud monitoring</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4 mt-8">
                <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on App Store" className="h-12" />
                <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="h-12" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
