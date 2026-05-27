import FeatureCard from './FeatureCard';

export default function Features() {
  const features = [
    {
      icon: "bi-building",
      title: "Multi-building management",
      description: "Control access and view logs across multiple office buildings from a single, unified dashboard."
    },
    {
      icon: "bi-person-check-fill",
      title: "Fast visitor check-in",
      description: "Reduce lobby wait times with digital check-in flows, QR codes, and instant notifications."
    },
    {
      icon: "bi-calendar-week",
      title: "Watchman roster",
      description: "Schedule shifts, track attendance, and ensure you always have the right security coverage."
    },
    {
      icon: "bi-graph-up-arrow",
      title: "Visitor analytics",
      description: "Gain insights into peak visitor hours, frequent guests, and overall foot traffic trends."
    },
    {
      icon: "bi-bell-fill",
      title: "Real-time alerts",
      description: "Receive instant push or SMS notifications for VIP arrivals, blacklisted individuals, or security breaches."
    },
    {
      icon: "bi-shield-lock",
      title: "Role-based access",
      description: "Give specific permissions to super admins and office owners based on their needs."
    }
  ];

  return (
    <section id="features" className="py-5 bg-white overflow-hidden">
      <div className="container py-5">
        <div className="text-center mb-5">
          <span className="text-primary fw-bold text-uppercase mb-2 d-block" style={{ fontSize: '0.65rem', letterSpacing: '0.2rem' }}>Capabilities</span>
          <h2 className="fw-bold text-dark mb-2" style={{ letterSpacing: '-0.02em', fontSize: '1.75rem' }}>The Security Command Suite</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '500px', fontSize: '0.9rem' }}>High-performance tools engineered for global property oversight and rapid security response.</p>
        </div>
        <div className="row g-4">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
