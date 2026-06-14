"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/utils/api";
import PropertyModal from "@/components/dashboard/PropertyModal";

export default function PropertyDetailClient({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<any>(null);
  const [floors, setFloors] = useState<any[]>([]);
  const [activeTowerIdx, setActiveTowerIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPropertyAndFloors = async () => {
    setIsLoading(true);
    try {
      const [propRes, floorRes] = await Promise.all([
        api.get(`/properties/${propertyId}`),
        api.get(`/floors?property=${propertyId}&limit=100`)
      ]);

      if (propRes.success) {
        setProperty(propRes.data);
      }

      if (floorRes.success && floorRes.data && floorRes.data.length > 0) {
        const sortedFloors = [...floorRes.data].sort((a, b) => {
          const numA = parseInt(a.floorNumber) || 0;
          const numB = parseInt(b.floorNumber) || 0;
          return numB - numA;
        });
        setFloors(sortedFloors);
      } else {
        // Fallback dynamically generated floors
        const totalFloors = propRes.data?.totalFloors || 0;
        const totalSft = propRes.data?.totalSft || 0;
        const estimatedSft = totalFloors > 0 ? Math.round(totalSft / totalFloors) : 0;
        
        const generatedFloors = [];
        for (let i = totalFloors; i >= 1; i--) {
          generatedFloors.push({
            floorNumber: i.toString(),
            floorName: `Floor ${i}`,
            totalSft: estimatedSft
          });
        }
        generatedFloors.push({
          floorNumber: "0",
          floorName: "Ground Floor",
          totalSft: estimatedSft
        });
        setFloors(generatedFloors);
      }
    } catch (err) {
      console.error("Failed to fetch property details or floors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId && propertyId !== "new" && propertyId !== "fallback") {
      fetchPropertyAndFloors();
    } else {
      setIsLoading(false);
    }
  }, [propertyId]);

  const handleSave = async (data: any) => {
    try {
      const r = await api.put(`/properties/${propertyId}`, data);
      if (r.success) {
        fetchPropertyAndFloors();
      }
    } catch (err) {
      console.error(err);
    }
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-primary" style={{ color: "#014aad", width: "3rem", height: "3rem" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Get active tower
  const activeTower = property?.towerConfigs?.[activeTowerIdx];

  // Get floor list based on active tower config or standard list
  const getActiveFloorsList = () => {
    if (activeTower) {
      const estimatedSft = Math.round((activeTower.sft || 0) / (activeTower.floors || 1));
      const generated = [];
      for (let i = activeTower.floors; i >= 1; i--) {
        generated.push({
          floorNumber: i.toString(),
          floorName: `Floor ${i}`,
          totalSft: estimatedSft
        });
      }
      generated.push({
        floorNumber: "0",
        floorName: "Ground Floor",
        totalSft: estimatedSft
      });
      return generated;
    }
    return floors;
  };

  const activeFloors = getActiveFloorsList();

  return (
    <div className="container-fluid p-0">
      {/* Header / Breadcrumbs */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-1">
              <li className="breadcrumb-item">
                <Link href="/admin/properties" className="text-decoration-none text-muted">Property Master</Link>
              </li>
              <li className="breadcrumb-item active fw-semibold text-dark" aria-current="page">
                {property?.propertyName || 'Loading...'}
              </li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            Property Details
          </h2>
        </div>
        <div className="d-flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1" 
            style={{ fontSize: '0.8rem', borderRadius: '6px' }}
          >
            <i className="bi bi-pencil-square"></i> Edit
          </button>
          <Link href="/admin/properties" className="btn btn-outline-secondary btn-sm fw-semibold d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', borderRadius: '6px' }}>
            <i className="bi bi-arrow-left"></i> Back
          </Link>
        </div>
      </div>

      <div className="row g-4 align-items-stretch">
        {/* Left Side: Property Metadata Card */}
        <div className="col-lg-4 col-md-5 col-12">
          <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column">
            {/* Property Image Container */}
            <div className="position-relative overflow-hidden rounded-3 mb-4" style={{ height: 180 }}>
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop"
                alt="Property View" className="w-100 h-100" style={{ objectFit: "cover" }}
              />
              <div
                className="position-absolute bg-white px-3 py-1 shadow-sm d-flex align-items-center gap-2"
                style={{ bottom: 12, right: 12, borderRadius: 20, fontSize: "0.72rem", fontWeight: 700 }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: property?.status === "Active" ? "#10b981" : "#f59e0b", display: "inline-block" }}></span>
                <span className="text-dark">{property?.status || "Active"}</span>
              </div>
            </div>

            {/* Property Name Header */}
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, backgroundColor: '#e8f0fe', color: '#014aad', flexShrink: 0 }}>
                <i className="bi bi-building-fill" style={{ fontSize: '1.2rem' }}></i>
              </div>
              <div className="text-truncate">
                <h5 className="fw-bold mb-0 text-dark text-truncate" style={{ fontSize: '1rem' }}>
                  {property?.propertyName || 'N/A'}
                </h5>
                <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                  {property?.propertyType || 'N/A'} Property
                </div>
              </div>
            </div>

            <hr className="opacity-10" />

            {/* Meta Items List */}
            <div className="d-flex flex-column">
              {[
                { label: "Total Area", value: `${property?.totalSft?.toLocaleString() || 0} SFT`, icon: "bi-aspect-ratio" },
                { label: "Number of Towers", value: `${property?.towers || 1} Tower(s)`, icon: "bi-building" },
                { label: "Total Floors", value: `${property?.totalFloors || 0} Floors`, icon: "bi-layers" },
                { label: "Operating Hours", value: `${property?.openingTime || '09:00'} - ${property?.closingTime || '18:00'}`, icon: "bi-clock" },
                { label: "Location / Address", value: property?.propertyAddress || property?.location || 'N/A', icon: "bi-geo-alt" }
              ].map((item, idx, arr) => (
                <div
                  key={idx}
                  className="d-flex justify-content-between align-items-center py-2"
                  style={{ borderBottom: idx === arr.length - 1 ? "none" : "1px solid #f1f5f9" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: 28, height: 28, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 6, color: '#014aad' }}
                    >
                      <i className={`bi ${item.icon}`} style={{ fontSize: "0.85rem" }}></i>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <span className="fw-bold text-dark text-end" style={{ fontSize: '0.82rem', maxWidth: '55%' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Floor Details Card */}
        <div className="col-lg-8 col-md-7 col-12">
          <div className="bg-white border rounded-4 p-4 h-100 d-flex flex-column" style={{ minHeight: 560 }}>
            {/* Header section wrapper */}
            <div className="d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
              {/* Header Title with Total Area Badge */}
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 flex-shrink-0">
                <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-building text-primary" style={{ color: '#014aad', fontSize: "1.4rem" }}></i>
                  Floor Details
                </h5>
                <span className="badge bg-light text-dark border px-3 py-2 fw-bold" style={{ fontSize: '0.75rem', borderRadius: '6px' }}>
                  Total Area: {property?.totalSft?.toLocaleString() || 0} SFT
                </span>
              </div>

              {/* Tower Tabs selector (Visible only if multiple towers are configured) */}
              {property?.towerConfigs && property.towerConfigs.length > 1 && (
                <div className="d-flex gap-2 mb-3 flex-shrink-0">
                  {property.towerConfigs.map((tower: any, idx: number) => (
                    <button
                      key={idx}
                      className={`btn btn-sm rounded-pill px-3 fw-bold`}
                      onClick={() => setActiveTowerIdx(idx)}
                      style={{ 
                        fontSize: '0.75rem', 
                        backgroundColor: activeTowerIdx === idx ? '#014aad' : '#ffffff', 
                        color: activeTowerIdx === idx ? '#ffffff' : '#64748b',
                        border: activeTowerIdx === idx ? 'none' : '1px solid #e2e8f0'
                      }}
                    >
                      {tower.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Floor Details Table Header */}
              <div className="d-flex align-items-center bg-light bg-opacity-50 px-3 py-2 mb-2 flex-shrink-0" style={{ borderRadius: 8 }}>
                <div className="fw-bold text-muted text-uppercase" style={{ flex: 1, fontSize: '0.7rem', letterSpacing: '0.05em' }}>Floor Name</div>
                <div className="fw-bold text-muted text-uppercase text-center" style={{ width: '120px', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Floor Number</div>
                <div className="fw-bold text-muted text-uppercase text-end" style={{ width: '120px', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Area (SFT)</div>
              </div>

              {/* Scrollable Floor Rows Wrapper depending on card box height */}
              <div className="position-relative flex-grow-1 mb-3" style={{ minHeight: "200px" }}>
                <div className="position-absolute w-100 h-100 overflow-auto pe-1">
                  <div className="d-flex flex-column">
                    {activeFloors.map((floor: any, idx: number) => (
                      <div key={idx} className="d-flex align-items-center py-2 px-3 border-bottom border-light">
                        <div className="d-flex align-items-center gap-3" style={{ flex: 1 }}>
                          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: '#e8f0fe', color: '#014aad' }}>
                            <i className="bi bi-layers" style={{ fontSize: '0.9rem' }}></i>
                          </div>
                          <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{floor.floorName}</span>
                        </div>
                        <div className="text-center text-secondary fw-semibold" style={{ width: '120px', fontSize: '0.85rem' }}>
                          {floor.floorNumber}
                        </div>
                        <div className="text-end text-dark fw-bold" style={{ width: '120px', fontSize: '0.85rem' }}>
                          {floor.totalSft ? floor.totalSft.toLocaleString() : 0} SFT
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Summary Cards */}
            <div className="row g-3 flex-shrink-0">
              {[
                { label: "Total Floors", value: `${activeTower ? activeTower.floors : (property?.totalFloors || 0)} Floors`, icon: "bi-file-earmark-text" },
                { label: "Total Area", value: `${activeTower ? activeTower.sft?.toLocaleString() : (property?.totalSft?.toLocaleString() || 0)} SFT`, icon: "bi-aspect-ratio" },
                { label: "Occupied SFT", value: `${property?.occupiedSft?.toLocaleString() || 0} SFT`, icon: "bi-building-fill" },
                { label: "Available SFT", value: `${((property?.totalSft||0)-(property?.occupiedSft||0)).toLocaleString()} SFT`, icon: "bi-check-circle" },
              ].map(card => (
                <div key={card.label} className="col-md-6 col-12">
                  <div className="d-flex align-items-center gap-3 bg-light bg-opacity-50 p-3 border" style={{ borderRadius: 10 }}>
                    <div className="d-flex align-items-center justify-content-center bg-white border" style={{ width: 40, height: 40, borderRadius: 8, color: '#014aad' }}>
                      <i className={`bi ${card.icon}`} style={{ fontSize: '1.1rem' }}></i>
                    </div>
                    <div>
                      <div className="text-muted fw-medium" style={{ fontSize: '0.72rem' }}>{card.label}</div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{card.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PropertyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editData={property}
      />
    </div>
  );
}
