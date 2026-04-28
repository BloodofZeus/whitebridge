import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import modernBankInterior from "@assets/generated_images/modern_diverse_bank_interior_bcd98c1b.png";
import digitalBankingTeam from "@assets/generated_images/diverse_digital_banking_team_89132ea5.png";
import investmentConsulting from "@assets/generated_images/diverse_investment_consulting_meeting_a8d646d1.png";
import businessBankingMeeting from "@assets/generated_images/diverse_business_banking_meeting_a56d3a4b.png";
import personalFinancialPlanning from "@assets/generated_images/diverse_personal_financial_planning_a89c4526.png";
import mobileBankingApp from "@assets/generated_images/mobile_banking_app_professional_e2997bac.png";
import customerService from "@assets/generated_images/diverse_bank_customer_service_837f286b.png";

const heroSlides = [
  {
    image: modernBankInterior,
    title: "Global Deposit Protection",
    subtitle: "Your deposits are FSCS protected up to £85,000 per person, giving you peace of mind with every transaction.",
    buttonText: "KNOW MORE"
  },
  {
    image: digitalBankingTeam,
    title: "Digital Banking Excellence",
    subtitle: "Experience the future of banking with our innovative digital solutions and 24/7 online services.",
    buttonText: "GET STARTED"
  },
  {
    image: investmentConsulting,
    title: "Investment Opportunities",
    subtitle: "Grow your wealth with our comprehensive investment services and expert financial guidance.",
    buttonText: "INVEST NOW"
  },
  {
    image: businessBankingMeeting,
    title: "Business Banking Solutions",
    subtitle: "Power your business forward with tailored commercial banking solutions and expert support.",
    buttonText: "LEARN MORE"
  },
  {
    image: personalFinancialPlanning,
    title: "Personal Financial Planning",
    subtitle: "Secure your financial future with our personalised banking services and wealth management solutions.",
    buttonText: "PLAN TODAY"
  },
  {
    image: mobileBankingApp,
    title: "Mobile Banking App",
    subtitle: "Bank anywhere, anytime with our award-winning mobile app featuring advanced security and convenience.",
    buttonText: "DOWNLOAD NOW"
  },
  {
    image: customerService,
    title: "Exceptional Customer Service",
    subtitle: "Experience personalised banking with our dedicated customer support team available 24/7.",
    buttonText: "CONTACT US"
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleCTAClick = () => {
    const slide = heroSlides[currentSlide];
    switch (slide.buttonText) {
      case "KNOW MORE":
        setLocation("/services");
        break;
      case "GET STARTED":
        setLocation("/products");
        break;
      case "INVEST NOW":
        setLocation("/investing");
        break;
      case "LEARN MORE":
        setLocation("/business");
        break;
      case "PLAN TODAY":
        setLocation("/personal");
        break;
      case "DOWNLOAD NOW":
        window.open("https://apps.apple.com", "_blank");
        break;
      case "CONTACT US":
        setLocation("/help");
        break;
      default:
        setLocation("/products");
    }
  };

  return (
    <section className="relative h-96 overflow-hidden">
      {/* Background Images */}
      {heroSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${slide.image}')` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 transition-all duration-500">
            {heroSlides[currentSlide].title}
          </h1>
          <p className="text-lg text-white mb-8 opacity-90 transition-all duration-500">
            {heroSlides[currentSlide].subtitle}
          </p>
          <Button
            onClick={handleCTAClick}
            className="bg-[#C5003E] hover:bg-[#9E0031] text-white px-8 py-3 text-sm font-semibold rounded-md transition-all duration-200 transform hover:scale-105"
            data-testid="button-hero-cta"
          >
            {heroSlides[currentSlide].buttonText}
          </Button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Carousel Dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
