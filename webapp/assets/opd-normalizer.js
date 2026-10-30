/*!
 * opd-normalizer.js
 * =================
 * Browser-side port of normalizer_core.py (parse_sales_report + parse_cash_register).
 * No backend required — replaces the Railway/Python API entirely.
 *
 * Depends on SheetJS (xlsx). Load before this file:
 *   <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
 * (jsDelivr/npm only mirror SheetJS up to v0.18.5 — newer builds are only
 * served from cdn.sheetjs.com, the project's own CDN.)
 *
 * Usage:
 *   const { sales, cash } = await OPDNormalizer.normalize(salesFile, cashFile);
 *   // sales -> array of {case_date, case_number, patient_name, test_name, test_amount}
 *   // cash  -> array of {trans_date, case_date, trans_number, patient_name,
 *   //                     case_number, entry_by, income, discount, remarks}
 *   // All dates are returned as 'YYYY-MM-DD' strings (or null).
 */
(function (global) {
  "use strict";

  // ─────────────────────────── helpers ────────────────────────────────────

  function safeStr(val) {
    if (val === null || val === undefined) return "";
    if (typeof val === "number" && Number.isNaN(val)) return "";
    return String(val).trim();
  }

  function isDateLike(val) {
    return val instanceof Date && !Number.isNaN(val.getTime());
  }

  function isCaseNumber(val) {
    return /^\d{4}\/\d{5}$/.test(String(val).trim());
  }

  function makeDateSafe(year, month1to12, day) {
    // month1to12 is 1-based (like the python code's m.group(2))
    const d = new Date(year, month1to12 - 1, day);
    // guard against JS's date rollover for invalid dates (e.g. 31/02/2026)
    if (
      d.getFullYear() !== year ||
      d.getMonth() !== month1to12 - 1 ||
      d.getDate() !== day
    ) {
      return null;
    }
    return d;
  }

  function extractDateFromRemarks(text) {
    if (!text) return null;
    const m = String(text).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) return null;
    return makeDateSafe(parseInt(m[3], 10), parseInt(m[2], 10), parseInt(m[1], 10));
  }

  function parseDDMMYYYY(text) {
    const s = safeStr(text);
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    return makeDateSafe(parseInt(m[3], 10), parseInt(m[2], 10), parseInt(m[1], 10));
  }

  function getFinancialYear(dt) {
    let y1, y2;
    if (dt.getMonth() + 1 >= 4) {
      y1 = dt.getFullYear();
      y2 = dt.getFullYear() + 1;
    } else {
      y1 = dt.getFullYear() - 1;
      y2 = dt.getFullYear();
    }
    return `${String(y1).slice(-2)}${String(y2).slice(-2)}`;
  }

  function toISO(d) {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function toNumber(val) {
    if (val === null || val === undefined || safeStr(val) === "") return 0.0;
    const n = typeof val === "number" ? val : parseFloat(val);
    return Number.isNaN(n) ? 0.0 : n;
  }

  // ─────────────────────────── sheet reading ──────────────────────────────

  function fileToRows(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: "array", cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: null,
            raw: true,
          });
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error || new Error("File read failed"));
      reader.readAsArrayBuffer(file);
    });
  }

  // ─────────────────────────── parsers ────────────────────────────────────

  function parseSalesReport(rows) {
    const records = [];
    let currentDate = null;
    let currentCase = null;
    let currentPatient = null;
    let readingTests = false;

    for (const row of rows) {
      const colA = row[0] ?? null;
      const colF = row[5] ?? null;
      const a = safeStr(colA);

      if (!a) {
        readingTests = false;
        continue;
      }

      if (isDateLike(colA)) {
        currentDate = colA;
        currentCase = null;
        currentPatient = null;
        readingTests = false;
        continue;
      }

      if (isCaseNumber(a)) {
        currentCase = a;
        const colC = row[2] ?? null;
        currentPatient = colC && safeStr(colC) ? safeStr(colC) : null;
        readingTests = currentPatient !== null;
        continue;
      }

      if (currentDate && currentCase && currentPatient === null) {
        currentPatient = a;
        readingTests = true;
        continue;
      }

      if (readingTests && currentDate && currentCase && currentPatient) {
        records.push({
          case_date: toISO(currentDate),
          case_number: currentCase,
          patient_name: currentPatient,
          test_name: a,
          test_amount: toNumber(colF),
        });
      }
    }

    return records;
  }

  function parseCashRegister(rows) {
    const records = [];
    let currentTransDate = null; // forward-filled from the date-block header

    for (const row of rows) {
      const col0 = row[0] ?? null;
      const col1 = row[1] ?? null; // case date
      const col2 = row[2] ?? null; // trans no
      const col3 = row[3] ?? null; // patient name
      const col5 = row[5] ?? null; // case no (raw)
      const col8 = row[8] ?? null; // entry_by
      const col9 = row[9] ?? null; // income
      const col10 = row[10] ?? null; // discount
      const col12 = row[12] ?? null; // remarks

      // New date-block header row, e.g. '17/06/2026' as a plain string.
      const blockDate = parseDDMMYYYY(col0);
      if (blockDate !== null) {
        currentTransDate = blockDate;
        continue;
      }

      if (col0 === null || typeof col0 !== "number") continue;
      const serial = Math.trunc(col0);
      if (Number.isNaN(serial) || serial <= 0) continue;

      // Skip data rows we haven't seen a date-block header for yet
      if (currentTransDate === null) continue;
      const transDate = currentTransDate;

      const caseDate = isDateLike(col1) ? col1 : null;

      const rawCase = safeStr(col5);
      if (!/^\d{5}$/.test(rawCase)) continue;

      const remarks = safeStr(col12);
      const remarksDate = extractDateFromRemarks(remarks);
      // FY is determined by case date, falling back to the transaction date.
      const fyDate = remarksDate || caseDate || transDate;
      const fy = getFinancialYear(fyDate);
      const fullCaseNumber = `${fy}/${rawCase}`;

      const transNoClean = safeStr(col2).replace(/\/\d{2}-\d{2}$/, "");

      records.push({
        trans_date: toISO(transDate),
        case_date: toISO(caseDate),
        trans_number: transNoClean,
        patient_name: safeStr(col3),
        case_number: fullCaseNumber,
        entry_by: safeStr(col8),
        income: toNumber(col9),
        discount: toNumber(col10),
        remarks: remarks,
      });
    }

    return records;
  }

  // ─────────────────────────── public API ─────────────────────────────────

  async function normalize(salesFile, cashFile) {
    if (typeof XLSX === "undefined") {
      throw new Error(
        "SheetJS (xlsx) is not loaded. Add <script src='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'></script> before opd-normalizer.js"
      );
    }
    const [salesRows, cashRows] = await Promise.all([
      fileToRows(salesFile),
      fileToRows(cashFile),
    ]);
    return {
      sales: parseSalesReport(salesRows),
      cash: parseCashRegister(cashRows),
    };
  }

  global.OPDNormalizer = {
    normalize,
    parseSalesReport,
    parseCashRegister,
    // exposed for debugging/testing
    _internal: { safeStr, isDateLike, isCaseNumber, getFinancialYear, toISO },
  };
})(typeof window !== "undefined" ? window : globalThis);
