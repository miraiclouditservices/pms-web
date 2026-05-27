"use client";

export default function FeatureCard({ icon, title, description }: { icon: string, title: string, description: string }) {
  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100 p-4 border-0 feature-card-3d transition-all">
        <div className="text-primary mb-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(1, 74, 173, 0.08)' }}>
          <i className={`bi ${icon} fs-5`}></i>
        </div>
        <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}>{title}</h5>
        <p className="text-muted mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>{description}</p>
      </div>
      <style jsx>{`
        .feature-card-3d {
          background: #ffffff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          border-radius: 1.25rem;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .feature-card-3d:hover {
          transform: translateY(-5px) rotateX(2deg) rotateY(2deg);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(1, 74, 173, 0.2);
        }
        .text-primary { color: #014aad !important; }
        .transition-all { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </div>
  );
}
