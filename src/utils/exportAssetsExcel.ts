export const exportAssetsToExcel = (dataToExport: any[]) => {
  if (!dataToExport || dataToExport.length === 0) return;

  const headers = [
    "Asset Code",
    "Description",
    "Category",
    "Property Name",
    "Floor",
    "Unit",
    "Location specific",
    "Purchase Value",
    "Purchase Date",
    "Warranty Status",
    "AMC Status",
    "Created By Name",
    "Created By Contact"
  ].join(",");

  const rows = dataToExport.map(a => {
    const pVal = a.purchaseValue || 0;
    const pDate = a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : 'N/A';
    
    // Extract Property / Location info
    const propertyName = a.property?.propertyName || 'Main Complex';
    const floor = a.floorNumber || '0';
    const unit = a.unit?.unitNumber || 'N/A';
    const specificLoc = a.assetLocation || 'N/A';

    // Extract Creator
    const cName = a.createdBy ? (typeof a.createdBy === 'object' ? a.createdBy.name : 'System') : 'System';
    const cContact = a.createdBy ? (typeof a.createdBy === 'object' ? (a.createdBy.email || a.createdBy.phoneNumber || 'N/A') : 'N/A') : 'N/A';
    
    // Extract Warranty / AMC
    const wEndDate = a.warrantyEndDate ? new Date(a.warrantyEndDate).toLocaleDateString() : 'N/A';
    const amcEndDate = a.amcEndDate ? new Date(a.amcEndDate).toLocaleDateString() : 'N/A';

    // Escape fields to avoid CSV breakage
    const escapeCsv = (str: string | number) => `"${String(str).replace(/"/g, '""')}"`;

    return [
      escapeCsv(a.assetCode || ''),
      escapeCsv(a.assetDescription || ''),
      escapeCsv(a.category || ''),
      escapeCsv(propertyName),
      escapeCsv(floor),
      escapeCsv(unit),
      escapeCsv(specificLoc),
      escapeCsv(pVal),
      escapeCsv(pDate),
      escapeCsv(wEndDate),
      escapeCsv(amcEndDate),
      escapeCsv(cName),
      escapeCsv(cContact)
    ].join(",");
  });

  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Assets_Export_${new Date().toISOString().substring(0, 10)}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
