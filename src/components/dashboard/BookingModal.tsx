"use client";

import { useState, useEffect } from "react";
import { ModalMode } from "./AssetModal";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: ModalMode;
}

export default function BookingModal({ isOpen, onClose, onSave, editData, mode }: BookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bookingId: "",
    bookingParticulars: "",
    dateOfBooking: "",
    timeOfBooking: "",
    bookingFromDate: "",
    bookingToDate: "",
    paymentStatus: "Pending",
    bookedBy: "",
    bookingStatus: "Pending"
  });

  useEffect(() => {
    if (isOpen) {
      if (editData && (mode === "edit" || mode === "view")) {
        setFormData({ 
          ...editData,
          bookingFromDate: editData.bookingFromDate ? new Date(editData.bookingFromDate).toISOString().split('T')[0] : "",
          bookingToDate: editData.bookingToDate ? new Date(editData.bookingToDate).toISOString().split('T')[0] : "",
          dateOfBooking: editData.dateOfBooking ? new Date(editData.dateOfBooking).toISOString().split('T')[0] : ""
        });
      } else {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        setFormData({
          bookingId: `BK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          bookingParticulars: "",
          dateOfBooking: dateStr,
          timeOfBooking: timeStr,
          bookingFromDate: dateStr,
          bookingToDate: dateStr,
          paymentStatus: "Pending",
          bookedBy: "",
          bookingStatus: "Pending"
        });
      }
    }
  }, [editData, isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "view") {
      onClose();
      return;
    }
    
    setIsSubmitting(true);
    onSave(formData);
    setIsSubmitting(false);
    onClose();
  };

  const isReadOnly = mode === "view";

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(2, 44, 34, 0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      backdropFilter: 'blur(10px)', animation: 'fadeIn 0.3s ease-out'
    }}>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      
      <div className="modal-dialog modal-lg w-100 mx-3" style={{ maxWidth: '650px', animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white">
          <div className="modal-header border-bottom p-4 bg-light d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark mb-0">
              {mode === 'create' ? 'New Space Booking' : mode === 'edit' ? 'Update Booking' : 'Booking Details'}
            </h5>
            <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold text-primary mb-0" style={{ color: '#014aad' }}>Booking Information</h6>
                <div className="badge bg-light text-dark border">ID: {formData.bookingId}</div>
              </div>
              
              <div className="row g-3 mb-4">
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-muted mb-1">Booking Particulars (Amenity/Hall/Room)</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.bookingParticulars} onChange={(e) => setFormData({...formData, bookingParticulars: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Booked By (Name)</label>
                  <input type="text" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.bookedBy} onChange={(e) => setFormData({...formData, bookedBy: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Request Date</label>
                  <input type="date" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.dateOfBooking} onChange={(e) => setFormData({...formData, dateOfBooking: e.target.value})} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Request Time</label>
                  <input type="time" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.timeOfBooking} onChange={(e) => setFormData({...formData, timeOfBooking: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">From Date</label>
                  <input type="date" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.bookingFromDate} onChange={(e) => setFormData({...formData, bookingFromDate: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">To Date</label>
                  <input type="date" className="form-control form-control-sm bg-light" required disabled={isReadOnly}
                    value={formData.bookingToDate} onChange={(e) => setFormData({...formData, bookingToDate: e.target.value})} />
                </div>
              </div>

              <hr className="text-muted" />

              <h6 className="fw-bold text-primary mb-3" style={{ color: '#014aad' }}>Status & Payment</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Payment Status</label>
                  <select className="form-select form-select-sm bg-light" disabled={isReadOnly}
                    value={formData.paymentStatus} onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted mb-1">Booking Status</label>
                  <select className="form-select form-select-sm bg-light" disabled={isReadOnly}
                    value={formData.bookingStatus} onChange={(e) => setFormData({...formData, bookingStatus: e.target.value})}>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

            </div>
            
            <div className="modal-footer border-top p-4 d-flex gap-3 bg-light">
              <button 
                type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-bold" 
                onClick={onClose} disabled={isSubmitting} style={{ fontSize: '0.85rem' }}
              >
                {mode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {mode !== 'view' && (
                <button 
                  type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm text-white border-0"
                  disabled={isSubmitting}
                  style={{ backgroundColor: '#014aad', fontSize: '0.85rem' }}
                >
                  {isSubmitting ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  {mode === 'create' ? 'Confirm Booking' : 'Update Booking'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
