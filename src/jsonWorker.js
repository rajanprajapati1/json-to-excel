import * as XLSX from 'xlsx';
import { flattenJSON, normalizeJSON } from './utils';

let processedData = null;

self.onmessage = async (e) => {
  const { command, fileData } = e.data;

  try {
    if (command === 'preview') {
      let rawData;
      try {
        rawData = JSON.parse(fileData);
      } catch (parseError) {
        throw new Error("Invalid JSON format. Please check the file syntax.");
      }

      const validData = normalizeJSON(rawData);

      if (validData.length === 0) {
        throw new Error("Could not find any convertible data in this JSON.");
      }

      processedData = validData;

      self.postMessage({
        status: 'preview',
        fileDetails: {
          recordCount: processedData.length,
          fileSize: fileData.length,
          fileName: 'uploaded.json' // In a real app, you'd pass the file name
        }
      });
    } else if (command === 'convert') {
      if (!processedData) {
        throw new Error("No data available to convert. Please upload a file first.");
      }

      const flatData = flattenJSON(processedData);

      const wb = XLSX.utils.book_new();
      const MAX_ROWS = 1048576; // Excel's row limit
      const totalChunks = Math.ceil(flatData.length / MAX_ROWS);

      for (let i = 0; i < totalChunks; i++) {
        const chunk = flatData.slice(i * MAX_ROWS, (i + 1) * MAX_ROWS);
        const ws = XLSX.utils.json_to_sheet(chunk);

        const colWidths = Object.keys(chunk[0] || {}).map(key => ({ wch: Math.max(key.length, 20) }));
        ws['!cols'] = colWidths;

        const sheetName = totalChunks > 1 ? `Sheet_${i + 1}` : "Data";
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      self.postMessage({ status: 'success', data: excelBuffer });
      processedData = null; // Clear data after conversion
    }
  } catch (error) {
    self.postMessage({ status: 'error', message: error.message });
  }
};