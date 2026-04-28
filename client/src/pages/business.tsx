import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Business() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#C5003E] to-[#0A2D5E] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">Power Your Business Forward</h1>
            <p className="text-xl mb-8">Comprehensive banking solutions designed to help your UK business grow and thrive</p>
            <Button className="bg-white text-[#0A2D5E] hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
              Start Banking With Us
            </Button>
          </div>
        </div>
      </section>

      {/* Business Banking Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Business Banking Solutions</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-[#0A2D5E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-briefcase text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Business Checking</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Streamlined business current accounts with tools to manage your cash flow effectively.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ No minimum balance options</li>
                  <li>✓ Free business debit card</li>
                  <li>✓ Online banking &amp; mobile app</li>
                  <li>✓ Unlimited electronic transactions</li>
                </ul>
                <Button variant="outline" className="border-[#0A2D5E] text-[#0A2D5E] hover:bg-[#0A2D5E] hover:text-white">
                  Open Account
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-[#C5003E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-line text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Business Loans</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Flexible financing options to support your business expansion and working capital needs.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ SME loans available</li>
                  <li>✓ Equipment financing</li>
                  <li>✓ Lines of credit</li>
                  <li>✓ Commercial property loans</li>
                </ul>
                <Button variant="outline" className="border-[#C5003E] text-[#C5003E] hover:bg-[#C5003E] hover:text-white">
                  Apply Now
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-[#C5003E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-credit-card text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Merchant Services</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Accept payments seamlessly with our comprehensive merchant services and POS solutions.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Card payment processing</li>
                  <li>✓ Mobile payment solutions</li>
                  <li>✓ Online payment gateway</li>
                  <li>✓ 24/7 customer support</li>
                </ul>
                <Button variant="outline" className="border-[#C5003E] text-[#C5003E] hover:bg-[#C5003E] hover:text-white">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Industry-Specific Solutions</h2>
            <p className="text-xl text-gray-600">Tailored banking services for your specific industry needs</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "fa-store", title: "Retail", desc: "POS integration and inventory financing", color: "bg-[#0A2D5E]" },
              { icon: "fa-utensils", title: "Hospitality", desc: "Equipment loans and cash management", color: "bg-[#C5003E]" },
              { icon: "fa-hard-hat", title: "Construction", desc: "Project financing and bonding", color: "bg-[#C5003E]" },
              { icon: "fa-laptop", title: "Technology", desc: "Startup financing and venture solutions", color: "bg-[#0A2D5E]" },
            ].map(({ icon, title, desc, color }) => (
              <div key={title} className="text-center">
                <div className={`w-20 h-20 ${color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <i className={`fas ${icon} text-white text-3xl`}></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Tools */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Digital Tools for Modern Business</h2>
              <p className="text-xl text-gray-600 mb-8">
                Manage your business finances efficiently with our comprehensive digital banking platform
              </p>
              <div className="space-y-6">
                {[
                  { icon: "fa-chart-bar", title: "Cash Flow Management", desc: "Real-time insights into your business finances" },
                  { icon: "fa-file-invoice", title: "Digital Invoicing", desc: "Create and send professional invoices instantly" },
                  { icon: "fa-users", title: "Team Access Controls", desc: "Manage permissions for employees and accountants" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start">
                    <i className={`fas ${icon} text-[#0A2D5E] text-2xl mr-4 mt-1`}></i>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{title}</h4>
                      <p className="text-gray-600">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1553484771-371a605b060b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Business team working on digital tools"
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="bg-[#0A2D5E] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Dedicated Business Support</h2>
          <p className="text-xl mb-8">Our Manchester-based business banking specialists are here to help you succeed</p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              { icon: "fa-phone", title: "24/7 Support", desc: "Round-the-clock assistance when you need it" },
              { icon: "fa-handshake", title: "Relationship Managers", desc: "Dedicated advisors who understand your business" },
              { icon: "fa-graduation-cap", title: "Business Resources", desc: "Educational content and tools for growth" },
            ].map(({ icon, title, desc }) => (
              <div key={title}>
                <i className={`fas ${icon} text-4xl mb-4 text-[#C5003E]`}></i>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
