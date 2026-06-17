"""
normalizer_core.py
==================
Pure-logic extraction from opd_normalizer.py — NO tkinter, NO GUI, NO openpyxl.
Safe to import in any headless server environment (Railway, Render, etc.).

Exports:
    parse_sales_report(path)  → list[dict]
    parse_cash_register(path) → list[dict]
"""

import re
import datetime
import pandas as pd


# ─────────────────────────── helpers ────────────────────────────────────────

def get_financial_year(dt: datetime.datetime) -> str:
    if dt.month >= 4:
        y1, y2 = dt.year, dt.year + 1
    else:
        y1, y2 = dt.year - 1, dt.year
    return f"{str(y1)[-2:]}{str(y2)[-2:]}"


def extract_date_from_remarks(text: str) -> datetime.datetime | None:
    if not text:
        return None
    m = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', str(text))
    if m:
        try:
            return datetime.datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        except ValueError:
            return None
    return None


def is_case_number(val) -> bool:
    return bool(re.fullmatch(r'\d{4}/\d{5}', str(val).strip()))


def is_date_like(val) -> bool:
    return isinstance(val, datetime.datetime)


def safe_str(val) -> str:
    return "" if (val is None or (isinstance(val, float) and str(val) == "nan")) else str(val).strip()


# ─────────────────────────── parsers ────────────────────────────────────────

def parse_sales_report(path: str) -> list[dict]:
    engine = "xlrd" if path.lower().endswith(".xls") else "openpyxl"
    df = pd.read_excel(path, engine=engine, header=None)

    records = []
    current_date = None
    current_case = None
    current_patient = None
    reading_tests = False

    for _, row in df.iterrows():
        col_a = row.iloc[0] if len(row) > 0 else None
        col_f = row.iloc[5] if len(row) > 5 else None
        a = safe_str(col_a)

        if not a:
            reading_tests = False
            continue

        if is_date_like(col_a):
            current_date = col_a
            current_case = None
            current_patient = None
            reading_tests = False
            continue

        if is_case_number(a):
            current_case = a
            col_c = row.iloc[2] if len(row) > 2 else None
            current_patient = safe_str(col_c) if col_c and safe_str(col_c) else None
            reading_tests = (current_patient is not None)
            continue

        if current_date and current_case and current_patient is None:
            current_patient = a
            reading_tests = True
            continue

        if reading_tests and current_date and current_case and current_patient:
            try:
                amount = float(col_f) if col_f not in (None, "") and safe_str(col_f) else 0.0
            except (ValueError, TypeError):
                amount = 0.0

            records.append({
                "case_date":    current_date,
                "case_number":  current_case,
                "patient_name": current_patient,
                "test_name":    a,
                "test_amount":  amount,
            })

    return records


def parse_cash_register(path: str) -> list[dict]:
    engine = "xlrd" if path.lower().endswith(".xls") else "openpyxl"
    df = pd.read_excel(path, engine=engine, header=None)

    records = []

    for _, row in df.iterrows():
        col0  = row.iloc[0]  if len(row) > 0  else None
        col1  = row.iloc[1]  if len(row) > 1  else None
        col2  = row.iloc[2]  if len(row) > 2  else None
        col3  = row.iloc[3]  if len(row) > 3  else None
        col5  = row.iloc[5]  if len(row) > 5  else None
        col8  = row.iloc[8]  if len(row) > 8  else None
        col9  = row.iloc[9]  if len(row) > 9  else None
        col10 = row.iloc[10] if len(row) > 10 else None
        col12 = row.iloc[12] if len(row) > 12 else None

        if col0 is None or not isinstance(col0, (int, float)):
            continue
        try:
            serial = int(col0)
        except (ValueError, TypeError):
            continue
        if serial <= 0:
            continue

        if not is_date_like(col1):
            continue

        trans_date = col1
        raw_case = safe_str(col5)
        if not re.fullmatch(r'\d{5}', raw_case):
            continue

        remarks = safe_str(col12)
        remarks_date = extract_date_from_remarks(remarks)
        fy_date = remarks_date if remarks_date else trans_date
        fy = get_financial_year(fy_date)
        full_case_number = f"{fy}/{raw_case}"

        trans_no_clean = re.sub(r'/\d{2}-\d{2}$', '', safe_str(col2))

        try:
            income = float(col9) if col9 not in (None, "") and safe_str(col9) else 0.0
        except (ValueError, TypeError):
            income = 0.0

        try:
            discount = float(col10) if col10 not in (None, "") and safe_str(col10) else 0.0
        except (ValueError, TypeError):
            discount = 0.0

        records.append({
            "trans_date":    trans_date,
            "trans_number":  trans_no_clean,
            "patient_name":  safe_str(col3),
            "case_number":   full_case_number,
            "entry_by":      safe_str(col8),
            "income":        income,
            "discount":      discount,
            "remarks":       remarks,
        })

    return records
