import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivateClient() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-finora-accent to-finora-secondary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">Private Client Services</h1>
            <p className="text-xl mb-8">Exclusive wealth management and private banking for high-net-worth individuals and families</p>
            <Button className="bg-white text-finora-primary hover:bg-gray-100 px-8 py-3 text-lg">
              Schedule Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* Wealth Management Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Comprehensive Wealth Solutions</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-pie text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Investment Management</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Personalized investment strategies tailored to your financial goals and risk tolerance.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Discretionary portfolio management</li>
                  <li>✓ Alternative investments</li>
                  <li>✓ ESG investment options</li>
                  <li>✓ Performance reporting</li>
                </ul>
                <Button variant="outline" className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-balance-scale text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Estate Planning</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Strategic estate planning and wealth transfer solutions for multi-generational wealth preservation.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Trust and estate services</li>
                  <li>✓ Tax optimization strategies</li>
                  <li>✓ Charitable giving solutions</li>
                  <li>✓ Family governance consulting</li>
                </ul>
                <Button variant="outline" className="border-finora-secondary text-finora-secondary hover:bg-finora-secondary hover:text-white">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-handshake text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Private Banking</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Exclusive banking services with dedicated relationship managers and concierge support.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Dedicated relationship manager</li>
                  <li>✓ Priority customer service</li>
                  <li>✓ Exclusive event invitations</li>
                  <li>✓ Global banking access</li>
                </ul>
                <Button variant="outline" className="border-finora-accent text-finora-accent hover:bg-finora-accent hover:text-white">
                  Contact Us
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Personalized Service */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Personalized Service Excellence</h2>
              <p className="text-xl text-gray-600 mb-8">
                Our private client team consists of seasoned professionals dedicated 
                to understanding and serving your unique financial needs.
              </p>
              <div className="space-y-6">
                <div className="flex items-start">
                  <i className="fas fa-user-tie text-finora-primary text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Dedicated Relationship Manager</h4>
                    <p className="text-gray-600">Your personal advisor who knows your goals</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-clock text-finora-primary text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">24/7 Concierge Service</h4>
                    <p className="text-gray-600">Round-the-clock support for urgent needs</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-globe text-finora-primary text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Global Network Access</h4>
                    <p className="text-gray-600">Worldwide banking privileges and services</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Professional wealth advisor consulting with client" 
                className="rounded-lg shadow-lg w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lifestyle Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Lifestyle & Concierge Services</h2>
            <p className="text-xl text-gray-600">
              Beyond banking - comprehensive lifestyle support for our valued clients
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-plane text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Travel Services</h3>
              <p className="text-gray-600">
                Luxury travel planning, private jet arrangements, 
                and exclusive resort access.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-calendar text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Event Planning</h3>
              <p className="text-gray-600">
                Private event coordination, exclusive venue access, 
                and entertainment booking services.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-graduation-cap text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Education Services</h3>
              <p className="text-gray-600">
                Private school placement, university admissions consulting, 
                and educational funding strategies.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-heart text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Philanthropy</h3>
              <p className="text-gray-600">
                Charitable foundation setup, impact investing, 
                and philanthropic strategy development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exclusive Membership */}
      <section className="bg-finora-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Exclusive Client Benefits</h2>
          <p className="text-xl mb-12">
            Join our exclusive community of distinguished clients
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <i className="fas fa-star text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Exclusive Events</h3>
              <p>Private art exhibitions, wine tastings, and cultural events</p>
            </div>
            <div>
              <i className="fas fa-golf-ball text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Premier Golf Access</h3>
              <p>Access to world-class golf courses and private clubs</p>
            </div>
            <div>
              <i className="fas fa-theater-masks text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Cultural Privileges</h3>
              <p>VIP access to theaters, museums, and cultural institutions</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}