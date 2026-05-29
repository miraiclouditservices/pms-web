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
      if (!user || user.role === 'Admin' || user.role === 'Super Admin') {
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



      {user?.role === 'Owner' ? (
        <>
          <div className="mb-4">
            <h2 className="mb-1 fw-bold fs-4 text-dark">My Office Details</h2>
            <p className="text-muted small mb-0">View and monitor your assigned office details, spatial profiles, and active units.</p>
          </div>
          <div className="row g-4 mt-2">
            {/* Card 1: Office Profile Details */}
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 rounded-2xl h-100" style={{ background: '#ffffff', padding: '2rem' }}>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="bg-emerald bg-opacity-10 text-primary rounded-2xl d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: '#e6f4ea', color: '#137333' }}>
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
        </>
      ) : (
        <>


          {/* Property Table */}
          <div className="table-responsive bg-white  border-2" style={{ borderRadius: '8px', overflow: 'visible', padding: '10px 10px', border: '1px solid #e0e0e0' }}>
            {/* Header & Filter Bar Merged */}
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 pt-0" style={{ position: 'sticky', top: '0', zIndex: 10, backgroundColor: '#ffffff' }}>
              {/* Left: Tab Headers */}
              <div className="d-flex  w-100 position-absolute" style={{ bottom: '0', left: '0', zIndex: -1, borderColor: '#e0e0e0' }}></div>
              <div className="d-flex gap-4">
                <div style={{ paddingBottom: '8px', cursor: 'pointer', marginBottom: '-1px' }}>
                  <span className="fw-bold text-dark" style={{ fontSize: '1rem' }}>Property Master</span>
                </div>
              </div>

              {/* Right: Search Bar, Filters & Add Button */}
              <div className="d-flex gap-3 align-items-center">
                <div className="position-relative" style={{ width: '250px' }}>
                  <input type="text" className="form-control px-3 py-2 " placeholder="Search users" style={{ borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }} />
                  <i className="bi bi-search position-absolute text-muted" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}></i>
                </div>
                <button className="btn bg-white border d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '4px', borderColor: '#e0e0e0' }}>
                  <i className="bi bi-funnel text-dark"></i>
                </button>
                {(!user || user.role === 'Admin' || user.role === 'Super Admin') && (
                  <button
                    className="btn d-flex align-items-center justify-content-center gap-2 shadow-sm px-4"
                    onClick={openAddModal}
                    style={{ backgroundColor: "var(--primary)", color: '#ffffff', fontWeight: '500', borderRadius: '4px', height: '40px', fontSize: '0.85rem', border: 'none' }}
                  >
                    <i className="bi bi-plus-circle"></i> Add New
                  </button>
                )}
              </div>
            </div>

            <table className="table mb-0 border-0" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
              <thead>
                <tr className="border-0">
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '70px', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none', borderTopLeftRadius: '8px' }}>S No</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '70px', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Building/Block</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '70px', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Property Type</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '70px', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Addedby</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '70px', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Property details</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '70px', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Total Sft</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '70px', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Occupied Sft</th>
                  <th className="py-3 px-4 fw-bold text-start" style={{ position: 'sticky', top: '70px', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none' }}>Status</th>
                  <th className="py-3 px-4 fw-bold text-center" style={{ position: 'sticky', top: '70px', zIndex: 9, fontSize: '0.8rem', backgroundColor: '#3f3f3f', color: '#ffffff', border: 'none', borderTopRightRadius: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {properties.length > 0 ? (
                  properties.map((prop, index) => (
                    <tr key={prop._id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td className="py-3 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>
                        {String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="py-3 px-4 align-middle" style={{ border: 'none' }}>
                        <Link href={`/admin/properties/${prop._id}`} className="text-decoration-none d-block">
                          <span style={{ fontSize: '0.85rem', color: '#333' }}>{prop.propertyName}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>{prop.propertyType || 'N/A'}</td>
                      <td className="py-3 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>
                        {prop.createdBy?.name || 'Admin'}
                      </td>
                      <td className="py-3 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>
                        {prop.totalFloors || 0} Floors
                      </td>
                      <td className="py-3 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>
                        {prop.totalSft ? prop.totalSft.toLocaleString() : 0} SFT
                      </td>
                      <td className="py-3 px-4 align-middle" style={{ fontSize: '0.85rem', color: '#555', border: 'none' }}>
                        {prop.occupiedSft ? prop.occupiedSft.toLocaleString() : 0} SFT
                      </td>
                      <td className="py-3 px-4 align-middle" style={{ border: 'none' }}>
                        <span style={{
                          fontSize: '0.8rem',
                          color: prop.status === 'Active' ? '#16a34a' : '#ea580c',
                        }}>
                          {prop.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle text-center" style={{ border: 'none' }}>
                        <div className="d-flex gap-2 justify-content-center align-items-center">
                          <Link href={`/admin/properties/${prop._id}`} className="text-dark">
                            <i className="bi bi-eye-fill" style={{ fontSize: '1.1rem', color: '#4b5563' }}></i>
                          </Link>
                          {(!user || user.role === 'Admin' || user.role === 'Super Admin') && (
                            <button className="btn btn-link text-dark p-0" onClick={() => openEditModal(prop)}>
                              <i className="bi bi-arrow-down-circle-fill" style={{ fontSize: '1.1rem', color: '#4b5563' }}></i>
                            </button>
                          )}
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
                        {(!user || user.role === 'Admin' || user.role === 'Super Admin') && (
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
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Properties...</span>
        </div>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}
