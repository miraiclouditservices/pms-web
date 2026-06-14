"use client";

import { useEffect, useState } from "react";

interface MeetingRoomFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  properties: any[];
  floors: any[];
  selectedProperty: string;
  setSelectedProperty: (val: string) => void;
  selectedFloor: string;
  setSelectedFloor: (val: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function MeetingRoomFilterDrawer({
  isOpen,
  onClose,
  properties = [],
  floors = [],
  selectedProperty,
  setSelectedProperty,
  selectedFloor,
  setSelectedFloor,
  onApply,
  onReset
}: MeetingRoomFilterDrawerProps) {
  const [localFloors, setLocalFloors] = useState<any[]>([]);

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
            Filter Rooms Master
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

          {/* Floor Select */}
          <div className="mb-4">
            <label className="form-label small fw-bold text-secondary mb-2">Floor Level</label>
            <select
              className="form-select shadow-none"
              style={{ fontSize: "0.85rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}
              disabled={!selectedProperty}
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
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
