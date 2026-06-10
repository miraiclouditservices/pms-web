"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const router = useRouter();

  const slides = [
    {
      image: "/mirai_dashboard_illustration.png",
      title: "Connect with every property.",
      description: "Everything you need in an easily customizable and unified management dashboard."
    },
    {
      image: "/mirai_property_image.png",
      title: "Manage properties seamlessly.",
      description: "Track and organize your commercial and residential spaces from a single location."
    },
    {
      image: "/mirai_office_image.png",
      title: "Optimize your office operations.",
      description: "Streamline workflows, rent tracking, payments, and staff roles with modern, secure controls."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { 
        email, 
        password
      });
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        router.replace('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex vh-100 flex-column flex-md-row bg-white font-sans overflow-hidden">
      
      {/* Left Side: Login Form */}
      <div className="col-12 col-md-6 col-lg-5 d-flex flex-column p-4 p-md-5 bg-white position-relative h-100 overflow-y-auto">
        
        {/* Brand Logo */}
        <div className="mb-auto pb-4">
          <div className="d-flex align-items-center gap-2">
            <img 
              src="/mirai_logo.png" 
              alt="Mirai Logo" 
              style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
            />
            <span className="fw-bold fs-5 text-primary" style={{ letterSpacing: '-0.02em' }}>Mirai Cloud</span>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="w-100 mx-auto my-auto" style={{ maxWidth: '400px' }}>
          <h2 className="fw-bold text-dark mb-1" style={{ fontSize: '1.75rem', letterSpacing: '-0.03em' }}>Log in to your Account</h2>
          <p className="text-muted mb-4 pb-2" style={{ fontSize: '0.9rem' }}>Welcome back! Enter your details to log in:</p>

          <form onSubmit={handleLogin}>
            
            {/* Email Field */}
            <div className="mb-3">
              <div className="input-group custom-input-group rounded bg-white">
                <span className="input-group-text bg-white border-end-0 px-3 text-muted">
                  <i className="bi bi-envelope"></i>
                </span>
                <input 
                  type="email" 
                  className="form-control bg-white border-start-0 ps-0 shadow-none text-dark clean-input" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ fontSize: '0.95rem', height: '48px' }}
                  required 
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-3">
              <div className="input-group custom-input-group rounded bg-white">
                <span className="input-group-text bg-white border-end-0 px-3 text-muted">
                  <i className="bi bi-lock"></i>
                </span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control bg-white border-start-0 border-end-0 px-0 shadow-none text-dark clean-input" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ fontSize: '0.95rem', height: '48px' }}
                  required 
                />
                <span 
                  className="input-group-text bg-white border-start-0 px-3 text-muted" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                </span>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check d-flex align-items-center gap-2 mb-0">
                <input className="form-check-input mt-0 custom-checkbox shadow-none" type="checkbox" id="rememberMe" />
                <label className="form-check-label text-muted" htmlFor="rememberMe" style={{ fontSize: '0.85rem' }}>
                  Remember me
                </label>
              </div>
              <a href="#" className="text-primary text-decoration-none fw-medium hover-opacity" style={{ fontSize: '0.85rem' }}>
                Forgot Password?
              </a>
            </div>

            {error && (
              <div className="alert alert-danger py-2 px-3 small rounded mb-4 border-0 bg-danger bg-opacity-10 text-danger d-flex align-items-center">
                <i className="bi bi-exclamation-circle-fill me-2"></i>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary w-100 fw-medium shadow-sm transition-all submit-btn"
              style={{ height: '48px', fontSize: '0.95rem', borderRadius: '6px' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          {/* Footer Text */}
          <div className="text-center mt-4">
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Don't have an account? <Link href="/register" className="text-primary text-decoration-none fw-medium hover-opacity">Create an account</Link>
            </p>
          </div>
        </div>

        <div className="mt-auto pt-4"></div>
      </div>

      {/* Right Side: Hero Graphic with Carousel */}
      <div className="col-12 col-md-6 col-lg-7 d-none d-md-flex flex-column align-items-center justify-content-center p-4 p-md-5 h-100 right-panel" style={{ backgroundColor: '#0d6efd' }}>
        
        <div className="w-100 position-relative d-flex flex-column align-items-center justify-content-center mb-4 px-3" style={{ height: '55vh', minHeight: '350px' }}>
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className="w-100 h-100 d-flex justify-content-center align-items-center position-absolute start-0 top-0 px-3"
              style={{ 
                opacity: idx === activeSlide ? 1 : 0,
                zIndex: idx === activeSlide ? 2 : 1,
                transition: 'opacity 0.8s ease-in-out'
              }}
            >
              <img 
                src={slide.image} 
                alt={slide.title} 
                className="img-fluid rounded shadow-lg"
                style={{ 
                  maxWidth: '90%', 
                  maxHeight: '100%', 
                  objectFit: 'contain'
                }} 
              />
            </div>
          ))}
        </div>

        {/* Hero Text */}
        <div className="text-center text-white mt-3 z-3 position-relative w-100" style={{ minHeight: '120px' }}>
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className="w-100 px-3"
              style={{ 
                opacity: idx === activeSlide ? 1 : 0,
                position: idx === activeSlide ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                transition: 'opacity 0.8s ease-in-out'
              }}
            >
              <h3 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}>{slide.title}</h3>
              <p className="text-white-50 mx-auto mb-0" style={{ maxWidth: '400px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {slide.description}
              </p>
            </div>
          ))}
        </div>

        {/* Carousel Dots */}
        <div className="d-flex gap-2 mt-4 mb-2 z-3 position-relative">
          {slides.map((_, idx) => (
            <div 
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className="rounded-circle bg-white cursor-pointer" 
              style={{ 
                width: '8px', 
                height: '8px', 
                opacity: idx === activeSlide ? 1 : 0.5,
                transform: idx === activeSlide ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.3s ease-in-out'
              }}
            ></div>
          ))}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .font-sans {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        .right-panel {
          position: relative;
          overflow: hidden;
        }

        .custom-input-group {
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease-in-out;
          background-color: #fff !important;
        }

        .custom-input-group:focus-within {
          border-color: #0d6efd;
          box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.1);
        }

        .clean-input {
          background-color: #fff !important;
        }

        .custom-input-group .form-control:focus {
          border-color: transparent;
          box-shadow: none;
        }

        .custom-checkbox {
          width: 16px;
          height: 16px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .custom-checkbox:checked {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        .submit-btn {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        .submit-btn:hover {
          background-color: #0b5ed7;
          border-color: #0a58ca;
        }

        .hover-opacity:hover {
          opacity: 0.8;
        }

        .form-control::placeholder {
          color: #94a3b8;
          opacity: 1;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            transition: background-color 5000s ease-in-out 0s;
        }

        /* Hide scrollbar for cleaner look if content ever overflows */
        .overflow-y-auto::-webkit-scrollbar {
          width: 0;
          background: transparent;
        }
      `}} />
    </div>
  );
}
