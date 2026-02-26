const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const CSV_DIR = path.join(__dirname, '../uploads/csv');
if (!fs.existsSync(CSV_DIR)) fs.mkdirSync(CSV_DIR, { recursive: true });

const generateCSV = async (data) => {
    try {
        const fileName = `csv_${Date.now()}.csv`;
        const filePath = path.join(CSV_DIR, fileName);

        // -------------------------
        // leadData MUST be ARRAY
        // -------------------------
        const leads = Array.isArray(data.leadData) ? data.leadData : [];

        // If no leads found
        if (leads.length === 0) {
            throw new Error("No leads found to generate CSV");
        }

        // -------------------------
        // FORMAT ALL LEADS
        // -------------------------
const rows = leads.map((item) => ({
    Name: item.Name || "",
    Email: Array.isArray(item.Email) ? item.Email.join("; ") : item.Email || "",
    Phone: Array.isArray(item.Phone) ? item.Phone.join("; ") : item.Phone || "",
    Website: item.Website || "",
    City: item.City || "",
    State: item.State || "",
    Country: item.Country || "",
    Postcode: item.Postcode || "",
    Street: item.Street || "",
    OpeningHours: item.OpeningHours || "",
}));

        // -------------------------
        // CREATE CSV
        // -------------------------
        const parser = new Parser();
        const csv = parser.parse(rows);

        // Write CSV file
        fs.writeFileSync(filePath, csv);

        return `/uploads/csv/${fileName}`;
    } catch (err) {
        throw err;
    }
};

module.exports = generateCSV;
