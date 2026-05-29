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
      const roleMap: Record<string, string> = {
        super_admin: 'Super Admin',
        floor_admin: 'Floor Admin',
        office_owner: 'Office Owner',
      };
      const role = roleMap[selectedRole] || 'Super Admin';
      
      const response = await api.post('/auth/login', { 
        email, 
        password,
        role 
      });
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirect based on role
        if (response.user.role === "Super Admin" || response.user.role === "Staff Admin" || response.user.role === "Floor Admin" || response.user.role === "Office Owner") {
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
             background: 'linear-gradient(135deg, #090f26 0%, #014aad 100%)',
             color: 'white'
           }}>
        {/* Animated Background Mesh */}
        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-20" style={{ 
          backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          zIndex: 0
        }}></div>

        <div className="position-relative z-1">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-lg" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-clouds-fill fs-4"></i>
            </div>
            <span className="fw-bold fs-4 tracking-tight">MIRAI CLOUD</span>
          </div>

          <div className="mt-5 pt-4">
            <p className="fw-light text-white text-opacity-75" style={{ maxWidth: '500px', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Mirai Cloud is a next-generation property and tenant management platform designed for global enterprises.
              Unify your real estate operations, automate workflows, and gain real-time visibility across all locations.
            </p>
          </div>
        </div>

        {/* Stats Section & Footer */}
        <div className="position-relative z-1">
          <div className="row g-3 mb-4">
            <div className="col-6">
              <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div className="text-white-50 mb-1" style={{ fontSize: '0.75rem' }}><i className="bi bi-building me-1"></i> Properties Managed</div>
                <div className="fs-5 fw-bold text-white">5000+</div>
              </div>
            </div>
            <div className="col-6">
              <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div className="text-white-50 mb-1" style={{ fontSize: '0.75rem' }}><i className="bi bi-people me-1"></i> Active Tenants</div>
                <div className="fs-5 fw-bold text-white">25K+</div>
              </div>
            </div>
            <div className="col-6">
              <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div className="text-white-50 mb-1" style={{ fontSize: '0.75rem' }}><i className="bi bi-cash-coin me-1"></i> Rental Value</div>
                <div className="fs-5 fw-bold text-white">$1.2B+</div>
              </div>
            </div>
            <div className="col-6">
              <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div className="text-white-50 mb-1" style={{ fontSize: '0.75rem' }}><i className="bi bi-cpu me-1"></i> System Uptime</div>
                <div className="fs-5 fw-bold text-white">99.99%</div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center small text-white text-opacity-40 fw-bold text-uppercase" style={{ letterSpacing: '0.1em', fontSize: '0.65rem' }}>
            <div>v5.0.0 Build</div>
            <div>© 2026 MIRAI CLOUD</div>
          </div>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="col-lg-6 d-flex flex-column justify-content-center align-items-center p-4 p-md-5">
        <div className="w-100" style={{ maxWidth: '380px', padding: '20px 0' }}>
          {/* Mobile Header */}
          <div className="d-lg-none text-center mb-4">
            <div className="bg-emerald text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 shadow-sm" style={{ width: '56px', height: '56px' }}>
              <i className="bi bi-clouds-fill fs-3"></i>
            </div>
            <h4 className="fw-bold mb-1">MIRAI CLOUD</h4>
          </div>

          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Welcome to Mirai Cloud</h3>
            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Sign in to manage global properties, automation, and billing.</p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Role Switcher — 3 tabs */}
            <div className="mb-4 bg-light p-1 rounded-pill d-flex gap-1">
              <button 
                type="button" 
                onClick={() => setSelectedRole('super_admin')}
                className={`btn btn-sm rounded-pill flex-grow-1 py-1 fw-bold transition-all ${selectedRole === 'super_admin' ? 'bg-white shadow-sm text-primary' : 'text-muted'}`}
                style={{ fontSize: '0.65rem' }}
              >
                Super Admin
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedRole('floor_admin')}
                className={`btn btn-sm rounded-pill flex-grow-1 py-1 fw-bold transition-all ${selectedRole === 'floor_admin' ? 'bg-white shadow-sm text-primary' : 'text-muted'}`}
                style={{ fontSize: '0.65rem' }}
              >
                Floor Admin
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedRole('office_owner')}
                className={`btn btn-sm rounded-pill flex-grow-1 py-1 fw-bold transition-all ${selectedRole === 'office_owner' ? 'bg-white shadow-sm text-primary' : 'text-muted'}`}
                style={{ fontSize: '0.65rem' }}
              >
                Office Owner
              </button>
            </div>

            {/* Form Fields */}
            <div className="mb-3">
              <label className="form-label text-muted small fw-bold text-uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>Corporate Identity</label>
              <div className="input-group border-bottom pb-1 position-relative">
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
              System Initialization? <Link href="/register" className="text-primary fw-bold text-decoration-none">Create Super Admin</Link>
            </p>
          </div>

          <div className="text-center pt-3 border-top">
            <Link href="/" className="text-decoration-none text-muted fw-bold hover-text-primary transition-all" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              <i className="bi bi-arrow-left me-2"></i>RETURN TO MAIN INTERFACE
            </Link>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .bg-emerald { background-color: #014aad !important; }
        .text-primary { color: #014aad !important; }
        .btn-emerald { background-color: #014aad; border: none; }
        .btn-emerald:hover { background-color: #013a8a; transform: translateY(-1px); }
        .shadow-emerald { box-shadow: 0 10px 15px -3px rgba(1, 74, 173, 0.3); }
        .hover-lift:hover { transform: translateY(-2px); }
        .hover-text-primary:hover { color: #014aad !important; }
        .tracking-tight { letter-spacing: -0.02em; }
        .input-group-text { min-width: 24px; }
        @media (max-width: 991.98px) {
          .min-vh-100 { overflow-y: auto !important; }
        }
      `}} />
    </div>
  );
}
