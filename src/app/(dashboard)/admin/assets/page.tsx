"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import styles from "@/styles/modules/Dashboard.module.css";
import AssetModal, { ModalMode } from "@/components/dashboard/AssetModal";

export default function AssetsPage() {
  const [userRole, setUserRole] = useState("super_admin"); // Mock role
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("All");

  const categories = ["All", "HVAC", "Electrical", "Plumbing", "IT & Tech", "Security", "Furniture", "Others"];

  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const metrics = {
    total: assets.length,
    underWarranty: assets.filter(a => a.warrantyEndDate && new Date(a.warrantyEndDate) >= new Date()).length,
    underAMC: assets.filter(a => a.amcEndDate && new Date(a.amcEndDate) >= new Date()).length,
    outOfWarranty: assets.filter(a => !a.warrantyEndDate || new Date(a.warrantyEndDate) < new Date()).length
  };

  useEffect(() => {
    fetchAssets();

    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.role === "Admin") {
            setUserRole("super_admin");
          } else if (u.role === "Owner") {
            setUserRole("manager");
          } else {
            setUserRole("viewer");
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/assets');
      if (response.success) {
        setAssets(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch assets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = (a.assetDescription?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.assetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTab = activeTab === "All" || a.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleOpenModal = (mode: ModalMode, asset: any = null) => {
    setModalMode(mode);
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handleSaveAsset = async (savedData: any) => {
    try {
      let response;
      if (modalMode === 'edit') {
        response = await api.put(`/assets/${savedData._id}`, savedData);
      } else {
        response = await api.post('/assets', savedData);
      }
      
      if (response.success) {
        fetchAssets();
      }
    } catch (err) {
      console.error("Failed to save asset:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      try {
        const response = await api.delete(`/assets/${id}`);
        if (response.success) {
          fetchAssets();
        }
      } catch (err) {
        console.error("Failed to delete asset:", err);
      }
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Header & Role Selector */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Assets Management</h2>
          <p className="text-muted small mb-0">View and manage all global assets</p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <div className="d-flex align-items-center bg-light rounded-pill p-1">
            <span className="small fw-bold text-muted px-2">Role:</span>
            <select 
              className="form-select form-select-sm border-0 bg-transparent fw-bold text-emerald shadow-none py-0" 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              style={{ width: '130px', cursor: 'pointer' }}
            >
              <option value="super_admin">Super Admin</option>
              <option value="manager">Facility Manager</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-download me-1"></i> Export
          </button>
          {userRole !== 'viewer' && (
            <button 
              className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold text-white border-0" 
              style={{ backgroundColor: '#10B981', fontSize: '0.75rem' }}
              onClick={() => handleOpenModal('create')}
            >
              <i className="bi bi-plus-lg me-1"></i> Add New Asset
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-box-seam fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Total Assets</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.total}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>All Assets</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-shield-check fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Under Warranty</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.underWarranty}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Active</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-file-earmark-text fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Under AMC</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.underAMC}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Active</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white p-3 rounded-xl border shadow-sm d-flex align-items-center gap-3 transition-all hover-lift">
            <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-exclamation-triangle fs-4"></i>
            </div>
            <div>
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Out of Warranty/AMC</div>
              <h3 className="fw-bold mb-0 text-dark">{metrics.outOfWarranty}</h3>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Expired</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="d-flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === cat ? 'btn-primary shadow-sm' : 'btn-white border text-muted'}`}
            style={activeTab === cat ? { backgroundColor: '#10B981', border: 'none', fontSize: '0.75rem' } : { fontSize: '0.75rem', backgroundColor: '#fff' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2 flex-grow-1" style={{ maxWidth: '400px' }}>
          <i className="bi bi-search text-muted me-2"></i>
          <input 
            type="text" 
            className="border-0 bg-transparent w-100 shadow-none small" 
            placeholder="Search by asset description, serial number or code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="py-3 px-4 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Asset Details</th>
                <th className="py-3 px-4 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Spatial Context</th>
                <th className="py-3 px-4 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Category</th>
                <th className="py-3 px-4 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Warranty Status</th>
                <th className="py-3 px-4 text-uppercase text-muted fw-bold border-bottom" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Asset Status</th>
                <th className="py-3 px-4 text-uppercase text-muted fw-bold border-bottom text-end" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const isExpired = asset.warrantyEndDate && new Date(asset.warrantyEndDate) < new Date();
                return (
                  <tr key={asset._id} className="transition-all hover-bg-light">
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light rounded p-2 text-primary">
                          <i className={`bi ${asset.category === 'HVAC' ? 'bi-wind' : asset.category === 'Electrical' ? 'bi-lightning-charge' : 'bi-box-seam'}`}></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{asset.assetDescription}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>{asset.assetCode} · {asset.serialNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex flex-column gap-1">
                        <div className="d-flex align-items-center gap-2">
                           <i className="bi bi-building text-emerald" style={{ fontSize: '0.8rem' }}></i>
                           <span className="fw-bold text-dark small">{asset.property?.propertyName || 'Main Complex'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                           <span className="badge bg-light text-muted border" style={{ fontSize: '0.6rem' }}>Floor {asset.floorNumber || '0'}</span>
                           {asset.unit ? (
                             <span className="text-emerald fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.65rem' }}>
                               <i className="bi bi-door-open-fill"></i> {asset.unit.unitNumber}
                             </span>
                           ) : (
                             <span className="text-muted italic" style={{ fontSize: '0.65rem' }}>Common Area</span>
                           )}
                        </div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>
                          <i className="bi bi-geo-alt"></i> {asset.assetLocation}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-light text-muted border rounded-pill fw-bold" style={{ fontSize: '0.65rem' }}>{asset.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      {asset.warrantyEndDate ? (
                        <div className="d-flex flex-column">
                          <span className={`fw-bold ${isExpired ? 'text-danger' : 'text-success'}`} style={{ fontSize: '0.75rem' }}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.65rem' }}>Ends: {new Date(asset.warrantyEndDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted small">No Warranty</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge bg-${asset.assetStatus === 'Active' ? 'success' : 'warning'} bg-opacity-10 text-${asset.assetStatus === 'Active' ? 'success' : 'warning'} rounded-pill`} style={{ fontSize: '0.65rem' }}>
                        {asset.assetStatus || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-sm btn-light rounded-circle" onClick={() => handleOpenModal('view', asset)} title="View">
                          <i className="bi bi-eye text-primary"></i>
                        </button>
                        {userRole !== 'viewer' && (
                          <button className="btn btn-sm btn-light rounded-circle" onClick={() => handleOpenModal('edit', asset)} title="Edit">
                            <i className="bi bi-pencil text-success"></i>
                          </button>
                        )}
                        {userRole === 'super_admin' && (
                          <button className="btn btn-sm btn-light rounded-circle" onClick={() => handleDelete(asset._id)} title="Delete">
                            <i className="bi bi-trash text-danger"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-top d-flex justify-content-between align-items-center bg-light">
          <span className="text-muted small fw-medium" style={{ fontSize: '0.75rem' }}>
            Showing {filteredAssets.length} of {assets.length} entries
          </span>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-white border px-2 shadow-none" disabled><i className="bi bi-chevron-left"></i></button>
            <button className="btn btn-sm btn-primary border-0 px-3 shadow-none" style={{ backgroundColor: '#10B981' }}>1</button>
            <button className="btn btn-sm btn-white border px-3 shadow-none">2</button>
            <button className="btn btn-sm btn-white border px-3 shadow-none">3</button>
            <span className="px-2 align-self-center text-muted">...</span>
            <button className="btn btn-sm btn-white border px-3 shadow-none">18</button>
            <button className="btn btn-sm btn-white border px-2 shadow-none"><i className="bi bi-chevron-right"></i></button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hover-lift:hover { transform: translateY(-3px); }
        .text-emerald { color: #10B981 !important; }
        .bg-emerald { background-color: #10B981 !important; }
        .rounded-xl { border-radius: 1rem !important; }
        .hover-bg-light:hover { background-color: rgba(0,0,0,0.02) !important; }
        .sticky-right { position: sticky; z-index: 1; border-left: 1px solid #dee2e6; }
      `}</style>
      
      <AssetModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAsset}
        editData={selectedAsset}
        mode={modalMode}
      />
    </div>
  );
}
