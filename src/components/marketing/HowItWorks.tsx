"use client";

export default function HowItWorks() {
  const steps = [
    {
      step: 1,
      title: "Architecture Setup",
      description: "Define your global property tree and configure entry protocols in minutes."
    },
    {
      step: 2,
      title: "Onboard Security",
      description: "Deploy security teams to specific nodes with encrypted access credentials."
    },
    {
      step: 3,
      title: "Live Monitoring",
      description: "Activate real-time visitor tracking and instant asset security analytics."
    }
  ];

  return (
    <section id="how-it-works" className="py-2" style={{ backgroundColor: '#fafafa' }}>
      <div className="container py-4">
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Rapid Enterprise Deployment</h2>
        </div>
        
        <div className="row g-4 justify-content-center">
          {steps.map((s, index) => (
            <div className="col-md-4" key={index}>
              <div className="card h-100 border-0 bg-transparent">
                <div className="card-body text-center px-4 py-2">
                  <div className="text-primary d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold" style={{ width: '40px', height: '40px', fontSize: '1.2rem', background: 'rgba(1, 74, 173, 0.08)', borderRadius: '10px' }}>
                    {s.step}
                  </div>
                  <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.95rem' }}>{s.title}</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .text-primary { color: #014aad !important; }
      `}</style>
    </section>
  );
}
