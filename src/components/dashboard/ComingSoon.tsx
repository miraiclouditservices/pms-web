"use client";

import React from 'react';

interface ComingSoonProps {
  title: string;
  description: string;
  icon: string;
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="d-flex align-items-center justify-content-center w-100" style={{ minHeight: '75vh' }}>
      <div className="text-center" style={{ maxWidth: '450px' }}>
        {/* Perfectly Centered Floating Icon Container */}
        <div className="mb-5 d-flex justify-content-center">
          <div className="animate-float">
            <div className="bg-white shadow-sm d-flex align-items-center justify-content-center" 
                 style={{ 
                   width: '100px', 
                   height: '100px', 
                   borderRadius: '50%', 
                   border: '1px solid #f1f5f9',
                   position: 'relative'
                 }}>
              <i className={`bi ${icon} text-primary`} style={{ 
                fontSize: '2.5rem',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}></i>
            </div>
          </div>
        </div>
        
        {/* High-Density Typography */}
        <div className="px-3">
          <h2 className="fw-bold text-dark mb-2" style={{ letterSpacing: '-0.02em', fontSize: '1.25rem' }}>{title}</h2>
          <div className="mx-auto bg-emerald mb-3" style={{ width: '30px', height: '2px', borderRadius: '1px', opacity: 0.8 }}></div>
          <p className="text-muted fw-normal mx-auto mb-4" style={{ fontSize: '0.85rem', lineHeight: '1.6', opacity: 0.8 }}>
            {description}
          </p>
          <div className="d-inline-flex align-items-center gap-2 text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.1em', fontSize: '0.55rem', opacity: 0.5 }}>
            <span className="dot" style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#014aad' }}></span>
            Module Under Construction
          </div>
        </div>

        <style jsx global>{`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          .text-primary { color: #014aad !important; }
          .bg-emerald { background-color: #014aad !important; }
        `}</style>
      </div>
    </div>
  );
}
