"use client";

import React from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface PaymentFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethod: string;
  setSelectedMethod: (m: string) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  minAmount: string;
  setMinAmount: (a: string) => void;
  maxAmount: string;
  setMaxAmount: (a: string) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function PaymentFilterDrawer({
  isOpen,
  onClose,
  selectedMethod,
  setSelectedMethod,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onApply,
  onReset,
}: PaymentFilterDrawerProps) {
  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
          }}
        />
      )}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: isOpen ? 0 : -340,
          width: 340,
          height: "100vh",
          background: "#fff",
          borderLeft: "1px solid #e2e8f0",
          zIndex: 1001,
          transition: "right 0.3s ease-in-out",
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <span className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
            Filter Payments
          </span>
          <button onClick={onClose} className="btn-close shadow-none" style={{ fontSize: "0.8rem" }} />
        </div>

        <div className="flex-grow-1" style={{ overflowY: "auto", marginRight: "-8px", paddingRight: "8px" }}>
          {/* Payment Method */}
          <div className="mb-3">
            <label className="form-label fw-bold text-muted small" style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>
              Payment Method
            </label>
            <select
              className="form-select shadow-none"
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
            >
              <option value="All">All Methods</option>
              <option value="Online">Online</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          {/* Month */}
          <div className="mb-3">
            <label className="form-label fw-bold text-muted small" style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>
              Billing Month
            </label>
            <select
              className="form-select shadow-none"
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All Months</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="mb-3">
            <label className="form-label fw-bold text-muted small" style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>
              Billing Year
            </label>
            <input
              type="number"
              placeholder="e.g. 2026"
              className="form-control shadow-none"
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            />
          </div>

          {/* Amount Range */}
          <div className="mb-3">
            <label className="form-label fw-bold text-muted small" style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>
              Amount Range (₹)
            </label>
            <div className="d-flex gap-2">
              <input
                type="number"
                placeholder="Min"
                className="form-control shadow-none"
                style={{ fontSize: "0.85rem", borderRadius: "6px" }}
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max"
                className="form-control shadow-none"
                style={{ fontSize: "0.85rem", borderRadius: "6px" }}
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-3">
            <label className="form-label fw-bold text-muted small" style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>
              Date Logged Range
            </label>
            <input
              type="date"
              className="form-control shadow-none mb-2"
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="form-control shadow-none"
              style={{ fontSize: "0.85rem", borderRadius: "6px" }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2 pt-3 border-top mt-auto">
          <button
            onClick={onReset}
            className="btn btn-sm btn-light border flex-grow-1 py-2"
            style={{ fontSize: "0.82rem", fontWeight: 600, borderRadius: "6px" }}
          >
            Reset
          </button>
          <button
            onClick={onApply}
            className="btn btn-sm text-white flex-grow-1 py-2"
            style={{ backgroundColor: "#014aad", fontSize: "0.82rem", fontWeight: 600, borderRadius: "6px" }}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
