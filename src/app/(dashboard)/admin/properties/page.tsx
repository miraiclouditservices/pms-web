"use client";

import styles from "@/styles/modules/Properties.module.css";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import PropertyModal from "@/components/dashboard/PropertyModal";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";

function PropertiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<any>(null);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      if (!user || user.role === 'Admin') {
        setEditProperty(null);
        setIsModalOpen(true);
      }
    }
  }, [searchParams, user]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditProperty(null);
    // Remove query params from URL
    router.replace('/admin/properties', { scroll: false });
  };

  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  const fetchOwnerProfile = async () => {
    try {
      const response = await api.get('/owners/my-profile');
      if (response.success) {
        setOwnerProfile(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch owner profile:", err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (user?.role === 'Owner') {
      fetchOwnerProfile();
    }
  }, [user]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/properties');
      if (response.success) {
        setProperties(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProperty = async (propData: any) => {
    try {
      let response;
      if (editProperty) {
        response = await api.put(`/properties/${editProperty._id}`, propData);
      } else {
        response = await api.post('/properties', propData);
      }
      
      if (response.success) {
        fetchProperties();
      }
    } catch (err) {
      console.error("Failed to save property:", err);
    }
    setEditProperty(null);
  };

  const openEditModal = (prop: any) => {
    setEditProperty(prop);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditProperty(null);
    setIsModalOpen(true);
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm("Are you sure you want to delete this property?")) {
      try {
        const response = await api.delete(`/properties/${id}`);
        if (response.success) {
          fetchProperties();
        }
      } catch (err) {
        console.error("Failed to delete property:", err);
      }
    }
  };

  return (
    <div className={styles.container}>
      <PropertyModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveProperty} 
        editData={editProperty}
      />
      
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>{user?.role === 'Owner' ? 'My Office Details' : 'Property Master'}</h2>
          <p>{user?.role === 'Owner' ? 'View and monitor your assigned office details, spatial profiles, and active units.' : 'Manage and monitor global real estate assets at scale.'}</p>
        </div>
        <div className={styles.controls}>
          {(!user || user.role === 'Admin') && (
            <>
              <button className="btn btn-outline-light border text-dark d-flex align-items-center gap-2">
                <i className="bi bi-map"></i> Map View
              </button>
              <button 
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={openAddModal}
              >
                <i className="bi bi-plus-lg"></i> Add Property
              </button>
            </>
          )}
        </div>
      </div>

      {user?.role === 'Owner' ? (
        <div className="row g-4 mt-2">
          {/* Card 1: Office Profile Details */}
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 rounded-2xl h-100" style={{ background: '#ffffff', padding: '2rem' }}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="bg-emerald bg-opacity-10 text-emerald rounded-2xl d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: '#e6f4ea', color: '#137333' }}>
                  <i className="bi bi-briefcase-fill" style={{ fontSize: '1.8rem' }}></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-1 text-dark">{ownerProfile?.ownerName || 'Elite Business Hub'}</h4>
                  <span className="badge rounded-pill px-3 py-1 fw-bold text-success" style={{ backgroundColor: '#e6f4ea', fontSize: '0.75rem' }}>Active Office Profile</span>
                </div>
              </div>

              <hr className="my-4 opacity-10" />

              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center py-1">
                  <span className="text-muted small fw-bold">Contact Person</span>
                  <span className="fw-bold text-dark">{ownerProfile?.contactPerson || 'Vijay CM'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-1">
                  <span className="text-muted small fw-bold">Designation</span>
                  <span className="fw-bold text-dark">{ownerProfile?.designation || 'Director'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-1">
                  <span className="text-muted small fw-bold">Email Address</span>
                  <span className="fw-bold text-dark">{ownerProfile?.emailId || 'contact@elitehub.com'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center py-1">
                  <span className="text-muted small fw-bold">Phone Number</span>
                  <span className="fw-bold text-dark">{ownerProfile?.contactNumber || 'N/A'}</span>
                </div>
                {ownerProfile?.gstNumber && (
                  <div className="d-flex justify-content-between align-items-center py-1">
                    <span className="text-muted small fw-bold">GST Registration</span>
                    <span className="fw-bold text-dark">{ownerProfile.gstNumber}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center py-1">
                  <span className="text-muted small fw-bold">Office Type</span>
                  <span className="fw-bold text-dark">{ownerProfile?.ownerType || 'Company'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Assigned Buildings & Units */}
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 rounded-2xl h-100" style={{ background: '#ffffff', padding: '2rem' }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-dark">
                <i className="bi bi-building text-success"></i>
                Assigned Office Units
              </h5>

              <div className="d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: '350px' }}>
                {ownerProfile?.unitsAssigned && ownerProfile.unitsAssigned.length > 0 ? (
                  ownerProfile.unitsAssigned.map((unit: any) => (
                    <div key={unit._id} className="p-3 border rounded-xl d-flex align-items-center justify-content-between bg-light bg-opacity-50" style={{ borderRadius: '12px' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 text-primary rounded-xl d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', backgroundColor: '#e8f0fe', color: '#1a73e8' }}>
                          <i className="bi bi-door-open-fill" style={{ fontSize: '1.2rem' }}></i>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-1 text-dark">Unit {unit.unitNumber}</h6>
                          <p className="text-muted small mb-0">{unit.property?.propertyName || 'Skyline Office Tower'}</p>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="badge rounded-pill px-3 py-1 small fw-bold mb-1 d-inline-block text-primary" style={{ backgroundColor: '#e8f0fe', fontSize: '0.75rem' }}>Floor {unit.floorNumber}</span>
                        <p className="text-muted small mb-0 fw-bold">{unit.sqft ? Math.round(Number(unit.sqft)).toLocaleString() : 'N/A'} Sq. Ft.</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-building-dash d-block mb-2" style={{ fontSize: '2rem' }}></i>
                    <span className="small">No active units assigned to your profile.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.search}>
              <i className={`bi bi-search ${styles.searchIcon}`}></i>
              <input type="text" placeholder="Search by name, ID, or location..." />
            </div>
            <div className="d-flex gap-2">
              <select className="form-select border-0 bg-light rounded-pill px-4" style={{ width: '160px' }}>
                <option>All Regions</option>
                <option>APAC</option>
                <option>EMEA</option>
                <option>US</option>
              </select>
              <select className="form-select border-0 bg-light rounded-pill px-4" style={{ width: '160px' }}>
                <option>All Types</option>
                <option>IT Park</option>
                <option>Commercial</option>
                <option>Mall</option>
              </select>
            </div>
          </div>

          {/* Property Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Property Details</th>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Region</th>
                  <th className={styles.th}>Structure</th>
                  <th className={styles.th}>Total Units</th>
                  <th className={styles.th}>Occupancy</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {properties.length > 0 ? (
                  properties.map((prop) => (
                    <tr key={prop._id} className={styles.tr}>
                      <td className={styles.td}>
                        <Link href={`/admin/properties/${prop._id}`} className="text-decoration-none d-block">
                          <div className={styles.propCell}>
                            <div className={styles.propIcon}>
                              <i className={`bi ${prop.icon || 'bi-building'}`}></i>
                            </div>
                            <div className={styles.propInfo}>
                              <h6>{prop.propertyName}</h6>
                              <p>{prop.location || prop.ownerAddress}</p>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className={styles.td}><span className="badge bg-light text-dark border rounded-pill px-3 py-2 fw-normal">{prop.propertyType || 'N/A'}</span></td>
                      <td className={styles.td}><span className="fw-bold text-muted small">{prop.region || 'N/A'}</span></td>
                      <td className={styles.td}>
                        <div className="d-flex flex-column">
                          <span className="fw-bold" style={{ fontSize: '0.85rem' }}>{prop.totalFloors || 0} Floors</span>
                        </div>
                      </td>
                      <td className={styles.td}><span className="fw-bold">{prop.totalUnits || 0}</span></td>
                      <td className={styles.td}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '4px', width: '60px', backgroundColor: '#e2e8f0' }}>
                            <div className="progress-bar bg-primary" style={{ width: `${prop.occupancy || 0}%`, backgroundColor: '#10B981 !important' }}></div>
                          </div>
                          <span className="fw-bold" style={{ fontSize: '0.75rem' }}>{prop.occupancy || 0}%</span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.statusBadge} bg-${prop.status === 'Active' ? 'success' : 'warning'} bg-opacity-10 text-${prop.status === 'Active' ? 'success' : 'warning'}`}>
                          {prop.status}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className="d-flex gap-1 justify-content-end">
                          <div className="dropdown">
                            <button className={styles.actionBtn} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                              <i className="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-xl p-2">
                              <li>
                                <Link className="dropdown-item rounded-lg py-2 small" href={`/admin/properties/${prop._id}`}>
                                  <i className="bi bi-eye me-2"></i>View Details
                                </Link>
                              </li>
                              {(!user || user.role === 'Admin') && (
                                <>
                                  <li>
                                    <button className="dropdown-item rounded-lg py-2 small" onClick={() => openEditModal(prop)}>
                                      <i className="bi bi-pencil me-2"></i>Edit Property
                                    </button>
                                  </li>
                                  <li><hr className="dropdown-divider opacity-10" /></li>
                                  <li>
                                    <button className="dropdown-item rounded-lg py-2 small text-danger" onClick={() => handleDeleteProperty(prop._id)}>
                                      <i className="bi bi-trash me-2"></i>Delete Property
                                    </button>
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="d-flex flex-column align-items-center gap-3 py-4">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                          <i className="bi bi-building-dash text-muted" style={{ fontSize: '2.5rem' }}></i>
                        </div>
                        <div className="text-center">
                          <h5 className="fw-bold mb-1">No Properties Found</h5>
                          <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>
                            Your property portfolio is currently empty.
                          </p>
                        </div>
                        {(!user || user.role === 'Admin') && (
                          <button className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold" onClick={openAddModal}>
                            <i className="bi bi-plus-lg me-2"></i>Register Property
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-emerald" role="status">
          <span className="visually-hidden">Loading Properties...</span>
        </div>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}
