"use client";

import styles from "@/styles/modules/Tenants.module.css";
import { useState, useEffect } from "react";
import TenantModal from "@/components/dashboard/TenantModal";
import { api } from "@/utils/api";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<any>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/tenants');
      if (response.success) setTenants(response.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
    }
  };

  const handleSaveTenant = async (data: any) => {
    try {
      if (editTenant) {
        await api.put(`/tenants/${editTenant._id}`, data);
      } else {
        await api.post('/tenants', data);
      }
      fetchTenants();
    } catch (err) {
      console.error("Error saving tenant:", err);
    }
    setIsModalOpen(false);
    setEditTenant(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this tenant?")) {
      try {
        await api.delete(`/tenants/${id}`);
        fetchTenants();
      } catch (err) {
        console.error("Error deleting tenant:", err);
      }
    }
  };

  return (
    <div className={styles.container}>
      <TenantModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditTenant(null); }} 
        onSave={handleSaveTenant} 
        editData={editTenant}
      />
      
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>Tenant Management</h2>
          <p>Manage tenant profiles, contact details, and KYC status.</p>
        </div>
        <button 
          className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" 
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: '#014aad', borderColor: '#014aad' }}
        >
          <i className="bi bi-person-plus-fill me-2"></i> Add Tenant
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Tenant Profile</th>
              <th className={styles.th}>Company</th>
              <th className={styles.th}>Contact Info</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => (
              <tr key={tenant._id} className={styles.tr}>
                <td className={styles.td}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <div className="fw-bold text-dark">{tenant.tenantName}</div>
                  </div>
                </td>
                <td className={styles.td}>
                  <span className="text-muted fw-bold">{tenant.companyName || 'N/A'}</span>
                </td>
                <td className={styles.td}>
                  <div className="d-flex flex-column small">
                    <span><i className="bi bi-envelope me-1 text-muted"></i> {tenant.emailId || 'N/A'}</span>
                    <span><i className="bi bi-telephone me-1 text-muted"></i> {tenant.contactNumber}</span>
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={`${styles.statusBadge} bg-${tenant.status === 'Active' ? 'success' : 'secondary'} bg-opacity-10 text-${tenant.status === 'Active' ? 'success' : 'secondary'}`}>
                    {tenant.status}
                  </span>
                </td>
                <td className={styles.td}>
                  <div className="d-flex gap-2">
                    <button className={styles.actionBtn} onClick={() => { setEditTenant(tenant); setIsModalOpen(true); }}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className={styles.actionBtn} onClick={() => handleDelete(tenant._id)}>
                      <i className="bi bi-trash text-danger"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-5">
                  <div className="d-flex flex-column align-items-center gap-2">
                    <i className="bi bi-people text-muted" style={{ fontSize: '2rem' }}></i>
                    <p className="text-muted mb-0">No tenants registered yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
