"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/modules/Properties.module.css";
import UserModal from "@/components/dashboard/UserModal";
import { ModalMode } from "@/components/dashboard/AssetModal";
import { api } from "@/utils/api";

export default function PeoplePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users');
      if (response.success) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (mode: ModalMode, user?: any) => {
    setModalMode(mode);
    setSelectedUser(user || null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userData: any) => {
    try {
      let response;
      if (modalMode === "create") {
        response = await api.post('/users', userData);
      } else {
        response = await api.put(`/users/${selectedUser._id}`, userData);
      }
      
      if (response.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to save user:", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Are you sure you want to revoke access for this user?")) {
      try {
        const response = await api.delete(`/users/${id}`);
        if (response.success) {
          fetchUsers();
        }
      } catch (err) {
        console.error("Failed to delete user:", err);
      }
    }
  };

  return (
    <div className={styles.container}>
      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveUser}
        editData={selectedUser}
        mode={modalMode}
      />

      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>Staff & User Directory</h2>
          <p>Provision access, manage roles, and monitor system governance.</p>
        </div>
        <div className={styles.controls}>
          <button 
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => handleOpenModal("create")}
          >
            <i className="bi bi-person-plus-fill"></i> Provision New User
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>User Identity</th>
              <th className={styles.th}>System Role</th>
              <th className={styles.th}>Contact Email</th>
              <th className={styles.th}>Created At</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-5"><div className="spinner-border text-emerald"></div></td></tr>
            ) : users.map((user) => (
              <tr key={user._id} className={styles.tr}>
                <td className={styles.td}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold text-emerald" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="d-flex flex-column">
                      <span className="fw-bold text-dark">{user.name}</span>
                      <span className="text-muted small">UID: {user._id.substring(0, 8)}</span>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={`badge rounded-pill px-3 py-2 fw-normal ${
                    user.role === 'Admin' ? 'bg-danger bg-opacity-10 text-danger' : 
                    user.role === 'Owner' ? 'bg-primary bg-opacity-10 text-primary' : 
                    'bg-success bg-opacity-10 text-success'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className={styles.td}><span className="text-muted small">{user.email}</span></td>
                <td className={styles.td}><span className="text-muted small">{new Date(user.createdAt).toLocaleDateString()}</span></td>
                <td className={styles.td}>
                  <span className={`${styles.statusBadge} bg-success bg-opacity-10 text-success`}>
                    Active
                  </span>
                </td>
                <td className={styles.td}>
                  <div className="d-flex gap-2 justify-content-end">
                    <button className={styles.actionBtn} title="View" onClick={() => handleOpenModal("view", user)}>
                      <i className="bi bi-eye"></i>
                    </button>
                    <button className={styles.actionBtn} title="Edit" onClick={() => handleOpenModal("edit", user)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className={`${styles.actionBtn} text-danger`} title="Delete" onClick={() => handleDeleteUser(user._id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
