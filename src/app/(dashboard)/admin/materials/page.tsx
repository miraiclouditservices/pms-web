"use client";

import styles from "@/styles/modules/Properties.module.css";
import { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";
import GatePassModal from "@/components/dashboard/GatePassModal";
import { ModalMode } from "@/components/dashboard/AssetModal";

function MaterialsContent() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedGatePass, setSelectedGatePass] = useState<any>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/materials');
      if (response.success) {
        setMaterials(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch materials:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (mode: ModalMode, item: any = null) => {
    setModalMode(mode);
    setSelectedGatePass(item);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      let response;
      if (modalMode === 'edit') {
        response = await api.put(`/materials/${data._id}`, data);
      } else {
        response = await api.post('/materials', data);
      }

      if (response.success) {
        fetchMaterials();
      }
    } catch (err) {
      console.error("Failed to save gate pass:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this gate pass?")) {
      try {
        const response = await api.delete(`/materials/${id}`);
        if (response.success) {
          fetchMaterials();
        }
      } catch (err) {
        console.error("Failed to delete gate pass:", err);
      }
    }
  };

  const filteredMaterials = materials.filter(item => 
    (item.materialDetails || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.vehicleNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.building || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.unit || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.officeName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className="fw-bold" style={{ letterSpacing: '-0.02em' }}>Material Management</h2>
          <p className="text-muted small">Track inward and outward material movement with gate passes.</p>
        </div>
        <div className={styles.controls}>
          <button 
            className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold border-0" 
            style={{ backgroundColor: '#10B981' }}
            onClick={() => handleOpenModal('create')}
          >
            <i className="bi bi-plus-lg me-1"></i> New Gate Pass
          </button>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.search} style={{ maxWidth: '400px' }}>
          <i className={`bi bi-search ${styles.searchIcon}`}></i>
          <input 
            type="text" 
            placeholder="Search by material, building, unit, office..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Gate Pass Type</th>
              <th className={styles.th}>Material Details</th>
              <th className={styles.th}>Location / Office</th>
              <th className={styles.th}>Quantity / Rate</th>
              <th className={styles.th}>Total Cost</th>
              <th className={styles.th}>Time</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-5">
                <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                Loading...
              </td></tr>
            ) : filteredMaterials.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-5 text-muted">No gate passes found.</td></tr>
            ) : filteredMaterials.map((item) => (
              <tr key={item._id} className={styles.tr}>
                <td className={styles.td}>
                  <span className={`badge rounded-pill bg-${item.gatePassType === 'Inward' ? 'success' : 'info'} bg-opacity-10 text-${item.gatePassType === 'Inward' ? 'success' : 'info'} px-3 py-2 fw-medium`}>
                    {item.gatePassType}
                  </span>
                </td>
                <td className={styles.td}>
                  <div className="fw-bold text-dark">{item.materialDetails}</div>
                  <div className="small text-muted" style={{ fontSize: '0.7rem' }}>HSN: {item.hsnCode || 'N/A'}</div>
                </td>
                <td className={styles.td}>
                  <div className="fw-medium text-dark">{item.building}</div>
                  <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                    Flr: {item.floor}, Unit: {item.unit}
                  </div>
                  {item.officeName && (
                    <div className="small text-emerald fw-bold mt-1" style={{ fontSize: '0.65rem', color: '#10B981' }}>
                      {item.officeName}
                    </div>
                  )}
                </td>
                <td className={styles.td}>
                  <div className="small">
                    <div className="fw-bold text-dark">{item.quantity} units</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>@ ₹{item.rate}</div>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className="fw-bold text-dark">₹{item.totalCost?.toLocaleString()}</div>
                </td>
                <td className={styles.td}>
                  <div className="small">
                    <div className="fw-bold"><span className="text-success small">In:</span> {item.inTime}</div>
                    {item.outTime && item.outTime !== '-' && (
                      <div className="fw-bold"><span className="text-danger small">Out:</span> {item.outTime}</div>
                    )}
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.vehicleNumber || 'No Vehicle'}</div>
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={`badge rounded-pill bg-${
                    item.status === 'Approved' ? 'success' : 
                    item.status === 'Cleared' ? 'primary' :
                    item.status === 'Rejected' ? 'danger' : 'warning'
                  } bg-opacity-10 text-${
                    item.status === 'Approved' ? 'success' : 
                    item.status === 'Cleared' ? 'primary' :
                    item.status === 'Rejected' ? 'danger' : 'warning'
                  } px-3 py-2 fw-medium`}>
                    {item.status || 'Pending'}
                  </span>
                </td>
                <td className={styles.td}>
                   <div className="d-flex gap-1 justify-content-end">
                    <button className={styles.actionBtn} title="View" onClick={() => handleOpenModal('view', item)}>
                      <i className="bi bi-eye text-primary"></i>
                    </button>
                    <button className={styles.actionBtn} title="Edit" onClick={() => handleOpenModal('edit', item)}>
                      <i className="bi bi-pencil text-success"></i>
                    </button>
                    <button className={styles.actionBtn} title="Delete" onClick={() => handleDelete(item._id)}>
                      <i className="bi bi-trash text-danger"></i>
                    </button>
                    <button className={styles.actionBtn} title="Print">
                      <i className="bi bi-printer text-muted"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GatePassModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editData={selectedGatePass}
        mode={modalMode}
      />
    </div>
  );
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MaterialsContent />
    </Suspense>
  );
}
