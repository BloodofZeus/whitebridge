import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, Book, Phone, MessageCircle, Mail, Download, Shield, CreditCard, Building } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useLocation();

  const faqData = [
    {
      question: "How do I reset my online banking password?",
      answer: "You can reset your password by clicking 'Forgot Password' on the login page, or call our customer service at 1-800-FINORA-1."
    },
    {
      question: "What are your current interest rates?",
      answer: "Interest rates vary by account type and are updated regularly. Please visit our Products page or contact us for current rates."
    },
    {
      question: "How do I dispute a transaction?",
      answer: "Log into your online banking, select the transaction, and click 'Dispute Transaction', or call customer service immediately."
    },
    {
      question: "What should I do if my card is lost or stolen?",
      answer: "Report lost or stolen cards immediately by calling 1-800-FINORA-1 or using our mobile app's card management feature."
    },
    {
      question: "How do I set up direct deposit?",
      answer: "Provide your employer with your account number and routing number (011075150), or download our direct deposit form."
    },
    {
      question: "What are your branch hours?",
      answer: "Most branches are open Monday-Friday 9AM-5PM, Saturday 9AM-1PM. Use our branch locator for specific hours."
    }
  ];

  const helpCategories = [
    {
      icon: CreditCard,
      title: "Account Management",
      description: "Managing your accounts, statements, and personal information",
      topics: ["Account balance", "Statements", "Profile updates", "Account alerts"]
    },
    {
      icon: Shield,
      title: "Security & Fraud",
      description: "Protecting your account and reporting suspicious activity",
      topics: ["Password reset", "Fraud reporting", "Security tips", "Two-factor authentication"]
    },
    {
      icon: Building,
      title: "Banking Services",
      description: "Information about our banking products and services",
      topics: ["Online banking", "Mobile app", "Bill pay", "Transfers"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-finora-accent to-finora-secondary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Help Center</h1>
          <p className="text-xl mb-8">Find answers to your questions and get the support you need</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help articles, FAQs, or topics..."
                className="w-full px-6 py-4 pl-12 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Search className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
              <Button className="absolute right-2 top-2 bg-finora-primary hover:bg-finora-dark">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Help Options */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Get Help Now</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border">
              <div className="w-16 h-16 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Call Support</h3>
              <p className="text-gray-600 mb-4">Speak with a representative</p>
              <p className="font-semibold text-finora-primary mb-4">1-800-FINORA-1</p>
              <Button onClick={() => window.open("tel:1-800-346-6721", "_self")} className="bg-finora-primary hover:bg-finora-dark">Call Now</Button>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border">
              <div className="w-16 h-16 bg-finora-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Chat with our support team</p>
              <p className="text-sm text-gray-500 mb-4">Available 24/7</p>
              <Button onClick={() => alert("Live chat feature will be available soon. Please call 1-800-FINORA-1 for immediate assistance.")} className="bg-finora-secondary hover:bg-finora-dark">Start Chat</Button>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border">
              <div className="w-16 h-16 bg-finora-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">Send us a detailed message</p>
              <p className="text-sm text-gray-500 mb-4">24-48 hour response</p>
              <Button onClick={() => window.open("mailto:support@finora.bank", "_self")} className="bg-finora-accent hover:bg-finora-dark">Send Email</Button>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Book className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Help Articles</h3>
              <p className="text-gray-600 mb-4">Browse our knowledge base</p>
              <p className="text-sm text-gray-500 mb-4">Step-by-step guides</p>
              <Button onClick={() => setLocation("/services")} className="bg-green-600 hover:bg-green-700">Browse Articles</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Help Categories</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {helpCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <category.icon className="w-12 h-12 text-finora-primary mb-4" />
                <h3 className="text-xl font-semibold mb-4">{category.title}</h3>
                <p className="text-gray-600 mb-6">{category.description}</p>
                <ul className="space-y-2 mb-6">
                  {category.topics.map((topic, topicIndex) => (
                    <li key={topicIndex} className="flex items-center">
                      <div className="w-2 h-2 bg-finora-primary rounded-full mr-3"></div>
                      <span className="text-gray-600">{topic}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                  View Articles
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-start">
                  <HelpCircle className="w-6 h-6 text-finora-primary mr-4 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button className="bg-finora-primary hover:bg-finora-dark">
              View All FAQs
            </Button>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Helpful Resources</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <Download className="w-12 h-12 text-finora-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Mobile App</h3>
              <p className="text-gray-600 mb-4">Download our mobile banking app</p>
              <Button variant="outline" className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                Download
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <Book className="w-12 h-12 text-finora-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">User Guides</h3>
              <p className="text-gray-600 mb-4">Step-by-step tutorials</p>
              <Button variant="outline" className="border-finora-secondary text-finora-secondary hover:bg-finora-secondary hover:text-white">
                View Guides
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <Shield className="w-12 h-12 text-finora-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Security Center</h3>
              <p className="text-gray-600 mb-4">Learn about account security</p>
              <Button variant="outline" className="border-finora-accent text-finora-accent hover:bg-finora-accent hover:text-white">
                Learn More
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <Building className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Branch Locator</h3>
              <p className="text-gray-600 mb-4">Find branches and ATMs</p>
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                Find Locations
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-finora-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Still Need Help?</h2>
          <p className="text-xl mb-8">Our customer service team is available 24/7 to assist you</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-finora-primary hover:bg-gray-100 font-semibold">
              Call 1-800-FINORA-1
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-finora-primary">
              Schedule Appointment
            </Button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white border-opacity-20">
            <p className="text-sm opacity-90">
              For emergencies outside business hours, please call our 24/7 fraud hotline or visit your nearest branch.
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