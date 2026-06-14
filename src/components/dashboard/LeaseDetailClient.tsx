"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/utils/api";

const STATUS_COLOR: Record<string, string> = {
  Paid: "success",
  Unpaid: "danger",
  Pending: "warning",
  Active: "success",
  Expired: "secondary",
  Suspended: "danger",
};

export default function LeaseDetailClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);
  const [lease, setLease] = useState<any>(null);
  const [billingData, setBillingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch user profile
      const resUser = await api.get(`/users/${userId}`);
      if (resUser.success) {
        const userData = resUser.data;
        setUser(userData);

        // Fetch lease for this user
        const resLease = await api.get(`/leases?limit=100`);
        if (resLease.success && resLease.data) {
          const matched = resLease.data.find(
            (l: any) => l.tenantEmail === userData.email || l.tenantName === userData.name
          );
          setLease(matched || null);
        }

        // Fetch billing invoices & payments
        const resBilling = await api.get(`/users/${userId}/billing`);
        if (resBilling.success) {
          setBillingData(resBilling.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId && userId !== "new" && userId !== "fallback") {
      fetchDetails();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <h5 className="text-danger">Agreement profile not found</h5>
        <Link href="/admin/leases" className="btn btn-outline-secondary btn-sm mt-3">
          Back to Agreements
        </Link>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="container-fluid p-0" style={{ fontFamily: "var(--font-geist-sans)" }}>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-1">
              <li className="breadcrumb-item">
                <Link href="/admin/leases" className="text-decoration-none text-muted">Lease Agreements</Link>
              </li>
              <li className="breadcrumb-item active fw-semibold text-dark" aria-current="page">
                {user.name}
              </li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
            Lease Agreement & Spatial Profile
          </h2>
        </div>
        <div>
          <Link href="/admin/leases" className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1" style={{ fontSize: "0.8rem", borderRadius: "6px" }}>
            <i className="bi bi-arrow-left"></i> Back to Agreements
          </Link>
        </div>
      </div>

      <div className="row g-4 align-items-stretch">
        {/* Left Column: User & Space Allocation Profile */}
        <div className="col-lg-5 col-12">
          <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column gap-4">
            
            {/* User Profile Info Card */}
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white bg-primary bg-opacity-75" style={{ width: 52, height: 52, fontSize: "1.2rem", flexShrink: 0 }}>
                {getInitials(user.name)}
              </div>
              <div className="text-truncate">
                <h5 className="fw-bold mb-0 text-dark text-truncate" style={{ fontSize: "1rem" }}>
                  {user.name}
                </h5>
                <span className="text-muted small d-block text-truncate">{user.email}</span>
                <span className={`badge bg-${STATUS_COLOR[user.agreementStatus] || "secondary"} bg-opacity-10 text-${STATUS_COLOR[user.agreementStatus] || "secondary"} border border-${STATUS_COLOR[user.agreementStatus] || "secondary"} border-opacity-25 rounded-pill mt-1`} style={{ fontSize: "0.72rem" }}>
                  {user.role === "FLOOR_ADMIN" ? "Floor Admin" : "Office Owner"} · {user.agreementStatus || "Active"}
                </span>
              </div>
            </div>

            <hr className="my-0 opacity-10" />

            {/* Spatial Allocation Card */}
            <div>
              <h6 className="fw-bold text-dark mb-3" style={{ fontSize: "0.88rem" }}>
                <i className="bi bi-layers text-primary me-2"></i>Spatial Mapping Configuration
              </h6>
              <div className="d-flex flex-column gap-2 p-3 bg-light rounded-3 border">
                <div>
                  <span className="text-muted small d-block" style={{ fontSize: '0.74rem' }}>Allocated Properties</span>
                  <strong className="text-dark small">
                    {user.assignedProperties?.map((p: any) => p.propertyName || p.name || p).join(", ") || "—"}
                  </strong>
                </div>
                <div className="border-top pt-2 mt-1">
                  <span className="text-muted small d-block" style={{ fontSize: '0.74rem' }}>Assigned Floors</span>
                  <strong className="text-dark small">
                    {user.assignedFloors?.map((f: any) => f.floorName || `Floor ${f.floorNumber}` || f).join(", ") || "—"}
                  </strong>
                </div>
                <div className="border-top pt-2 mt-1">
                  <span className="text-muted small d-block" style={{ fontSize: '0.74rem' }}>Specific Unit Allocations</span>
                  <strong className="text-dark small">
                    {user.assignedUnits?.map((u: any) => `Unit ${u.unitNumber}` || u).join(", ") || "—"}
                  </strong>
                </div>
              </div>
            </div>

            {/* General Details List */}
            <div className="d-flex flex-column">
              {[
                { label: "Phone Number", value: user.phoneNumber || "—", icon: "bi-telephone-fill" },
                { label: "Agreement Term", value: `${formatDate(user.floorAssignmentStartDate)} to ${formatDate(user.floorAssignmentEndDate)}`, icon: "bi-calendar-check" },
                { label: "Monthly Due Day", value: `${user.paymentDueDay || 5}th of Month`, icon: "bi-alarm" },
              ].map((row, idx, arr) => (
                <div
                  key={row.label}
                  className="d-flex justify-content-between align-items-center py-2.5"
                  style={{ borderBottom: idx === arr.length - 1 ? "none" : "1px solid #f1f5f9" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: 28, height: 28, backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 6, color: "#1a73e8" }}
                    >
                      <i className={`bi ${row.icon}`} style={{ fontSize: "0.85rem" }}></i>
                    </div>
                    <span className="text-muted" style={{ fontSize: "0.82rem", fontWeight: 500 }}>{row.label}</span>
                  </div>
                  <span className="fw-bold text-dark text-end" style={{ fontSize: "0.82rem", maxWidth: "60%" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Billing Summary & Payment Ledger */}
        <div className="col-lg-7 col-12">
          <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column gap-4">
            
            {/* Financial Summary Widget */}
            <div>
              <h6 className="fw-bold text-dark mb-3" style={{ fontSize: "0.88rem" }}>
                <i className="bi bi-wallet2 text-primary me-2"></i>Financial & Billing Summary
              </h6>
              <div className="row g-3">
                <div className="col-sm-4 col-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block" style={{ fontSize: '0.74rem' }}>Monthly Contract Fee</span>
                    <strong className="text-dark fs-5">₹{(user.monthlyManagementAmount || 0).toLocaleString()}</strong>
                  </div>
                </div>
                <div className="col-sm-4 col-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block" style={{ fontSize: '0.74rem' }}>Total Billed</span>
                    <strong className="text-dark fs-5">₹{(billingData?.summary?.totalBilled || 0).toLocaleString()}</strong>
                  </div>
                </div>
                <div className="col-sm-4 col-12">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block" style={{ fontSize: '0.74rem' }}>Pending Balance</span>
                    <strong className={`fs-5 ${billingData?.summary?.pendingAmount > 0 ? "text-danger" : "text-success"}`}>
                      ₹{(billingData?.summary?.pendingAmount || 0).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoices and Payments History Table */}
            <div className="flex-grow-1">
              <h6 className="fw-bold text-dark mb-3" style={{ fontSize: "0.88rem" }}>
                <i className="bi bi-clock-history text-primary me-2"></i>Billing & Transactions History
              </h6>
              
              <div className="table-responsive border rounded-3 overflow-hidden">
                <table className="table table-hover mb-0 align-middle text-nowrap small">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-2 px-3 text-muted">Billing Period</th>
                      <th className="py-2 px-3 text-muted">Amount</th>
                      <th className="py-2 px-3 text-muted">Due Date</th>
                      <th className="py-2 px-3 text-muted">Paid Date</th>
                      <th className="py-2 px-3 text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!billingData?.invoices || billingData.invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted">No billing transactions recorded yet.</td>
                      </tr>
                    ) : (
                      billingData.invoices.map((inv: any) => (
                        <tr key={inv.invoiceId}>
                          <td className="py-2.5 px-3 fw-semibold text-dark">{inv.billingPeriod}</td>
                          <td className="py-2.5 px-3 text-dark">₹{inv.amount.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-muted">{formatDate(inv.dueDate)}</td>
                          <td className="py-2.5 px-3 text-muted">{formatDate(inv.paidDate)}</td>
                          <td className="py-2.5 px-3">
                            <span className={`badge bg-${STATUS_COLOR[inv.status] || "secondary"} bg-opacity-10 text-${STATUS_COLOR[inv.status] || "secondary"} border border-${STATUS_COLOR[inv.status] || "secondary"} border-opacity-25 rounded-pill`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
