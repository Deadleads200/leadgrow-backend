const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const PDF_DIR = path.join(__dirname, '../uploads/pdf');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

const generatePDF = async (data, headerTitle, filePrefix="pdf") => {
    return new Promise((resolve, reject) => {
        try {
            const fileName = `${filePrefix}_${Date.now()}.pdf`;
            const filePath = path.join(PDF_DIR, fileName);

            const doc = new PDFDocument({
                margin: 40,
                size: "A4",
                bufferPages: true
            });

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // -------------------------------
            // COLORS + UI CONSTANTS
            // -------------------------------
            const HEADER_TEXT = "#2c3e50";
            const KEY_BG = "#f1f3f5";
            const VAL_BG = "#ffffff";
            const BORDER_COLOR = "#dee2e6";
            const TEXT_COLOR = "#333333";

            const START_X = 40;
            const PAGE_WIDTH = 595.28;
            const USABLE_WIDTH = PAGE_WIDTH - (START_X * 2);

            const COLS_PER_ROW = 2;
            const TOTAL_COL_WIDTH = USABLE_WIDTH / COLS_PER_ROW;

            const KEY_WIDTH = 90;
            const VAL_WIDTH = TOTAL_COL_WIDTH - KEY_WIDTH;

            const PADDING = 6;
            const FONT_SIZE = 10;

            const cleanValue = (v) => {
                if (v === undefined || v === null || v === "") return "-";
                if (Array.isArray(v)) return v.join(", ");
                if (typeof v === "object") {
                    return Object.entries(v)
                        .map(([k, val]) => `${k}: ${val}`).join(", ");
                }
                return String(v);
            };

            // -------------------------------
            // HEADER
            // -------------------------------
            const drawMainHeader = () => {
                doc.fillColor(HEADER_TEXT)
                    .fontSize(20)
                    .font("Helvetica-Bold")
                    .text(headerTitle , { align: "center" });

                doc.moveDown(0.5);
                doc.lineWidth(2).strokeColor('#3498db')
                    .moveTo(START_X, doc.y).lineTo(START_X + USABLE_WIDTH, doc.y).stroke();
                doc.moveDown(2);
            };

            // -------------------------------
            // SECTION TITLE
            // -------------------------------
            const drawSectionTitle = (title) => {
                if (doc.y > 700) doc.addPage();

                doc.fillColor(HEADER_TEXT)
                    .fontSize(14)
                    .font("Helvetica-Bold")
                    .text(title, START_X, doc.y);

                doc.rect(START_X, doc.y + 5, USABLE_WIDTH, 1)
                    .fill(BORDER_COLOR);

                doc.moveDown(1.5);
            };

            // -------------------------------
            // TABLE DRAWER (UI SAME)
            // -------------------------------
            const drawSideBySideTable = (obj) => {
                    const entries = Object.entries(obj).filter(([key, _]) => key !== "type");

                for (let i = 0; i < entries.length; i += COLS_PER_ROW) {
                    let startY = doc.y;

                    const rowItems = entries.slice(i, i + COLS_PER_ROW);

                    doc.font("Helvetica").fontSize(FONT_SIZE);

                    let maxRowHeight = 15;

                    rowItems.forEach(([key, val]) => {
                        const valText = cleanValue(val);

                        const hKey = doc.heightOfString(key, { width: KEY_WIDTH - PADDING });
                        const hVal = doc.heightOfString(valText, { width: VAL_WIDTH - PADDING });

                        const itemHeight = Math.max(hKey, hVal);
                        if (itemHeight > maxRowHeight) maxRowHeight = itemHeight;
                    });

                    const totalRowHeight = maxRowHeight + (PADDING * 2);

                    if (startY + totalRowHeight > doc.page.height - 50) {
                        doc.addPage();
                        startY = doc.y;
                    }

                    rowItems.forEach(([key, val], index) => {
                        const currentX = START_X + (index * TOTAL_COL_WIDTH);
                        const valText = cleanValue(val);

                        doc.rect(currentX, startY, KEY_WIDTH, totalRowHeight)
                            .fillAndStroke(KEY_BG, BORDER_COLOR);

                        doc.fillColor(HEADER_TEXT).font("Helvetica-Bold").fontSize(FONT_SIZE)
                            .text(key, currentX + PADDING, startY + PADDING, {
                                width: KEY_WIDTH - PADDING,
                                align: 'left'
                            });

                        doc.rect(currentX + KEY_WIDTH, startY, VAL_WIDTH, totalRowHeight)
                            .fillAndStroke(VAL_BG, BORDER_COLOR);

                        doc.fillColor(TEXT_COLOR).font("Helvetica").fontSize(FONT_SIZE)
                            .text(valText, currentX + KEY_WIDTH + PADDING, startY + PADDING, {
                                width: VAL_WIDTH - PADDING,
                                align: 'left'
                            });
                    });

                    if (rowItems.length < COLS_PER_ROW) {
                        const currentX = START_X + TOTAL_COL_WIDTH;
                        doc.rect(currentX, startY, KEY_WIDTH, totalRowHeight).stroke(BORDER_COLOR);
                        doc.rect(currentX + KEY_WIDTH, startY, VAL_WIDTH, totalRowHeight).stroke(BORDER_COLOR);
                    }

                    doc.y = startY + totalRowHeight;
                }
            };

            // -------------------------------
            // START GENERATION
            // -------------------------------
            drawMainHeader();

            let index = 1;

            // EACH GEOJSON OBJECT = NEW TABLE
            if (Array.isArray(data.leadData)) {
                data.leadData.forEach((obj) => {
                    drawSideBySideTable(obj);
                    doc.moveDown(1.5);
                    index++;
                });
            }



            doc.end();

            stream.on('finish', () => resolve(`/uploads/pdf/${fileName}`));
            stream.on('error', reject);

        } catch (err) {
            reject(err);
        }
    });
};

module.exports = generatePDF;
