# OPD Normalizer API

REST API that wraps `opd_normalizer.py` so your web app can upload two
raw Excel files and get back normalised JSON — no desktop Python needed.

## Files

```
opd-normalizer-api/
  app.py             ← Flask API
  opd_normalizer.py  ← your existing normalizer (unchanged)
  requirements.txt
  Procfile
  railway.toml
  README.md
```

---

## Deploy on Railway (free tier, recommended)

1. Go to https://railway.app  → sign up with GitHub (free)
2. Click **New Project → Deploy from GitHub repo**
3. Push this folder as a GitHub repo first:
   ```bash
   cd opd-normalizer-api
   git init
   git add .
   git commit -m "OPD Normalizer API"
   gh repo create opd-normalizer-api --public --source=. --push
   ```
4. In Railway, select the repo → it auto-detects Python
5. Railway gives you a URL like: `https://opd-normalizer-api-production.up.railway.app`
6. Copy that URL into your web app's `NORMALIZER_API_URL` constant

---

## Deploy on Render (alternative free option)

1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
   - **Plan**: Free
4. Copy the `.onrender.com` URL into your web app

---

## API Endpoints

### GET /health
Returns `{"status": "ok"}` — use this to verify deployment.

### POST /normalize
Upload two Excel files, get back JSON.

**Request** (multipart/form-data):
- `sales_file`  — Sales Report .xls or .xlsx
- `cash_file`   — Cash Register .xls or .xlsx

**Response**:
```json
{
  "ok": true,
  "sales_count": 142,
  "cash_count": 87,
  "data": {
    "sales": [
      { "case_date": "12-03-2026", "case_number": "2526/00594",
        "patient_name": "...", "test_name": "...", "test_amount": 500 }
    ],
    "cash": [
      { "trans_date": "12-03-2026", "trans_number": "M-000881",
        "patient_name": "...", "case_number": "2526/00594",
        "entry_by": "...", "income": 500, "discount": 50, "remarks": "" }
    ]
  }
}
```

---

## Local testing

```bash
pip install -r requirements.txt
python app.py
# Now POST to http://localhost:5000/normalize
```
