"use client";
import React, { useState, useEffect, useRef } from "react";
import { api } from "@/utils/api";

const ASSET_CATEGORIES = [
  "HVAC Systems",
  "Electrical Systems",
  "Power Backup Systems",
  "Security Systems",
  "Fire & Safety Equipment",
  "Plumbing & Water Systems",
  "Elevator & Escalator Systems",
  "Building Infrastructure",
  "Furniture & Fixtures",
  "IT & Networking Equipment",
  "CCTV & Surveillance",
  "Access Control Systems",
  "Kitchen Equipment",
  "Laundry Equipment",
  "Cleaning Equipment",
  "Gardening & Landscaping",
  "Energy Management Systems",
  "Solar & Renewable Energy",
  "Generator & UPS",
  "Transformer & Electrical Panels",
  "Lighting Systems",
  "Parking & Vehicle Equipment",
  "EV Charging Systems",
  "Office Equipment",
  "Communication Equipment",
  "Medical & Emergency Equipment",
  "Safety Equipment",
  "Water Treatment Systems",
  "Waste Management Equipment",
  "Swimming Pool Equipment",
  "Gym & Fitness Equipment",
  "Recreation Equipment",
  "Construction Equipment",
  "Tools & Machinery",
  "Kitchen Appliances",
  "Home Appliances",
  "Tenant Provided Assets",
  "Rental Assets",
  "Lease Assets",
  "Miscellaneous / Others"
];

