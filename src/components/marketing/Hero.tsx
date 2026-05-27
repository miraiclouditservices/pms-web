"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Hero() {
  const words = ["simplified", "smarter", "secure", "global"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleTyping = () => {
      const currentWord = words[currentWordIndex];
      if (isDeleting) {
        setDisplayedText(prev => prev.slice(0, -1));
        setTypingSpeed(80);
      } else {
        setDisplayedText(prev => currentWord.slice(0, prev.length + 1));
        setTypingSpeed(150);
      }

      if (!isDeleting && displayedText === currentWord) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayedText === "") {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentWordIndex, typingSpeed]);

  return (
    <section className="hero-dark py-5 pt-md-5 overflow-hidden position-relative" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', paddingTop: '70px', background: '#001233' }}>
      {/* Refined Dynamic Background Mesh */}
      <div className="hero-mesh-refined"></div>

      <div className="container position-relative z-1 text-center mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Global Badge (Glassmorphic) */}
            <div className="d-inline-flex align-items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-10 rounded-pill px-3 py-1 mb-5 animate__animated animate__fadeInDown shadow-sm" style={{ backdropFilter: 'blur(10px)' }}>
              <span className="small text-white fw-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2rem', opacity: 0.9 }}>🌍 Intelligence · Scale · Security</span>
            </div>

            {/* Main Heading */}
            <h1 className="display-4 fw-bold text-white mb-4 animate__animated animate__fadeIn tracking-tight" style={{ lineHeight: '1.2' }}>
              Office security, <br className="d-md-none" />
              <span className="text-primary typing-cursor">{displayedText}</span>
            </h1>

            {/* Premium Subtitle */}
            <p className="text-white opacity-70 mb-5 px-md-5 mx-auto animate__animated animate__fadeIn fw-light" style={{ maxWidth: '650px', fontSize: '1rem', lineHeight: '1.7' }}>
              Deploy a unified command center to monitor global assets, manage complex tenant protocols, and scale your property security infrastructure.
            </p>

            {/* Refined CTA Buttons */}
            <div className="d-flex justify-content-center gap-4 mb-5 flex-wrap animate__animated animate__fadeInUp">
              <Link href="/login" className="btn btn-emerald-vibrant rounded-pill px-5 py-3 fw-bold transition-all hover-lift">
                Get started free <i className="bi bi-arrow-right ms-2"></i>
              </Link>
              <a href="#features" className="btn btn-glass-white rounded-pill px-5 py-3 fw-bold transition-all hover-lift">
                Explore features
              </a>
            </div>

            {/* High-End Trust Line */}
            <div className="mt-5 pt-5 animate__animated animate__fadeIn">
              <p className="text-white opacity-40 small fw-bold text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.25em' }}>
                Governing Global Enterprise Safety
              </p>
              <div className="d-flex justify-content-center gap-5 mt-4 opacity-30 grayscale invert">
                <i className="bi bi-apple fs-4"></i>
                <i className="bi bi-google fs-4"></i>
                <i className="bi bi-microsoft fs-4"></i>
                <i className="bi bi-nvidia fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hero-mesh-refined {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 0% 0%, rgba(1, 74, 173, 0.08) 0%, transparent 50%),
                      radial-gradient(circle at 100% 100%, rgba(1, 74, 173, 0.05) 0%, transparent 50%);
          z-index: 0;
        }
        .text-primary { color: #014aad !important; }
        .btn-emerald-vibrant {
          background: linear-gradient(135deg, #014aad 0%, #013a8a 100%);
          border: none;
          color: white !important;
          box-shadow: 0 10px 20px -5px rgba(1, 74, 173, 0.4);
        }
        .btn-emerald-vibrant:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #014aad 100%);
          box-shadow: 0 15px 30px -5px rgba(1, 74, 173, 0.5);
          transform: translateY(-3px);
        }
        .btn-glass-white {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white !important;
        }
        .btn-glass-white:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .hover-lift:hover { transform: translateY(-3px); }
        .tracking-tight { letter-spacing: -0.04em; }
      `}</style>
    </section>
  );
}
