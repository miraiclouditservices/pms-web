"use client";

import React, { useState, useEffect } from 'react';
import styles from "@/styles/modules/Properties.module.css";
import { api } from "@/utils/api";

export default function FloorAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ floor: '', owner: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchFloors();
    fetchOwners();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/floor-assignments');
      if (res.success) setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFloors = async () => {
    try {
      const res = await api.get('/floors');
      if (res.success) setFloors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOwners = async () => {
    try {
      const res = await api.get('/owners');
      if (res.success) setOwners(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/floor-assignments', formData);
      fetchAssignments();
      setIsModalOpen(false);
      setFormData({ floor: '', owner: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to assign floor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to revoke this assignment?")) {
      try {
        await api.delete(`/floor-assignments/${id}`);
        fetchAssignments();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>Floor Assignments</h2>
          <p>Bind office owners to specific spatial assets across your properties.</p>
        </div>
        <div className={styles.controls}>
          <button 
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm rounded-pill px-4"
            onClick={() => setIsModalOpen(true)}
            style={{ backgroundColor: '#014aad', borderColor: '#014aad', color: '#ffffff', fontWeight: 'bold' }}
          >
            <i className="bi bi-link-45deg"></i> Assign Owner
          </button>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.search}>
          <i className={`bi bi-search ${styles.searchIcon}`}></i>
          <input type="text" placeholder="Search by owner or property..." />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Property & Floor</th>
              <th className={styles.th}>Assigned Owner</th>
              <th className={styles.th}>Assignment Date</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <tr key={assignment._id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-xl d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', backgroundColor: '#e8f0fe', color: '#1a73e8' }}>
                        <i className="bi bi-layers-fill" style={{ fontSize: '1.2rem' }}></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">{assignment.floor?.property?.propertyName || 'Unknown Property'}</h6>
                        <span className="small text-muted fw-bold">{assignment.floor?.floorName || 'Unknown Floor'}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className="fw-bold text-dark">
                      <i className="bi bi-person-badge text-primary me-1"></i> {assignment.owner?.ownerName || 'Unknown Owner'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className="text-muted small fw-bold">
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className="d-flex justify-content-end">
                      <button className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1" onClick={() => handleDelete(assignment._id)}>
                        <i className="bi bi-x-circle me-1"></i> Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-5">
                  <div className="d-flex flex-column align-items-center gap-3 py-4">
                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                      <i className="bi bi-diagram-3 text-muted" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <div className="text-center">
                      <h5 className="fw-bold mb-1">No Active Assignments</h5>
                      <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>
                        You have not bound any floors to office owners yet.
                      </p>
                    </div>
                    <button className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold" onClick={() => setIsModalOpen(true)}>
                      <i className="bi bi-plus-lg me-2"></i>Create Assignment
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 py-3">
                <h5 className="modal-title fw-bold">Assign Floor to Owner</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-2">Select Office Owner</label>
                    <select 
                      className="form-select bg-light border-0 py-2 shadow-none" 
                      required
                      value={formData.owner}
                      onChange={(e) => setFormData({...formData, owner: e.target.value})}
                    >
                      <option value="">-- Select Owner --</option>
                      {owners.map(o => <option key={o._id} value={o._id}>{o.ownerName} ({o.emailId})</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted text-uppercase mb-2">Select Target Floor</label>
                    <select 
                      className="form-select bg-light border-0 py-2 shadow-none" 
                      required
                      value={formData.floor}
                      onChange={(e) => setFormData({...formData, floor: e.target.value})}
                    >
                      <option value="">-- Select Floor --</option>
                      {floors.map(f => <option key={f._id} value={f._id}>{f.property?.propertyName} - {f.floorName || `Floor ${f.floorNumber}`}</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-emerald rounded-pill px-4 fw-bold text-white shadow-sm" disabled={isLoading} style={{ backgroundColor: '#014aad' }}>
                    {isLoading ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
