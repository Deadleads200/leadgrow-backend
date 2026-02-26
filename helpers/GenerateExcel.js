const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const EXCEL_DIR = path.join(__dirname, '../uploads/excel');
if (!fs.existsSync(EXCEL_DIR)) fs.mkdirSync(EXCEL_DIR, { recursive: true });

const generateExcel = async (data) => {
    try {
        const fileName = `excel_${Date.now()}.xlsx`;
        const filePath = path.join(EXCEL_DIR, fileName);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Lead Report');

        let allHeaders = new Set();
        let finalRows = [];

        // -----------------------------
        // FLATTEN OBJECT FUNCTION
        // -----------------------------
        const flattenObject = (prefix, obj, flat) => {
            if (!obj || typeof obj !== "object") return;

            Object.entries(obj).forEach(([key, value]) => {
                        if (key === "type") return; 

                const finalKey = `${key}`;
                const val =
                    value === undefined || value === null
                        ? "-"
                        : Array.isArray(value)
                        ? value.join(", ")
                        : typeof value === "object"
                        ? JSON.stringify(value)
                        : value;

                flat[finalKey] = val;
                allHeaders.add(finalKey);
            });
        };

        // ----------------------------------------------------
        // EXPECTED STRUCTURE:
        // ----------------------------------------------------
        const leadArr = Array.isArray(data.leadData) ? data.leadData : [];
        const geoArr = Array.isArray(data.geoJsonData) ? data.geoJsonData : [];

        // ----------------------------------------------------
        // BUILD ROWS
        // ----------------------------------------------------
        leadArr.forEach((lead, index) => {
            let rowData = {};

            // Lead part
            flattenObject("lead", lead, rowData);

            // Matching geoJson → same index (if exists)
            if (geoArr[index]?.properties) {
                flattenObject("geo", geoArr[index].properties, rowData);
            }

            finalRows.push(rowData);
        });

        // -----------------------------
        // HEADER ROW
        // -----------------------------
        const headers = Array.from(allHeaders);
        const headerRow = sheet.addRow(headers);

        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1F4E78' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // -----------------------------
        // MULTIPLE ROWS
        // -----------------------------
        finalRows.forEach((rowObj) => {
            const rowValues = headers.map((h) => rowObj[h] || "-");
            const row = sheet.addRow(rowValues);

            row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // -----------------------------
        // AUTO WIDTH
        // -----------------------------
        sheet.columns.forEach((col) => {
            let maxLen = 15;
            col.eachCell({ includeEmpty: true }, (cell) => {
                const len = cell.value ? cell.value.toString().length : 0;
                if (len > maxLen) maxLen = len;
            });
            col.width = maxLen + 8;
        });

        await workbook.xlsx.writeFile(filePath);
        return `/uploads/excel/${fileName}`;

    } catch (err) {
        console.log(" Excel Error:", err);
        throw err;
    }
};

module.exports = generateExcel;
