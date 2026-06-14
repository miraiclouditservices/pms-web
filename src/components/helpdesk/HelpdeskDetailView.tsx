"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/utils/api";
import { formatRole } from "@/utils/format";

interface HelpdeskDetailViewProps {
  viewItem: any;
  onClose: () => void;
  currentUser: any;
  onRefresh: () => void;
}

export default function HelpdeskDetailView({
  viewItem,
  onClose,
  currentUser,
  onRefresh
}: HelpdeskDetailViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "timeline">("chat");

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

  useEffect(() => {
    if (viewItem) {
      fetchComments();
      fetchLogs();
      setResolutionNote(viewItem.resolutionNote || "");
      setShowAssignForm(false);
      setShowResolveForm(false);
      // Load all admin/staff users for assignment dropdowns
      api.get("/users").then(res => {
        if (res.success) setUsers(res.data);
      });
    }
  }, [viewItem]);

  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, activeTab]);

  if (!viewItem) return null;

  const fetchComments = async () => {
    try {
      const res = await api.get(`/helpdesk/${viewItem._id}/comments`);
      if (res.success) setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get(`/helpdesk/${viewItem._id}/logs`);
      if (res.success) setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post(`/helpdesk/${viewItem._id}/comments`, {
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
      const res = await api.put(`/helpdesk/${viewItem._id}/assign`, {
        assignedTo: selectedAssigneeId,
        assignedRole: selectedAssignRole
      });
      if (res.success) {
        setShowAssignForm(false);
        fetchLogs();
        viewItem.status = "ASSIGNED";
        viewItem.assignedTo = users.find(u => u._id === selectedAssigneeId);
        viewItem.assignedRole = selectedAssignRole;
        onRefresh();
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
      const res = await api.put(`/helpdesk/${viewItem._id}/status`, {
        status: "RESOLVED",
        resolutionNote
      });
      if (res.success) {
        setShowResolveForm(false);
        fetchLogs();
        viewItem.status = "RESOLVED";
        viewItem.resolvedBy = currentUser?.name;
        viewItem.resolvedRole = currentUser?.role;
        viewItem.resolvedAt = new Date();
        viewItem.resolutionNote = resolutionNote;
        onRefresh();
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
      const res = await api.put(`/helpdesk/${viewItem._id}/status`, {
        status: "CLOSED"
      });
      if (res.success) {
        fetchLogs();
        viewItem.status = "CLOSED";
        onRefresh();
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
      const res = await api.put(`/helpdesk/${viewItem._id}/status`, {
        status
      });
      if (res.success) {
        fetchLogs();
        viewItem.status = status;
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter users based on selected assignment role
  const assignableUsers = users.filter(u => u.role === selectedAssignRole);

  // Permission helpers
  const canAssign = (currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "FLOOR_ADMIN") && (viewItem.status === "OPEN" || viewItem.status === "ASSIGNED");
  const canUpdateStatus = (currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "FLOOR_ADMIN" || currentUser?.role === "STAFF_ADMIN") && viewItem.status !== "CLOSED";
  const canResolve = (currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "FLOOR_ADMIN" || currentUser?.role === "STAFF_ADMIN") && viewItem.status !== "RESOLVED" && viewItem.status !== "CLOSED";
  const canClose = (currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "FLOOR_ADMIN") && viewItem.status === "RESOLVED";

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
          maxWidth: "1100px",
          height: "85vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}
      >
        <div className="modal-content border-0 h-100 d-flex flex-column bg-white">
          {/* Modal Header */}
          <div
            className="px-4 py-2.5 d-flex justify-content-between align-items-center"
            style={{ backgroundColor: "#3a3a3a", color: "#ffffff" }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-ticket-detailed fs-6"></i>
              <h5 className="fw-bold mb-0" style={{ fontSize: "0.9rem" }}>
                Support Ticket Workspace ({viewItem.ticketId})
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
          <div className="flex-grow-1 d-flex overflow-hidden">
            {/* Left Column: Ticket Details */}
            <div
              className="p-4 border-end overflow-y-auto"
              style={{ width: "45%", display: "flex", flexDirection: "column", gap: "15px", backgroundColor: "#fbfcfd" }}
            >
              <div>
                <span
                  className={`badge rounded-pill px-2.5 py-1 fw-bold text-uppercase border ${
                    viewItem.status === "OPEN" ? "bg-danger bg-opacity-10 text-danger border-danger" :
                    viewItem.status === "ASSIGNED" ? "bg-info bg-opacity-10 text-info border-info" :
                    viewItem.status === "IN_PROGRESS" ? "bg-warning bg-opacity-10 text-warning border-warning" :
                    viewItem.status === "RESOLVED" ? "bg-success bg-opacity-10 text-success border-success" :
                    "bg-secondary bg-opacity-10 text-secondary border-secondary"
                  }`}
                  style={{ fontSize: "0.7rem" }}
                >
                  {viewItem.status}
                </span>
                <span className={`badge rounded-pill ms-2 px-2.5 py-1 fw-bold text-uppercase border ${
                  viewItem.priority === "Critical" ? "bg-danger text-white border-danger" :
                  viewItem.priority === "High" ? "bg-warning text-dark border-warning" :
                  "bg-light text-dark border-secondary"
                }`} style={{ fontSize: "0.7rem" }}>
                  {viewItem.priority} Priority
                </span>
              </div>

              <div>
                <h5 className="fw-bold text-dark mb-1" style={{ fontSize: "1.1rem" }}>{viewItem.title}</h5>
                <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>Category: <span className="fw-semibold text-dark">{viewItem.category}</span></p>
              </div>

              <div className="bg-white rounded border" style={{ padding: "12px" }}>
                <label className="text-muted d-block mb-1" style={{ fontSize: "0.72rem", fontWeight: 600 }}>Description</label>
                <p className="text-dark mb-0" style={{ whiteSpace: "pre-line", fontSize: "0.8rem" }}>{viewItem.description}</p>
              </div>

              {viewItem.attachment && (
                <div className="bg-white p-3 rounded border">
                  <label className="text-muted small fw-bold d-block mb-1">Attachment</label>
                  <a href={viewItem.attachment} target="_blank" rel="noreferrer" className="small text-primary text-decoration-none fw-semibold">
                    <i className="bi bi-file-earmark-arrow-down me-1"></i> View Attachment Document
                  </a>
                </div>
              )}

              {/* Property mapping */}
              <div className="row g-2">
                <div className="col-6">
                  <div className="bg-white rounded border" style={{ padding: "12px", minHeight: "64px" }}>
                    <span className="text-muted d-block mb-0.5" style={{ fontSize: "0.72rem", fontWeight: 500 }}>Property</span>
                    <span className="text-dark d-block fw-semibold" style={{ fontSize: "0.8rem" }}>{viewItem.property?.propertyName || "-"}</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-white rounded border" style={{ padding: "12px", minHeight: "64px" }}>
                    <span className="text-muted d-block mb-0.5" style={{ fontSize: "0.72rem", fontWeight: 500 }}>Floor</span>
                    <span className="text-dark d-block fw-semibold" style={{ fontSize: "0.8rem" }}>{viewItem.floor?.floorName || `Floor ${viewItem.floor?.floorNumber}` || "-"}</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-white rounded border" style={{ padding: "12px", minHeight: "64px" }}>
                    <span className="text-muted d-block mb-0.5" style={{ fontSize: "0.72rem", fontWeight: 500 }}>Office / Flat</span>
                    <span className="text-dark d-block fw-semibold" style={{ fontSize: "0.8rem" }}>{viewItem.unit?.unitName || viewItem.unit?.unitNumber || "-"}</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-white rounded border" style={{ padding: "12px", minHeight: "64px" }}>
                    <span className="text-muted d-block mb-0.5" style={{ fontSize: "0.72rem", fontWeight: 500 }}>Location Area</span>
                    <span className="text-dark d-block fw-semibold" style={{ fontSize: "0.8rem" }}>{viewItem.locationArea || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="bg-white rounded border" style={{ padding: "12px" }}>
                <span className="text-muted d-block mb-1 fw-semibold" style={{ fontSize: "0.72rem" }}>Assignment</span>
                {viewItem.assignedTo ? (
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-light border rounded-circle d-flex align-items-center justify-content-center text-secondary" style={{ width: "28px", height: "28px" }}>
                      <i className="bi bi-person" style={{ fontSize: "0.8rem" }}></i>
                    </div>
                    <div>
                      <span className="fw-semibold text-dark d-block" style={{ fontSize: "0.8rem" }}>{viewItem.assignedTo?.name || viewItem.assignedTo}</span>
                      <span className="text-muted extra-small" style={{ fontSize: "0.7rem" }}>{formatRole(viewItem.assignedRole)}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted italic" style={{ fontSize: "0.78rem" }}>Not Assigned Yet</span>
                )}
              </div>

              {/* Resolution Details */}
              {viewItem.status === "RESOLVED" && (
                <div className="bg-success bg-opacity-10 border border-success rounded" style={{ padding: "12px" }}>
                  <span className="text-success fw-bold d-block mb-1" style={{ fontSize: "0.72rem" }}>Resolution Summary</span>
                  <p className="text-dark mb-2" style={{ fontSize: "0.8rem" }}>{viewItem.resolutionNote}</p>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                    Resolved By: <span className="fw-semibold text-dark">{viewItem.resolvedBy} ({formatRole(viewItem.resolvedRole)})</span> at {new Date(viewItem.resolvedAt).toLocaleDateString()}
                  </div>
                </div>
              )}

              {/* Action Panels */}
              <div className="mt-auto pt-3 border-top d-flex flex-column gap-2">
                {!showAssignForm && !showResolveForm && (
                  <div className="d-flex flex-wrap gap-2">
                    {canAssign && (
                      <button className="btn btn-primary btn-sm flex-grow-1 fw-bold border-0" style={{ backgroundColor: "#014aad" }} onClick={() => setShowAssignForm(true)}>
                        <i className="bi bi-person-plus me-1"></i> Assign Ticket
                      </button>
                    )}

                    {canUpdateStatus && viewItem.status !== "IN_PROGRESS" && (
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
                      <select className="form-select form-select-sm" style={{ fontSize: "0.78rem" }} value={selectedAssignRole} onChange={e => { setSelectedAssignRole(e.target.value); setSelectedAssigneeId(""); }}>
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="FLOOR_ADMIN">Floor Admin</option>
                        <option value="OFFICE_OWNER">Office Owner</option>
                        <option value="STAFF_ADMIN">Staff Admin</option>
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
              <div className="d-flex p-1 bg-light border-bottom gap-1">
                <button
                  className={`flex-grow-1 py-2 px-3 rounded border-0 fw-semibold transition-all d-flex align-items-center justify-content-center gap-2`}
                  style={{
                    fontSize: "0.78rem",
                    backgroundColor: activeTab === "chat" ? "#ffffff" : "transparent",
                    color: activeTab === "chat" ? "#0f172a" : "#64748b",
                    boxShadow: activeTab === "chat" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                  onClick={() => setActiveTab("chat")}
                >
                  <i className="bi bi-chat-left-text" style={{ fontSize: "0.85rem" }}></i>
                  Comments Chat
                  <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: "0.68rem" }}>{comments.length}</span>
                </button>
                <button
                  className={`flex-grow-1 py-2 px-3 rounded border-0 fw-semibold transition-all d-flex align-items-center justify-content-center gap-2`}
                  style={{
                    fontSize: "0.78rem",
                    backgroundColor: activeTab === "timeline" ? "#ffffff" : "transparent",
                    color: activeTab === "timeline" ? "#0f172a" : "#64748b",
                    boxShadow: activeTab === "timeline" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                  onClick={() => setActiveTab("timeline")}
                >
                  <i className="bi bi-clock-history" style={{ fontSize: "0.85rem" }}></i>
                  Activity Timeline
                  <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: "0.68rem" }}>{logs.length}</span>
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
                          const senderInitials = c.commentBy ? c.commentBy.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "?";
                          return (
                            <div key={c._id} className={`d-flex gap-2 ${isMe ? "flex-row-reverse align-self-end" : "align-self-start"}`} style={{ maxWidth: "85%" }}>
                              {/* Avatar */}
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  fontSize: "0.72rem",
                                  backgroundColor: isMe ? "#014aad" : "#64748b",
                                  flexShrink: 0
                                }}
                              >
                                {senderInitials}
                              </div>
                              
                              {/* Content Column */}
                              <div className={`d-flex flex-column ${isMe ? "align-items-end" : "align-items-start"}`}>
                                <div
                                  className={`d-flex align-items-center ${isMe ? "flex-row-reverse" : ""}`}
                                  style={{ gap: "5px", marginBottom: "4px" }}
                                >
                                  <span className="fw-semibold text-dark" style={{ fontSize: "0.72rem" }}>{c.commentBy}</span>
                                  <span
                                    className="badge rounded border bg-light text-muted"
                                    style={{ fontSize: "0.62rem", fontWeight: 500, padding: "2px 6px" }}
                                  >
                                    {formatRole(c.commentRole)}
                                  </span>
                                </div>
                                
                                <div
                                  className="rounded text-dark shadow-sm"
                                  style={{
                                    padding: "8px 14px",
                                    fontSize: "0.78rem",
                                    lineHeight: "1.4",
                                    wordBreak: "break-word",
                                    backgroundColor: isMe ? "#eff6ff" : "#ffffff",
                                    border: isMe ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                                    borderRadius: isMe ? "12px 0px 12px 12px" : "0px 12px 12px 12px"
                                  }}
                                >
                                  <div>{c.comment}</div>
                                  {c.attachment && (
                                    <div className="pt-1 border-top" style={{ marginTop: "6px", borderColor: isMe ? "#bfdbfe" : "#e2e8f0" }}>
                                      <a href={c.attachment} target="_blank" rel="noreferrer" className="text-primary text-decoration-none fw-semibold" style={{ fontSize: "0.68rem" }}>
                                        <i className="bi bi-link-45deg"></i> Attachment
                                      </a>
                                    </div>
                                  )}
                                </div>
                                <span className="text-muted" style={{ fontSize: "0.62rem", marginTop: "4px", display: "block" }}>
                                  {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handlePostComment} className="p-2 border-top bg-white d-flex gap-2 align-items-center">
                      <input
                        type="text"
                        className="form-control form-control-sm border shadow-none"
                        style={{
                          height: "38px",
                          borderRadius: "19px",
                          paddingLeft: "15px",
                          fontSize: "0.78rem",
                          borderColor: "#e2e8f0"
                        }}
                        placeholder="Write a message reply..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary rounded-circle p-0 d-flex align-items-center justify-content-center text-white border-0 shadow-sm"
                        style={{
                          width: "36px",
                          height: "36px",
                          backgroundColor: "#014aad",
                          flexShrink: 0,
                          cursor: "pointer"
                        }}
                      >
                        <i className="bi bi-send-fill" style={{ fontSize: "0.85rem" }}></i>
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
                              <span className="text-muted fw-semibold" style={{ fontSize: "0.7rem" }}>
                                {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <h6 className="fw-bold text-dark mb-0.5 mt-0.5" style={{ fontSize: "0.78rem" }}>
                                {log.actionType === "TICKET_CREATED" ? "Ticket Created" :
                                 log.actionType === "TICKET_ASSIGNED" ? "Ticket Assigned" :
                                 log.actionType === "TICKET_RESOLVED" ? "Ticket Resolved" :
                                 "Status Changed"}
                              </h6>
                              <div className="text-muted" style={{ fontSize: "0.74rem" }}>
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
                              <div className="text-muted mt-0.5" style={{ fontSize: "0.68rem" }}>
                                By: <span className="fw-semibold">{log.updatedBy}</span> ({formatRole(log.updatedRole)})
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
        </div>
      </div>
    </div>
  );
}
