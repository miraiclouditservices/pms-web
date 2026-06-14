"use client";

import { useEffect, useState } from "react";

interface BookingFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  properties: any[];
  floors: any[];
  meetingRooms: any[];
  selectedProperty: string;
  setSelectedProperty: (val: string) => void;
  selectedFloor: string;
  setSelectedFloor: (val: string) => void;
  selectedRoom: string;
  setSelectedRoom: (val: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function BookingFilterDrawer({
  isOpen,
  onClose,
  properties = [],
  floors = [],
  meetingRooms = [],
  selectedProperty,
  setSelectedProperty,
  selectedFloor,
  setSelectedFloor,
  selectedRoom,
  setSelectedRoom,
  onApply,
  onReset
}: BookingFilterDrawerProps) {
  const [localFloors, setLocalFloors] = useState<any[]>([]);
  const [localRooms, setLocalRooms] = useState<any[]>([]);

  // Filter floors by property
  useEffect(() => {
    if (selectedProperty) {
      setLocalFloors(floors.filter(f => {
        const propId = f.property?._id || f.property || "";
        return propId === selectedProperty;
      }));
    } else {
      setLocalFloors([]);
    }
  }, [selectedProperty, floors]);

  // Filter meeting rooms by property / floor
  useEffect(() => {
    let filtered = meetingRooms;
    if (selectedProperty) {
      filtered = filtered.filter(r => {
        const propId = r.property?._id || r.property || "";
        return propId === selectedProperty;
      });
    }
    if (selectedFloor) {
      filtered = filtered.filter(r => {
        const floorId = r.floor?._id || r.floor || "";
        return floorId === selectedFloor;
      });
    }
    setLocalRooms(filtered);
  }, [selectedProperty, selectedFloor, meetingRooms]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.4)", zIndex: 1040, backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="position-fixed top-0 end-0 h-100 bg-white border-start d-flex flex-column"
        style={{
          width: "350px",
          zIndex: 1050,
          boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
          fontFamily: "var(--font-geist-sans)"
        }}
      >
        {/* Header */}
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light">
          <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "1rem" }}>
            <i className="bi bi-funnel-fill text-primary me-2" />
            Filter Reservations
          </h5>
          <button
            type="button"
            className="btn-close shadow-none"
            onClick={onClose}
            style={{ cursor: "pointer" }}
          />
        </div>

        {/* Body */}
        <div className="flex-grow-1 p-4 overflow-auto">
          {/* Property Select */}
          <div className="mb-4">
            <label className="form-label small fw-bold text-secondary mb-2">Property / Building</label>
            <select
              className="form-select shadow-none"
              style={{ fontSize: "0.85rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}
              value={selectedProperty}
              onChange={(e) => {
                setSelectedProperty(e.target.value);
                setSelectedFloor("");
                setSelectedRoom("");
              }}
            >
              <option value="">-- All Properties --</option>
              {properties.map(p => (
                <option key={p._id} value={p._id}>
                  {p.propertyName}
                </option>
              ))}
            </select>
          </div>

          {/* Floor Level Select */}
          <div className="mb-4">
            <label className="form-label small fw-bold text-secondary mb-2">Floor Level</label>
            <select
              className="form-select shadow-none"
              style={{ fontSize: "0.85rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}
              disabled={!selectedProperty}
              value={selectedFloor}
              onChange={(e) => {
                setSelectedFloor(e.target.value);
                setSelectedRoom("");
              }}
            >
              <option value="">-- All Floors --</option>
              {localFloors.map(f => (
                <option key={f._id} value={f._id}>
                  {f.floorName || `Floor ${f.floorNumber}`}
                </option>
              ))}
            </select>
            {!selectedProperty && (
              <span className="text-muted" style={{ fontSize: "0.68rem" }}>
                Select a property first to view floors.
              </span>
            )}
          </div>

          {/* Room Select */}
          <div className="mb-4">
            <label className="form-label small fw-bold text-secondary mb-2">Meeting Room</label>
            <select
              className="form-select shadow-none"
              style={{ fontSize: "0.85rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
            >
              <option value="">-- All Rooms --</option>
              {(selectedProperty ? localRooms : meetingRooms).map(r => (
                <option key={r._id} value={r._id}>
                  {r.roomName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-top bg-light d-flex gap-2 justify-content-end">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3 fw-bold rounded-3"
            onClick={onReset}
          >
            Reset All
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm px-3 fw-bold text-white shadow-sm border-0 rounded-3"
            style={{ backgroundColor: "#014aad" }}
            onClick={() => {
              onApply();
              onClose();
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
