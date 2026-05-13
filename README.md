# MediTrack

Post-discharge patient monitoring platform. Sends automated daily check-in messages to patients via SMS or WhatsApp (Twilio), collects symptom reports through a mobile-friendly web form, and alerts doctors when patients report critical symptoms.

---

## Structure

```
meditrack_v2/
├── backend/     Django REST API
└── frontend/    React PWA
```

---

## Quick Start (Local)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # fill in your values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_URL if needed
npm run dev
```

---

## Neon PostgreSQL Setup

1. Create a project at https://neon.tech
2. Copy the **Connection string** (psql format)
3. In `backend/.env` set:
   ```
   DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/meditrack?sslmode=require
   ```
4. Run `python manage.py migrate`

---

## Twilio SMS Setup

1. Create a Twilio account at https://twilio.com
2. Buy a phone number (or use the WhatsApp sandbox)
3. In `backend/.env` set:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+12015551234
   ```
4. In Twilio Console → Phone Numbers → your number → Messaging:
   - Set Webhook URL to: `https://your-backend.com/api/sms/webhook/`
   - Method: HTTP POST
5. Set `FRONTEND_URL` to your deployed frontend URL so SMS links work

### WhatsApp (optional)
```
TWILIO_USE_WHATSAPP=True
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

## Scheduler

The scheduler runs automatically when Django starts (APScheduler). It checks every minute and sends messages to patients whose scheduled time has arrived.

**Alternative — cron job:**
```bash
# Send every minute via cron
* * * * * cd /path/to/backend && python manage.py send_scheduled_checkins
```

---

## Deployment

### Backend (Railway / Render / Fly.io)
- Set all environment variables from `.env.example`
- Start command: `bash start.sh`
- The `start.sh` script runs migrations and starts Gunicorn automatically

### Frontend (Vercel / Netlify)
- Set `VITE_API_URL` to your backend URL
- Build command: `npm run build`
- Output directory: `dist`

### CORS
After deploying, add your frontend URL to `CORS_ALLOWED_ORIGINS` in backend `.env`.

---

## Django Admin

Access at `/admin/` — all models are registered with rich list views, search, filters, and inline editing.

---

## PWA

The frontend is a Progressive Web App. Users can install it on Android/iOS from the browser's "Add to Home Screen" option.
