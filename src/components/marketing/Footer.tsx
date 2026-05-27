"use client";

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="text-white pt-5 pb-4" style={{ backgroundColor: '#001233', borderTop: '1px solid rgba(1, 74, 173, 0.2)' }}>
      <div className="container">
        {/* Top Section */}
        <div className="row gy-5 mb-5">
          {/* Column 1 - Brand */}
          <div className="col-lg-3 col-md-6">
            <Link href="/" className="text-decoration-none d-flex align-items-center gap-2 mb-4">
              <div className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-shield-lock-fill fs-4"></i>
              </div>
              <span className="fw-bold text-white fs-4">PMS Security</span>
            </Link>
            <p className="text-white-50 mb-4 pe-lg-3">
              Secure workplaces. Smarter operations. Built for global scale.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-white-50 hover-text-primary fs-5 transition-all"><i className="bi bi-linkedin"></i></a>
              <a href="#" className="text-white-50 hover-text-primary fs-5 transition-all"><i className="bi bi-twitter-x"></i></a>
              <a href="#" className="text-white-50 hover-text-primary fs-5 transition-all"><i className="bi bi-github"></i></a>
            </div>
          </div>

          {/* Column 2 - Product */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="fw-bold text-white mb-4 text-uppercase small tracking-widest">Product</h6>
            <ul className="list-unstyled">
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Features</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Pricing</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Integrations</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">API Access</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Updates</a></li>
            </ul>
          </div>

          {/* Column 3 - Company */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="fw-bold text-white mb-4 text-uppercase small tracking-widest">Company</h6>
            <ul className="list-unstyled">
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">About Us</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Careers</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Blog</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Press</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Contact</a></li>
            </ul>
          </div>

          {/* Column 4 - Resources */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="fw-bold text-white mb-4 text-uppercase small tracking-widest">Resources</h6>
            <ul className="list-unstyled">
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Help Center</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Documentation</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Compliance</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Privacy Policy</a></li>
              <li className="mb-3"><a href="#" className="text-white-50 footer-link small transition-all">Terms</a></li>
            </ul>
          </div>

          {/* Column 5 - Newsletter (Middle Section CTA Strip equivalent) */}
          <div className="col-lg-3 col-md-12 mt-lg-0 mt-4">
            <h6 className="fw-bold text-white mb-4 text-uppercase small tracking-widest">Stay Updated</h6>
            <p className="text-white-50 small mb-4">Subscribe for product releases and security insights.</p>
            <div className="input-group">
              <input 
                type="email" 
                className="form-control bg-white bg-opacity-10 border-white border-opacity-10 text-white rounded-start-pill px-3" 
                placeholder="Enter email" 
                style={{ height: '48px' }}
              />
              <button className="btn btn-primary rounded-end-pill px-4 fw-bold" type="button">Subscribe</button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-top border-white border-opacity-10">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <p className="text-white-50 small mb-0">© 2025 PMS Security. All rights reserved.</p>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <div className="d-flex justify-content-center justify-content-md-end gap-4">
                <a href="#" className="text-white-50 text-decoration-none small hover-text-primary transition-all">Privacy</a>
                <a href="#" className="text-white-50 text-decoration-none small hover-text-primary transition-all">Terms</a>
                <a href="#" className="text-white-50 text-decoration-none small hover-text-primary transition-all">Security</a>
                <a href="#" className="text-white-50 text-decoration-none small hover-text-primary transition-all">Status</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
