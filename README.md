# SehatRecover Digital Health Portal & Mobile Triage Node

SehatRecover is a digital healthcare platform designed to streamline patient enrollment, secure clinical records vaulting, and cashless government insurance claims management. Built with a robust FastAPI python backend and an Expo React Native mobile application, the system incorporates passwordless secure authentication, an in-house rule-based AI Health Triage Engine, real-time IoMT telemetry tracking, and a simulated HIPAA-compliant cryptographic blockchain audit ledger.

---

## 🏗️ Project Architecture

```
sehatrecover/
├── backend/                  # Python FastAPI Core Server
│   ├── app.py                # Database initialization, APIs, Blockchain logic, and static routing
│   ├── ai_engine.py          # Rule-based NLP symptom checker & advanced clinical pharmacology advisor
│   └── requirements.txt      # Python package dependencies (FastAPI, Uvicorn)
├── static/                   # Web Portal Frontend (served by FastAPI)
│   ├── index.html            # Public landing page with passwordless signup & flip health card
│   ├── auth.html             # Login/Signup interface
│   ├── dashboard.html        # Interactive patient workspace (Pharmacy, Claims, Loans, Triage)
│   ├── app.js / auth.js / dashboard.js  # Frontend portal event handling and API integrations
│   └── styles.css / auth.css / dashboard.css  # Sleek dark-mode glassmorphic styling
├── mobile/                   # Expo React Native Cross-Platform Application
│   ├── App.js                # Core App container (Auth, Dashboards, NFC-share, GPS tracking)
│   └── package.json          # React Native dependencies configuration
├── renders/                  # Extracted flowchart images and design details mapped from Figma
│   └── extracted_flows.md    # Detail breakdown of Patient, Doctor, Pharmacy, and Admin pathways
├── sehatrecover.db           # SQLite database initialized with mock users and clinical records
└── README.md                 # Project handbook (this file)
```

---

## ⚡ Main Core Features

1. **Passwordless Secure Login**: Authenticate with a mobile number or email via an OTP verification flow (Bypass code: `123456` in development).
2. **National ABHA Card & State Schemes**: 1-Click Aadhaar-KYC integration links national health identities to state benefit plans (MJPJAY, Aarogyasri, CMCHIS, Chiranjeevi, BSKY) to unlock 100% cashless treatment coverage.
3. **HIPAA-Compliant Blockchain Ledger**: A cryptographic ledger tracking patient consent, clinical transactions, cashless claim settlements, and pharmacy orders to guarantee complete tamper-proof records audits.
4. **IoMT Vitals Telemetry Sync**: Simulation of real-time wearable telemetry (Heart Rate, SpO2, steps count) syncing straight to the patient registry.
5. **AI Health Advisor**: Real-time symptom checks, diet guides, and clinical department emergency routing.
6. **Smart Medical Desk & Emergency Siren**: 1-click ambulance request with real-time ETA GPS mapping tracking driver progress.
7. **Healthcare Loans & EMI Desk**: 0% APR BNPL finance generator backed by credit score simulation.

---

## 🚀 Getting Started & Setup Guide

Follow the instructions below to run the entire stack locally.

### Prerequisites
* **Node.js** (v16.0 or higher) and **npm**
* **Python** (v3.8 or higher) and **pip**

---

### Step 1: Running the Python FastAPI Backend

1. **Open your terminal** and navigate to the project root directory.
2. **Install Python dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. **Start the FastAPI server**:
   ```bash
   python -m uvicorn backend.app:app --port 8000 --reload
   ```
4. **Access the Web Applications**:
   * Public Web Portal: [http://127.0.0.1:8000](http://127.0.0.1:8000)
   * Login Interface: [http://127.0.0.1:8000/login](http://127.0.0.1:8000/login)
   * Patient Dashboard: [http://127.0.0.1:8000/dashboard](http://127.0.0.1:8000/dashboard)

*Note: The SQLite database (`sehatrecover.db`) will automatically initialize and populate itself on the first boot with initial records for patient **Anna Smith** (`SR-9982-1045-88`).*

---

### Step 2: Running the React Native Mobile App (Expo)

1. **Navigate to the `mobile` directory**:
   ```bash
   cd mobile
   ```
2. **Install Node dependencies**:
   ```bash
   npm install
   ```
3. **Configure API URL**:
   By default, the app targets `http://127.0.0.1:8000`. If you are running on a physical mobile device via Expo Go, change `DEFAULT_API_URL` at the top of [mobile/App.js](file:///d:/healthcare%20portal/mobile/App.js#L9) to your computer's local IP address (e.g., `http://192.168.1.XX:8000`).
4. **Start the Expo server**:
   ```bash
   npx expo start
   ```
5. **Run the App**:
   * Scan the QR code with your phone (requires the **Expo Go** app installed from Google Play or App Store).
   * Or press `a` in your terminal to launch it in an **Android Emulator** (requires Android Studio setup).
   * Or press `w` to test the mobile layout in your **Web Browser**.

---

## 🔑 Developer Bypass & Test Credentials

Use these pre-populated credentials to easily demo all user flows:

* **Demo Phone Number**: `9876543210`
* **Demo Email**: `anna.smith@example.com`
* **OTP Bypass Passcode**: `123456`
* **Initial Demo Card ID**: `SR-9982-1045-88` (Anna Smith)
* **Initial Rewards Balance**: `240 points` (Redeemable at the Pharmacy checkout)

---

## 🔒 Security Compliance Note
All operations are architected around HIPAA specifications. The database utilizes simulated encryption, secure timed consent tokens (NFC handshakes that expire in 15 minutes), and full decentralized blockchain integrity audit verification.
