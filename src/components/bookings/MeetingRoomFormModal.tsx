"use client";

import { useState, useEffect, useRef } from "react";

interface MeetingRoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editData?: any;
  mode: "create" | "edit";
  properties: any[];
  floors: any[];
  units: any[];
}

export default function MeetingRoomFormModal({
  isOpen,
  onClose,
  onSave,
  editData,
  mode,
  properties = [],
  floors = [],
  units = []
}: MeetingRoomFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    _id: undefined as string | undefined,
    roomName: "",
    property: "",
    floor: "",
    sqft: 0,
    capacity: 10,
    status: "Available",
    unit: ""
  });

  // Searchable Dropdowns States & Refs
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [propertySearch, setPropertySearch] = useState("");
  const propertyContainerRef = useRef<HTMLDivElement>(null);

  const [showFloorDropdown, setShowFloorDropdown] = useState(false);
  const [floorSearch, setFloorSearch] = useState("");
  const floorContainerRef = useRef<HTMLDivElement>(null);

  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const unitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (propertyContainerRef.current && !propertyContainerRef.current.contains(target)) {
        setShowPropertyDropdown(false);
      }
      if (floorContainerRef.current && !floorContainerRef.current.contains(target)) {
        setShowFloorDropdown(false);
      }
      if (unitContainerRef.current && !unitContainerRef.current.contains(target)) {
        setShowUnitDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      setPropertySearch("");
      setFloorSearch("");
      setUnitSearch("");
      setShowPropertyDropdown(false);
      setShowFloorDropdown(false);
      setShowUnitDropdown(false);

      if (editData && mode === "edit") {
        setFormData({
          _id: editData._id,
          roomName: editData.roomName || "",
          property: editData.property?._id || editData.property || "",
          floor: editData.floor?._id || editData.floor || "",
          sqft: editData.sqft || 0,
          capacity: editData.capacity || 10,
          status: editData.status || "Available",
          unit: editData.unit?._id || editData.unit || ""
        });
      } else {
        const defaultProp = properties[0]?._id || "";
        const defaultFloor = floors.filter(f => (f.property === defaultProp || f.property?._id === defaultProp))[0]?._id || "";

        setFormData({
          _id: undefined,
          roomName: "",
          property: defaultProp,
          floor: defaultFloor,
          sqft: 150,
          capacity: 8,
          status: "Available",
          unit: ""
        });
      }
    }
  }, [editData, isOpen, mode, properties, floors]);

  if (!isOpen) return null;

  const filteredFloors = floors.filter(f => {
    const propId = f.property?._id || f.property || "";
    return propId === formData.property;
  });

  const filteredUnits = units.filter(u => {
    const floorId = u.floor?._id || u.floor || "";
    return floorId === formData.floor;
  });

  const handleUnitChange = (unitId: string) => {
    const selectedUnit = units.find(u => u._id === unitId);
    if (selectedUnit) {
      setFormData({
        ...formData,
        unit: unitId,
        sqft: selectedUnit.sqft || 0,
        roomName: selectedUnit.unitName || `Room ${selectedUnit.unitNumber}`
      });
    } else {
      setFormData({
        ...formData,
        unit: "",
        sqft: 0,
        roomName: ""
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.property || !formData.floor || !formData.roomName || formData.sqft <= 0) {
      setValidationError("Please fill out all required fields with valid values.");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || "Failed to save meeting room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1100, backdropFilter: "blur(6px)" }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 500 }}>
        <div className="modal-content border-0 overflow-hidden" style={{ borderRadius: "10px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          
          {/* Header */}
          <div
            className="d-flex align-items-center justify-content-between px-4 py-3"
            style={{ backgroundColor: "#3a3a3a" }}
          >
            <h5 className="mb-0 text-white fw-semibold" style={{ fontSize: "1rem" }}>
              {mode === "create" ? "Add Meeting Room / Hall" : "Update Room Details"}
            </h5>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "#d1d5db",
                fontSize: "1.4rem", cursor: "pointer", lineHeight: 1,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
              {validationError && (
                <div className="alert alert-danger border-0 rounded-3 mb-4 py-2 small fw-medium">
                  <i className="bi bi-exclamation-triangle-fill me-2" /> {validationError}
                </div>
              )}

              <div className="row g-3">
                {/* Searchable Property Selection */}
                <div className="col-12 position-relative" ref={propertyContainerRef}>
                  <label className="form-label small fw-semibold text-dark mb-1">Select Property *</label>
                  <div
                    className="form-control d-flex justify-content-between align-items-center bg-white"
                    onClick={() => setShowPropertyDropdown(prev => !prev)}
                    style={{ fontSize: "0.85rem", padding: "8px 12px", cursor: "pointer", border: "1px solid #ced4da", borderRadius: "0.375rem", userSelect: "none" }}
                  >
                    <span>
                      {properties.find(p => p._id === formData.property)?.propertyName || "Select Property..."}
                    </span>
                    <i className={`bi bi-chevron-${showPropertyDropdown ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }} />
                  </div>

                  {showPropertyDropdown && (
                    <div
                      className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                      style={{
                        top: "100%", left: 12, right: 12, zIndex: 1050,
                        marginTop: "4px", maxHeight: "280px", display: "flex", flexDirection: "column"
                      }}
                    >
                      <div className="position-relative mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm ps-3"
                          placeholder="Search property..."
                          value={propertySearch}
                          onChange={e => setPropertySearch(e.target.value)}
                          style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                          autoFocus
                        />
                        {propertySearch && (
                          <button
                            type="button"
                            onClick={() => setPropertySearch("")}
                            className="position-absolute border-0 bg-transparent text-muted"
                            style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="overflow-auto flex-grow-1" style={{ maxHeight: "180px" }}>
                        {(() => {
                          const filtered = properties.filter(p =>
                            p.propertyName?.toLowerCase().includes(propertySearch.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return <div className="text-muted text-center py-2 small">No matches found</div>;
                          }
                          return filtered.map(p => (
                            <div
                              key={p._id}
                              onClick={() => {
                                setFormData({ ...formData, property: p._id, floor: "", unit: "" });
                                setShowPropertyDropdown(false);
                                setPropertySearch("");
                              }}
                              className="px-3 py-2 rounded-2 small"
                              style={{
                                cursor: "pointer",
                                backgroundColor: formData.property === p._id ? "#f1f5f9" : "transparent",
                                color: formData.property === p._id ? "#014aad" : "#334155",
                                fontWeight: formData.property === p._id ? 600 : 400,
                              }}
                              onMouseEnter={e => {
                                if (formData.property !== p._id) {
                                  e.currentTarget.style.backgroundColor = "#f8fafc";
                                  e.currentTarget.style.color = "#000";
                                }
                              }}
                              onMouseLeave={e => {
                                if (formData.property !== p._id) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                  e.currentTarget.style.color = "#334155";
                                }
                              }}
                            >
                              {p.propertyName}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Searchable Floor Selection */}
                <div className="col-12 position-relative" ref={floorContainerRef}>
                  <label className="form-label small fw-semibold text-dark mb-1">Select Floor Level *</label>
                  <div
                    className={`form-control d-flex justify-content-between align-items-center ${!formData.property ? "bg-white text-muted" : "bg-white"}`}
                    onClick={() => {
                      if (formData.property) {
                        setShowFloorDropdown(prev => !prev);
                      }
                    }}
                    style={{
                      fontSize: "0.85rem", padding: "8px 12px",
                      cursor: formData.property ? "pointer" : "not-allowed",
                      border: "1px solid #ced4da", borderRadius: "0.375rem", userSelect: "none"
                    }}
                  >
                    <span>
                      {(() => {
                        if (!formData.property) return "Select Property first";
                        const floorObj = filteredFloors.find(f => f._id === formData.floor);
                        return floorObj ? (floorObj.floorName || `Floor ${floorObj.floorNumber}`) : "Select Floor...";
                      })()}
                    </span>
                    <i className={`bi bi-chevron-${showFloorDropdown ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }} />
                  </div>

                  {showFloorDropdown && formData.property && (
                    <div
                      className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                      style={{
                        top: "100%", left: 12, right: 12, zIndex: 1050,
                        marginTop: "4px", maxHeight: "280px", display: "flex", flexDirection: "column"
                      }}
                    >
                      <div className="position-relative mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm ps-3"
                          placeholder="Search floor..."
                          value={floorSearch}
                          onChange={e => setFloorSearch(e.target.value)}
                          style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                          autoFocus
                        />
                        {floorSearch && (
                          <button
                            type="button"
                            onClick={() => setFloorSearch("")}
                            className="position-absolute border-0 bg-transparent text-muted"
                            style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="overflow-auto flex-grow-1" style={{ maxHeight: "180px" }}>
                        {(() => {
                          const filtered = filteredFloors.filter(f =>
                            (f.floorName || `Floor ${f.floorNumber}`).toLowerCase().includes(floorSearch.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return <div className="text-muted text-center py-2 small">No matches found</div>;
                          }
                          return filtered.map(f => (
                            <div
                              key={f._id}
                              onClick={() => {
                                setFormData({ ...formData, floor: f._id, unit: "" });
                                setShowFloorDropdown(false);
                                setFloorSearch("");
                              }}
                              className="px-3 py-2 rounded-2 small"
                              style={{
                                cursor: "pointer",
                                backgroundColor: formData.floor === f._id ? "#f1f5f9" : "transparent",
                                color: formData.floor === f._id ? "#014aad" : "#334155",
                                fontWeight: formData.floor === f._id ? 600 : 400,
                              }}
                              onMouseEnter={e => {
                                if (formData.floor !== f._id) {
                                  e.currentTarget.style.backgroundColor = "#f8fafc";
                                  e.currentTarget.style.color = "#000";
                                }
                              }}
                              onMouseLeave={e => {
                                if (formData.floor !== f._id) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                  e.currentTarget.style.color = "#334155";
                                }
                              }}
                            >
                              {f.floorName || `Floor ${f.floorNumber}`}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Searchable Unit Mapping */}
                <div className="col-12 position-relative" ref={unitContainerRef}>
                  <label className="form-label small fw-semibold text-dark mb-1">Convert Floor Unit (Optional)</label>
                  <div
                    className={`form-control d-flex justify-content-between align-items-center ${!formData.floor ? "bg-white text-muted" : "bg-white"}`}
                    onClick={() => {
                      if (formData.floor) {
                        setShowUnitDropdown(prev => !prev);
                      }
                    }}
                    style={{
                      fontSize: "0.85rem", padding: "8px 12px",
                      cursor: formData.floor ? "pointer" : "not-allowed",
                      border: "1px solid #ced4da", borderRadius: "0.375rem", userSelect: "none"
                    }}
                  >
                    <span>
                      {(() => {
                        if (!formData.floor) return "Select Floor level first";
                        const unitObj = filteredUnits.find(u => u._id === formData.unit);
                        return unitObj ? `${unitObj.unitNumber} ${unitObj.unitName ? `- ${unitObj.unitName}` : ""} (${unitObj.sqft} SFT)` : "-- Standalone Meeting Room (No Unit Link) --";
                      })()}
                    </span>
                    <i className={`bi bi-chevron-${showUnitDropdown ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }} />
                  </div>

                  {showUnitDropdown && formData.floor && (
                    <div
                      className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                      style={{
                        top: "100%", left: 12, right: 12, zIndex: 1050,
                        marginTop: "4px", maxHeight: "280px", display: "flex", flexDirection: "column"
                      }}
                    >
                      <div className="position-relative mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm ps-3"
                          placeholder="Search floor unit..."
                          value={unitSearch}
                          onChange={e => setUnitSearch(e.target.value)}
                          style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                          autoFocus
                        />
                        {unitSearch && (
                          <button
                            type="button"
                            onClick={() => setUnitSearch("")}
                            className="position-absolute border-0 bg-transparent text-muted"
                            style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="overflow-auto flex-grow-1" style={{ maxHeight: "180px" }}>
                        <div
                          onClick={() => {
                            setFormData({ ...formData, unit: "", sqft: 0, roomName: "" });
                            setShowUnitDropdown(false);
                            setUnitSearch("");
                          }}
                          className="px-3 py-2 rounded-2 small text-secondary"
                          style={{ cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          -- Standalone Meeting Room (No Unit Link) --
                        </div>
                        {(() => {
                          const filtered = filteredUnits.filter(u =>
                            String(u.unitNumber).toLowerCase().includes(unitSearch.toLowerCase()) ||
                            (u.unitName || "").toLowerCase().includes(unitSearch.toLowerCase())
                          );
                          return filtered.map(u => (
                            <div
                              key={u._id}
                              onClick={() => {
                                handleUnitChange(u._id);
                                setShowUnitDropdown(false);
                                setUnitSearch("");
                              }}
                              className="px-3 py-2 rounded-2 small"
                              style={{
                                cursor: "pointer",
                                backgroundColor: formData.unit === u._id ? "#f1f5f9" : "transparent",
                                color: formData.unit === u._id ? "#014aad" : "#334155",
                                fontWeight: formData.unit === u._id ? 600 : 400,
                              }}
                              onMouseEnter={e => {
                                if (formData.unit !== u._id) {
                                  e.currentTarget.style.backgroundColor = "#f8fafc";
                                  e.currentTarget.style.color = "#000";
                                }
                              }}
                              onMouseLeave={e => {
                                if (formData.unit !== u._id) {
                                  e.currentTarget.style.backgroundColor = "transparent";
                                  e.currentTarget.style.color = "#334155";
                                }
                              }}
                            >
                              {u.unitNumber} {u.unitName ? `- ${u.unitName}` : ""} ({u.sqft} SFT)
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Room Name */}
                <div className="col-12">
                  <label className="form-label small fw-semibold text-dark mb-1">Room / Hall Name *</label>
                  <input
                    type="text"
                    className="form-control bg-white"
                    style={{ fontSize: "0.85rem", padding: "8px 12px", border: "1px solid #ced4da", borderRadius: "0.375rem" }}
                    required
                    placeholder="e.g. Executive Boardroom, Alpha Studio"
                    value={formData.roomName}
                    onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                  />
                </div>

                {/* SFT Size */}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark mb-1">Room Size (SFT) *</label>
                  <input
                    type="number"
                    className="form-control bg-white"
                    style={{ fontSize: "0.85rem", padding: "8px 12px", border: "1px solid #ced4da", borderRadius: "0.375rem" }}
                    required
                    disabled={!!formData.unit}
                    min={1}
                    value={formData.sqft}
                    onChange={(e) => setFormData({ ...formData, sqft: Number(e.target.value) })}
                  />
                </div>

                {/* Capacity */}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark mb-1">Max Capacity (Pax) *</label>
                  <input
                    type="number"
                    className="form-control bg-white"
                    style={{ fontSize: "0.85rem", padding: "8px 12px", border: "1px solid #ced4da", borderRadius: "0.375rem" }}
                    required
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  />
                </div>

                {/* Maintenance Status */}
                <div className="col-12">
                  <label className="form-label small fw-semibold text-dark mb-1">Maintenance Status</label>
                  <select
                    className="form-select bg-white"
                    style={{ fontSize: "0.85rem", padding: "8px 12px", border: "1px solid #ced4da", borderRadius: "0.375rem" }}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-light border-top d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3 fw-bold rounded-3"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm px-3 fw-bold text-white shadow-sm border-0 rounded-3"
                style={{ backgroundColor: "#014aad" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" style={{ width: "0.8rem", height: "0.8rem" }} />
                    Saving...
                  </>
                ) : (
                  "Save Space"
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
