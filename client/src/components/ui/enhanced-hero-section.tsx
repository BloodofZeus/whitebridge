import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import personalFinancialPlanning from "@assets/generated_images/diverse_personal_financial_planning_a89c4526.png";
import professionalOnlineBanking from "@assets/generated_images/diverse_professional_online_banking_2a63fb70.png";
import familyFinancialPlanning from "@assets/generated_images/diverse_family_financial_planning_cece0fd4.png";

const heroSlides = [
  {
    image: personalFinancialPlanning,
    title: "Banking That Grows With You",
    subtitle: "Experience the future of financial services with Finora's innovative banking solutions",
    cta: "Start Your Journey"
  },
  {
    image: professionalOnlineBanking,
    title: "Invest in Your Tomorrow",
    subtitle: "Build wealth with our comprehensive investment and wealth management services",
    cta: "Explore Investing"
  },
  {
    image: familyFinancialPlanning,
    title: "Business Banking Excellence",
    subtitle: "Power your business forward with tailored commercial banking solutions",
    cta: "Grow Your Business"
  }
];

export default function EnhancedHeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={`Hero slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
          {heroSlides[currentSlide].title}
        </h1>
        <p className="text-xl md:text-2xl mb-8 animate-slide-up">
          {heroSlides[currentSlide].subtitle}
        </p>
        <Button 
          size="lg"
          className="bg-finora-primary text-white hover:bg-finora-dark px-12 py-4 text-lg font-semibold transform hover:scale-105 transition-transform duration-200"
          data-testid="button-hero-cta"
        >
          {heroSlides[currentSlide].cta} →
        </Button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
          />
        ))}
      </div>

      {/* Video Background Alternative (commented for now) */}
      {/* 
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/videos/banking-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>
      */}

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-finora-accent rounded-full opacity-20 animate-pulse-slow hidden lg:block"></div>
      <div className="absolute bottom-1/3 right-1/3 w-16 h-16 bg-finora-secondary rounded-full opacity-30 animate-pulse-slow hidden lg:block"></div>
      <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-finora-primary rounded-full opacity-25 animate-pulse-slow hidden lg:block"></div>
    </section>
  );
}