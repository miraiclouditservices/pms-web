"use client";

import styles from "@/styles/modules/Properties.module.css";
import { useState, useEffect, Suspense } from "react";
import { api } from "@/utils/api";

function UnitsContent() {
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/units');
      if (response.success) {
        setUnits(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch units:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>Unit Management</h2>
          <p>Granular control over property units, occupancy, and parking.</p>
        </div>
        <div className={styles.controls}>
          <button className="btn btn-primary d-flex align-items-center gap-2">
            <i className="bi bi-plus-lg"></i> Add New Unit
          </button>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.search}>
          <i className={`bi bi-search ${styles.searchIcon}`}></i>
          <input type="text" placeholder="Search by unit number or floor..." />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Unit Number</th>
              <th className={styles.th}>Property</th>
              <th className={styles.th}>Floor</th>
              <th className={styles.th}>Area (Sq. Ft)</th>
              <th className={styles.th}>Parking</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-5">Loading...</td></tr>
            ) : units.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-5">No units found.</td></tr>
            ) : units.map((unit) => (
              <tr key={unit._id} className={styles.tr}>
                <td className={styles.td}>
                   <div className="fw-bold">{unit.unitNumber}</div>
                </td>
                <td className={styles.td}>{unit.propertyId?.propertyName || 'Property'}</td>
                <td className={styles.td}>{unit.floorNumber}</td>
                <td className={styles.td}>{unit.squareFeet}</td>
                <td className={styles.td}>
                   <div className="small">
                      <div>Car: {unit.carParking}</div>
                      <div className="text-muted">Bike: {unit.bikeParking}</div>
                   </div>
                </td>
                <td className={styles.td}>
                  <span className={`${styles.statusBadge} bg-${unit.unitStatus === 'Occupied' ? 'success' : 'warning'} bg-opacity-10 text-${unit.unitStatus === 'Occupied' ? 'success' : 'warning'}`}>
                    {unit.unitStatus}
                  </span>
                </td>
                <td className={styles.td}>
                   <div className="d-flex gap-1 justify-content-end">
                    <button className={styles.actionBtn}>
                      <i className="bi bi-pencil"></i>
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

export default function UnitsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UnitsContent />
    </Suspense>
  );
}
