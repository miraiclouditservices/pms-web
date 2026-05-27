"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      // Add background when scrolled
      setIsScrolled(window.scrollY > 50);

      // Determine active section
      const sections = ['features', 'how-it-works', 'pricing', 'faq'];
      
      let currentSection = '';
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Adjust 150 to catch the section a bit earlier
          if (rect.top <= 150 && rect.bottom >= 150) {
            currentSection = section;
            break;
          }
        }
      }
      
      setActiveSection(currentSection);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${isScrolled ? 'bg-white shadow-sm' : 'bg-white'}`} style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', height: '70px' }}>
      <div className="container h-100">
        <Link href="/" className="navbar-brand fw-bold d-flex align-items-center gap-2">
          <div className="bg-emerald text-white rounded-lg d-flex align-items-center justify-content-center shadow-sm" style={{ width: '38px', height: '38px' }}>
            <i className="bi bi-shield-check fs-5"></i>
          </div>
          <span className="fs-5 tracking-tight text-dark" style={{ letterSpacing: '-0.02em' }}>PMS GLOBAL</span>
        </Link>
        
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
          <span className="navbar-toggler-icon" style={{ width: '1.2rem', height: '1.2rem' }}></span>
        </button>
        
        <div className="collapse navbar-collapse h-100" id="navbarContent">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 fw-bold">
            <li className="nav-item">
              <a className={`nav-link px-3 transition-all ${activeSection === 'features' ? 'text-primary' : 'text-muted hover-text-primary'}`} style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} href="#features">Features</a>
            </li>
            <li className="nav-item">
              <a className={`nav-link px-3 transition-all ${activeSection === 'how-it-works' ? 'text-primary' : 'text-muted hover-text-primary'}`} style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} href="#how-it-works">How it works</a>
            </li>
            <li className="nav-item">
              <a className={`nav-link px-3 transition-all ${activeSection === 'pricing' ? 'text-primary' : 'text-muted hover-text-primary'}`} style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} href="#pricing">Pricing</a>
            </li>
            <li className="nav-item">
              <a className={`nav-link px-3 transition-all ${activeSection === 'faq' ? 'text-primary' : 'text-muted hover-text-primary'}`} style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} href="#faq">FAQ</a>
            </li>
          </ul>
          <div className="d-flex align-items-center">
            <Link href="/login" className="btn btn-emerald rounded-pill px-4 py-2 fw-bold shadow-emerald text-white transition-all hover-lift" style={{ fontSize: '0.75rem' }}>Get Started</Link>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .bg-emerald { background-color: #014aad !important; }
        .text-primary { color: #014aad !important; }
        .btn-emerald { background-color: #014aad; border: none; }
        .btn-emerald:hover { background-color: #013a8a; transform: translateY(-1px); }
        .shadow-emerald { box-shadow: 0 10px 15px -3px rgba(1, 74, 173, 0.3); }
        .hover-lift:hover { transform: translateY(-2px); }
        .hover-text-primary:hover { color: #014aad !important; }
        .rounded-xl { border-radius: 1rem !important; }
        .tracking-tight { letter-spacing: -0.02em; }
      `}</style>
    </nav>
  );
}
