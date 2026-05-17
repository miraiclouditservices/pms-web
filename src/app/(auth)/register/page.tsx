"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Admin"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (response.success) {
        if (response.token) {
          // This was the first user (bootstrap flow)
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          router.replace('/admin/dashboard');
        } else {
          // Admin successfully created a new user
          alert("New account provisioned successfully.");
          setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: "Admin"
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Only system administrators can create accounts.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column flex-lg-row overflow-hidden bg-white">
      {/* Brand Side */}
      <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 position-relative overflow-hidden" 
           style={{ 
             background: 'linear-gradient(135deg, #064E3B 0%, #10B981 100%)',
             color: 'white'
           }}>
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
              Join the <br />
              <span className="text-white text-opacity-75">Network.</span>
            </h1>
            <p className="fw-light text-white text-opacity-80" style={{ maxWidth: '440px', fontSize: '1.1rem' }}>
              Create your account to start managing property assets, security protocols, and high-density space modeling.
            </p>
          </div>
        </div>

        <div className="position-relative z-1 d-flex justify-content-between align-items-center small text-white text-opacity-40 fw-bold text-uppercase" style={{ letterSpacing: '0.1em', fontSize: '0.65rem' }}>
          <div>v4.2.0 Build</div>
          <div>© 2026 PSM GLOBAL</div>
        </div>
      </div>

      {/* Register Form Side */}
      <div className="col-lg-6 d-flex flex-column justify-content-center align-items-center p-4 p-md-5">
        <div className="w-100" style={{ maxWidth: '400px' }}>
          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Create Account</h3>
            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Register to access the management portal.</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label text-muted small fw-bold text-uppercase mb-1" style={{ fontSize: '0.6rem' }}>Full Name</label>
                <div className="input-group border-bottom pb-1">
                  <span className="input-group-text bg-transparent border-0 px-0 me-3"><i className="bi bi-person text-muted"></i></span>
                  <input 
                    type="text" 
                    className="form-control bg-transparent border-0 px-0 shadow-none" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="col-12">
                <label className="form-label text-muted small fw-bold text-uppercase mb-1" style={{ fontSize: '0.6rem' }}>Corporate Email</label>
                <div className="input-group border-bottom pb-1">
                  <span className="input-group-text bg-transparent border-0 px-0 me-3"><i className="bi bi-envelope text-muted"></i></span>
                  <input 
                    type="email" 
                    className="form-control bg-transparent border-0 px-0 shadow-none" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label text-muted small fw-bold text-uppercase mb-1" style={{ fontSize: '0.6rem' }}>Password</label>
                <div className="input-group border-bottom pb-1">
                  <span className="input-group-text bg-transparent border-0 px-0 me-3"><i className="bi bi-lock text-muted"></i></span>
                  <input 
                    type="password" 
                    className="form-control bg-transparent border-0 px-0 shadow-none" 
                    required 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label text-muted small fw-bold text-uppercase mb-1" style={{ fontSize: '0.6rem' }}>Confirm</label>
                <div className="input-group border-bottom pb-1">
                  <span className="input-group-text bg-transparent border-0 px-0 me-3"><i className="bi bi-shield-lock text-muted"></i></span>
                  <input 
                    type="password" 
                    className="form-control bg-transparent border-0 px-0 shadow-none" 
                    required 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <div className="col-12">
                <label className="form-label text-muted small fw-bold text-uppercase mb-1" style={{ fontSize: '0.6rem' }}>Account Role</label>
                <div className="bg-light p-3 rounded shadow-sm border border-emerald border-opacity-25 d-flex align-items-center gap-3">
                  <div className="bg-emerald bg-opacity-10 text-emerald rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <i className="bi bi-shield-lock-fill"></i>
                  </div>
                  <div>
                    <p className="fw-bold mb-0 text-dark" style={{ fontSize: '0.85rem' }}>System Administrator</p>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.7rem' }}>Full access to all dashboard modules and user management.</p>
                  </div>
                </div>
                <input type="hidden" value="Admin" />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger border-0 py-2 small fw-medium mt-4 mb-0" style={{ borderRadius: '0.5rem', backgroundColor: '#FEF2F2', color: '#B91C1C' }}>
                <i className="bi bi-exclamation-circle-fill me-2"></i>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-emerald w-100 py-3 fw-bold text-white shadow-emerald rounded-pill transition-all mt-4 mb-4"
              disabled={isLoading}
            >
              {isLoading ? "PROVISIONING..." : "CREATE ACCOUNT"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-muted small mb-0">
              Already have an account? <Link href="/login" className="text-emerald fw-bold text-decoration-none">Log In</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .bg-emerald { background-color: #10B981 !important; }
        .text-emerald { color: #10B981 !important; }
        .btn-emerald { background-color: #10B981; border: none; }
        .btn-emerald:hover { background-color: #059669; transform: translateY(-1px); }
        .shadow-emerald { box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3); }
        .tracking-tight { letter-spacing: -0.02em; }
      `}</style>
    </div>
  );
}
