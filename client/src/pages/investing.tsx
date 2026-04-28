import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Investing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-finora-secondary to-finora-accent py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">Smart Investing Solutions</h1>
            <p className="text-xl mb-8">Build and protect your wealth with our comprehensive investment services and expert guidance</p>
            <Button className="bg-white text-finora-primary hover:bg-gray-100 px-8 py-3 text-lg">
              Start Investing Today
            </Button>
          </div>
        </div>
      </section>

      {/* Investment Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Investment Products & Services</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-area text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Mutual Funds</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Diversified investment options from leading fund companies with professional management.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Broad market index funds</li>
                  <li>✓ Sector-specific funds</li>
                  <li>✓ International diversification</li>
                  <li>✓ Low-cost options available</li>
                </ul>
                <Button variant="outline" className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                  Explore Funds
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-layer-group text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">ETFs & Stocks</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Individual stocks and exchange-traded funds for direct market exposure and control.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Commission-free stock trades</li>
                  <li>✓ Extensive ETF selection</li>
                  <li>✓ Real-time market data</li>
                  <li>✓ Advanced trading tools</li>
                </ul>
                <Button variant="outline" className="border-finora-secondary text-finora-secondary hover:bg-finora-secondary hover:text-white">
                  Start Trading
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-umbrella text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Retirement Planning</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Tax-advantaged retirement accounts and planning services for long-term financial security.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Traditional & Roth IRAs</li>
                  <li>✓ 401(k) rollovers</li>
                  <li>✓ Retirement income strategies</li>
                  <li>✓ Social Security optimization</li>
                </ul>
                <Button variant="outline" className="border-finora-accent text-finora-accent hover:bg-finora-accent hover:text-white">
                  Plan Retirement
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Investment Philosophy */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Our Investment Philosophy</h2>
              <p className="text-xl text-gray-600 mb-8">
                We believe in disciplined, long-term investing strategies that are 
                tailored to your individual risk tolerance and financial goals.
              </p>
              <div className="space-y-6">
                <div className="flex items-start">
                  <i className="fas fa-compass text-finora-primary text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Goal-Based Investing</h4>
                    <p className="text-gray-600">Strategies aligned with your specific financial objectives</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-balance-scale text-finora-primary text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Risk Management</h4>
                    <p className="text-gray-600">Diversification and asset allocation to manage volatility</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-chart-line text-finora-primary text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Long-term Focus</h4>
                    <p className="text-gray-600">Patient capital approach for sustained growth</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Financial advisor reviewing investment portfolio" 
                className="rounded-lg shadow-lg w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Advisory Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Professional Advisory Services</h2>
            <p className="text-xl text-gray-600">
              Work with our experienced investment professionals to create and manage your portfolio
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-user-tie text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Personal Financial Advisors</h3>
              <p className="text-gray-600 mb-6">
                Dedicated advisors who understand your unique financial situation and goals.
              </p>
              <ul className="text-sm space-y-2">
                <li>✓ One-on-one consultations</li>
                <li>✓ Personalized investment strategies</li>
                <li>✓ Ongoing portfolio monitoring</li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-robot text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Robo-Advisor Platform</h3>
              <p className="text-gray-600 mb-6">
                Automated investing with low fees and professional portfolio management.
              </p>
              <ul className="text-sm space-y-2">
                <li>✓ Algorithm-driven rebalancing</li>
                <li>✓ Tax-loss harvesting</li>
                <li>✓ Low minimum investments</li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-graduation-cap text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Investment Education</h3>
              <p className="text-gray-600 mb-6">
                Educational resources and tools to help you make informed investment decisions.
              </p>
              <ul className="text-sm space-y-2">
                <li>✓ Market research and insights</li>
                <li>✓ Investment webinars</li>
                <li>✓ Portfolio analysis tools</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Market Insights */}
      <section className="bg-finora-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Market Insights & Research</h2>
            <p className="text-xl text-gray-600">
              Stay informed with our latest market analysis and investment insights
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Financial market data and charts" 
                className="rounded-lg shadow-lg w-full h-auto" 
              />
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-6">Expert Market Analysis</h3>
              <p className="text-lg text-gray-600 mb-6">
                Our research team provides regular market commentary, 
                economic outlooks, and investment recommendations.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <i className="fas fa-newspaper text-finora-primary text-xl mr-3"></i>
                  <span>Weekly market updates and commentary</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-chart-bar text-finora-primary text-xl mr-3"></i>
                  <span>Quarterly economic and market outlook</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-lightbulb text-finora-primary text-xl mr-3"></i>
                  <span>Investment ideas and sector analysis</span>
                </div>
              </div>
              <Button className="bg-finora-primary hover:bg-finora-dark text-white px-8 py-3 mt-6">
                Access Research
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}