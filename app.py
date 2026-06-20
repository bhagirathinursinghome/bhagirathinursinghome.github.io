"""
OPD Normalizer API
==================
Flask-based REST API that wraps opd_normalizer.py so the web app can
send two raw Excel files and get back the merged/normalised JSON.

POST /normalize
  multipart/form-data:
    sales_file  : Sales Report (.xls/.xlsx)
    cash_file   : Cash Register (.xls/.xlsx)

Response 200:
  {
    "sales":  [ { case_date, case_number, patient_name, test_name, test_amount } ],
    "cash":   [ { trans_date, case_date, trans_number, patient_name, case_number,
                  entry_by, income, discount, remarks } ]
  }
  Note: for "cash", trans_date is the real transaction/receipt date
  (forward-filled from the Cash Register's Column A date-block header) and
  case_date is the underlying case's own date (Column B, "Case Dt") —
  these can differ for old dues collected on a later day.

GET /health  → { "status": "ok" }
"""

import os
import io
import json
import tempfile
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

from normalizer_core import parse_sales_report, parse_cash_register

app = Flask(__name__)

# Allow requests from any origin (your web app's domain)
CORS(app, resources={r"/*": {"origins": "*"}})


def _dt_serial(obj):
    """JSON serializer for datetime objects."""
    if isinstance(obj, datetime.datetime):
        return obj.strftime("%d-%m-%Y")
    raise TypeError(f"Not serializable: {type(obj)}")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "OPD Normalizer API"})


@app.route("/normalize", methods=["POST"])
def normalize():
    # ── Validate inputs ──────────────────────────────────────────────────
    if "sales_file" not in request.files:
        return jsonify({"error": "Missing sales_file"}), 400
    if "cash_file" not in request.files:
        return jsonify({"error": "Missing cash_file"}), 400

    sales_file = request.files["sales_file"]
    cash_file = request.files["cash_file"]

    # ── Save to temp files (parsers need a real path) ────────────────────
    s_suffix = ".xlsx" if sales_file.filename.endswith(".xlsx") else ".xls"
    c_suffix = ".xlsx" if cash_file.filename.endswith(".xlsx") else ".xls"

    with tempfile.NamedTemporaryFile(delete=False, suffix=s_suffix) as sf:
        sales_file.save(sf.name)
        sales_path = sf.name

    with tempfile.NamedTemporaryFile(delete=False, suffix=c_suffix) as cf:
        cash_file.save(cf.name)
        cash_path = cf.name

    try:
        # ── Parse ────────────────────────────────────────────────────────
        sales_records = parse_sales_report(sales_path)
        cash_records  = parse_cash_register(cash_path)

        # ── Serialize (convert datetimes) ────────────────────────────────
        result = json.loads(
            json.dumps(
                {"sales": sales_records, "cash": cash_records},
                default=_dt_serial
            )
        )

        return jsonify({
            "ok": True,
            "sales_count": len(sales_records),
            "cash_count":  len(cash_records),
            "data": result
        })

    except Exception as exc:
        import traceback
        return jsonify({
            "error": str(exc),
            "trace": traceback.format_exc()
        }), 500

    finally:
        try:
            os.unlink(sales_path)
            os.unlink(cash_path)
        except OSError:
            pass


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
