"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import UnitModal from "@/components/dashboard/UnitModal";
import { api } from "@/utils/api";

export default function PropertyDetailClient({ propertyId }: { propertyId: string }) {
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPropertyAndUnits = async () => {
    setIsLoading(true);
    try {
      const [propRes, unitRes] = await Promise.all([
        api.get(`/properties/${propertyId}`),
        api.get(`/units?property=${propertyId}`)
      ]);

      if (propRes.success) setProperty(propRes.data);
      if (unitRes.success) setUnits(unitRes.data);
    } catch (err) {
      console.error("Failed to fetch property details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId && propertyId !== "fallback") {
      fetchPropertyAndUnits();
    }
  }, [propertyId]);

  // Group units by floor
  const getFloorData = () => {
    if (!property) return [];
    
    const floors = [];
    // Start from top floor down to 0 (or basement)
    for (let i = property.totalFloors || 0; i >= 0; i--) {
      const floorUnits = units.filter(u => u.floorNumber === i.toString() || u.floorNumber === `Floor ${i}`);
      floors.push({
        id: `f${i}`,
        level: i,
        name: i === 0 ? "Ground Floor" : `Floor ${i}`,
        units: floorUnits.map(u => ({
          id: u.unitNumber,
          status: u.unitStatus,
          type: u.unitType || 'Standard',
          owner: u.ownerName || ''
        }))
      });
    }
    return floors;
  };

  const floorData = getFloorData();

  const handleSaveUnit = async (unitData: any) => {
    try {
        let response;
        if (selectedUnit && selectedUnit._id) {
            // Update existing
            response = await api.put(`/units/${selectedUnit._id}`, {
                ...unitData,
                property: propertyId,
                floorNumber: selectedFloor.replace('Floor ', '').replace('Level ', '').replace('LEVEL ', '')
            });
        } else {
            // Create new
            response = await api.post('/units', {
                ...unitData,
                property: propertyId,
                floorNumber: selectedFloor.replace('Floor ', '').replace('Level ', '').replace('LEVEL ', '')
            });
        }

        if (response.success) {
            fetchPropertyAndUnits();
            setSelectedUnit(null);
        }
    } catch (err) {
        console.error("Failed to save unit:", err);
    }
  };

  return (
    <div className="container-fluid p-0">
      <UnitModal
        isOpen={isUnitModalOpen}
        onClose={() => {
            setIsUnitModalOpen(false);
            setSelectedUnit(null);
        }}
        onSave={handleSaveUnit}
        floorLevel={selectedFloor}
        editData={selectedUnit}
      />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-1">
              <li className="breadcrumb-item"><Link href="/admin/properties" className="text-decoration-none text-muted">Properties</Link></li>
              <li className="breadcrumb-item active" aria-current="page">{property?.propertyName || 'Loading...'}</li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0" style={{ letterSpacing: '-0.02em', fontSize: '1.5rem' }}>Floors & Units Management</h2>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-download me-1"></i> Export Layout
          </button>
          <button className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold" style={{ fontSize: '0.75rem', backgroundColor: '#014aad', border: 'none' }}>
            <i className="bi bi-gear-fill me-1"></i> Property Settings
          </button>
        </div>
      </div>

      {/* Property Occupancy Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white rounded-xl shadow-sm border p-3">
            <h6 className="text-muted small fw-bold mb-1">Total Area</h6>
            <h3 className="fw-bold text-dark mb-0">{property?.totalSft?.toLocaleString() || 0} <span className="fs-6 text-muted fw-normal">SFT</span></h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-emerald bg-opacity-10 rounded-xl shadow-sm border border-emerald border-opacity-25 p-3">
            <h6 className="text-primary small fw-bold mb-1">Occupied Area</h6>
            <h3 className="fw-bold text-primary mb-0">{property?.occupiedSft?.toLocaleString() || 0} <span className="fs-6 opacity-75 fw-normal">SFT</span></h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white rounded-xl shadow-sm border p-3">
            <h6 className="text-muted small fw-bold mb-1">Available Area</h6>
            <h3 className="fw-bold text-dark mb-0">{property?.availableSft?.toLocaleString() || 0} <span className="fs-6 text-muted fw-normal">SFT</span></h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-primary bg-opacity-10 rounded-xl shadow-sm border border-primary border-opacity-25 p-3">
            <h6 className="text-primary small fw-bold mb-1">Occupancy</h6>
            <h3 className="fw-bold text-primary mb-0">{property?.occupancyPercentage || 0}%</h3>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ background: 'linear-gradient(to right, #ffffff, #f8fafc)' }}>
        <div className="d-flex gap-4 align-items-center">
            <div className="small fw-bold text-muted text-uppercase me-2" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Occupancy Status:</div>
            <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-circle p-1" style={{ width: '10px', height: '10px', backgroundColor: '#014aad', boxShadow: '0 0 8px rgba(1, 74, 173, 0.4)' }}></span>
            <span className="fw-bold" style={{ fontSize: '0.75rem', color: '#334155' }}>Occupied</span>
            </div>
            <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-circle p-1" style={{ width: '10px', height: '10px', backgroundColor: '#CBD5E1' }}></span>
            <span className="fw-bold" style={{ fontSize: '0.75rem', color: '#334155' }}>Vacant</span>
            </div>
            <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-circle p-1" style={{ width: '10px', height: '10px', backgroundColor: '#3B82F6' }}></span>
            <span className="fw-bold" style={{ fontSize: '0.75rem', color: '#334155' }}>Reserved</span>
            </div>
        </div>
        <div className="d-flex gap-4 align-items-center border-start ps-4">
            <div className="small fw-bold text-muted text-uppercase me-2" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Unit Types:</div>
            <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.7rem' }}>
                <i className="bi bi-briefcase-fill"></i> Office
            </div>
            <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.7rem' }}>
                <i className="bi bi-cpu-fill"></i> IT / Tech
            </div>
            <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.7rem' }}>
                <i className="bi bi-shop"></i> Retail
            </div>
        </div>
      </div>

      {/* Floors List */}
      <div className="d-flex flex-column gap-4">
        {floorData.map((floor) => (
          <div key={floor.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 bg-light border-bottom d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-dark text-white rounded px-2 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>
                  LEVEL {floor.level}
                </div>
                <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{floor.name}</h6>
                <span className="badge bg-white text-muted border rounded-pill fw-normal" style={{ fontSize: '0.65rem' }}>
                  {floor.units.length} Units Defined
                </span>
              </div>
              <button
                className="btn btn-link text-primary p-0 fw-bold text-decoration-none"
                onClick={() => {
                  setSelectedFloor(floor.name);
                  setIsUnitModalOpen(true);
                }}
                style={{ fontSize: '0.75rem', color: '#014aad' }}
              >
                <i className="bi bi-plus-lg me-1"></i> Add Units
              </button>
            </div>

            <div className="p-4">
              <div className="row g-3">
                {floor.units.map((unit, idx) => (
                  <div key={idx} className="col-lg-2 col-md-3 col-sm-4 col-6">
                    <div 
                      className={`p-3 rounded-xl border shadow-sm h-100 transition-all unit-card ${unit.status === 'Occupied' ? 'bg-white border-success' : 'bg-light border-transparent'}`} 
                      style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                      onClick={() => {
                          const fullUnit = units.find(u => u.unitNumber === unit.id);
                          setSelectedUnit(fullUnit);
                          setSelectedFloor(floor.name);
                          setIsUnitModalOpen(true);
                      }}
                    >
                      {unit.status === 'Occupied' && <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', background: 'linear-gradient(135deg, transparent 50%, #014aad 50%)', opacity: 0.1 }}></div>}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="fw-bold text-dark" style={{ fontSize: '1rem', letterSpacing: '-0.02em' }}>{unit.id}</span>
                        <div className="d-flex gap-2 align-items-center">
                            <div className={`rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '24px', height: '24px', backgroundColor: unit.status === 'Occupied' ? '#014aad15' : '#e2e8f0' }}>
                                <i className={`bi ${unit.type === 'IT' ? 'bi-cpu-fill' : unit.type === 'Retail' ? 'bi-shop' : 'bi-briefcase-fill'} ${unit.status === 'Occupied' ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <button className="btn btn-link p-0 text-muted shadow-none">
                                <i className="bi bi-three-dots-vertical" style={{ fontSize: '0.8rem' }}></i>
                            </button>
                        </div>
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <div className="fw-bold text-muted text-uppercase" style={{ fontSize: '0.55rem', letterSpacing: '0.05em' }}>{unit.type} Space</div>
                        {unit.owner ? (
                            <div className="text-truncate fw-bold text-dark mt-1" title={unit.owner} style={{ fontSize: '0.75rem' }}>
                                {unit.owner}
                            </div>
                        ) : (
                            <div className="text-muted italic" style={{ fontSize: '0.7rem' }}>Vacant Position</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Unit Placeholder */}
                <div className="col-md-2 col-sm-4 col-6">
                  <div
                    className="p-3 rounded-lg border border-dashed d-flex flex-column align-items-center justify-content-center text-muted h-100"
                    style={{ minHeight: '80px', cursor: 'pointer', backgroundColor: '#fafafa' }}
                    onClick={() => {
                      setSelectedFloor(floor.name);
                      setIsUnitModalOpen(true);
                    }}
                  >
                    <i className="bi bi-plus-circle mb-1" style={{ fontSize: '1.2rem' }}></i>
                    <span className="fw-bold" style={{ fontSize: '0.6rem' }}>ADD UNIT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .bg-success-light { background-color: rgba(1, 74, 173, 0.05); }
        .bg-warning-light { background-color: rgba(245, 158, 11, 0.05); }
        .bg-info-light { background-color: rgba(59, 130, 246, 0.05); }
        .bg-danger-light { background-color: rgba(239, 68, 68, 0.05); }
        .border-success { border-color: #014aad !important; }
        .border-warning { border-color: #F59E0B !important; }
        .border-info { border-color: #3B82F6 !important; }
        .border-danger { border-color: #EF4444 !important; }
        .unit-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .rounded-xl { border-radius: 1rem !important; }
        .rounded-lg { border-radius: 0.75rem !important; }
      `}</style>
    </div>
  );
}
