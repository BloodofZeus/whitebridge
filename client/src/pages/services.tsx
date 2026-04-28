import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, MapPin, Clock, Shield, Headphones, CreditCard, Building, Users, Calculator } from "lucide-react";
import { useLocation } from "wouter";

export default function Services() {
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-finora-secondary to-finora-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Banking Services</h1>
          <p className="text-xl mb-8">Comprehensive financial services designed to meet all your banking needs</p>
        </div>
      </section>

      {/* Customer Support Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Customer Support</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">24/7 Phone Support</h3>
              <p className="text-gray-600 mb-4">Call us anytime at 1-800-FINORA-1</p>
              <Button onClick={() => window.open("tel:1-800-346-6721", "_self")} className="bg-finora-primary hover:bg-finora-dark">Call Now</Button>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-finora-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Chat with our support team online</p>
              <Button onClick={() => setLocation("/help")} className="bg-finora-secondary hover:bg-finora-dark">Start Chat</Button>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-finora-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Branch Locator</h3>
              <p className="text-gray-600 mb-4">Find the nearest Finora branch</p>
              <Button onClick={() => setLocation("/find-branch")} className="bg-finora-accent hover:bg-finora-dark">Find Branch</Button>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Appointment Booking</h3>
              <p className="text-gray-600 mb-4">Schedule a meeting with our experts</p>
              <Button onClick={() => setLocation("/help")} className="bg-green-600 hover:bg-green-700">Book Now</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Digital Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Digital Banking Services</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <Shield className="w-12 h-12 text-finora-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4">Online Banking</h3>
              <p className="text-gray-600 mb-6">Secure online access to your accounts 24/7 with advanced security features.</p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>• Account management</li>
                <li>• Bill pay and transfers</li>
                <li>• Mobile check deposit</li>
                <li>• Transaction history</li>
              </ul>
              <Button className="w-full bg-finora-primary hover:bg-finora-dark">Access Online</Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <CreditCard className="w-12 h-12 text-finora-secondary mb-4" />
              <h3 className="text-xl font-semibold mb-4">Card Services</h3>
              <p className="text-gray-600 mb-6">Complete card management services including activation, replacement, and fraud protection.</p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>• Card activation</li>
                <li>• Lost/stolen reporting</li>
                <li>• PIN changes</li>
                <li>• Fraud monitoring</li>
              </ul>
              <Button className="w-full bg-finora-secondary hover:bg-finora-dark">Manage Cards</Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <Building className="w-12 h-12 text-finora-accent mb-4" />
              <h3 className="text-xl font-semibold mb-4">Account Services</h3>
              <p className="text-gray-600 mb-6">Comprehensive account services including statements, alerts, and account updates.</p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>• eStatements</li>
                <li>• Account alerts</li>
                <li>• Direct deposit setup</li>
                <li>• Overdraft protection</li>
              </ul>
              <Button className="w-full bg-finora-accent hover:bg-finora-dark">Account Settings</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Specialized Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Specialized Services</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <Users className="w-12 h-12 text-finora-primary mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Wealth Management</h3>
              <p className="text-gray-600 mb-6">Personal financial planning and investment management services for high-net-worth individuals.</p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-finora-primary rounded-full mr-3"></div>
                  <span className="text-gray-600">Investment portfolio management</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-finora-primary rounded-full mr-3"></div>
                  <span className="text-gray-600">Retirement planning</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-finora-primary rounded-full mr-3"></div>
                  <span className="text-gray-600">Estate planning</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-finora-primary rounded-full mr-3"></div>
                  <span className="text-gray-600">Tax planning strategies</span>
                </div>
              </div>
              <Button className="bg-finora-primary hover:bg-finora-dark">Schedule Consultation</Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <Calculator className="w-12 h-12 text-finora-secondary mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Business Solutions</h3>
              <p className="text-gray-600 mb-6">Comprehensive business banking services including cash management, payroll, and commercial lending.</p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-finora-secondary rounded-full mr-3"></div>
                  <span className="text-gray-600">Cash management services</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-finora-secondary rounded-full mr-3"></div>
                  <span className="text-gray-600">Payroll processing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-finora-secondary rounded-full mr-3"></div>
                  <span className="text-gray-600">Commercial lending</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-finora-secondary rounded-full mr-3"></div>
                  <span className="text-gray-600">Treasury management</span>
                </div>
              </div>
              <Button className="bg-finora-secondary hover:bg-finora-dark">Learn More</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Information</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <Phone className="w-8 h-8 text-finora-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Customer Service</h3>
              <p className="text-gray-600">1-800-FINORA-1</p>
              <p className="text-sm text-gray-500">Available 24/7</p>
            </div>
            
            <div>
              <Headphones className="w-8 h-8 text-finora-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Technical Support</h3>
              <p className="text-gray-600">1-800-FINORA-2</p>
              <p className="text-sm text-gray-500">Mon-Fri 8AM-8PM</p>
            </div>
            
            <div>
              <MessageCircle className="w-8 h-8 text-finora-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-600">Available online</p>
              <p className="text-sm text-gray-500">24/7 Support</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-6">Our customer service team is here to help you with any questions or concerns.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-finora-primary hover:bg-finora-dark">Contact Support</Button>
              <Button variant="outline" className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                Schedule Appointment
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