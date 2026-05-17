"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState("super_admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      // Map frontend selection to backend roles
      const role = selectedRole === 'super_admin' ? 'Admin' : 'Owner';
      
      const response = await api.post('/auth/login', { 
        email, 
        password,
        role 
      });
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirect based on role or to common dashboard
        if (response.user.role === "Admin" || response.user.role === "Owner" || response.user.role === "Staff") {
           router.replace('/admin/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column flex-lg-row overflow-hidden bg-white">
      {/* Brand Side (Visible on Desktop) */}
      <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 position-relative overflow-hidden" 
           style={{ 
             background: 'linear-gradient(135deg, #064E3B 0%, #10B981 100%)',
             color: 'white'
           }}>
        {/* Animated Background Mesh */}
        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-20" style={{ 
          backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          zIndex: 0
        }}></div>

        <div className="position-relative z-1">
          <div className="d-flex align-items-center gap-3 mb-5">
            <div className="bg-white text-emerald rounded-circle d-flex align-items-center justify-content-center shadow-lg" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-shield-check fs-4"></i>
            </div>
            <span className="fw-bold fs-4 tracking-tight">PMS GLOBAL</span>
          </div>

          <div className="mt-5 pt-4">
            <h1 className="display-4 fw-bold mb-3" style={{ letterSpacing: '-0.04em', lineHeight: '1.2' }}>
              Enterprise <br />
              <span className="text-white text-opacity-75">Property Management.</span>
            </h1>
            <p className="fw-light text-white text-opacity-80" style={{ maxWidth: '440px', fontSize: '1.1rem' }}>
              The unified command center for global real estate assets, security protocols, and high-density space modeling.
            </p>
          </div>
        </div>

        <div className="position-relative z-1 d-flex justify-content-between align-items-center small text-white text-opacity-40 fw-bold text-uppercase" style={{ letterSpacing: '0.1em', fontSize: '0.65rem' }}>
          <div>v4.2.0 Build</div>
          <div>© 2026 PSM GLOBAL</div>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="col-lg-6 d-flex flex-column justify-content-center align-items-center p-4 p-md-5">
        <div className="w-100" style={{ maxWidth: '360px' }}>
          {/* Mobile Header */}
          <div className="d-lg-none text-center mb-4">
            <div className="bg-emerald text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 shadow-sm" style={{ width: '56px', height: '56px' }}>
              <i className="bi bi-shield-check fs-3"></i>
            </div>
            <h4 className="fw-bold mb-1">PMS GLOBAL</h4>
          </div>

          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Welcome Back</h3>
            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Access your global property portfolio dashboard.</p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Role Switcher */}
            <div className="mb-4 bg-light p-1 rounded-pill d-flex">
              <button 
                type="button" 
                onClick={() => setSelectedRole('super_admin')}
                className={`btn btn-sm rounded-pill flex-grow-1 py-1 fw-bold transition-all ${selectedRole === 'super_admin' ? 'bg-white shadow-sm text-emerald' : 'text-muted'}`}
                style={{ fontSize: '0.7rem' }}
              >
                Super Admin
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedRole('office_owner')}
                className={`btn btn-sm rounded-pill flex-grow-1 py-1 fw-bold transition-all ${selectedRole === 'office_owner' ? 'bg-white shadow-sm text-emerald' : 'text-muted'}`}
                style={{ fontSize: '0.7rem' }}
              >
                Office Owner
              </button>
            </div>

            {/* Form Fields */}
            <div className="mb-3">
              <label className="form-label text-muted small fw-bold text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>Corporate Identity</label>
              <div className="input-group border-bottom pb-1">
                <span className="input-group-text bg-transparent border-0 px-0 me-3"><i className="bi bi-envelope text-muted" style={{ fontSize: '0.85rem' }}></i></span>
                <input 
                  type="email" 
                  className="form-control bg-transparent border-0 px-0 shadow-none" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ fontSize: '0.9rem' }}
                  required 
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted small fw-bold text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>Security Credentials</label>
              <div className="input-group border-bottom pb-1">
                <span className="input-group-text bg-transparent border-0 px-0 me-3"><i className="bi bi-lock text-muted" style={{ fontSize: '0.85rem' }}></i></span>
                <input 
                  type="password" 
                  className="form-control bg-transparent border-0 px-0 shadow-none" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ fontSize: '0.9rem' }}
                  required 
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger border-0 py-2 small fw-medium mb-4" style={{ borderRadius: '0.5rem', backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '0.75rem' }}>
                <i className="bi bi-exclamation-circle-fill me-2"></i>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-emerald w-100 py-3 fw-bold text-white shadow-emerald rounded-pill transition-all hover-lift mb-3"
              style={{ fontSize: '0.85rem' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" style={{ width: '12px', height: '12px' }}></span>
                  <span>Verifying Protocols...</span>
                </div>
              ) : (
                "AUTHENTICATE ACCESS"
              )}
            </button>
          </form>

          <div className="text-center mb-4">
            <p className="text-muted small mb-0">
              Don't have an account? <Link href="/register" className="text-emerald fw-bold text-decoration-none">Create One</Link>
            </p>
          </div>

          <div className="text-center pt-3 border-top">
            <Link href="/" className="text-decoration-none text-muted fw-bold hover-text-emerald transition-all" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              <i className="bi bi-arrow-left me-2"></i>RETURN TO MAIN INTERFACE
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .bg-emerald { background-color: #10B981 !important; }
        .text-emerald { color: #10B981 !important; }
        .btn-emerald { background-color: #10B981; border: none; }
        .btn-emerald:hover { background-color: #059669; transform: translateY(-1px); }
        .shadow-emerald { box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3); }
        .hover-lift:hover { transform: translateY(-2px); }
        .hover-text-emerald:hover { color: #10B981 !important; }
        .tracking-tight { letter-spacing: -0.02em; }
        .input-group-text { min-width: 24px; }
        @media (max-width: 991.98px) {
          .min-vh-100 { overflow-y: auto !important; }
        }
      `}</style>
    </div>
  );
}
