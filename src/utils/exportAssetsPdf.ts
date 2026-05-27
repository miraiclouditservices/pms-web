export const exportAssetsToPdf = (dataToExport: any[], totalValue: number) => {
  if (!dataToExport || dataToExport.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to generate the PDF.");
    return;
  }

  // Deduce main property for watermark (defaulting to the first asset's property or a generic string)
  const mainProperty = dataToExport[0]?.property?.propertyName || 'Enterprise Assets';

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Assets Management Report</title>
      <style>
        :root {
          --primary-color: #014aad;
          --secondary-color: #64748b;
          --bg-light: #f8fafc;
          --border-color: #e2e8f0;
        }

        @page {
          margin: 15mm;
          size: A4 landscape;
        }

        body {
          font-family: 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          line-height: 1.5;
          margin: 0;
          padding: 0;
          background-color: white;
          position: relative;
        }

        /* Modern Watermark */
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 8rem;
          font-weight: 900;
          color: rgba(1, 74, 173, 0.03); /* Extremely faint primary color */
          white-space: nowrap;
          z-index: -1;
          pointer-events: none;
          text-transform: uppercase;
          letter-spacing: -2px;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 3px solid var(--primary-color);
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .header-content h1 {
          margin: 0;
          font-size: 28px;
          color: var(--primary-color);
          letter-spacing: -0.5px;
        }

        .header-content p {
          margin: 5px 0 0 0;
          color: var(--secondary-color);
          font-size: 14px;
        }

        .meta-box {
          background: var(--bg-light);
          border: 1px solid var(--border-color);
          padding: 15px 20px;
          border-radius: 8px;
          text-align: right;
        }

        .meta-box .label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--secondary-color);
          margin-bottom: 4px;
        }

        .meta-box .value {
          font-size: 20px;
          font-weight: 700;
          color: var(--primary-color);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 40px;
        }

        th {
          background-color: var(--bg-light);
          color: var(--secondary-color);
          font-weight: 600;
          text-align: left;
          padding: 12px 15px;
          border-bottom: 2px solid var(--border-color);
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }

        td {
          padding: 12px 15px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: top;
        }

        tr:nth-child(even) td {
          background-color: rgba(248, 250, 252, 0.4);
        }

        /* Value Column specific styling */
        .financial-col {
          font-weight: 600;
          color: #0f172a;
        }

        /* Creator Column specific styling */
        .creator-name {
          font-weight: 600;
          display: block;
        }
        .creator-contact {
          font-size: 10px;
          color: var(--secondary-color);
          margin-top: 3px;
          display: block;
        }

        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
          text-align: center;
          font-size: 10px;
          color: var(--secondary-color);
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Ensure watermark breaks pages nicely or covers all pages */
          .watermark {
            display: block;
          }
        }
      </style>
    </head>
    <body>
      <div class="watermark">${mainProperty}</div>
      
      <header>
        <div class="header-content">
          <h1>Assets Management Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        <div class="meta-box">
          <span class="label">Total Asset Value</span>
          <span class="value">₹ ${totalValue.toLocaleString()}</span>
        </div>
      </header>

      <table>
        <thead>
          <tr>
            <th style="width: 15%">Asset Code</th>
            <th style="width: 20%">Description & Category</th>
            <th style="width: 20%">Location Details</th>
            <th style="width: 15%">Financials</th>
            <th style="width: 15%">Lifecycle</th>
            <th style="width: 15%">Registered By</th>
          </tr>
        </thead>
        <tbody>
          ${dataToExport.map(a => {
            const creatorName = a.createdBy ? (typeof a.createdBy === 'object' ? a.createdBy.name : 'System') : 'System';
            const creatorContact = a.createdBy ? (typeof a.createdBy === 'object' ? (a.createdBy.email || a.createdBy.phoneNumber || 'N/A') : 'N/A') : 'N/A';
            const propertyName = a.property?.propertyName || 'Main Complex';
            const floorNum = a.floorNumber || '0';
            const wDate = a.warrantyEndDate ? new Date(a.warrantyEndDate).toLocaleDateString() : 'N/A';
            const aDate = a.amcEndDate ? new Date(a.amcEndDate).toLocaleDateString() : 'N/A';
            
            return `
            <tr>
              <td><strong style="color: var(--primary-color)">${a.assetCode}</strong></td>
              <td>
                <span style="display: block; font-weight: 600;">${a.assetDescription}</span>
                <span style="font-size: 10px; color: var(--secondary-color); background: var(--bg-light); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color); display: inline-block; margin-top: 4px;">${a.category}</span>
              </td>
              <td>
                <span style="display: block; font-weight: 500;">${propertyName}</span>
                <span style="font-size: 10px; color: var(--secondary-color); display: block; margin-top: 2px;">Floor ${floorNum}</span>
              </td>
              <td class="financial-col">
                <span style="display: block;">₹ ${a.purchaseValue?.toLocaleString() || 0}</span>
                <span style="font-size: 10px; color: var(--secondary-color); font-weight: 400; display: block; margin-top: 2px;">Purchased: ${a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : 'N/A'}</span>
              </td>
              <td>
                <span style="display: block; font-size: 11px;">Warranty: <strong>${wDate}</strong></span>
                <span style="display: block; font-size: 11px; margin-top: 3px;">AMC: <strong>${aDate}</strong></span>
              </td>
              <td>
                <span class="creator-name">${creatorName}</span>
                <span class="creator-contact">${creatorContact}</span>
              </td>
            </tr>
          `}).join('')}
        </tbody>
      </table>

      <div class="footer">
        Strictly Confidential &bull; Property & Asset Management System &bull; Page 1 of 1
      </div>

      <script>
        // Use timeout to ensure fonts and styles render before print dialog opens
        setTimeout(() => {
          window.print();
          // Optionally auto-close after print, but often better to let user manually close if they want to save as PDF
        }, 500);
      </script>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};
