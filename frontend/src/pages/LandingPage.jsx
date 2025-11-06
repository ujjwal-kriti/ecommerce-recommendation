import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  ChatBubbleLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  StarIcon,
  PlayIcon,
  Bars3Icon,
  XMarkIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  CpuChipIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({});
  const [hoveredElement, setHoveredElement] = useState(null);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const testimonialsRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Parallax effect
      const scrolled = window.pageYOffset;
      setParallaxOffset({
        x: scrolled * 0.5,
        y: scrolled * 0.3
      });
      
      // Intersection Observer for animations
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
            }
          });
        },
        { threshold: 0.1 }
      );

      [heroRef, featuresRef, statsRef, testimonialsRef].forEach(ref => {
        if (ref.current) observer.observe(ref.current);
      });

      return () => observer.disconnect();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  // Magnetic button effect
  const handleMouseEnter = (e) => {
    setHoveredElement(e.currentTarget);
  };

  const handleMouseLeave = (e) => {
    setHoveredElement(null);
    e.currentTarget.style.transform = 'translate(0px, 0px)';
  };

  const handleMouseMove = (e) => {
    if (hoveredElement === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = 50;
      
      if (distance < maxDistance) {
        const strength = (maxDistance - distance) / maxDistance;
        const moveX = x * strength * 0.3;
        const moveY = y * strength * 0.3;
        e.currentTarget.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    }
  };

  const features = [
    {
      icon: SparklesIcon,
      title: 'AI-Powered Recommendations',
      description: 'Get personalized product suggestions using advanced machine learning algorithms that understand your business needs.',
      color: 'from-blue-500 to-purple-600',
      delay: '0ms'
    },
    {
      icon: ChatBubbleLeftIcon,
      title: 'Conversational AI Assistant',
      description: 'Chat with our intelligent assistant to discover products, get recommendations, and process documents naturally.',
      color: 'from-green-500 to-teal-600',
      delay: '200ms'
    },
    {
      icon: ChartBarIcon,
      title: 'Real-time Analytics',
      description: 'Track your business performance with comprehensive dashboards and actionable insights.',
      color: 'from-orange-500 to-red-600',
      delay: '400ms'
    },
    {
      icon: ShoppingCartIcon,
      title: 'Smart Order Management',
      description: 'Streamline your purchasing process with automated reordering and bulk order capabilities.',
      color: 'from-purple-500 to-pink-600',
      delay: '600ms'
    },
    {
      icon: RocketLaunchIcon,
      title: 'Lightning Fast Performance',
      description: 'Experience blazing-fast load times and instant responses powered by cutting-edge technology.',
      color: 'from-yellow-500 to-orange-600',
      delay: '800ms'
    },
    {
      icon: CpuChipIcon,
      title: 'Advanced Machine Learning',
      description: 'Leverage sophisticated AI models that continuously learn and improve recommendations.',
      color: 'from-indigo-500 to-purple-600',
      delay: '1000ms'
    }
  ];

  const stats = [
    { number: '95%', label: 'Customer Satisfaction' },
    { number: '40%', label: 'Increase in Sales' },
    { number: '60%', label: 'Time Saved' },
    { number: '500+', label: 'Happy Businesses' }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      business: 'Kumar Electronics',
      type: 'Electronics Retailer',
      content: 'Qwipo AI has transformed how we discover and order products. The recommendations are spot-on!',
      rating: 5,
      avatar: 'RK'
    },
    {
      name: 'Priya Sharma',
      business: 'Sharma Medical Store',
      type: 'Pharmacy',
      content: 'The AI assistant helps us find the right medical supplies quickly. It\'s like having a personal consultant.',
      rating: 5,
      avatar: 'PS'
    },
    {
      name: 'Amit Patel',
      business: 'Patel Grocery',
      type: 'Grocery Store',
      content: 'Our inventory management has never been easier. The analytics help us make better decisions.',
      rating: 5,
      avatar: 'AP'
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        {/* Mouse Follow Effect */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none transition-all duration-300"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-xl' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <SparklesIcon className="h-6 w-6 text-white animate-pulse" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                Qwipo AI
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-105 relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-105 relative group">
                Testimonials
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#stats" className="text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-105 relative group">
                Stats
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <button
                onClick={handleLoginClick}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center space-x-2 group relative overflow-hidden"
              >
                <span className="relative z-10">Login</span>
                <ArrowRightIcon className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110"
              >
                {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t animate-slide-down">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-300">Features</a>
              <a href="#testimonials" className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-300">Testimonials</a>
              <a href="#stats" className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-300">Stats</a>
              <button
                onClick={handleLoginClick}
                className="w-full text-left px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Dynamic Background Elements with Parallax */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse animate-morphing"
            style={{ transform: `translate(${parallaxOffset.x * 0.1}px, ${parallaxOffset.y * 0.1}px)` }}
          ></div>
          <div 
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse animate-morphing" 
            style={{ 
              animationDelay: '1s',
              transform: `translate(${parallaxOffset.x * -0.1}px, ${parallaxOffset.y * -0.1}px)`
            }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-10 animate-pulse animate-morphing" 
            style={{ 
              animationDelay: '2s',
              transform: `translate(${parallaxOffset.x * 0.05}px, ${parallaxOffset.y * 0.05}px)`
            }}
          ></div>
          
          {/* Additional floating elements */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full opacity-40 animate-float"
              style={{
                left: `${20 + i * 10}%`,
                top: `${30 + i * 8}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + Math.random() * 2}s`,
                transform: `translate(${parallaxOffset.x * (0.02 + i * 0.01)}px, ${parallaxOffset.y * (0.02 + i * 0.01)}px)`
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="max-w-4xl mx-auto">
            {/* Animated Badge with Enhanced Effects */}
            <div className={`inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-8 animate-bounce-in hover:scale-110 hover:shadow-xl transition-all duration-500 cursor-pointer group ${isVisible.hero ? 'animate-slide-up' : 'opacity-0'}`}>
              <SparklesIcon className="h-5 w-5 mr-2 animate-spin group-hover:animate-wiggle" />
              <span className="animate-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:animate-heartbeat">
                AI-Powered B2B Marketplace
              </span>
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse group-hover:animate-bounce"></div>
            </div>

            {/* Main Heading with Enhanced Typewriter Effect */}
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${isVisible.hero ? 'animate-slide-up' : 'opacity-0'}`}>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient hover:animate-glow inline-block cursor-pointer">
                Smart Product
              </span>
              <br />
              <span className="text-gray-900 animate-fadeIn hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-500 inline-block cursor-pointer" style={{ animationDelay: '0.5s' }}>
                Recommendations
              </span>
            </h1>

            {/* Animated Subheading with Interactive Effects */}
            <p className={`text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed hover:text-gray-800 transition-colors duration-300 ${isVisible.hero ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
              Transform your B2B business with{' '}
              <span className="text-blue-600 font-semibold hover:text-purple-600 hover:scale-105 transition-all duration-300 inline-block cursor-pointer">
                AI-powered product discovery
              </span>
              , intelligent recommendations, and conversational assistance that understands your needs.
            </p>

            {/* Enhanced CTA Buttons with Magnetic Effects */}
            <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-12 ${isVisible.hero ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '1.2s' }}>
              <button
                onClick={handleLoginClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-6 rounded-2xl text-lg font-semibold hover:shadow-2xl hover:scale-110 transition-all duration-500 flex items-center space-x-3 relative overflow-hidden animate-glow"
              >
                <span className="relative z-10">Get Started</span>
                <ArrowRightIcon className="h-6 w-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition-opacity duration-500"></div>
              </button>
              <button className="group border-2 border-gray-300 text-gray-700 px-12 py-6 rounded-2xl text-lg font-semibold hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-500 hover:scale-105 hover:shadow-xl relative overflow-hidden">
                <PlayIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                <span>Watch Demo</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            </div>

            {/* Enhanced Trust Indicators with Hover Effects */}
            <div className={`flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-gray-500 ${isVisible.hero ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '1.6s' }}>
              {[
                { text: 'Free to start', icon: CheckIcon },
                { text: 'No setup fees', icon: CheckIcon },
                { text: '24/7 AI Support', icon: CheckIcon }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 hover:scale-110 hover:text-gray-700 transition-all duration-300 cursor-pointer group">
                  <item.icon className="h-5 w-5 text-green-500 animate-pulse group-hover:animate-bounce" style={{ animationDelay: `${index * 0.2}s` }} />
                  <span className="group-hover:font-semibold transition-all duration-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hover:scale-110 transition-transform duration-300 cursor-pointer">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center hover:border-blue-500 transition-colors duration-300">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse hover:bg-blue-500 transition-colors duration-300"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className="py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className={`text-5xl md:text-6xl font-bold text-gray-900 mb-8 ${isVisible.features ? 'animate-slide-up' : 'opacity-0'}`}>
              Powerful Features for
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient"> Modern Businesses</span>
            </h2>
            <p className={`text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed ${isVisible.features ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
              Discover how our AI-powered platform can revolutionize your B2B operations and boost your business growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-4 relative overflow-hidden cursor-pointer ${isVisible.features ? 'animate-slide-up' : 'opacity-0'}`}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  transitionDelay: feature.delay 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-16px) scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
              >
                {/* Hover Effect Background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                {/* Floating Particles on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-float"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: `${30 + i * 10}%`,
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '2s'
                      }}
                    />
                  ))}
                </div>
                
                {/* Icon Container with Enhanced Effects */}
                <div className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative group-hover:animate-glow`}>
                  <feature.icon className="h-10 w-10 text-white group-hover:scale-110 transition-transform duration-300 group-hover:animate-wiggle" />
                  <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                </div>
                
                {/* Content with Enhanced Typography */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300 group-hover:scale-105">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 group-hover:leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Enhanced Decorative Elements */}
                <div className="absolute top-4 right-4 w-8 h-8 border-2 border-gray-200 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 group-hover:animate-spin"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-60 transition-all duration-500 group-hover:animate-bounce"></div>
                
                {/* Progress Bar Animation */}
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-700 ease-out"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} id="stats" className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
          <div className="absolute inset-0 opacity-20">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-white rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${4 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className={`text-5xl md:text-6xl font-bold text-white mb-8 ${isVisible.stats ? 'animate-slide-up' : 'opacity-0'}`}>
              Trusted by Businesses Worldwide
            </h2>
            <p className={`text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed ${isVisible.stats ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
              See how Qwipo AI is transforming B2B commerce across industries with impressive results.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`text-center group cursor-pointer ${isVisible.stats ? 'animate-slide-up' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 0.2}s` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 hover:bg-white/20 transition-all duration-500 hover:scale-105 group relative overflow-hidden">
                  {/* Floating Elements on Hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-3 h-3 bg-white rounded-full animate-float"
                        style={{
                          left: `${25 + i * 20}%`,
                          top: `${20 + i * 15}%`,
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: '3s'
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="text-5xl md:text-6xl font-bold text-white mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:animate-heartbeat relative z-10">
                    {stat.number}
                  </div>
                  <div className="text-blue-100 text-lg font-medium group-hover:text-white transition-colors duration-300 group-hover:font-bold relative z-10">
                    {stat.label}
                  </div>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="mt-4 w-full bg-white/20 rounded-full h-3 overflow-hidden relative z-10">
                    <div 
                      className="h-3 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-full transition-all duration-1000 ease-out group-hover:animate-pulse"
                      style={{ 
                        width: isVisible.stats ? '100%' : '0%',
                        transitionDelay: `${index * 0.2}s`
                      }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                  
                  {/* Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} id="testimonials" className="py-24 bg-gradient-to-br from-white via-gray-50 to-blue-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className={`text-5xl md:text-6xl font-bold text-gray-900 mb-8 ${isVisible.testimonials ? 'animate-slide-up' : 'opacity-0'}`}>
              What Our Customers Say
            </h2>
            <p className={`text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed ${isVisible.testimonials ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
              Join thousands of satisfied businesses that have transformed their operations with Qwipo AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 relative overflow-hidden cursor-pointer ${isVisible.testimonials ? 'animate-slide-up' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 0.2}s` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
              >
                {/* Enhanced Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Floating Quote Marks */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute text-4xl text-blue-200 font-serif animate-float"
                      style={{
                        left: `${20 + i * 30}%`,
                        top: `${30 + i * 20}%`,
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: '4s'
                      }}
                    >
                      "
                    </div>
                  ))}
                </div>
                
                <div className="relative z-10">
                  {/* Enhanced Stars with Individual Animations */}
                  <div className="flex items-center mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIconSolid 
                        key={i} 
                        className="h-6 w-6 text-yellow-400 group-hover:scale-125 transition-transform duration-300 hover:animate-bounce cursor-pointer" 
                        style={{ 
                          animationDelay: `${i * 0.1}s`,
                          filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))'
                        }} 
                      />
                    ))}
                  </div>
                  
                  {/* Enhanced Quote with Typography Effects */}
                  <p className="text-gray-700 mb-8 italic text-lg leading-relaxed group-hover:text-gray-800 transition-colors duration-300 group-hover:font-medium">
                    "{testimonial.content}"
                  </p>
                  
                  {/* Enhanced Author Section */}
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-6 group-hover:scale-110 transition-transform duration-300 group-hover:animate-glow relative">
                      {testimonial.avatar}
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors duration-300 group-hover:scale-105">
                        {testimonial.name}
                      </div>
                      <div className="text-gray-600 font-medium group-hover:text-gray-700 transition-colors duration-300">
                        {testimonial.business}
                      </div>
                      <div className="text-gray-500 text-sm group-hover:text-gray-600 transition-colors duration-300">
                        {testimonial.type}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Decorative Quote Mark */}
                <div className="absolute top-6 right-6 text-8xl text-blue-100 font-serif opacity-20 group-hover:opacity-40 transition-opacity duration-300 group-hover:animate-float">
                  "
                </div>
                
                {/* Progress Indicator */}
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-700 ease-out"></div>
                
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90"></div>
          <div className="absolute inset-0 opacity-30">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-white rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 4}s`,
                  animationDuration: `${3 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 animate-slide-up">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.3s' }}>
            Join the future of B2B commerce with AI-powered recommendations and intelligent automation. 
            Start your journey today and see the difference AI can make.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <button
              onClick={handleLoginClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
              className="group bg-white text-blue-600 px-12 py-6 rounded-2xl text-xl font-bold hover:shadow-2xl hover:scale-110 transition-all duration-500 flex items-center justify-center space-x-3 relative overflow-hidden animate-glow"
            >
              <span className="relative z-10">Start Free Trial</span>
              <ArrowRightIcon className="h-6 w-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-blue-600/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
            </button>
            <button 
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
              className="group border-2 border-white text-white px-12 py-6 rounded-2xl text-xl font-bold hover:bg-white hover:text-blue-600 transition-all duration-500 hover:scale-105 hover:shadow-xl relative overflow-hidden"
            >
              <span className="relative z-10">Contact Sales</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-white/40 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
            </button>
          </div>
          
          {/* Trust Badges */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-12 text-blue-100">
            <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300">
              <CheckIcon className="h-5 w-5 text-green-300" />
              <span>30-day free trial</span>
            </div>
            <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300">
              <CheckIcon className="h-5 w-5 text-green-300" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300">
              <CheckIcon className="h-5 w-5 text-green-300" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6 group">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <SparklesIcon className="h-7 w-7 text-white animate-pulse" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  Qwipo AI
                </span>
              </div>
              <p className="text-gray-400 mb-8 max-w-md leading-relaxed text-lg">
                Empowering B2B businesses with AI-powered product recommendations and intelligent automation 
                that drives growth and efficiency.
              </p>
              <div className="flex space-x-4">
                {['facebook', 'twitter', 'linkedin', 'github'].map((social) => (
                  <div key={social} className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all duration-300 hover:scale-110 cursor-pointer group">
                    <span className="text-sm font-bold group-hover:text-white transition-colors duration-300">
                      {social.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Product</h3>
              <ul className="space-y-3 text-gray-400">
                {['Features', 'Pricing', 'API', 'Documentation', 'Integrations'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Support</h3>
              <ul className="space-y-3 text-gray-400">
                {['Help Center', 'Contact Us', 'Status', 'Community', 'Blog'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                &copy; 2024 Qwipo AI. All rights reserved. Built for the Qwipo Hackathon Challenge.
              </p>
              <div className="flex space-x-6 text-gray-400">
                <a href="#" className="hover:text-white transition-colors duration-300">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors duration-300">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors duration-300">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
