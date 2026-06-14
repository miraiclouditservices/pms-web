"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/utils/api";

interface HelpdeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editData?: any;
  mode: "create" | "view" | "edit";
  currentUser: any;
}

export default function HelpdeskModal({
  isOpen,
  onClose,
  onSave,
  editData,
  mode,
  currentUser
}: HelpdeskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "timeline">("chat");

  // Form States for ticket creation
  const [formData, setFormData] = useState({
    title: "",
    category: "Maintenance",
    priority: "Low",
    description: "",
    attachment: "",
    property: "",
    floor: "",
    unit: "",
    locationArea: ""
  });

  // Locations / Mappings data for creation
  const [properties, setProperties] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Dropdown search states
  const [showPropDrop, setShowPropDrop] = useState(false);
  const [propSearch, setPropSearch] = useState("");
  const propRef = useRef<HTMLDivElement>(null);

  const [showFloorDrop, setShowFloorDrop] = useState(false);
  const [floorSearch, setFloorSearch] = useState("");
  const floorRef = useRef<HTMLDivElement>(null);

  const [showUnitDrop, setShowUnitDrop] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const unitRef = useRef<HTMLDivElement>(null);

  // View Ticket States (Comments & Timeline Logs)
  const [comments, setComments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentAttachment, setCommentAttachment] = useState("");

  // Assignment & Resolution States
  const [users, setUsers] = useState<any[]>([]);
  const [selectedAssignRole, setSelectedAssignRole] = useState("STAFF_ADMIN");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [showAssignForm, setShowAssignForm] = useState(false);

  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch properties and units on mount/open
  useEffect(() => {
    if (isOpen) {
      api.get("/properties").then(res => {
        if (res.success) setProperties(res.data);
      });
      api.get("/units").then(res => {
        if (res.success) setUnits(res.data);
      });
      // Load all admin/staff users for assignment dropdowns
      api.get("/users").then(res => {
        if (res.success) setUsers(res.data);
      });
    }
  }, [isOpen]);

  // Dynamically load floors when property changes
  useEffect(() => {
    const fetchFloorsForProperty = async () => {
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
    fetchFloorsForProperty();
  }, [formData.property]);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (propRef.current && !propRef.current.contains(e.target as Node)) setShowPropDrop(false);
      if (floorRef.current && !floorRef.current.contains(e.target as Node)) setShowFloorDrop(false);
      if (unitRef.current && !unitRef.current.contains(e.target as Node)) setShowUnitDrop(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  // Fetch logs and comments on ticket view
  useEffect(() => {
    if (isOpen && editData && (mode === "view" || mode === "edit")) {
      fetchComments();
      fetchLogs();
      setResolutionNote(editData.resolutionNote || "");
      setShowAssignForm(false);
      setShowResolveForm(false);
    }
  }, [isOpen, editData, mode]);

  useEffect(() => {
    if (activeTab === "chat") {
      scrollToBottom();
    }
  }, [comments, activeTab]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/helpdesk/${editData._id}/comments`);
      if (res.success) setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get(`/helpdesk/${editData._id}/logs`);
      if (res.success) setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  // Filter lists based on searches
  const filteredProps = properties.filter(p =>
    (p.propertyName || "").toLowerCase().includes(propSearch.toLowerCase())
  );

  const filteredFloors = floors.filter(f =>
    (f.floorName || `Floor ${f.floorNumber}`).toLowerCase().includes(floorSearch.toLowerCase())
  );

  const filteredUnits = units
    .filter(u => {
      const matchProperty = (u.property?._id || u.property) === formData.property;
      const matchFloor = (u.floor?._id || u.floor) === formData.floor;
      return matchProperty && matchFloor;
    })
    .filter(u =>
      (u.unitName || u.unitNumber || "").toLowerCase().includes(unitSearch.toLowerCase())
    );

  // Filter users based on selected assignment role
  const assignableUsers = users.filter(u => u.role === selectedAssignRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") {
      onClose();
      return;
    }

    if (!formData.property || !formData.floor) {
      alert("Property and Floor are required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      // Reset creation form state on successful submit
      setFormData({
        title: "",
        category: "Maintenance",
        priority: "Low",
        description: "",
        attachment: "",
        property: "",
        floor: "",
        unit: "",
        locationArea: ""
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post(`/helpdesk/${editData._id}/comments`, {
        comment: newComment,
        attachment: commentAttachment
      });
      if (res.success) {
        setNewComment("");
        setCommentAttachment("");
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedAssigneeId) {
      alert("Please select a user to assign.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.put(`/helpdesk/${editData._id}/assign`, {
        assignedTo: selectedAssigneeId,
        assignedRole: selectedAssignRole
      });
      if (res.success) {
        setShowAssignForm(false);
        fetchLogs();
        editData.status = "ASSIGNED";
        editData.assignedTo = users.find(u => u._id === selectedAssigneeId);
        editData.assignedRole = selectedAssignRole;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!resolutionNote.trim()) {
      alert("Please enter a resolution note.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.put(`/helpdesk/${editData._id}/status`, {
        status: "RESOLVED",
        resolutionNote
      });
      if (res.success) {
        setShowResolveForm(false);
        fetchLogs();
        editData.status = "RESOLVED";
        editData.resolvedBy = currentUser?.name;
        editData.resolvedRole = currentUser?.role;
        editData.resolvedAt = new Date();
        editData.resolutionNote = resolutionNote;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!confirm("Are you sure you want to close this ticket permanently?")) return;
    setIsSubmitting(true);
    try {
      const res = await api.put(`/helpdesk/${editData._id}/status`, {
        status: "CLOSED"
      });
      if (res.success) {
        fetchLogs();
        editData.status = "CLOSED";
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setIsSubmitting(true);
    try {
      const res = await api.put(`/helpdesk/${editData._id}/status`, {
        status
      });
      if (res.success) {
        fetchLogs();
        editData.status = status;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProp = properties.find(p => p._id === formData.property);
  const selectedFloorObj = floors.find(f => f._id === formData.floor);
  const selectedUnitObj = units.find(u => u._id === formData.unit);

  // Permission helpers
  const canAssign = (currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "FLOOR_ADMIN") && (editData?.status === "OPEN" || editData?.status === "ASSIGNED");
  const canUpdateStatus = (currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "FLOOR_ADMIN" || currentUser?.role === "STAFF_ADMIN") && editData?.status !== "CLOSED";
  const canResolve = (currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "FLOOR_ADMIN" || currentUser?.role === "STAFF_ADMIN") && editData?.status !== "RESOLVED" && editData?.status !== "CLOSED";
  const canClose = (currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "FLOOR_ADMIN") && editData?.status === "RESOLVED";

  return (
    <div
      className="modal show d-block"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "20px"
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered overflow-hidden w-100"
        style={{
          maxWidth: mode === "create" ? "750px" : "1100px",
          height: mode === "create" ? "auto" : "85vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}
      >
        <div className="modal-content border-0 h-100 d-flex flex-column bg-white">
          {/* Modal Header */}
          <div
            className="px-4 py-3 d-flex justify-content-between align-items-center"
            style={{ backgroundColor: "#3a3a3a", color: "#ffffff" }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-ticket-detailed fs-5"></i>
              <h5 className="fw-bold mb-0" style={{ fontSize: "1rem" }}>
                {mode === "create" ? "Raise Support Ticket" : `Support Ticket Workspace (${editData?.ticketId})`}
              </h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white shadow-none"
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#d1d5db", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          {mode === "create" ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflowY: "auto" }}>
              <div className="p-4" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
                <div className="row g-3">
                  {/* Basic Information */}
                  <div className="col-12">
                    <h6 className="fw-bold text-dark border-bottom pb-2" style={{ fontSize: "0.9rem" }}>Basic Information</h6>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small fw-semibold text-muted mb-1">Ticket Title*</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      style={{ height: "40px", borderRadius: "6px", fontSize: "0.85rem" }}
                      placeholder="e.g., Water leakage issue"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-muted mb-1">Category*</label>
                    <select
                      className="form-select"
                      required
                      style={{ height: "40px", borderRadius: "6px", fontSize: "0.85rem" }}
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Maintenance">Maintenance</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Water">Water</option>
                      <option value="Payment">Payment</option>
                      <option value="Agreement">Agreement</option>
                      <option value="Security">Security</option>
                      <option value="Technical Issue">Technical Issue</option>
                      <option value="Complaint">Complaint</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-muted mb-1">Priority*</label>
                    <select
                      className="form-select"
                      required
                      style={{ height: "40px", borderRadius: "6px", fontSize: "0.85rem" }}
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small fw-semibold text-muted mb-1">Description / Comments*</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      required
                      style={{ borderRadius: "6px", fontSize: "0.85rem" }}
                      placeholder="Write detailed description of the issue..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small fw-semibold text-muted mb-1">Attachment Link (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ height: "40px", borderRadius: "6px", fontSize: "0.85rem" }}
                      placeholder="Document or Image URL"
                      value={formData.attachment}
                      onChange={e => setFormData({ ...formData, attachment: e.target.value })}
                    />
                  </div>

                  {/* Property Details */}
                  <div className="col-12 mt-4">
                    <h6 className="fw-bold text-dark border-bottom pb-2" style={{ fontSize: "0.9rem" }}>Property Location details</h6>
                  </div>
                  
                  {/* Select Property (Searchable Dropdown) */}
                  <div className="col-md-4 position-relative" ref={propRef}>
                    <label className="form-label small fw-semibold text-muted mb-1">Select Property*</label>
                    <div
                      className="form-control d-flex justify-content-between align-items-center bg-white"
                      style={{ height: "40px", borderRadius: "6px", cursor: "pointer", border: "1px solid #ced4da", userSelect: "none", fontSize: "0.85rem" }}
                      onClick={() => setShowPropDrop(!showPropDrop)}
                    >
                      <span className={formData.property ? "text-dark" : "text-muted"}>
                        {selectedProp?.propertyName || "Select Property..."}
                      </span>
                      <i className={`bi bi-chevron-${showPropDrop ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }}></i>
                    </div>
                    {showPropDrop && (
                      <div
                        className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                        style={{ top: "100%", left: 0, right: 0, zIndex: 1050, marginTop: "4px", maxHeight: "250px", display: "flex", flexDirection: "column" }}
                      >
                        <div className="position-relative mb-2">
                          <input
                            type="text"
                            className="form-control form-control-sm ps-3"
                            placeholder="Search property..."
                            value={propSearch}
                            onChange={e => setPropSearch(e.target.value)}
                            style={{ fontSize: "0.8rem", height: "32px", paddingRight: "28px" }}
                            autoFocus
                          />
                          {propSearch && (
                            <button
                              type="button"
                              onClick={() => setPropSearch("")}
                              className="position-absolute border-0 bg-transparent text-muted"
                              style={{ right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem" }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="overflow-auto flex-grow-1" style={{ maxHeight: "160px" }}>
                          {filteredProps.map(p => (
                            <div
                              key={p._id}
                              className="px-3 py-2 rounded-2 small cursor-pointer hover-bg-light"
                              style={{
                                cursor: "pointer",
                                backgroundColor: formData.property === p._id ? "#f1f5f9" : "transparent",
                                color: formData.property === p._id ? "#014aad" : "#334155",
                                fontWeight: formData.property === p._id ? 600 : 400
                              }}
                              onClick={() => {
                                setFormData({ ...formData, property: p._id, floor: "", unit: "" });
                                setShowPropDrop(false);
                                setPropSearch("");
                              }}
                            >
                              {p.propertyName}
                            </div>
                          ))}
                          {filteredProps.length === 0 && <div className="text-muted text-center py-2 small">No properties found</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Select Floor (Searchable Dropdown) */}
                  <div className="col-md-4 position-relative" ref={floorRef}>
                    <label className="form-label small fw-semibold text-muted mb-1">Select Floor*</label>
                    <div
                      className={`form-control d-flex justify-content-between align-items-center bg-white ${!formData.property ? "text-muted" : "text-dark"}`}
                      style={{
                        height: "40px",
                        borderRadius: "6px",
                        cursor: formData.property ? "pointer" : "not-allowed",
                        border: "1px solid #ced4da",
                        userSelect: "none",
                        fontSize: "0.85rem"
                      }}
                      onClick={() => {
                        if (formData.property) {
                          setShowFloorDrop(!showFloorDrop);
                        }
                      }}
                    >
                      <span>
                        {!formData.property ? "Select Property first" : selectedFloorObj ? (selectedFloorObj.floorName || `Floor ${selectedFloorObj.floorNumber}`) : "Select Floor..."}
                      </span>
                      <i className={`bi bi-chevron-${showFloorDrop ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }}></i>
                    </div>
                    {showFloorDrop && formData.property && (
                      <div
                        className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                        style={{ top: "100%", left: 0, right: 0, zIndex: 1050, marginTop: "4px", maxHeight: "250px", display: "flex", flexDirection: "column" }}
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
                        <div className="overflow-auto flex-grow-1" style={{ maxHeight: "160px" }}>
                          {filteredFloors.map(f => {
                            const label = f.floorName || `Floor ${f.floorNumber}`;
                            return (
                              <div
                                key={f._id}
                                className="px-3 py-2 rounded-2 small cursor-pointer hover-bg-light"
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: formData.floor === f._id ? "#f1f5f9" : "transparent",
                                  color: formData.floor === f._id ? "#014aad" : "#334155",
                                  fontWeight: formData.floor === f._id ? 600 : 400
                                }}
                                onClick={() => {
                                  setFormData({ ...formData, floor: f._id, unit: "" });
                                  setShowFloorDrop(false);
                                  setFloorSearch("");
                                }}
                              >
                                {label}
                              </div>
                            );
                          })}
                          {filteredFloors.length === 0 && <div className="text-muted text-center py-2 small">No floors found</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Select Office / Flat / Unit (Searchable Dropdown) */}
                  <div className="col-md-4 position-relative" ref={unitRef}>
                    <label className="form-label small fw-semibold text-muted mb-1">Select Unit / Flat / Office</label>
                    <div
                      className={`form-control d-flex justify-content-between align-items-center bg-white ${!formData.floor ? "text-muted" : "text-dark"}`}
                      style={{
                        height: "40px",
                        borderRadius: "6px",
                        cursor: formData.floor ? "pointer" : "not-allowed",
                        border: "1px solid #ced4da",
                        userSelect: "none",
                        fontSize: "0.85rem"
                      }}
                      onClick={() => {
                        if (formData.floor) {
                          setShowUnitDrop(!showUnitDrop);
                        }
                      }}
                    >
                      <span>
                        {!formData.floor ? "Select Floor first" : selectedUnitObj ? `${selectedUnitObj.unitNumber} (${selectedUnitObj.unitType})` : "Select Unit..."}
                      </span>
                      <i className={`bi bi-chevron-${showUnitDrop ? "up" : "down"} text-muted`} style={{ fontSize: "0.75rem" }}></i>
                    </div>
                    {showUnitDrop && formData.floor && (
                      <div
                        className="bg-white rounded-3 shadow-lg border p-2 position-absolute"
                        style={{ top: "100%", left: 0, right: 0, zIndex: 1050, marginTop: "4px", maxHeight: "250px", display: "flex", flexDirection: "column" }}
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
                        <div className="overflow-auto flex-grow-1" style={{ maxHeight: "160px" }}>
                          {filteredUnits.map(u => {
                            const label = `${u.unitNumber} (${u.unitType})`;
                            return (
                              <div
                                key={u._id}
                                className="px-3 py-2 rounded-2 small cursor-pointer hover-bg-light"
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: formData.unit === u._id ? "#f1f5f9" : "transparent",
                                  color: formData.unit === u._id ? "#014aad" : "#334155",
                                  fontWeight: formData.unit === u._id ? 600 : 400
                                }}
                                onClick={() => {
                                  setFormData({ ...formData, unit: u._id });
                                  setShowUnitDrop(false);
                                  setUnitSearch("");
                                }}
                              >
                                {label}
                              </div>
                            );
                          })}
                          {filteredUnits.length === 0 && <div className="text-muted text-center py-2 small">No units found</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location Area */}
                  <div className="col-md-12">
                    <label className="form-label small fw-semibold text-muted mb-1">Specific Location Description</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ height: "40px", borderRadius: "6px", fontSize: "0.85rem" }}
                      placeholder="e.g. Corridor near elevator B, unit 304 restroom"
                      value={formData.locationArea}
                      onChange={e => setFormData({ ...formData, locationArea: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-3 border-top d-flex justify-content-end gap-2 bg-light">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-4 fw-bold"
                  style={{ height: "38px", borderRadius: "6px" }}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm px-4 fw-bold text-white border-0"
                  style={{ height: "38px", borderRadius: "6px", backgroundColor: "#014aad" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Raise Ticket"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-grow-1 d-flex overflow-hidden">
              {/* Left Column: Ticket Details */}
              <div
                className="p-4 border-end overflow-y-auto"
                style={{ width: "45%", display: "flex", flexDirection: "column", gap: "15px", backgroundColor: "#fbfcfd" }}
              >
                <div>
                  <span
                    className={`badge rounded-pill px-3 py-1.5 fw-bold text-uppercase border ${
                      editData.status === "OPEN" ? "bg-danger bg-opacity-10 text-danger border-danger" :
                      editData.status === "ASSIGNED" ? "bg-info bg-opacity-10 text-info border-info" :
                      editData.status === "IN_PROGRESS" ? "bg-warning bg-opacity-10 text-warning border-warning" :
                      editData.status === "RESOLVED" ? "bg-success bg-opacity-10 text-success border-success" :
                      "bg-secondary bg-opacity-10 text-secondary border-secondary"
                    }`}
                  >
                    {editData.status}
                  </span>
                  <span className={`badge rounded-pill ms-2 px-3 py-1.5 fw-bold text-uppercase border ${
                    editData.priority === "Critical" ? "bg-danger text-white border-danger" :
                    editData.priority === "High" ? "bg-warning text-dark border-warning" :
                    "bg-light text-dark border-secondary"
                  }`}>
                    {editData.priority} Priority
                  </span>
                </div>

                <div>
                  <h4 className="fw-bold text-dark mb-1">{editData.title}</h4>
                  <p className="text-muted small mb-0">Category: <span className="fw-bold">{editData.category}</span></p>
                </div>

                <div className="bg-white p-3 rounded border">
                  <label className="text-muted small fw-bold d-block mb-1">Description</label>
                  <p className="small text-dark mb-0" style={{ whiteSpace: "pre-line" }}>{editData.description}</p>
                </div>

                {editData.attachment && (
                  <div className="bg-white p-3 rounded border">
                    <label className="text-muted small fw-bold d-block mb-1">Attachment</label>
                    <a href={editData.attachment} target="_blank" rel="noreferrer" className="small text-primary text-decoration-none fw-semibold">
                      <i className="bi bi-file-earmark-arrow-down me-1"></i> View Attachment Document
                    </a>
                  </div>
                )}

                {/* Property mapping */}
                <div className="row g-2">
                  <div className="col-6">
                    <div className="bg-white p-3 rounded border">
                      <span className="text-muted small d-block">Property</span>
                      <span className="fw-bold text-dark small">{editData.property?.propertyName || "-"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-white p-3 rounded border">
                      <span className="text-muted small d-block">Floor</span>
                      <span className="fw-bold text-dark small">{editData.floor?.floorName || `Floor ${editData.floor?.floorNumber}` || "-"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-white p-3 rounded border">
                      <span className="text-muted small d-block">Office / Flat</span>
                      <span className="fw-bold text-dark small">{editData.unit?.unitName || editData.unit?.unitNumber || "-"}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-white p-3 rounded border">
                      <span className="text-muted small d-block">Location Area</span>
                      <span className="fw-bold text-dark small">{editData.locationArea || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Assignment Details */}
                <div className="bg-white p-3 rounded border">
                  <span className="text-muted small d-block mb-1 fw-bold">Assignment</span>
                  {editData.assignedTo ? (
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-light border rounded-circle d-flex align-items-center justify-content-center text-secondary" style={{ width: "32px", height: "32px" }}>
                        <i className="bi bi-person"></i>
                      </div>
                      <div>
                        <span className="fw-bold text-dark small d-block">{editData.assignedTo?.name || editData.assignedTo}</span>
                        <span className="text-muted extra-small">{editData.assignedRole}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted small italic">Not Assigned Yet</span>
                  )}
                </div>

                {/* Resolution Details */}
                {editData.status === "RESOLVED" && (
                  <div className="bg-success bg-opacity-10 border border-success p-3 rounded">
                    <span className="text-success small fw-bold d-block mb-1">Resolution Summary</span>
                    <p className="small text-dark mb-2">{editData.resolutionNote}</p>
                    <div className="extra-small text-muted">
                      Resolved By: <span className="fw-bold text-dark">{editData.resolvedBy} ({editData.resolvedRole})</span> at {new Date(editData.resolvedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Action Panels */}
                <div className="mt-auto pt-3 border-top d-flex flex-column gap-2">
                  {/* Regular Action Buttons */}
                  {!showAssignForm && !showResolveForm && (
                    <div className="d-flex flex-wrap gap-2">
                      {canAssign && (
                        <button className="btn btn-primary btn-sm flex-grow-1 fw-bold border-0" style={{ backgroundColor: "#014aad" }} onClick={() => setShowAssignForm(true)}>
                          <i className="bi bi-person-plus me-1"></i> Assign Ticket
                        </button>
                      )}

                      {canUpdateStatus && editData.status !== "IN_PROGRESS" && (
                        <button className="btn btn-warning btn-sm flex-grow-1 fw-bold text-dark" onClick={() => handleUpdateStatus("IN_PROGRESS")}>
                          <i className="bi bi-play-fill me-1"></i> Start Work
                        </button>
                      )}

                      {canResolve && (
                        <button className="btn btn-success btn-sm flex-grow-1 fw-bold text-white border-0 bg-success" onClick={() => setShowResolveForm(true)}>
                          <i className="bi bi-check-circle me-1"></i> Resolve Ticket
                        </button>
                      )}

                      {canClose && (
                        <button className="btn btn-dark btn-sm flex-grow-1 fw-bold text-white" onClick={handleCloseTicket}>
                          <i className="bi bi-archive me-1"></i> Close Ticket
                        </button>
                      )}
                    </div>
                  )}

                  {/* Assignment Form */}
                  {showAssignForm && (
                    <div className="bg-white border rounded p-3 d-flex flex-column gap-2">
                      <h6 className="fw-bold small text-dark mb-0">Assign Support Ticket</h6>
                      <div>
                        <label className="extra-small text-muted d-block mb-1">Assign Role Type</label>
                        <select className="form-select form-select-sm" value={selectedAssignRole} onChange={e => { setSelectedAssignRole(e.target.value); setSelectedAssigneeId(""); }}>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          <option value="FLOOR_ADMIN">FLOOR_ADMIN</option>
                          <option value="OFFICE_OWNER">OFFICE_OWNER</option>
                          <option value="STAFF_ADMIN">STAFF_ADMIN</option>
                        </select>
                      </div>
                      <div>
                        <label className="extra-small text-muted d-block mb-1">Select User</label>
                        <select className="form-select form-select-sm" value={selectedAssigneeId} onChange={e => setSelectedAssigneeId(e.target.value)}>
                          <option value="">Select User...</option>
                          {assignableUsers.map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                          ))}
                        </select>
                      </div>
                      <div className="d-flex gap-2 mt-1">
                        <button className="btn btn-outline-secondary btn-sm flex-grow-1" onClick={() => setShowAssignForm(false)}>Cancel</button>
                        <button className="btn btn-primary btn-sm flex-grow-1 text-white border-0" style={{ backgroundColor: "#014aad" }} onClick={handleAssignTicket} disabled={isSubmitting}>Submit</button>
                      </div>
                    </div>
                  )}

                  {/* Resolution Form */}
                  {showResolveForm && (
                    <div className="bg-white border rounded p-3 d-flex flex-column gap-2">
                      <h6 className="fw-bold small text-dark mb-0">Submit Resolution Notes</h6>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        placeholder="Specify findings, fixed leakage, etc..."
                        value={resolutionNote}
                        onChange={e => setResolutionNote(e.target.value)}
                      />
                      <div className="d-flex gap-2 mt-1">
                        <button className="btn btn-outline-secondary btn-sm flex-grow-1" onClick={() => setShowResolveForm(false)}>Cancel</button>
                        <button className="btn btn-success btn-sm flex-grow-1 text-white border-0 bg-success" onClick={handleResolveTicket} disabled={isSubmitting}>Resolve</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Chat/Comments & Timeline */}
              <div className="d-flex flex-column" style={{ width: "55%", height: "100%" }}>
                {/* Tab navigation */}
                <div className="d-flex border-bottom bg-light">
                  <button
                    className={`px-4 py-2.5 fw-bold border-0 bg-transparent small transition-all ${activeTab === "chat" ? "border-bottom border-primary border-3 text-primary" : "text-muted"}`}
                    style={{ borderBottomColor: activeTab === "chat" ? "#014aad" : "transparent" }}
                    onClick={() => setActiveTab("chat")}
                  >
                    Comments Chat ({comments.length})
                  </button>
                  <button
                    className={`px-4 py-2.5 fw-bold border-0 bg-transparent small transition-all ${activeTab === "timeline" ? "border-bottom border-primary border-3 text-primary" : "text-muted"}`}
                    style={{ borderBottomColor: activeTab === "timeline" ? "#014aad" : "transparent" }}
                    onClick={() => setActiveTab("timeline")}
                  >
                    Activity Timeline ({logs.length})
                  </button>
                </div>

                {/* Tab Panels */}
                <div className="flex-grow-1 overflow-hidden d-flex flex-column position-relative">
                  {activeTab === "chat" ? (
                    <>
                      {/* Chat Messages */}
                      <div className="flex-grow-1 overflow-y-auto p-3 d-flex flex-column gap-3" style={{ backgroundColor: "#f8f9fa" }}>
                        {comments.length === 0 ? (
                          <div className="text-center my-auto text-muted small">
                            <i className="bi bi-chat-left-dots fs-3 d-block mb-2 opacity-50"></i>
                            No comments posted yet. Start the conversation.
                          </div>
                        ) : (
                          comments.map(c => {
                            const isMe = c.commentBy === currentUser?.name;
                            return (
                              <div key={c._id} className={`d-flex flex-column ${isMe ? "align-items-end" : "align-items-start"}`}>
                                <div className="d-flex gap-1.5 align-items-center mb-1">
                                  <span className="fw-bold extra-small text-dark">{c.commentBy}</span>
                                  <span className="badge bg-light text-muted border extra-small">{c.commentRole}</span>
                                </div>
                                <div
                                  className={`p-2.5 rounded shadow-sm text-dark small ${isMe ? "bg-primary text-white bg-opacity-90 rounded-tr-0" : "bg-white rounded-tl-0 border"}`}
                                  style={{ maxWidth: "80%", wordBreak: "break-word" }}
                                >
                                  <div>{c.comment}</div>
                                  {c.attachment && (
                                    <div className="mt-1 pt-1 border-top border-white border-opacity-20">
                                      <a href={c.attachment} target="_blank" rel="noreferrer" className={`extra-small ${isMe ? "text-white fw-bold" : "text-primary"}`}>
                                        <i className="bi bi-link-45deg"></i> Attachment Download
                                      </a>
                                    </div>
                                  )}
                                </div>
                                <span className="extra-small text-muted mt-0.5" style={{ fontSize: "0.68rem" }}>
                                  {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat Input */}
                      <form onSubmit={handlePostComment} className="p-3 border-top bg-white d-flex gap-2">
                        <input
                          type="text"
                          className="form-control form-control-sm border shadow-none"
                          style={{ height: "40px", borderRadius: "20px", paddingLeft: "15px" }}
                          placeholder="Write a message reply..."
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary rounded-circle p-0 d-flex align-items-center justify-content-center text-white border-0 shadow-sm"
                          style={{ width: "40px", height: "40px", backgroundColor: "#014aad", flexShrink: 0 }}
                        >
                          <i className="bi bi-send-fill fs-6"></i>
                        </button>
                      </form>
                    </>
                  ) : (
                    /* Timeline Logs */
                    <div className="flex-grow-1 overflow-y-auto p-4" style={{ backgroundColor: "#ffffff" }}>
                      {logs.length === 0 ? (
                        <div className="text-center my-auto text-muted small py-5">
                          <i className="bi bi-clock-history fs-3 d-block mb-2 opacity-50"></i>
                          No activity logged yet.
                        </div>
                      ) : (
                        <div className="position-relative ps-4" style={{ borderLeft: "2px solid #e2e8f0" }}>
                          {logs.map((log, idx) => (
                            <div key={log._id || idx} className="position-relative mb-4">
                              {/* Dot indicator */}
                              <div
                                className="position-absolute rounded-circle"
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  left: "-31px",
                                  top: "5px",
                                  backgroundColor:
                                    log.actionType === "TICKET_CREATED" ? "#3b82f6" :
                                    log.actionType === "TICKET_ASSIGNED" ? "#f59e0b" :
                                    log.actionType === "TICKET_RESOLVED" ? "#10b981" :
                                    "#94a3b8",
                                  border: "2px solid #ffffff"
                                }}
                              />
                              <div>
                                <span className="extra-small text-muted fw-semibold">
                                  {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <h6 className="fw-bold text-dark mb-0.5 mt-0.5" style={{ fontSize: "0.85rem" }}>
                                  {log.actionType === "TICKET_CREATED" ? "Ticket Created" :
                                   log.actionType === "TICKET_ASSIGNED" ? "Ticket Assigned" :
                                   log.actionType === "TICKET_RESOLVED" ? "Ticket Resolved" :
                                   "Status Changed"}
                                </h6>
                                <div className="small text-muted">
                                  {log.actionType === "TICKET_ASSIGNED" && (
                                    <span>Assigned To: <span className="fw-bold text-dark">{log.newValue}</span> (Previous: {log.oldValue})</span>
                                  )}
                                  {log.actionType === "STATUS_CHANGED" && (
                                    <span>Status changed from <span className="fw-bold text-dark">{log.oldValue}</span> to <span className="fw-bold text-dark">{log.newValue}</span></span>
                                  )}
                                  {log.actionType === "TICKET_RESOLVED" && (
                                    <span>Resolved. Resolution: <span className="fw-bold text-dark">{log.comment}</span></span>
                                  )}
                                </div>
                                <div className="extra-small text-muted mt-1">
                                  By: <span className="fw-semibold">{log.updatedBy}</span> ({log.updatedRole})
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
