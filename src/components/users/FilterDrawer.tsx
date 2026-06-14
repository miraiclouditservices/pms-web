"use client";

import React, { useEffect, useState } from "react";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  staffCategoryFilter: string;
  setStaffCategoryFilter: (val: string) => void;
  onReset: () => void;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  staffCategoryFilter,
  setStaffCategoryFilter,
  onReset,
}: FilterDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen && !mounted) return null;

  return (
    <div
      className={`position-fixed inset-0 w-100 h-100 d-flex justify-content-end`}
      style={{
        zIndex: 1060,
        top: 0,
        left: 0,
        backgroundColor: isOpen ? "rgba(15, 23, 42, 0.3)" : "rgba(15, 23, 42, 0)",
        backdropFilter: isOpen ? "blur(3px)" : "none",
        transition: "all 0.3s ease-in-out",
        pointerEvents: isOpen ? "auto" : "none",
      }}
      onClick={onClose}
    >
      <div
        className="h-100 bg-white border-start d-flex flex-column"
        style={{
          width: "100%",
          maxWidth: "380px",
          boxShadow: "-10px 0 25px -5px rgba(0, 0, 0, 0.08)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-in-out",
          pointerEvents: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center bg-light flex-shrink-0">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <i className="hgi-stroke hgi-filter" style={{ fontSize: "1rem" }} />
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-0" style={{ fontSize: "1rem" }}>Advanced Filters</h5>
              <p className="text-muted small mb-0" style={{ fontSize: "0.72rem" }}>Configure table results and filters</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
              lineHeight: 1,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-main)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            ×
          </button>
        </div>

        {/* Form Fields */}
        <div className="flex-grow-1 overflow-y-auto px-4 py-4" style={{ fontSize: '0.85rem' }}>
          {/* Quick Search */}
          <div className="mb-4">
            <label className="form-label fw-bold text-secondary text-uppercase mb-2" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>Search</label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control px-3 py-2 shadow-none"
                placeholder="Search name, email, phone..."
                style={{ borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="hgi-stroke hgi-search-01 position-absolute text-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}></i>
            </div>
          </div>

          {/* Access Role */}
          <div className="mb-4">
            <label className="form-label fw-bold text-secondary text-uppercase mb-2" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>Access Role</label>
            <select
              className="form-select px-3 py-2 shadow-none"
              style={{ borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All Roles">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="FLOOR_ADMIN">Floor Admin</option>
              <option value="OFFICE_OWNER">Office Owner</option>
              <option value="STAFF_ADMIN">Staff Admin</option>
            </select>
          </div>

          {/* User Status */}
          <div className="mb-4">
            <label className="form-label fw-bold text-secondary text-uppercase mb-2" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>User Status</label>
            <select
              className="form-select px-3 py-2 shadow-none"
              style={{ borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Staff Category */}
          {roleFilter === "STAFF_ADMIN" && (
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary text-uppercase mb-2" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>Staff Category</label>
              <select
                className="form-select px-3 py-2 shadow-none"
                style={{ borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                value={staffCategoryFilter}
                onChange={(e) => setStaffCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {['Security', 'Watchman', 'Electrician', 'Plumber', 'Helpdesk', 'Gardener', 'Housekeeping', 'Supervisor', 'Other', 'None'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}


        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-top d-flex gap-2 bg-light flex-shrink-0">
          <button
            type="button"
            className="btn btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-2"
            style={{ borderRadius: '6px', fontSize: '0.85rem' }}
            onClick={onReset}
          >
            <i className="hgi-stroke hgi-reload-01" /> Reset All
          </button>
          <button
            type="button"
            className="btn btn-primary w-50 d-flex align-items-center justify-content-center gap-2 text-white border-0"
            style={{ borderRadius: '6px', fontSize: '0.85rem', backgroundColor: 'var(--primary)' }}
            onClick={onClose}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
