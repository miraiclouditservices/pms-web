"use client";

import styles from "@/styles/modules/Properties.module.css";
import { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";
import AmcModal from "@/components/dashboard/AmcModal";

function AMCContent() {
  const [amcs, setAmcs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmc, setSelectedAmc] = useState<any>(null);

  useEffect(() => {
    fetchAMCs();
  }, []);

  const fetchAMCs = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/amc');
      if (response.success) {
        setAmcs(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch AMCs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAmc = async (data: any) => {
    try {
        let response;
        if (selectedAmc) {
            response = await api.put(`/amc/${selectedAmc._id}`, data);
        } else {
            response = await api.post('/amc', data);
        }
        if (response.success) {
            fetchAMCs();
        }
    } catch (err) {
        console.error("Failed to save AMC:", err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>AMC Management</h2>
          <p>Manage Annual Maintenance Contracts and service schedules.</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm fw-bold border-0"
            onClick={() => {
                setSelectedAmc(null);
                setIsModalOpen(true);
            }}
            style={{ backgroundColor: '#10B981', height: '42px' }}
          >
            <i className="bi bi-plus-lg"></i> Add AMC
          </button>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.search}>
          <i className={`bi bi-search ${styles.searchIcon}`}></i>
          <input type="text" placeholder="Search by asset or vendor..." />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>AMC Details</th>
              <th className={styles.th}>Vendor</th>
              <th className={styles.th}>Duration</th>
              <th className={styles.th}>Value</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-5">Loading...</td></tr>
            ) : amcs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-5">No AMCs found.</td></tr>
            ) : amcs.map((amc) => (
              <tr key={amc._id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.propCell}>
                    <div className={styles.propIcon}>
                      <i className="bi bi-calendar-check"></i>
                    </div>
                    <div className={styles.propInfo}>
                      <h6>{amc.amcId}</h6>
                      <p>{amc.asset?.assetDescription || 'Asset Name'}</p>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className="small">
                    <div className="fw-bold">{amc.vendor?.vendorName || 'Vendor Name'}</div>
                    <div className="text-muted">{amc.contactNumber}</div>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className="small">
                    <div>{new Date(amc.startDate).toLocaleDateString()}</div>
                    <div className="text-muted">to {new Date(amc.endDate).toLocaleDateString()}</div>
                  </div>
                </td>
                <td className={styles.td}>₹ {amc.amcValue?.toLocaleString()}</td>
                <td className={styles.td}>
                  <span className={`${styles.statusBadge} bg-${amc.amcStatus === 'Active' ? 'success' : 'danger'} bg-opacity-10 text-${amc.amcStatus === 'Active' ? 'success' : 'danger'}`}>
                    {amc.amcStatus || 'Active'}
                  </span>
                </td>
                <td className={styles.td}>
                   <div className="d-flex gap-1 justify-content-end">
                    <button 
                        className={styles.actionBtn}
                        onClick={() => {
                            setSelectedAmc(amc);
                            setIsModalOpen(true);
                        }}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AmcModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAmc}
        editData={selectedAmc}
      />
    </div>
  );
}

export default function AMCPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AMCContent />
    </Suspense>
  );
}