interface AssetFormModalProps {
  mode: "create" | "edit";
  editData?: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

function buildForm(data?: any) {
  const formatDate = (date: any) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  return {
    _id: data?._id || undefined,
    assetCode: data?.assetCode || "",
    assetDescription: data?.assetDescription || "",
    category: data?.category || "Miscellaneous / Others",
    property: typeof data?.property === "object" ? data.property?._id : data?.property || "",
    unit: typeof data?.unit === "object" ? data.unit?._id : data?.unit || "",
    floorNumber: data?.floorNumber !== undefined ? String(data.floorNumber) : "",
    assetLocation: data?.assetLocation || "",
    serialNumber: data?.serialNumber || "",
    makeBrand: data?.makeBrand || data?.make || "",
    purchaseDate: formatDate(data?.purchaseDate),
    purchaseValue: data?.purchaseValue !== undefined ? String(data.purchaseValue) : "",
    warrantyStartDate: formatDate(data?.warrantyStartDate),
    warrantyEndDate: formatDate(data?.warrantyEndDate),
    amcStartDate: formatDate(data?.amcStartDate),
    amcEndDate: formatDate(data?.amcEndDate),
    vendor: typeof data?.vendor === "object" ? data.vendor?._id : data?.vendor || "",
    vendorName: data?.vendorName || "",
    contactName: data?.contactName || "",
    contactNumber: data?.contactNumber || "",
    assetStatus: data?.assetStatus || "Active",
  };
}

export default function AssetFormModal({
  mode,
  editData,
  onSubmit,
  onClose,
  isSubmitting = false,
}: AssetFormModalProps) {
  const [formData, setFormData] = useState(() => buildForm(editData));
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Searchable Dropdowns State & Refs
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [propertySearch, setPropertySearch] = useState("");
  const propertyContainerRef = useRef<HTMLDivElement>(null);

  const [showFloorDropdown, setShowFloorDropdown] = useState(false);
  const [floorSearch, setFloorSearch] = useState("");
  const floorContainerRef = useRef<HTMLDivElement>(null);

  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const unitContainerRef = useRef<HTMLDivElement>(null);

  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const vendorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(target)) {
        setShowCategoryDropdown(false);
      }
      if (propertyContainerRef.current && !propertyContainerRef.current.contains(target)) {
        setShowPropertyDropdown(false);
      }
      if (floorContainerRef.current && !floorContainerRef.current.contains(target)) {
        setShowFloorDropdown(false);
      }
      if (unitContainerRef.current && !unitContainerRef.current.contains(target)) {
        setShowUnitDropdown(false);
      }
      if (vendorContainerRef.current && !vendorContainerRef.current.contains(target)) {
        setShowVendorDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Sync if editData changes
    setFormData(buildForm(editData));
  }, [editData]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const [propRes, unitRes, vendorRes] = await Promise.all([
          api.get("/properties"),
          api.get("/units"),
          api.get("/vendors?limit=1000"),
        ]);
        if (propRes.success) setProperties(propRes.data);
        if (unitRes.success) setUnits(unitRes.data);
        if (vendorRes.success) setVendors(vendorRes.data);
      } catch (err) {
        console.error("Failed to fetch form options:", err);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchFloors = async () => {
      if (!formData.property) {
        setFloors([]);
        return;
      }
      try {
        const res = await api.get(`/floors?property=${formData.property}&limit=1000`);
        if (res.success) {
          setFloors(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch floors for property:", err);
      }
    };
    fetchFloors();
  }, [formData.property]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pre-processing
    const payload = {
      ...formData,
      floorNumber: formData.floorNumber !== "" ? Number(formData.floorNumber) : undefined,
      purchaseValue: formData.purchaseValue !== "" ? Number(formData.purchaseValue) : undefined,
      property: formData.property || undefined,
      unit: formData.unit || undefined,
      vendor: formData.vendor || undefined,
    };

    // Clean up empty fields to avoid casting issues in Mongoose
    if (!payload.assetCode) delete payload.assetCode;
    if (!payload.property) delete payload.property;
    if (!payload.unit) delete payload.unit;
    if (!payload.vendor) delete payload.vendor;

    onSubmit(payload);
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1100, backdropFilter: "blur(6px)" }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 800 }}>
        <div
          className="modal-content border-0 overflow-hidden"
          style={{ borderRadius: "10px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        >
          {/* Header */}
          <div
            className="d-flex align-items-center justify-content-between px-4 py-3"
            style={{ backgroundColor: "#3a3a3a" }}
          >
            <h5 className="mb-0 text-white fw-semibold" style={{ fontSize: "1rem" }}>
              {mode === "create" ? "Add New Asset" : "Edit Asset Details"}
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
            {/* Body */}
            <div style={{ padding: "24px", maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
              {loadingOptions ? (
                <div className="text-center py-5 text-muted">
                  <span className="spinner-border spinner-border-sm me-2" />
                  Loading properties and units...
                </div>
              ) : (
                <div className="row g-3">
                  {/* Asset Description */}
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold text-dark">Asset Description *</label>
                    <input
                      type="text"
                      name="assetDescription"
                      className="form-control bg-white"
                      value={formData.assetDescription}
                      onChange={handleChange}
                      placeholder="e.g. 50kVA Diesel Generator"
                      required
                      style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    />
                  </div>

                  {/* Category */}
                  <div className="col-md-4 position-relative" ref={categoryContainerRef}>
                    <label className="form-label small fw-semibold text-dark">Category</label>
                    <div
                      className="form-control d-flex justify-content-between align-items-center bg-white"
                      onClick={() => setShowCategoryDropdown(prev => !prev)}
                      style={{ fontSize: "0.85rem", padding: "8px 12px", cursor: "pointer", border: "1px solid #ced4da", borderRadius: "0.375rem", userSelect: "none" }}
                    >
                      <span>{formData.category || "Select Category..."}</span>
                      <i className={`bi bi-chevron-${showCategoryDropdown ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }} />
                    </div>

                    {showCategoryDropdown && (
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
                            placeholder="Search category..."
                            value={categorySearch}
                            onChange={e => setCategorySearch(e.target.value)}
                            style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                            autoFocus
                          />
                          {categorySearch && (
                            <button
                              type="button"
                              onClick={() => setCategorySearch("")}
                              className="position-absolute border-0 bg-transparent text-muted"
                              style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                            >
                              ×
                            </button>
                          )}
                        </div>

                        <div className="overflow-auto flex-grow-1" style={{ maxHeight: "180px" }}>
                          {(() => {
                            const filtered = ASSET_CATEGORIES.filter(c =>
                              c.toLowerCase().includes(categorySearch.toLowerCase())
                            );
                            if (filtered.length === 0) {
                              return <div className="text-muted text-center py-2 small">No matches found</div>;
                            }
                            return filtered.map(c => (
                              <div
                                key={c}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, category: c }));
                                  setShowCategoryDropdown(false);
                                  setCategorySearch("");
                                }}
                                className="px-3 py-2 rounded-2 small"
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: formData.category === c ? "#f1f5f9" : "transparent",
                                  color: formData.category === c ? "#014aad" : "#334155",
                                  fontWeight: formData.category === c ? 600 : 400,
                                }}
                                onMouseEnter={e => {
                                  if (formData.category !== c) {
                                    e.currentTarget.style.backgroundColor = "#f8fafc";
                                    e.currentTarget.style.color = "#000";
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (formData.category !== c) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "#334155";
                                  }
                                }}
                              >
                                {c}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Make/Brand */}
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">Make / Brand</label>
                    <input
                      type="text"
                      name="makeBrand"
                      className="form-control bg-white"
                      value={formData.makeBrand}
                      onChange={handleChange}
                      placeholder="e.g. Samsung"
                      style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    />
                  </div>

                  {/* Serial Number */}
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">Serial Number</label>
                    <input
                      type="text"
                      name="serialNumber"
                      className="form-control bg-white"
                      value={formData.serialNumber}
                      onChange={handleChange}
                      placeholder="e.g. SN-102938"
                      style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    />
                  </div>

                  {/* Property */}
                  <div className="col-md-4 position-relative" ref={propertyContainerRef}>
                    <label className="form-label small fw-semibold text-dark">Property / Building</label>
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
                                  setFormData(prev => ({
                                    ...prev,
                                    property: p._id,
                                    floorNumber: "",
                                    unit: "",
                                  }));
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

                  {/* Floor */}
                  <div className="col-md-4 position-relative" ref={floorContainerRef}>
                    <label className="form-label small fw-semibold text-dark">Floor Level</label>
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
                          const floorObj = floors.find(f => String(f.floorNumber) === String(formData.floorNumber));
                          return floorObj ? (floorObj.floorName || `Floor ${floorObj.floorNumber}`) : (formData.floorNumber ? `Floor ${formData.floorNumber}` : "Select Floor...");
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
                            const filtered = floors.filter(f => {
                              const label = f.floorName || `Floor ${f.floorNumber}`;
                              return label.toLowerCase().includes(floorSearch.toLowerCase());
                            });
                            if (filtered.length === 0) {
                              return <div className="text-muted text-center py-2 small">No matches found</div>;
                            }
                            return filtered.map(f => {
                              const label = f.floorName || `Floor ${f.floorNumber}`;
                              const isSelected = String(formData.floorNumber) === String(f.floorNumber);
                              return (
                                <div
                                  key={f._id}
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      floorNumber: String(f.floorNumber),
                                      unit: "",
                                    }));
                                    setShowFloorDropdown(false);
                                    setFloorSearch("");
                                  }}
                                  className="px-3 py-2 rounded-2 small"
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: isSelected ? "#f1f5f9" : "transparent",
                                    color: isSelected ? "#014aad" : "#334155",
                                    fontWeight: isSelected ? 600 : 400,
                                  }}
                                  onMouseEnter={e => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = "#f8fafc";
                                      e.currentTarget.style.color = "#000";
                                    }
                                  }}
                                  onMouseLeave={e => {
                                    if (!isSelected) {
                                      e.currentTarget.style.backgroundColor = "transparent";
                                      e.currentTarget.style.color = "#334155";
                                    }
                                  }}
                                >
                                  {label}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Unit */}
                  <div className="col-md-4 position-relative" ref={unitContainerRef}>
                    <label className="form-label small fw-semibold text-dark">Linked Flat / Unit</label>
                    <div
                      className={`form-control d-flex justify-content-between align-items-center ${!formData.floorNumber ? "bg-white text-muted" : "bg-white"}`}
                      onClick={() => {
                        if (formData.floorNumber) {
                          setShowUnitDropdown(prev => !prev);
                        }
                      }}
                      style={{
                        fontSize: "0.85rem", padding: "8px 12px",
                        cursor: formData.floorNumber ? "pointer" : "not-allowed",
                        border: "1px solid #ced4da", borderRadius: "0.375rem", userSelect: "none"
                      }}
                    >
                      <span>
                        {(() => {
                          if (!formData.floorNumber) return "Select Floor first";
                          const unitObj = units.find(u => u._id === formData.unit);
                          return unitObj ? `${unitObj.unitNumber} (${unitObj.unitType})` : "Select Unit...";
                        })()}
                      </span>
                      <i className={`bi bi-chevron-${showUnitDropdown ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }} />
                    </div>

                    {showUnitDropdown && formData.floorNumber && (
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
                            placeholder="Search unit..."
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
                          {(() => {
                            const filteredUnits = units
                              .filter(u => {
                                const mProp = u.property?._id === formData.property || u.property === formData.property;
                                const mFloor = String(u.floorNumber) === String(formData.floorNumber);
                                return mProp && mFloor;
                              })
                              .filter(u => {
                                const label = `${u.unitNumber} (${u.unitType})`;
                                return label.toLowerCase().includes(unitSearch.toLowerCase());
                              });

                            if (filteredUnits.length === 0) {
                              return <div className="text-muted text-center py-2 small">No matches found</div>;
                            }
                            return filteredUnits.map(u => {
                              const label = `${u.unitNumber} (${u.unitType})`;
                              return (
                                <div
                                  key={u._id}
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      unit: u._id,
                                    }));
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
                                  {label}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Specific Spot */}
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold text-dark">Internal Specific Spot *</label>
                    <input
                      type="text"
                      name="assetLocation"
                      className="form-control bg-white"
                      value={formData.assetLocation}
                      onChange={handleChange}
                      placeholder="e.g. North corridor near server room"
                      required
                      style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    />
                  </div>

                  {/* Asset Status */}
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">Asset Status</label>
                    <select
                      name="assetStatus"
                      className="form-select bg-white"
                      value={formData.assetStatus}
                      onChange={handleChange}
                      style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    >
                      <option value="Active">Active</option>
                      <option value="Under Repair">Under Repair</option>
                      <option value="Scrapped">Scrapped</option>
                    </select>
                  </div>

                  {/* Purchase Date */}
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">Purchase Date</label>
                    <input
                      type="date"
                      name="purchaseDate"
                      className="form-control bg-white"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                      style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    />
                  </div>

                  {/* Purchase Value */}
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">Purchase Value (₹)</label>
                    <input
                      type="number"
                      name="purchaseValue"
                      className="form-control bg-white"
                      value={formData.purchaseValue}
                      onChange={handleChange}
                      placeholder="0"
                      style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    />
                  </div>

                  {/* Spacer */}
                  <div className="col-md-4" />

                  {/* Warranty Start */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Warranty Start Date</label>
                    <input
                      type="date"
                      name="warrantyStartDate"
                      className="form-control bg-white"
                      value={formData.warrantyStartDate}
                      onChange={handleChange}
                      style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    />
                  </div>

                  {/* Warranty Expiry */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Warranty Expiry Date</label>
                    <input
                      type="date"
                      name="warrantyEndDate"
                      className="form-control bg-white"
                      value={formData.warrantyEndDate}
                      onChange={handleChange}
                      style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    />
                  </div>

                  {/* AMC Start */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">AMC Start Date</label>
                    <input
                      type="date"
                      name="amcStartDate"
                      className="form-control bg-white"
                      value={formData.amcStartDate}
                      onChange={handleChange}
                      style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    />
                  </div>

                  {/* AMC Expiry */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">AMC Expiry Date</label>
                    <input
                      type="date"
                      name="amcEndDate"
                      className="form-control bg-white"
                      value={formData.amcEndDate}
                      onChange={handleChange}
                      style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    />
                  </div>

                   {/* Vendor Name */}
                   <div className="col-md-4 position-relative" ref={vendorContainerRef}>
                      <label className="form-label small fw-semibold text-dark">Vendor Company</label>
                      <div
                        className="form-control d-flex justify-content-between align-items-center bg-white"
                        onClick={() => setShowVendorDropdown(prev => !prev)}
                        style={{ fontSize: "0.85rem", padding: "8px 12px", cursor: "pointer", border: "1px solid #ced4da", borderRadius: "0.375rem", userSelect: "none" }}
                      >
                        <span>
                          {vendors.find(v => v._id === formData.vendor)?.vendorName || "Select Vendor..."}
                        </span>
                        <i className={`bi bi-chevron-${showVendorDropdown ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }} />
                      </div>

                      {showVendorDropdown && (
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
                              placeholder="Search vendor..."
                              value={vendorSearch}
                              onChange={e => setVendorSearch(e.target.value)}
                              style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                              autoFocus
                            />
                            {vendorSearch && (
                              <button
                                type="button"
                                onClick={() => setVendorSearch("")}
                                className="position-absolute border-0 bg-transparent text-muted"
                                style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                              >
                                ×
                              </button>
                            )}
                          </div>

                          <div className="overflow-auto flex-grow-1" style={{ maxHeight: "180px" }}>
                            {(() => {
                              const filtered = vendors.filter(v =>
                                v.vendorName?.toLowerCase().includes(vendorSearch.toLowerCase())
                              );
                              if (filtered.length === 0) {
                                return <div className="text-muted text-center py-2 small">No matches found</div>;
                              }
                              return filtered.map(v => {
                                const isSelected = formData.vendor === v._id;
                                return (
                                  <div
                                    key={v._id}
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        vendor: v._id,
                                        vendorName: v.vendorName || "",
                                        contactName: v.contactName || "",
                                        contactNumber: v.contactNumber || v.mobileNumber || "",
                                      }));
                                      setShowVendorDropdown(false);
                                      setVendorSearch("");
                                    }}
                                    className="px-3 py-2 rounded-2 small"
                                    style={{
                                      cursor: "pointer",
                                      backgroundColor: isSelected ? "#f1f5f9" : "transparent",
                                      color: isSelected ? "#014aad" : "#334155",
                                      fontWeight: isSelected ? 600 : 400,
                                    }}
                                    onMouseEnter={e => {
                                      if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = "#f8fafc";
                                        e.currentTarget.style.color = "#000";
                                      }
                                    }}
                                    onMouseLeave={e => {
                                      if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.color = "#334155";
                                      }
                                    }}
                                  >
                                    {v.vendorName}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
 
                   {/* Contact Person */}
                   <div className="col-md-4">
                     <label className="form-label small fw-semibold text-dark">Contact Person Name</label>
                     <input
                       type="text"
                       name="contactName"
                       className="form-control bg-white"
                       value={formData.contactName}
                       readOnly
                       placeholder="Auto-populated"
                       style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                     />
                   </div>
 
                   {/* Contact Number */}
                   <div className="col-md-4">
                     <label className="form-label small fw-semibold text-dark">Contact Number</label>
                     <input
                       type="text"
                       name="contactNumber"
                       className="form-control bg-white"
                       value={formData.contactNumber}
                       readOnly
                       placeholder="Auto-populated"
                       style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                     />
                   </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="d-flex justify-content-end gap-3 px-4 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
              <button
                type="button"
                className="btn btn-outline-secondary px-4 fw-semibold"
                onClick={onClose}
                disabled={isSubmitting}
                style={{ fontSize: "0.85rem", borderRadius: "6px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-5 fw-bold text-white shadow-sm border-0"
                disabled={isSubmitting || loadingOptions}
                style={{ backgroundColor: "#014aad", fontSize: "0.85rem", borderRadius: "6px" }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : mode === "create" ? (
                  "Save Asset"
                ) : (
                  "Update Asset"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
