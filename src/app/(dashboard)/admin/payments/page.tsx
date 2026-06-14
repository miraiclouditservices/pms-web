"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { api } from "@/utils/api";
import Table, { TableColumn } from "@/components/common/Table";
import PaymentFilterDrawer from "@/components/dashboard/PaymentFilterDrawer";

const ITEMS_PER_PAGE = 20;

function LedgerContent() {
  const [payments, setPayments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs: Paid / Unpaid
  const [activeTab, setActiveTab] = useState<"Paid" | "Unpaid">("Paid");

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);

  // Summary Metrics
  const [summary, setSummary] = useState({
    totalCollected: 0,
    totalTransactions: 0,
    avgTxnValue: 0
  });

  // Dynamic counter details
  const [counters, setCounters] = useState({
    total: 0,
    paid: 0,
    unpaid: 0
  });

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedMethod, setSelectedMethod] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(ITEMS_PER_PAGE));
    params.append("status", activeTab);

    if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
    if (selectedMethod !== "All") params.append("paymentMethod", selectedMethod);
    if (selectedMonth !== "All") params.append("month", selectedMonth);
    if (selectedYear) params.append("year", selectedYear);
    if (minAmount) params.append("minAmount", minAmount);
    if (maxAmount) params.append("maxAmount", maxAmount);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    return params.toString();
  }, [page, activeTab, debouncedSearch, selectedMethod, selectedMonth, selectedYear, minAmount, maxAmount, startDate, endDate]);

  const fetchPaymentsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [paymentsRes, meRes, allPaidRes, allUnpaidRes] = await Promise.all([
        api.get(`/payments?${buildQuery()}`),
        api.get("/auth/me"),
        api.get(`/payments?status=Paid&limit=1`),
        api.get(`/payments?status=Unpaid&limit=1`)
      ]);

      if (meRes.success) {
        const userObj = meRes.user || meRes.data;
        setCurrentUser(userObj);
        if (userObj) {
          localStorage.setItem("user", JSON.stringify(userObj));
        }
      }

      if (paymentsRes.success) {
        setPayments(paymentsRes.data || []);
        setTotalPages(paymentsRes.pagination?.totalPages || 1);
        setTotalPayments(paymentsRes.pagination?.totalPayments || 0);
        if (paymentsRes.summary) {
          setSummary(paymentsRes.summary);
        }
      }

      // Compute status counters
      const paidCount = allPaidRes.pagination?.totalPayments || 0;
      const unpaidCount = allUnpaidRes.pagination?.totalPayments || 0;
      setCounters({
        paid: paidCount,
        unpaid: unpaidCount,
        total: paidCount + unpaidCount
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    fetchPaymentsData();
  }, [fetchPaymentsData]);

  const handleResetFilters = () => {
    setSelectedMethod("All");
    setSelectedMonth("All");
    setSelectedYear("");
    setMinAmount("");
    setMaxAmount("");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
    setShowFiltersDrawer(false);
  };

  const handleExportCSV = () => {
    // Generate simple client-side CSV download
    const headers = ["S No", "Tenant Name", "Period Mapped", "Amount Paid", "Status", "Date Logged", "Method", "Transaction ID"];
    const rows = payments.map((p, idx) => [
      String(idx + 1).padStart(3, "0"),
      p.lease?.tenantName || "N/A",
      `${p.month} ${p.year}`,
      p.amount || 0,
      p.status || "Paid",
      p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-GB") : "—",
      p.paymentMethod,
      p.transactionId || "—"
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_ledger_${activeTab.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFiltersCount = [
    debouncedSearch.trim() !== "",
    selectedMethod !== "All",
    selectedMonth !== "All",
    selectedYear !== "",
    minAmount !== "",
    maxAmount !== "",
    startDate !== "",
    endDate !== ""
  ].filter(Boolean).length;

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "Admin" || currentUser?.role === "Super Admin";
  const isFloorAdmin = currentUser?.role === "FLOOR_ADMIN" || currentUser?.role === "Floor Admin";
  const isOwner = currentUser?.role === "Owner" || currentUser?.role === "OFFICE_OWNER" || currentUser?.role === "Office Owner";

  if (currentUser && !isSuperAdmin && !isFloorAdmin && !isOwner) {
    return (
      <div className="container py-5 text-center bg-white shadow-sm border rounded-xl mt-4" style={{ fontFamily: "var(--font-geist-sans)" }}>
        <i className="bi bi-shield-slash text-danger fs-1 d-block mb-3"></i>
        <h4 className="fw-bold text-dark">Unauthorized Access</h4>
        <p className="text-muted small">You do not have administrative permissions to view or handle the payments ledger.</p>
      </div>
    );
  }

  const columns: TableColumn<any>[] = [
    {
      header: "S No",
      render: (_, idx) => {
        const indexVal = (page - 1) * ITEMS_PER_PAGE + idx + 1;
        return <span className="text-muted fw-bold">{String(indexVal).padStart(3, "0")}</span>;
      }
    },
    {
      header: "Tenant Name",
      render: (p) => <span className="fw-semibold text-dark">{p.lease?.tenantName || "N/A"}</span>
    },
    {
      header: "Period Mapped",
      render: (p) => <span className="text-muted">{p.month} {p.year}</span>
    },
    {
      header: "Amount Paid",
      render: (p) => <span className="fw-bold text-success">₹{(p.amount || 0).toLocaleString()}</span>
    },
    {
      header: "Status",
      render: (p) => (
        <span className={`badge rounded-pill px-2.5 py-1 ${p.status === "Paid" ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25" : "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"}`} style={{ fontSize: "0.72rem", fontWeight: "bold" }}>
          {p.status || "Paid"}
        </span>
      )
    },
    {
      header: "Date Logged",
      render: (p) => (
        <span className="text-muted">
          {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
        </span>
      )
    },
    {
      header: "Method",
      render: (p) => (
        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-1" style={{ fontSize: "0.75rem" }}>
          {p.paymentMethod}
        </span>
      )
    },
    {
      header: "Transaction ID",
      render: (p) => <span className="text-muted">{p.transactionId || "—"}</span>
    }
  ];

  return (
    <div className="container-fluid p-0 d-flex flex-column" style={{ fontFamily: "var(--font-geist-sans)", height: "calc(100vh - 104px)", overflow: "hidden" }}>
      
      <PaymentFilterDrawer
        isOpen={showFiltersDrawer}
        onClose={() => setShowFiltersDrawer(false)}
        selectedMethod={selectedMethod}
        setSelectedMethod={setSelectedMethod}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        minAmount={minAmount}
        setMinAmount={setMinAmount}
        maxAmount={maxAmount}
        setMaxAmount={setMaxAmount}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onApply={() => {
          setPage(1);
          setShowFiltersDrawer(false);
        }}
        onReset={handleResetFilters}
      />

      {/* Header Panel matching Visitor Management UI structure exactly */}
      <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-3 flex-shrink-0">
        <div>
          <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.03em", fontSize: "1.25rem" }}>
            Accounts Ledger & Payments
          </h2>
          <div className="d-flex align-items-center gap-1.5 text-muted flex-wrap" style={{ fontSize: "0.76rem" }}>
            <span style={{ color: "#475569" }}>Total Collected: <strong className="text-success" style={{ fontWeight: 700 }}>₹{(summary.totalCollected || 0).toLocaleString()}</strong></span>
            <span>·</span>
            <span style={{ color: "#475569" }}>Total Transactions: <strong className="text-primary" style={{ fontWeight: 700 }}>{summary.totalTransactions}</strong></span>
            <span>·</span>
            <span style={{ color: "#475569" }}>Avg. Payment Value: <strong style={{ fontWeight: 700, color: "#8b5cf6" }}>₹{(summary.avgTxnValue || 0).toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Action controls right-aligned at page header level */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Clean Status Switcher Tabs */}
          <div className="d-flex p-1 bg-white border rounded-3 me-1" style={{ fontSize: "0.8rem", height: 40, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => { setActiveTab("Paid"); setPage(1); }}
              className={`btn btn-sm px-3 py-1 d-flex align-items-center gap-1.5 border-0 fw-semibold transition-all h-100 ${activeTab === "Paid" ? "bg-success text-white" : "text-muted bg-transparent"}`}
              style={{ borderRadius: "6px", fontSize: "0.78rem" }}
            >
              <i className="bi bi-check-circle-fill"></i>
              Paid
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("Unpaid"); setPage(1); }}
              className={`btn btn-sm px-3 py-1 d-flex align-items-center gap-1.5 border-0 fw-semibold transition-all h-100 ${activeTab === "Unpaid" ? "bg-secondary text-white" : "text-muted bg-transparent"}`}
              style={{ borderRadius: "6px", fontSize: "0.78rem" }}
            >
              <i className="bi bi-exclamation-circle-fill"></i>
              Unpaid / Pending
            </button>
          </div>

          {/* Search bar */}
          <div className="position-relative">
            <input
              type="text"
              className="form-control shadow-none"
              placeholder="Search tenant or transaction ID..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                width: 250,
                height: 40,
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "0.82rem",
                paddingRight: 32,
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#94a3b8",
                  fontSize: "1.1rem",
                }}
              >
                &times;
              </button>
            ) : (
              <i className="bi bi-search position-absolute text-muted" style={{ right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem" }} />
            )}
          </div>

          {/* Funnel Filter button */}
          <button
            onClick={() => setShowFiltersDrawer(true)}
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center position-relative"
            style={{
              width: 40,
              height: 40,
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              backgroundColor: activeFiltersCount > 0 ? "#f8fafc" : "#fff",
            }}
            title="Filters"
          >
            <i className="bi bi-funnel text-secondary" style={{ fontSize: "0.95rem" }} />
            {activeFiltersCount > 0 && (
              <span
                className="position-absolute bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                style={{
                  top: -5,
                  right: -5,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  fontSize: "0.62rem",
                  backgroundColor: "#014aad",
                }}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Export button */}
          <button
            onClick={handleExportCSV}
            className="btn btn-outline-secondary d-flex align-items-center gap-1.5 px-3"
            style={{
              height: 40,
              fontSize: "0.82rem",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              fontWeight: 500,
              color: "#334155"
            }}
          >
            <i className="bi bi-download" /> Export
          </button>
        </div>
      </div>

      {/* Main Table Bento Box (direct table with no double header card) */}
      <div className="bg-white border rounded-4 shadow-sm overflow-hidden flex-grow-1 d-flex flex-column min-height-0">
        <div className="flex-grow-1 overflow-hidden d-flex flex-column min-height-0">
          <Table
            columns={columns}
            data={payments}
            isLoading={isLoading}
            loadingMessage="Fetching ledger transactions..."
            emptyMessage="No payment records match this query."
            containerClassName="table-responsive"
            containerStyle={{ flexGrow: 1, overflowY: "auto" }}
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalPayments}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LedgerContent />
    </Suspense>
  );
}
