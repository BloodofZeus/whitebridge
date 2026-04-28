import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Commercial() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-finora-dark to-finora-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">Commercial Banking Excellence</h1>
            <p className="text-xl mb-8">Sophisticated financial solutions for large enterprises and institutional clients</p>
            <Button className="bg-white text-finora-primary hover:bg-gray-100 px-8 py-3 text-lg">
              Explore Our Services
            </Button>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Enterprise Financial Solutions</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-building text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Corporate Banking</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Comprehensive banking solutions for large corporations and multinational enterprises.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Multi-currency accounts</li>
                  <li>✓ International wire transfers</li>
                  <li>✓ Cash concentration services</li>
                  <li>✓ Liquidity management</li>
                </ul>
                <Button variant="outline" className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-line text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Capital Markets</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Access to capital markets and investment banking services for strategic initiatives.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Debt & equity underwriting</li>
                  <li>✓ Syndicated lending</li>
                  <li>✓ M&A advisory services</li>
                  <li>✓ Risk management solutions</li>
                </ul>
                <Button variant="outline" className="border-finora-secondary text-finora-secondary hover:bg-finora-secondary hover:text-white">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-globe text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Trade Finance</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">International trade financing and documentary credit services for global commerce.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Letters of credit</li>
                  <li>✓ Import/export financing</li>
                  <li>✓ Supply chain financing</li>
                  <li>✓ Foreign exchange services</li>
                </ul>
                <Button variant="outline" className="border-finora-accent text-finora-accent hover:bg-finora-accent hover:text-white">
                  Explore Options
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Industry Expertise */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Industry Expertise</h2>
            <p className="text-xl text-gray-600">
              Deep sector knowledge across key industries
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Modern commercial buildings" 
                className="rounded-lg shadow-lg w-full h-auto" 
              />
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-6">Real Estate</h3>
              <p className="text-lg text-gray-600 mb-6">
                Specialized financing solutions for commercial real estate developers, 
                investors, and property management companies.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <i className="fas fa-check text-finora-primary mr-3"></i>
                  Construction and development loans
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-finora-primary mr-3"></i>
                  Permanent commercial mortgages
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-finora-primary mr-3"></i>
                  Bridge and interim financing
                </li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">Healthcare</h3>
              <p className="text-lg text-gray-600 mb-6">
                Comprehensive banking solutions tailored to healthcare providers, 
                hospitals, and medical practice groups.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <i className="fas fa-check text-finora-secondary mr-3"></i>
                  Practice acquisition financing
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-finora-secondary mr-3"></i>
                  Medical equipment loans
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-finora-secondary mr-3"></i>
                  Revenue cycle management
                </li>
              </ul>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Modern healthcare facility" 
                className="rounded-lg shadow-lg w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Technology Solutions */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Advanced Technology Platform</h2>
            <p className="text-xl text-gray-600">
              Cutting-edge digital solutions designed for enterprise-scale operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-shield-alt text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Enterprise Security</h3>
              <p className="text-gray-600">
                Bank-grade security with multi-factor authentication, 
                encryption, and fraud monitoring systems.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-sync-alt text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">API Integration</h3>
              <p className="text-gray-600">
                Seamless integration with your existing ERP, 
                accounting, and treasury management systems.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-analytics text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Advanced Analytics</h3>
              <p className="text-gray-600">
                Real-time reporting and business intelligence 
                tools for informed decision-making.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}