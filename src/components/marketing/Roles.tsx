"use client";

export default function Roles() {
  const roles = [
    {
      title: "Global Executive",
      description: "Full oversight of portfolio security and system-wide intelligence.",
      icon: "bi-shield-check",
      features: [
        "Portfolio orchestration",
        "Subscription lifecycle",
        "Unified data intelligence",
        "Global protocol config"
      ]
    },
    {
      title: "Asset Director",
      description: "Operational management of specific office nodes and security layers.",
      icon: "bi-briefcase",
      features: [
        "Node-specific monitoring",
        "Rapid visitor onboarding",
        "Encrypted arrival logs",
        "Personnel management"
      ]
    }
  ];

  return (
    <section className="py-2 bg-white">
      <div className="container py-4">
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Strategic Permissions</h2>
        </div>
        
        <div className="row g-4 justify-content-center">
          {roles.map((role, index) => (
            <div className="col-lg-4 col-md-6" key={index}>
              <div className="card h-100 border-0 shadow-sm p-4" style={{ borderRadius: '1.25rem' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="text-primary d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(1, 74, 173, 0.08)' }}>
                    <i className={`bi ${role.icon} fs-5`}></i>
                  </div>
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '1rem' }}>{role.title}</h6>
                </div>
                <p className="text-muted mb-4" style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>{role.description}</p>
                <ul className="list-unstyled mb-0">
                  {role.features.map((feature, idx) => (
                    <li className="mb-2 d-flex align-items-center" key={idx}>
                      <i className="bi bi-check2 text-primary me-2 fw-bold" style={{ fontSize: '0.9rem' }}></i>
                      <span className="fw-medium text-dark" style={{ fontSize: '0.85rem' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
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
