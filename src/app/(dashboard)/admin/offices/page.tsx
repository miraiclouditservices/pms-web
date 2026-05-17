"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import OfficeModal from "@/components/dashboard/OfficeModal";

export default function OfficesPage() {
  const [offices, setOffices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/properties');
      if (response.success) {
        setOffices(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch offices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      let response;
      if (editData) {
        response = await api.put(`/properties/${editData._id}`, data);
      } else {
        response = await api.post('/properties', data);
      }
      
      if (response.success) {
        fetchOffices();
      }
    } catch (err) {
      console.error("Failed to save office:", err);
    }
    setEditData(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this office from the system?")) {
      try {
        const response = await api.delete(`/properties/${id}`);
        if (response.success) {
          fetchOffices();
        }
      } catch (err) {
        console.error("Failed to delete office:", err);
      }
    }
  };

  const openEdit = (office: any) => {
    setEditData(office);
    setIsModalOpen(true);
  };

  return (
    <div className="container-fluid py-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Office Management</h4>
          <p className="text-muted small mb-0">Total {offices.length} offices registered</p>
        </div>
        <button 
          className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
          onClick={() => { setEditData(null); setIsModalOpen(true); }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <i className="bi bi-plus-lg me-2"></i>Add Office
        </button>
      </div>

      <div className="card border rounded-3 bg-white">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="text-muted small fw-bold text-uppercase py-3 px-4 border-bottom-0">Office</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 px-4 border-bottom-0">Manager</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 px-4 border-bottom-0">Security</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 px-4 border-bottom-0">Stats</th>
                  <th className="text-muted small fw-bold text-uppercase py-3 px-4 border-bottom-0 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {offices.map((off) => (
                  <tr key={off._id}>
                    <td className="px-4 py-3 border-light">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                           <i className="bi bi-building fs-5"></i>
                        </div>
                        <div>
                          <p className="fw-bold text-dark mb-0">{off.propertyName || off.name}</p>
                          <p className="text-muted small mb-0">{off.location || off.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-light">
                      <p className="fw-medium mb-0">{off.managerName || off.manager || '-'}</p>
                      <p className="text-muted small mb-0">{off.phoneNo || off.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3 border-light">
                      <span className={`badge ${off.securityLevel === 'High' || off.securityLevel === 'Restricted' ? 'bg-danger' : 'bg-info'} bg-opacity-10 text-${off.securityLevel === 'High' || off.securityLevel === 'Restricted' ? 'danger' : 'info'} rounded-pill px-3 py-2 fw-medium`}>
                        {off.securityLevel || 'Standard'}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-light">
                      <div className="d-flex gap-3">
                        <div className="text-center">
                          <p className="fw-bold mb-0 small">{off.totalUnits || off.units || 0}</p>
                          <p className="text-muted mb-0" style={{ fontSize: '0.65rem' }}>UNITS</p>
                        </div>
                        <div className="text-center border-start ps-3">
                          <p className="fw-bold mb-0 small">{off.totalTowers || off.watchmen || 0}</p>
                          <p className="text-muted mb-0" style={{ fontSize: '0.65rem' }}>TOWERS</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-light text-end">
                      <button className="btn btn-sm btn-light rounded-pill me-2" onClick={() => openEdit(off)}>
                        <i className="bi bi-pencil text-primary"></i>
                      </button>
                      <button className="btn btn-sm btn-light rounded-pill" onClick={() => handleDelete(off._id)}>
                        <i className="bi bi-trash text-danger"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <OfficeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave}
        editData={editData}
      />
    </div>
  );
}
