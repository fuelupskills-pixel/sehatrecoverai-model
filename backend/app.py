import os
import uuid
import random
import hashlib
import time
import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from backend.ai_engine import ai_engine

app = FastAPI(
    title="SehatRecover Core API Engine",
    description="Python backend serving SehatRecover static UI, passwordless auth, persistent blockchain ledger, IoMT sync, care bookings, and AI health advice",
    version="2.0.0"
)

# Enable CORS for React Native mobile integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "sehatrecover.db"

def get_db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- CRYPTOGRAPHIC SIMULATED BLOCKCHAIN IMPLEMENTATION ---
class Block:
    def __init__(self, index, timestamp, data, previous_hash):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        payload = f"{self.index}{self.timestamp}{self.data}{self.previous_hash}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def log_blockchain_txn(action_type, details):
    block_data = {
        "action": action_type,
        "details": details,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    conn = get_db_conn()
    cursor = conn.cursor()
    
    # Get latest block
    cursor.execute("SELECT * FROM blockchain ORDER BY block_index DESC LIMIT 1")
    latest = cursor.fetchone()
    
    new_index = 0
    prev_hash = "0"
    if latest:
        new_index = latest["block_index"] + 1
        prev_hash = latest["hash"]
        
    new_block = Block(new_index, time.time(), str(block_data), prev_hash)
    
    cursor.execute(
        "INSERT INTO blockchain (block_index, timestamp, data, previous_hash, hash) VALUES (?, ?, ?, ?, ?)",
        (new_block.index, new_block.timestamp, new_block.data, new_block.previous_hash, new_block.hash)
    )
    conn.commit()
    conn.close()
    
    # Replace ₹ to Rs. for console print
    safe_data = str(block_data).replace("₹", "Rs.")
    print(f"\n[BLOCKCHAIN LEDGER] Block #{new_block.index} minted. Hash: {new_block.hash[:16]}...\n")
    return new_block

# State Scheme Configurations
STATE_SCHEMES = {
    "mjpjay": {
        "name": "MJPJAY (Mahatma Jyotiba Phule Jan Arogya Yojana - Maharashtra)",
        "balance": "Rs.5,00,000",
        "badge": "MJPJAY LINKED"
    },
    "aarogyasri": {
        "name": "Dr. YSR Aarogyasri Health Scheme (Andhra Pradesh)",
        "balance": "Rs.10,00,000",
        "badge": "AAROGYASRI LINKED"
    },
    "cmchis": {
        "name": "CMCHIS (Chief Minister's Comprehensive Health Insurance Scheme - Tamil Nadu)",
        "balance": "Rs.5,00,000",
        "badge": "CMCHIS LINKED"
    },
    "chiranjeevi": {
        "name": "Chiranjeevi Swasthya Bima Yojana (Rajasthan)",
        "balance": "Rs.25,00,000",
        "badge": "CHIRANJEEVI LINKED"
    },
    "bsky": {
        "name": "BSKY (Biju Swasthya Kalyan Yojana - Odisha)",
        "balance": "Rs.5,00,000 (Rs.10,00,000 for female members)",
        "badge": "BSKY LINKED"
    }
}


# --- DATABASE INITIALIZATION ON STARTUP ---
@app.on_event("startup")
def setup_sqlite_database():
    conn = get_db_conn()
    cursor = conn.cursor()
    
    # Create Tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medications (
        key TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        advantage TEXT,
        side_effects TEXT,
        precautions TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        contact TEXT PRIMARY KEY,
        fullName TEXT,
        healthId TEXT,
        token TEXT,
        qrCodeData TEXT,
        abhaLinked INTEGER DEFAULT 0
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS abha_profiles (
        userId TEXT PRIMARY KEY,
        abhaNumber TEXT,
        abhaAddress TEXT,
        kycStatus TEXT,
        linkedScheme TEXT,
        insuranceBalance TEXT,
        governmentBenefitsActive INTEGER DEFAULT 1,
        badgeText TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        provider TEXT,
        service TEXT,
        amount TEXT,
        status TEXT,
        scheme TEXT,
        date TEXT,
        blockHeight INTEGER
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        type TEXT,
        provider TEXT,
        date TEXT,
        time TEXT,
        status TEXT,
        details TEXT,
        videoUrl TEXT,
        callUrl TEXT,
        reminderTime TEXT,
        reminderActive INTEGER DEFAULT 0
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        prescriptionId TEXT,
        medications TEXT,
        originalPrice REAL,
        discount REAL,
        finalPrice REAL,
        status TEXT,
        date TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prescriptions (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        patientName TEXT,
        doctorName TEXT,
        medications TEXT,
        status TEXT,
        date TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        fileName TEXT,
        fileType TEXT,
        fileSize TEXT,
        category TEXT,
        date TEXT,
        folder TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fitness_bookings (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        type TEXT,
        name TEXT,
        date TEXT,
        time TEXT,
        price TEXT,
        status TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        amount REAL,
        collateralPolicy TEXT,
        tenureMonths INTEGER,
        monthlyEmi REAL,
        status TEXT,
        date TEXT,
        interestRate TEXT
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ambulance_bookings (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        ambulanceType TEXT,
        pickupAddress TEXT,
        status TEXT,
        etaMinutes INTEGER,
        driverName TEXT,
        driverContact TEXT,
        vehicleNumber TEXT,
        date TEXT,
        timestamp REAL
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wholesale_orders (
        id TEXT PRIMARY KEY,
        pharmacyId TEXT,
        item TEXT,
        formulation TEXT,
        quantity INTEGER,
        totalAmount REAL,
        status TEXT,
        date TEXT,
        timestamp REAL
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blockchain (
        block_index INTEGER PRIMARY KEY,
        timestamp REAL,
        data TEXT,
        previous_hash TEXT,
        hash TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS otps (
        contact TEXT PRIMARY KEY,
        otp TEXT,
        timestamp REAL
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hospitals (
        id TEXT PRIMARY KEY,
        name TEXT,
        city TEXT,
        type TEXT,
        insurers TEXT,
        cashless INTEGER DEFAULT 1,
        rating TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blood_requests (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        patientName TEXT,
        contact TEXT,
        email TEXT,
        bloodGroup TEXT,
        existingIllness TEXT,
        testReportName TEXT,
        status TEXT,
        date TEXT,
        timestamp REAL
    )""")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        doctorName TEXT,
        sender TEXT,
        message TEXT,
        timestamp REAL,
        date TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS diagnostics_bookings (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        testName TEXT,
        provider TEXT,
        price REAL,
        status TEXT,
        date TEXT,
        time TEXT,
        agentName TEXT,
        agentContact TEXT,
        agentEta INTEGER,
        timestamp REAL
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS partner_lab_rates (
        id TEXT PRIMARY KEY,
        labName TEXT,
        testCode TEXT,
        testName TEXT,
        basePrice REAL,
        customPrice REAL,
        parameters TEXT
    )""")
    
    # Dynamic DB Migrations for Bookings (Add video call, voice call, and reminder configurations)
    for col_name, col_type in [
        ("videoUrl", "TEXT"),
        ("callUrl", "TEXT"),
        ("reminderTime", "TEXT"),
        ("reminderActive", "INTEGER DEFAULT 0")
    ]:
        try:
            cursor.execute(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass # column already exists
            
    conn.commit()
    
    # Pre-populate demo user if none exists
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        print("[DATABASE INIT] Inserting default demo patients and historical records...")
        
        # Insert Medications
        meds = [
            ("amoxicillin", "Amoxicillin 500mg", "Antibiotic (Penicillin class)", "Highly effective at destroying broad-spectrum bacteria. Commonly used to treat respiratory infections, strep throat, dental abscesses, and urinary tract infections.", "Mild nausea, diarrhea, abdominal discomfort, skin rashes, or allergic reactions (if sensitive to penicillin).", "Complete the full prescribed course even if symptoms disappear. Do not take if you have a known penicillin allergy. Take with meals to reduce gastrointestinal side effects."),
            ("metformin", "Metformin 500mg", "Antidiabetic (Biguanide class)", "Lowers blood glucose levels by improving insulin sensitivity, decreasing hepatic glucose production, and delaying intestinal glucose absorption. Standard first-line treatment for Type 2 Diabetes.", "Metallic taste in mouth, nausea, loss of appetite, bloating, mild abdominal pain, or diarrhea (temporary).", "Take with meals (breakfast/dinner) to minimize stomach issues. Limit alcohol consumption to prevent lactic acidosis risks. Monitor kidney functions annually."),
            ("paracetamol", "Paracetamol 650mg", "Analgesic & Antipyretic", "Provides rapid relief for mild-to-moderate physical pain (headaches, muscle aches, toothaches, joint stiffness) and reduces fever by acting on heat-regulating centers in the brain.", "Rare when taken at recommended dosages. Extremely high doses can lead to severe liver toxicity.", "Max daily intake is 4,000mg (4g) for adults. Do not combine with other paracetamol-containing OTC remedies. Maintain a gap of 4 to 6 hours between doses."),
            ("atorvastatin", "Atorvastatin 10mg", "Statin (HMG-CoA Reductase Inhibitor)", "Lowers 'bad' LDL cholesterol and triglycerides while increasing 'good' HDL cholesterol. Reduces the risks of heart attacks, angina, and cardiovascular strokes.", "Mild muscle aches (myalgia), headache, nasal congestion, or slight elevations in liver enzymes.", "Take once daily, preferably in the evening. Avoid excessive grapefruit juice. Report any unexplained, severe muscle pain or weakness immediately to your doctor.")
        ]
        cursor.executemany("INSERT INTO medications VALUES (?, ?, ?, ?, ?, ?)", meds)


        # Insert Anna Smith Profiles (phone and email mappings)
        p_anna = ("Anna Smith", "SR-9982-1045-88", "mock-token-anna-smith", "sehatrecover://card/verify?id=SR-9982-1045-88&name=Anna%20Smith", 0)
        cursor.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)", ("9876543210",) + p_anna)
        cursor.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)", ("anna.smith@example.com",) + p_anna)
        
        # Insert Initial Claims
        cursor.execute("INSERT INTO claims VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                       ("CLM-9011", "SR-9982-1045-88", "Apollo Pharmacy #14", "Medication Dispatch (Amoxicillin)", "Rs.450", "Settled (100% Cashless)", "AB-PMJAY Cover", "2026-05-18", 1))
        cursor.execute("INSERT INTO claims VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                       ("CLM-8891", "SR-9982-1045-88", "Metropolis Diagnostic Labs", "Complete Blood Count & Liver Panel", "Rs.1,200", "Settled (100% Cashless)", "MJPJAY Maharashtra", "2026-05-24", 2))
        
        # Insert Initial Care Bookings
        cursor.execute("INSERT INTO bookings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                       ("BKG-3081", "SR-9982-1045-88", "Doctor Consultation", "Dr. Dev Kumar (Cardiologist)", "2026-06-02", "10:30 AM", "Confirmed", "General heart checkup & post-triage consultation.", "https://meet.sehatrecover.com/room/BKG-3081", "tel:+919988776655", "15 minutes before", 1))
        
        # Insert Initial Orders
        cursor.execute("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                       ("ORD-5541", "SR-9982-1045-88", "RX-9982", "Amoxicillin 500mg (3x daily)", 450.0, 450.0, 0.0, "Delivered", "2026-06-01"))
        
        # Insert Initial Prescriptions
        cursor.execute("INSERT INTO prescriptions VALUES (?, ?, ?, ?, ?, ?, ?)",
                       ("RX-9982", "SR-9982-1045-88", "Anna Smith", "Dr. Dev Kumar", "Amoxicillin 500mg (3x daily), Paracetamol 650mg (as needed)", "Active", "2026-06-01"))
        
        # Insert Initial Documents Explorer Files
        cursor.execute("INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                       ("DOC-7711", "SR-9982-1045-88", "Blood_Report_May_2026.pdf", "PDF", "1.2 MB", "Lab Diagnosis", "2026-05-15", "diagnostics"))
        cursor.execute("INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                       ("DOC-8822", "SR-9982-1045-88", "Liver_Panel_Scans.pdf", "PDF", "3.1 MB", "Lab Diagnosis", "2026-05-24", "diagnostics"))
        cursor.execute("INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                       ("DOC-9933", "SR-9982-1045-88", "Amoxicillin_Prescription_June.pdf", "PDF", "850 KB", "Prescription", "2026-06-01", "prescriptions"))
        cursor.execute("INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                       ("DOC-1044", "SR-9982-1045-88", "HDFC_Ergo_Policy_Receipt.pdf", "PDF", "2.4 MB", "Insurance Policy", "2026-05-10", "insurance_docs"))
        cursor.execute("INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                       ("DOC-2055", "SR-9982-1045-88", "Universal_Health_Card_Front.png", "PNG", "350 KB", "Government Card", "2026-06-01", "gov_cards"))
        
        # Insert Initial Fitness Booking
        cursor.execute("INSERT INTO fitness_bookings VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                       ("FIT-1092", "SR-9982-1045-88", "Yoga Class", "Hatha Yoga Morning Session", "2026-06-03", "07:30 AM", "Rs.350", "Booked (Paid via UPI)"))
        
        # Insert Initial Hospitals (Empanelled Network Data)
        print("[DATABASE INIT] Inserting authentic Empanelled Hospital Network Data...")
        tpa_list = ", Medi Assist TPA, MDIndia TPA, Vidal Health TPA, Paramount Health, Raksha TPA, Heritage Health"
        hospitals = [
            ("HOSP-101", "Apollo Hospitals, Greams Road", "Chennai", "Private", "New India Assurance, Star Health, ICICI Lombard" + tpa_list, 1, "4.8"),
            ("HOSP-102", "Fortis Escorts Heart Institute", "New Delhi", "Private", "New India Assurance, HDFC Ergo, Care Health" + tpa_list, 1, "4.7"),
            ("HOSP-103", "Nanavati Super Speciality Hospital", "Mumbai", "Private", "New India Assurance, SBI General, Bajaj Allianz" + tpa_list, 1, "4.6"),
            ("HOSP-104", "Manipal Hospital, HAL Airport Road", "Bangalore", "Private", "New India Assurance, Star Health, ICICI Lombard" + tpa_list, 1, "4.7"),
            ("HOSP-105", "Max Super Speciality Hospital", "Saket, Delhi", "Private", "New India Assurance, HDFC Ergo, Niva Bupa" + tpa_list, 1, "4.5"),
            ("HOSP-106", "Lilavati Hospital and Research Centre", "Mumbai", "Private", "New India Assurance, ICICI Lombard, Oriental" + tpa_list, 1, "4.8"),
            ("HOSP-107", "Narayana Multispeciality Hospital", "Bangalore", "Private", "New India Assurance, Star Health, SBI General" + tpa_list, 1, "4.6"),
            ("HOSP-108", "Medanta - The Medicity", "Gurugram", "Private", "New India Assurance, Bajaj Allianz, Care Health" + tpa_list, 1, "4.9"),
            ("HOSP-109", "Kokilaben Dhirubhai Ambani Hospital", "Mumbai", "Private", "New India Assurance, HDFC Ergo, ICICI Lombard" + tpa_list, 1, "4.7"),
            ("HOSP-110", "AIG Hospitals (Asian Institute)", "Hyderabad", "Private", "New India Assurance, Star Health, Niva Bupa" + tpa_list, 1, "4.8"),
            ("HOSP-111", "Yashoda Hospitals, Secunderabad", "Hyderabad", "Private", "New India Assurance, ICICI Lombard, SBI General" + tpa_list, 1, "4.7"),
            ("HOSP-112", "Sakra World Hospital", "Bangalore", "Private", "New India Assurance, Care Health, HDFC Ergo" + tpa_list, 1, "4.5"),
            ("HOSP-113", "Artemis Hospital", "Gurugram", "Private", "New India Assurance, Star Health, Bajaj Allianz" + tpa_list, 1, "4.6"),
            ("HOSP-114", "Sir H. N. Reliance Foundation Hospital", "Mumbai", "Private", "New India Assurance, ICICI Lombard, Niva Bupa" + tpa_list, 1, "4.9")
        ]
        cursor.executemany("INSERT INTO hospitals VALUES (?, ?, ?, ?, ?, ?, ?)", hospitals)
        
        # Initialize Blockchain with Genesis and Claim blocks
        genesis_block = Block(0, 1774915200.0, "Genesis Block - SehatRecover HIPAA Compliant Cryptographic Ledger Init", "0")
        cursor.execute("INSERT INTO blockchain VALUES (?, ?, ?, ?, ?)", (0, genesis_block.timestamp, genesis_block.data, genesis_block.previous_hash, genesis_block.hash))
        conn.commit()
        
        log_blockchain_txn("CLAIM_SETTLED", {"claimId": "CLM-9011", "patientId": "SR-9982-1045-88", "amount": "Rs.450"})
        log_blockchain_txn("CLAIM_SETTLED", {"claimId": "CLM-8891", "patientId": "SR-9982-1045-88", "amount": "Rs.1,200"})
        
        # Seed default diagnostics bookings
        cursor.execute("INSERT INTO diagnostics_bookings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                       ("DX-101", "SR-9982-1045-88", "Diabetes Screening (HbA1c + Fasting Blood Sugar)", "Max Labs", 299.0, "Report Dispatched", "2026-06-02", "08:30 AM", "Vikram Rathore", "+91 98765-01234", 0, time.time() - 86400))
        cursor.execute("INSERT INTO diagnostics_bookings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                       ("DX-102", "SR-9982-1045-88", "Basic Health Screening Package", "Metropolis Healthcare", 999.0, "Agent Dispatched", "2026-06-03", "09:00 AM", "Amit Sharma", "+91 96543-98765", 15, time.time() - 3600))

    # Seed wholesale orders if table is empty (independent of other tables)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM wholesale_orders")
    if cursor.fetchone()[0] == 0:
        print("[DATABASE INIT] Inserting default wholesale orders...")
        wholesale_orders = [
            ("ORD-WS-101", "PHARM-9982-APOLLO", "Amoxicillin 500mg", "Capsules", 100, 12000.0, "Processing", time.strftime("%Y-%m-%d"), time.time() - 7200),
            ("ORD-WS-102", "PHARM-1045-METRO", "Metformin 500mg", "Tablets", 250, 30000.0, "Dispatched", time.strftime("%Y-%m-%d"), time.time() - 3600),
            ("ORD-WS-103", "9876543210", "Atorvastatin 10mg", "Tablets", 50, 6000.0, "Delivered", time.strftime("%Y-%m-%d"), time.time() - 86400)
        ]
        cursor.executemany("INSERT INTO wholesale_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", wholesale_orders)
        conn.commit()

    # Seed diagnostics bookings if table is empty (independent of other tables)
    cursor.execute("SELECT COUNT(*) FROM diagnostics_bookings")
    if cursor.fetchone()[0] == 0:
        print("[DATABASE INIT] Inserting default diagnostics bookings...")
        cursor.execute("INSERT INTO diagnostics_bookings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                       ("DX-101", "SR-9982-1045-88", "Diabetes Screening (HbA1c + Fasting Blood Sugar)", "Max Labs", 299.0, "Completed", "2026-06-02", "08:30 AM", "Vikram Rathore", "+91 98765-01234", 0, time.time() - 86400))
        cursor.execute("INSERT INTO diagnostics_bookings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                       ("DX-102", "SR-9982-1045-88", "Basic Health Screening Package", "Metropolis Healthcare", 999.0, "Sample Collected", "2026-06-03", "09:00 AM", "Amit Sharma", "+91 96543-98765", 0, time.time() - 3600))
        conn.commit()

    # Seed partner lab rates if table is empty
    cursor.execute("SELECT COUNT(*) FROM partner_lab_rates")
    if cursor.fetchone()[0] == 0:
        print("[DATABASE INIT] Inserting default partner lab rates...")
        rates = [
            ("healthians_cbc", "Healthians", "CBC", "Complete Blood Count (CBC)", 250.0, 299.0, "Hemoglobin, Platelets, WBC Count, Red Blood Cells"),
            ("healthians_hba1c", "Healthians", "HBA1C", "Diabetes HbA1c", 280.0, 350.0, "Glycated Hemoglobin, Average Blood Glucose"),
            ("healthians_thyroid", "Healthians", "THYROID", "Thyroid Profile (T3, T4, TSH)", 300.0, 400.0, "T3 (Triiodothyronine), T4 (Thyroxine), TSH (Thyroid Stimulating Hormone)"),
            
            ("lallabs_cbc", "Dr. Lal PathLabs", "CBC", "Complete Blood Count (CBC)", 290.0, 390.0, "Hemoglobin, Packed Cell Volume, Platelets, MCH, MCV, MCHC"),
            ("lallabs_hba1c", "Dr. Lal PathLabs", "HBA1C", "Diabetes HbA1c", 310.0, 380.0, "HbA1c Percentage, Estimated Average Glucose"),
            ("lallabs_thyroid", "Dr. Lal PathLabs", "THYROID", "Thyroid Profile (T3, T4, TSH)", 350.0, 450.0, "Total T3, Total T4, TSH Ultrasensitive"),
            
            ("apollo_cbc", "Apollo Diagnostics", "CBC", "Complete Blood Count (CBC)", 270.0, 349.0, "Hb, TLC, DLC, Platelet Count, Peripheral Smear"),
            ("apollo_hba1c", "Apollo Diagnostics", "HBA1C", "Diabetes HbA1c", 290.0, 360.0, "HbA1c (Glycosylated Hb), Average Blood Sugar"),
            ("apollo_thyroid", "Apollo Diagnostics", "THYROID", "Thyroid Profile (T3, T4, TSH)", 320.0, 420.0, "Free T3, Free T4, TSH")
        ]
        cursor.executemany("INSERT INTO partner_lab_rates VALUES (?, ?, ?, ?, ?, ?, ?)", rates)
        conn.commit()
        
    conn.close()

# --- PYDANTIC REQUEST MODELS ---
class SymptomRequest(BaseModel):
    symptoms: str

class OTPSendRequest(BaseModel):
    contact: str
    channel: str
    purpose: str = ""

class OTPVerifyRequest(BaseModel):
    contact: str
    otpCode: str
    fullName: str = "Valued Patient"

class SimVerifyRequest(BaseModel):
    phoneNumber: str
    otpCode: str

class ABHALinkRequest(BaseModel):
    abhaId: str
    userId: str
    stateScheme: str = ""

class TransactionRequest(BaseModel):
    role: str
    userId: str
    action: str

class PrescriptionCreate(BaseModel):
    patientId: str
    patientName: str
    doctorName: str
    medications: str

class DocumentCreate(BaseModel):
    patientId: str
    fileName: str
    category: str
    fileSize: str
    folder: str = "diagnostics"

class DiagnosticBookingCreate(BaseModel):
    patientId: str
    testName: str
    price: float
    provider: str
    date: str
    time: str

class LabRateUpdate(BaseModel):
    id: str
    customPrice: float

class ActivityBookRequest(BaseModel):
    patientId: str
    activityType: str
    activityName: str
    scheduleDate: str
    scheduleTime: str
    price: float
    discountApplied: float
    pointsRedeemed: int = 0
    finalPrice: float
    paymentMethod: str

class PaymentCheckoutRequest(BaseModel):
    patientId: str
    itemId: str
    itemType: str
    amount: float
    paymentMethod: str
    cardNumber: str = ""
    upiId: str = ""

class OneClickLoanRequest(BaseModel):
    patientId: str
    loanAmount: float
    tenureMonths: int
    loanType: str

class CareBookingRequest(BaseModel):
    patientId: str
    bookingType: str
    providerName: str
    date: str
    time: str
    details: str = ""
    videoUrl: str = ""
    callUrl: str = ""
    reminderTime: str = "None"
    reminderActive: int = 0

class PharmacyOrderRequest(BaseModel):
    patientId: str
    prescriptionId: str
    medications: str
    price: float
    discountApplied: float
    pointsRedeemed: int = 0
    schemeUsed: str = ""

class FitnessLogRequest(BaseModel):
    patientId: str
    steps: int
    distance: float
    calories: int
    durationMinutes: int
    pointsAwarded: int

class AIChatQuery(BaseModel):
    query: str
    patientId: str = "SR-GUEST-001"
    context: str = ""

class ABHAEnrollRequest(BaseModel):
    aadhaarNumber: str
    fullName: str
    stateScheme: str = ""
    userId: str

class ClaimSubmitRequest(BaseModel):
    patientId: str
    documentId: str
    provider: str
    service: str
    amount: float
    policyType: str
    schemeName: str

class InsuranceLoanRequest(BaseModel):
    patientId: str
    loanAmount: float
    tenureMonths: int
    schemeUsed: str
    policyBalance: float

class AmbulanceBookRequest(BaseModel):
    patientId: str
    ambulanceType: str
    pickupAddress: str

class BloodRequestSubmit(BaseModel):
    patientId: str
    bloodGroup: str
    existingIllness: str
    testReportName: str

class BloodRequestStatusUpdate(BaseModel):
    status: str

class PharmacyOrderCreate(BaseModel):
    patientId: str
    prescriptionId: str
    medications: str
    originalPrice: float

class ClaimSubmitRequest(BaseModel):
    claimId: str = ""
    patientId: str
    provider: str
    service: str
    amount: float
    schemeName: str

class FHIRClaimRequest(BaseModel):
    patientId: str
    providerId: str
    claimAmount: float
    diagnosisCode: str
    policyNumber: str

class FHIRClaimResponse(BaseModel):
    claimId: str

class ChatMessageSend(BaseModel):
    patientId: str
    doctorName: str
    sender: str
    message: str

class WholesaleOrderCreate(BaseModel):
    pharmacyId: str
    item: str
    formulation: str
    quantity: int
    totalAmount: float

class WholesaleOrderStatusUpdate(BaseModel):
    status: str

# --- AUTH ENDPOINTS ---
@app.post("/api/auth/send-otp")
def send_otp(request: OTPSendRequest):
    contact = request.contact.strip()
    if not contact:
        raise HTTPException(status_code=400, detail="Contact detail is required.")

    if request.channel == "email":
        if "@" not in contact:
            raise HTTPException(status_code=400, detail="Invalid email format.")
    elif request.channel == "mobile":
        digits = "".join(filter(str.isdigit, contact))
        if len(digits) < 8:
            raise HTTPException(status_code=400, detail="Invalid mobile number.")
    elif request.channel == "telegram":
        if not contact:
            raise HTTPException(status_code=400, detail="Invalid Telegram username.")
    else:
        raise HTTPException(status_code=400, detail="Invalid channel.")

    conn = get_db_conn()
    cursor = conn.cursor()

    # Smart login: if signup mode and account exists, allow login instead
    # If login mode and account doesn't exist, auto-create (seamless onboarding)
    cursor.execute("SELECT * FROM users WHERE contact = ?", (contact,))
    existing_user = cursor.fetchone()
    
    if request.purpose == "signup" and existing_user:
        # Account already exists — treat as login, don't error
        pass  # Allow OTP to be sent for login
    # Removed: login rejection for non-existent accounts — now auto-creates on verify

    otp = f"{random.randint(100000, 999999)}"
    cursor.execute("INSERT OR REPLACE INTO otps (contact, otp, timestamp) VALUES (?, ?, ?)", (contact, otp, time.time()))
    conn.commit()
    conn.close()
    
    # Log to Blockchain
    log_blockchain_txn("OTP_ISSUED", {"contact": contact, "purpose": request.purpose})

    # Dispatch OTP based on channel
    import threading
    import urllib.request
    import json
    import os

    def dispatch_otp_async(channel, contact, code):
        message = f"Your SehatRecover Health Portal verification code is {code}. Do not share this with anyone."
        try:
            if channel == "telegram":
                bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
                if not bot_token:
                    print("Telegram bot token not configured. Skipping message dispatch.")
                    return
                chat_id = contact.replace("@", "") 
                url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                req = urllib.request.Request(url, data=json.dumps({"chat_id": chat_id, "text": message}).encode("utf-8"), headers={"Content-Type": "application/json"})
                urllib.request.urlopen(req)
            elif channel == "email":
                # Simulated print for now as configuring real email takes SMTP credentials
                print(f"Email to {contact}: {message}")
            elif channel == "mobile":
                # Simulated print for now 
                print(f"SMS to {contact}: {message}")
        except Exception as e:
            print(f"Failed to dispatch OTP: {e}")

    threading.Thread(target=dispatch_otp_async, args=(request.channel, contact, otp)).start()

    return {
        "status": "success",
        "message": f"OTP successfully sent via {request.channel}.",
        "contact": contact,
        "devOtp": otp 
    }

@app.post("/api/auth/verify-otp")
def verify_otp_auth(request: OTPVerifyRequest):
    contact = request.contact.strip()
    code = request.otpCode.strip()

    conn = get_db_conn()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM otps WHERE contact = ?", (contact,))
    otp_row = cursor.fetchone()
    
    if not otp_row:
        conn.close()
        raise HTTPException(status_code=404, detail="No active verification session.")

    if otp_row["otp"] != code:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid OTP code.")

    # Delete OTP session
    cursor.execute("DELETE FROM otps WHERE contact = ?", (contact,))
    
    # Check if user exists
    cursor.execute("SELECT * FROM users WHERE contact = ?", (contact,))
    user_row = cursor.fetchone()
    
    user = {}
    blockchain_action = ""
    blockchain_data = {}
    
    if user_row:
        user = dict(user_row)
        user["abhaLinked"] = bool(user["abhaLinked"])
        blockchain_action = "USER_LOGIN"
        blockchain_data = {"healthId": user["healthId"], "contact": contact}
    else:
        # Sign up flow - create new user
        random_id_seq = f"{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(10, 99)}"
        health_id = f"SR-{random_id_seq}"
        user = {
            "fullName": request.fullName or "Valued Patient",
            "contact": contact,
            "healthId": health_id,
            "token": str(uuid.uuid4()),
            "qrCodeData": f"sehatrecover://card/verify?id={health_id}&name={request.fullName}",
            "abhaLinked": False
        }
        cursor.execute(
            "INSERT INTO users (contact, fullName, healthId, token, qrCodeData, abhaLinked) VALUES (?, ?, ?, ?, ?, ?)",
            (contact, user["fullName"], user["healthId"], user["token"], user["qrCodeData"], 0)
        )
        blockchain_action = "USER_SIGNUP"
        blockchain_data = {"healthId": health_id, "fullName": request.fullName}
        
    conn.commit()
    
    # Fetch ABHA profile
    h_id = user["healthId"]
    cursor.execute("SELECT * FROM abha_profiles WHERE userId = ?", (h_id,))
    abha_row = cursor.fetchone()
    
    if abha_row:
        user["abhaLinked"] = True
        user["abhaProfile"] = dict(abha_row)
        user["abhaProfile"]["governmentBenefitsActive"] = bool(user["abhaProfile"]["governmentBenefitsActive"])
    else:
        user["abhaLinked"] = False
        user["abhaProfile"] = None
        
    conn.close()
    
    # Log to blockchain AFTER closing connection to avoid database lock
    if blockchain_action:
        log_blockchain_txn(blockchain_action, blockchain_data)
    
    return {
        "status": "success",
        "message": "User verified successfully.",
        "user": user
    }

@app.post("/api/verify-otp")
def verify_otp_sim(request: SimVerifyRequest):
    contact = request.phoneNumber.strip()
    code = request.otpCode.strip()

    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM otps WHERE contact = ?", (contact,))
    row = cursor.fetchone()
    conn.close()
    
    if row and row["otp"] == code:
        return {"status": "success", "message": "Verification successful."}
    
    raise HTTPException(status_code=400, detail="Invalid OTP code.")

# --- ABHA ENDPOINT ---
@app.post("/api/abha/link")
def link_abha_account(request: ABHALinkRequest):
    abha_id = request.abhaId.strip().replace("-", "")
    user_id = request.userId.strip()

    if not abha_id:
        raise HTTPException(status_code=400, detail="ABHA ID is required.")

    is_numeric = abha_id.isdigit() and len(abha_id) == 14
    is_address = abha_id.endswith("@abha") and len(abha_id) > 6

    if not (is_numeric or is_address):
        raise HTTPException(status_code=400, detail="Invalid ABHA format. Require 14-digit number or address@abha.")

    formatted_abha = request.abhaId.strip()
    if is_numeric and "-" not in formatted_abha:
        formatted_abha = f"{abha_id[:2]}-{abha_id[2:6]}-{abha_id[6:10]}-{abha_id[10:]}"

    scheme = "AB-PMJAY (Pradhan Mantri Jan Arogya Yojana)"
    balance = "Rs.5,00,000"
    badge = "ABHA LINKED"

    state_key = request.stateScheme.lower().strip()
    if state_key in STATE_SCHEMES:
        scheme_info = STATE_SCHEMES[state_key]
        scheme = f"AB-PMJAY + {scheme_info['name']}"
        balance = scheme_info["balance"]
        badge = f"ABHA & {scheme_info['badge']}"

    profile = {
        "abhaNumber": formatted_abha if is_numeric else f"AB-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
        "abhaAddress": request.abhaId.strip() if is_address else f"{request.userId.lower().replace('-','')}@abha",
        "kycStatus": "VERIFIED (Aadhaar KYC)",
        "linkedScheme": scheme,
        "insuranceBalance": balance,
        "governmentBenefitsActive": 1,
        "linkedUserId": user_id,
        "badgeText": badge
    }

    conn = get_db_conn()
    cursor = conn.cursor()
    
    # Insert or Replace ABHA profile
    cursor.execute(
        "INSERT OR REPLACE INTO abha_profiles (userId, abhaNumber, abhaAddress, kycStatus, linkedScheme, insuranceBalance, governmentBenefitsActive, badgeText) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (user_id, profile["abhaNumber"], profile["abhaAddress"], profile["kycStatus"], profile["linkedScheme"], profile["insuranceBalance"], 1, profile["badgeText"])
    )
    
    # Update users table
    cursor.execute("UPDATE users SET abhaLinked = 1 WHERE healthId = ?", (user_id,))
    
    conn.commit()
    conn.close()
    
    # Log to Blockchain
    log_blockchain_txn("ABHA_LINKED", {"userId": user_id, "abhaAddress": profile["abhaAddress"], "scheme": scheme})

    return {
        "status": "success",
        "message": "National ABHA and State-Sponsored Scheme linked successfully.",
        "abhaProfile": profile
    }

# --- BLOCKCHAIN LEDGER RETRIEVAL ---
@app.get("/api/blockchain/blocks")
def get_blockchain_blocks():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM blockchain ORDER BY block_index ASC")
    rows = cursor.fetchall()
    conn.close()
    
    return {
        "status": "success",
        "chain": [dict(r) for r in rows]
    }

# --- MEDICAL CLAIMS & HOSPITALS API ---
@app.get("/api/hospitals")
def get_hospitals(city: str = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    if city and city.lower() != "all":
        cursor.execute("SELECT * FROM hospitals WHERE city LIKE ? COLLATE NOCASE", (f"%{city}%",))
    else:
        cursor.execute("SELECT * FROM hospitals")
    rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "hospitals": [dict(r) for r in rows]}

@app.post("/api/hospitals/dispatch-claim")
def dispatch_hospital_claim(request: ClaimSubmitRequest):
    claim_id = f"CLM-{random.randint(1000, 9999)}"
    claim_date = time.strftime("%Y-%m-%d")
    
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM blockchain ORDER BY block_index DESC LIMIT 1")
    latest = cursor.fetchone()
    height = latest["block_index"] + 1 if latest else 1
    
    status_text = "Cashless Pre-Auth Approved"
    amount_text = f"Rs.{request.amount}" if request.amount > 0 else "Rs.1,50,000 (Est. Blocked)"
    
    cursor.execute(
        "INSERT INTO claims (id, patientId, provider, service, amount, status, scheme, date, blockHeight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (claim_id, request.patientId, request.provider, request.service, amount_text, status_text, request.schemeName, claim_date, height)
    )
    conn.commit()
    conn.close()
    
    log_blockchain_txn("CASHLESS_HOSPITAL_DISPATCH", {
        "claimId": claim_id, 
        "patientId": request.patientId, 
        "hospital": request.provider,
        "amountBlocked": amount_text
    })

    return {
        "status": "success", 
        "message": "One-Click Cashless Dispatch successful.",
        "claimId": claim_id
    }

# --- NHCX INTEGRATION API ---
@app.post("/api/nhcx/v1/Claim/$submit")
def submit_nhcx_claim(request: FHIRClaimRequest):
    claim_id = f"NHCX-{random.randint(10000, 99999)}"
    claim_date = time.strftime("%Y-%m-%d")
    
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM blockchain ORDER BY block_index DESC LIMIT 1")
    latest = cursor.fetchone()
    height = latest["block_index"] + 1 if latest else 1
    
    status_text = "Pending (NHCX Processing)"
    amount_text = f"Rs.{request.claimAmount}"
    
    cursor.execute(
        "INSERT INTO claims (id, patientId, provider, service, amount, status, scheme, date, blockHeight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (claim_id, request.patientAbhaId, request.providerId, request.serviceDetails, amount_text, status_text, request.policyNumber, claim_date, height)
    )
    conn.commit()
    conn.close()
    
    log_blockchain_txn("NHCX_CLAIM_SUBMITTED", {
        "nhcxClaimId": claim_id, 
        "patientAbha": request.patientAbhaId, 
        "hospital": request.providerId,
        "amount": amount_text
    })

    return {
        "resourceType": "ClaimResponse",
        "status": "success",
        "message": "Claim successfully routed to NHCX network.",
        "claimId": claim_id,
        "outcome": "queued"
    }

@app.get("/api/nhcx/v1/ClaimResponse/{claim_id}")
def get_nhcx_claim_status(claim_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM claims WHERE id = ?", (claim_id,))
    claim = cursor.fetchone()
    conn.close()
    
    if not claim:
        raise HTTPException(status_code=404, detail="NHCX Claim not found")
        
    return {
        "resourceType": "ClaimResponse",
        "claimId": claim_id,
        "status": claim["status"],
        "amount": claim["amount"],
        "date": claim["date"]
    }

@app.get("/api/dashboard/claims/{patient_id}")
def get_claims(patient_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM claims WHERE patientId = ?", (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    
    return {"status": "success", "claims": [dict(r) for r in rows]}

# --- CARE BOOKINGS API ---
@app.get("/api/dashboard/bookings/{patient_id}")
def get_bookings(patient_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE patientId = ?", (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "bookings": [dict(r) for r in rows]}

@app.post("/api/dashboard/bookings")
def book_care(req: CareBookingRequest):
    bkg_id = f"BKG-{random.randint(1000, 9999)}"
    video_url = req.videoUrl if req.videoUrl else f"https://meet.sehatrecover.com/room/{bkg_id}"
    call_url = req.callUrl if req.callUrl else "tel:+919988776655"
    
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO bookings (id, patientId, type, provider, date, time, status, details, videoUrl, callUrl, reminderTime, reminderActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (bkg_id, req.patientId, req.bookingType, req.providerName, req.date, req.time, "Confirmed", req.details, video_url, call_url, req.reminderTime, req.reminderActive)
    )
    conn.commit()
    conn.close()
    
    # Log to Blockchain
    block = log_blockchain_txn("CARE_BOOKING", {"bookingId": bkg_id, "patientId": req.patientId, "provider": req.providerName})
    
    return {"status": "success", "booking": {
        "id": bkg_id,
        "patientId": req.patientId,
        "bookingType": req.bookingType,
        "providerName": req.providerName,
        "date": req.date,
        "time": req.time,
        "status": "Confirmed",
        "details": req.details,
        "videoUrl": video_url,
        "callUrl": call_url,
        "reminderTime": req.reminderTime,
        "reminderActive": req.reminderActive
    }, "blockHash": block.hash}

# --- PHARMACY ONLINE ORDERS API ---
@app.get("/api/dashboard/orders/{patient_id}")
def get_orders(patient_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE patientId = ?", (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "orders": [dict(r) for r in rows]}

@app.post("/api/dashboard/orders")
def place_order(req: PharmacyOrderRequest):
    order_id = f"ORD-{random.randint(1000, 9999)}"
    final_price = req.price - req.discountApplied
    order_date = time.strftime("%Y-%m-%d")
    
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO orders (id, patientId, prescriptionId, medications, originalPrice, discount, finalPrice, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (order_id, req.patientId, req.prescriptionId, req.medications, req.price, req.discountApplied, final_price, "Ordered (Pending Dispatch)", order_date)
    )
    conn.commit()
    conn.close()
    
    # Log to Blockchain
    block = log_blockchain_txn("PHARMACY_ORDER_PLACED", {"orderId": order_id, "patientId": req.patientId, "finalPrice": final_price})
    
    return {"status": "success", "order": {
        "id": order_id,
        "patientId": req.patientId,
        "prescriptionId": req.prescriptionId,
        "medications": req.medications,
        "originalPrice": req.price,
        "discount": req.discountApplied,
        "finalPrice": final_price,
        "status": "Ordered (Pending Dispatch)",
        "date": order_date
    }, "blockHash": block.hash}

@app.post("/api/dashboard/orders/{order_id}/dispatch")
def dispatch_order(order_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found.")
        
    cursor.execute("UPDATE orders SET status = 'Delivered' WHERE id = ?", (order_id,))
    
    # Create cashless claim if paid via insurance (finalPrice == 0)
    if order["finalPrice"] == 0:
        claim_id = f"CLM-{random.randint(1000, 9999)}"
        claim_date = time.strftime("%Y-%m-%d")
        
        # Get chain length for blockHeight
        cursor.execute("SELECT COUNT(*) FROM blockchain")
        height = cursor.fetchone()[0]
        
        cursor.execute(
            "INSERT INTO claims (id, patientId, provider, service, amount, status, scheme, date, blockHeight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (claim_id, order["patientId"], "SehatRecover Network Pharmacy", f"Medications: {order['medications']}", f"Rs.{order['originalPrice']}", "Settled (100% Cashless)", "Integrated Health Scheme", claim_date, height)
        )
        conn.commit()
        conn.close()
        
        # Log to Blockchain
        log_blockchain_txn("CLAIM_SETTLED", {"claimId": claim_id, "patientId": order["patientId"], "amount": f"Rs.{order['originalPrice']}"})
    else:
        conn.commit()
        conn.close()
        log_blockchain_txn("PHARMACY_ORDER_DISPATCHED", {"orderId": order_id, "patientId": order["patientId"]})
        
    return {"status": "success", "message": "Order dispatched and claims committed."}

# --- FITNESS LOGGING API ---
@app.post("/api/dashboard/fitness/log-session")
def log_fitness_session(req: FitnessLogRequest):
    block = log_blockchain_txn("FITNESS_GOAL_ACHIEVED", {
        "patientId": req.patientId,
        "steps": req.steps,
        "distanceKm": req.distance,
        "calories": req.calories,
        "rewardPointsAwarded": req.pointsAwarded
    })
    return {"status": "success", "blockHash": block.hash, "message": "Fitness metrics cryptographically logged."}

# --- AI ADVANCED HEALTH ASSISTANT ---
@app.post("/api/ai/health-assistant")
def get_ai_assistant_advice(req: AIChatQuery):
    response_data = ai_engine.analyze_assistant_query(req.query, req.context)
    log_blockchain_txn("AI_CONSULTATION_AUDIT", {"queryClass": req.context, "adviceDept": response_data.get("department", "General")})
    return response_data

# --- OLD AI SYMPTOM TRIASE FALLBACK ---
@app.post("/api/ai/symptom-checker")
def analyze_symptoms(request: SymptomRequest):
    result = ai_engine.analyze_symptoms(request.symptoms)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

# --- OLD APP CORE API ROUTINGS ---
@app.post("/api/confirm-transaction")
def confirm_transaction(request: TransactionRequest):
    tx_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    log_blockchain_txn("SECURITY_AUDIT_TRANSACTION", {"txId": tx_id, "role": request.role, "userId": request.userId})
    return {
        "status": "success",
        "transactionId": tx_id,
        "role": request.role,
        "userId": request.userId,
        "action": request.action,
        "timestamp": "2026-06-01T00:00:00Z",
        "receipt": {
            "summary": f"Secure healthcare data transaction verified and logged under {request.role} protocol.",
            "duration": "Limited access window active: 15 minutes."
        }
    }

@app.get("/api/flow-data")
def get_flow_data():
    roles = {
        "Patient": ["Scan QR Code", "Request for Document", "OTP Verification", "Limited Time Access", "Confirm Transaction"],
        "Doctor": ["Scan QR Code", "Request for Document", "OTP Verification", "Limited Time Access", "Confirm Transaction"],
        "Pharmacy": ["Scan QR Code", "Request for Document", "OTP Verification", "Limited Time Access", "Confirm Transaction"],
        "Admin": ["Scan QR Code", "Request for Document", "OTP Verification", "Limited Time Access", "Confirm Transaction"]
    }
    return {
        "roles": roles,
        "steps": [
            {"id": 1, "name": "Scan QR Code", "desc": "Scan card QR code to initiate secure connection."},
            {"id": 2, "name": "Request for Document", "desc": "Select and request authorization for specific health documents."},
            {"id": 3, "name": "OTP Verification", "desc": "Double-authenticate connection using a one-time passcode."},
            {"id": 4, "name": "Limited Time Access", "desc": "Temporary session token generated with active countdown window."},
            {"id": 5, "name": "Confirm Transaction", "desc": "Commit the secure exchange and print/log the digital transaction receipt."}
        ]
    }

@app.get("/api/dashboard/prescriptions")
def get_prescriptions():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM prescriptions")
    rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "prescriptions": [dict(r) for r in rows]}

@app.post("/api/dashboard/prescriptions")
def create_prescription(req: PrescriptionCreate):
    rx_id = f"RX-{random.randint(1000, 9999)}"
    rx_date = time.strftime("%Y-%m-%d")
    
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO prescriptions (id, patientId, patientName, doctorName, medications, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (rx_id, req.patientId, req.patientName, req.doctorName, req.medications, "Active", rx_date)
    )
    conn.commit()
    conn.close()
    
    log_blockchain_txn("PRESCRIPTION_ISSUED", {"rxId": rx_id, "patientId": req.patientId, "doctor": req.doctorName})
    return {"status": "success", "prescription": {
        "id": rx_id,
        "patientId": req.patientId,
        "patientName": req.patientName,
        "doctorName": req.doctorName,
        "medications": req.medications,
        "status": "Active",
        "date": rx_date
    }}

@app.post("/api/dashboard/prescriptions/{rx_id}/fulfill")
def fulfill_prescription_direct(rx_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM prescriptions WHERE id = ?", (rx_id,))
    rx = cursor.fetchone()
    
    if not rx:
        conn.close()
        raise HTTPException(status_code=404, detail="Prescription not found.")
        
    cursor.execute("UPDATE prescriptions SET status = 'Fulfilled' WHERE id = ?", (rx_id,))
    
    # Record order as fulfilled
    order_id = f"ORD-{random.randint(1000, 9999)}"
    order_date = time.strftime("%Y-%m-%d")
    cursor.execute(
        "INSERT INTO orders (id, patientId, prescriptionId, medications, originalPrice, discount, finalPrice, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (order_id, rx["patientId"], rx["id"], rx["medications"], 450.0, 450.0, 0.0, "Delivered", order_date)
    )
    
    # Claim height
    cursor.execute("SELECT COUNT(*) FROM blockchain")
    height = cursor.fetchone()[0]
    
    claim_id = f"CLM-{random.randint(1000, 9999)}"
    cursor.execute(
        "INSERT INTO claims (id, patientId, provider, service, amount, status, scheme, date, blockHeight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (claim_id, rx["patientId"], "Consultant Doctor Dispensation", f"Rx Meds: {rx['medications']}", "Rs.450", "Settled (100% Cashless)", "Central PM-JAY Cover", order_date, height)
    )
    
    conn.commit()
    conn.close()
    
    log_blockchain_txn("PRESCRIPTION_FULFILLED", {"rxId": rx_id, "claimId": claim_id})
    return {"status": "success", "message": "Prescription fulfilled cashlessly."}

@app.get("/api/dashboard/documents/{patient_id}")
def get_documents(patient_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE patientId = ?", (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "documents": [dict(r) for r in rows]}

@app.post("/api/dashboard/documents")
def upload_document(req: DocumentCreate):
    doc_id = f"DOC-{random.randint(1000, 9999)}"
    doc_date = time.strftime("%Y-%m-%d")
    file_type = req.fileName.split(".")[-1].upper() if "." in req.fileName else "PDF"
    
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO documents (id, patientId, fileName, fileType, fileSize, category, date, folder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (doc_id, req.patientId, req.fileName, file_type, req.fileSize, req.category, doc_date, req.folder)
    )
    conn.commit()
    conn.close()
    
    # Log to Blockchain
    log_blockchain_txn("DOCUMENT_UPLOADED", {"docId": doc_id, "patientId": req.patientId, "fileName": req.fileName, "folder": req.folder})
    
    return {"status": "success", "document": {
        "id": doc_id,
        "patientId": req.patientId,
        "fileName": req.fileName,
        "fileType": file_type,
        "fileSize": req.fileSize,
        "category": req.category,
        "date": doc_date,
        "folder": req.folder
    }}

# --- EXTENDED PERSISTENT ENDPOINTS ---
@app.get("/api/dashboard/fitness/bookings/{patient_id}")
def get_fitness_bookings(patient_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM fitness_bookings WHERE patientId = ?", (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "bookings": [dict(r) for r in rows]}

@app.post("/api/dashboard/fitness/book-activity")
def book_activity(request: ActivityBookRequest):
    act_id = f"FIT-{random.randint(1000, 9999)}"
    final_price_text = f"Rs.{request.finalPrice}"
    status_text = f"Booked (Paid via {request.paymentMethod})" if request.finalPrice > 0 else "Booked (Points Redeemed)"
    
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO fitness_bookings (id, patientId, type, name, date, time, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (act_id, request.patientId, request.activityType, request.activityName, request.scheduleDate, request.scheduleTime, final_price_text, status_text)
    )
    conn.commit()
    conn.close()
    
    log_blockchain_txn("FITNESS_ACTIVITY_BOOKED", {
        "bookingId": act_id,
        "patientId": request.patientId,
        "activity": request.activityName,
        "price": final_price_text
    })
    
    return {
        "status": "success",
        "message": "Activity booked successfully.",
        "booking": {
            "id": act_id,
            "patientId": request.patientId,
            "type": request.activityType,
            "name": request.activityName,
            "date": request.scheduleDate,
            "time": request.scheduleTime,
            "price": final_price_text,
            "status": status_text
        }
    }

@app.post("/api/dashboard/payments/checkout")
def pay_checkout(request: PaymentCheckoutRequest):
    txn_id = f"TXN-{random.randint(100000, 999999)}"
    log_blockchain_txn("PAYMENT_SETTLED", {
        "transactionId": txn_id,
        "patientId": request.patientId,
        "itemId": request.itemId,
        "type": request.itemType,
        "amount": f"Rs.{request.amount}",
        "method": request.paymentMethod
    })
    
    return {
        "status": "success",
        "message": f"Payment of Rs.{request.amount} settled successfully via {request.paymentMethod}.",
        "transactionId": txn_id
    }

@app.post("/api/dashboard/loans/one-click-apply")
def one_click_loan(request: OneClickLoanRequest):
    loan_id = f"LON-{random.randint(1000, 9999)}"
    monthly_emi = request.loanAmount / request.tenureMonths
    loan_date = time.strftime("%Y-%m-%d")
    
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO loans (id, patientId, amount, collateralPolicy, tenureMonths, monthlyEmi, status, date, interestRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (loan_id, request.patientId, request.loanAmount, f"Bureau Credit Score Collateral ({request.loanType})", request.tenureMonths, round(monthly_emi, 2), "Disbursed", loan_date, "0% APR (Instant Disburse)")
    )
    conn.commit()
    conn.close()
    
    log_blockchain_txn("ONE_CLICK_LOAN_DISBURSED", {
        "loanId": loan_id,
        "patientId": request.patientId,
        "amount": request.loanAmount,
        "type": request.loanType
    })
    
    return {
        "status": "success",
        "message": f"Instant {request.loanType} of Rs.{request.loanAmount} approved and credited in 1-click!",
        "loan": {
            "id": loan_id,
            "patientId": request.patientId,
            "amount": request.loanAmount,
            "collateralPolicy": f"Bureau Credit Score Collateral ({request.loanType})",
            "tenureMonths": request.tenureMonths,
            "monthlyEmi": round(monthly_emi, 2),
            "status": "Disbursed",
            "date": loan_date,
            "interestRate": "0% APR (Instant Disburse)"
        }
    }

@app.post("/api/abha/enroll")
def enroll_abha(request: ABHAEnrollRequest):
    aadhaar = request.aadhaarNumber.strip().replace("-", "")
    if len(aadhaar) != 12 or not aadhaar.isdigit():
        raise HTTPException(status_code=400, detail="Invalid Aadhaar Number. Must be a 12-digit number.")
        
    random_abha = f"AB-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
    random_addr = f"{request.userId.lower().replace('-','')}@abha"
    
    scheme = "AB-PMJAY (Pradhan Mantri Jan Arogya Yojana)"
    balance = "Rs.5,00,000"
    badge = "ABHA LINKED"
    
    state_key = request.stateScheme.lower().strip()
    if state_key in STATE_SCHEMES:
        scheme_info = STATE_SCHEMES[state_key]
        scheme = f"AB-PMJAY + {scheme_info['name']}"
        balance = scheme_info["balance"]
        badge = f"ABHA & {scheme_info['badge']}"
        
    profile = {
        "abhaNumber": random_abha,
        "abhaAddress": random_addr,
        "kycStatus": "VERIFIED (Aadhaar KYC)",
        "linkedScheme": scheme,
        "insuranceBalance": balance,
        "governmentBenefitsActive": 1,
        "linkedUserId": request.userId,
        "badgeText": badge
    }
    
    conn = get_db_conn()
    cursor = conn.cursor()
    
    # Save ABHA Profile
    cursor.execute(
        "INSERT OR REPLACE INTO abha_profiles (userId, abhaNumber, abhaAddress, kycStatus, linkedScheme, insuranceBalance, governmentBenefitsActive, badgeText) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (request.userId, profile["abhaNumber"], profile["abhaAddress"], profile["kycStatus"], profile["linkedScheme"], profile["insuranceBalance"], 1, profile["badgeText"])
    )
    
    # Update users session linkage
    cursor.execute("UPDATE users SET abhaLinked = 1 WHERE healthId = ?", (request.userId,))
    
    conn.commit()
    conn.close()
    
    log_blockchain_txn("ABHA_ENROLLED", {"userId": request.userId, "abhaAddress": random_addr, "scheme": scheme})
    
    return {
        "status": "success",
        "message": "National ABHA Card generated & state benefits enrolled.",
        "abhaProfile": profile
    }

@app.post("/api/dashboard/claims/submit")
def submit_claim(request: ClaimSubmitRequest):
    claim_id = f"CLM-{random.randint(1000, 9999)}"
    claim_date = time.strftime("%Y-%m-%d")
    
    conn = get_db_conn()
    cursor = conn.cursor()
    
    # Get chain length for blockHeight
    cursor.execute("SELECT COUNT(*) FROM blockchain")
    height = cursor.fetchone()[0]
    
    amount_text = f"Rs.{request.amount:,.2f}" if isinstance(request.amount, (int, float)) else request.amount
    status_text = "Settled (100% Cashless)" if request.policyType == "Government" else "Approved (Direct Cashless)"
    
    cursor.execute(
        "INSERT INTO claims (id, patientId, provider, service, amount, status, scheme, date, blockHeight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (claim_id, request.patientId, request.provider, request.service, amount_text, status_text, request.schemeName, claim_date, height)
    )
    
    # Update active user's government insurance coverage balance if applicable
    h_id = request.patientId
    if request.policyType == "Government":
        cursor.execute("SELECT * FROM abha_profiles WHERE userId = ?", (h_id,))
        profile = cursor.fetchone()
        if profile:
            try:
                bal_str = profile["insuranceBalance"].replace("Rs.", "").replace("₹", "").replace(",", "").split(" ")[0]
                curr_bal = float(bal_str)
                new_bal = max(0.0, curr_bal - request.amount)
                new_bal_str = f"Rs.{new_bal:,.2f}".replace(".00", "")
                cursor.execute("UPDATE abha_profiles SET insuranceBalance = ? WHERE userId = ?", (new_bal_str, h_id))
            except Exception as e:
                print(f"[CLAIM SYNC ERROR]: {e}")
                
    conn.commit()
    conn.close()
    
    log_blockchain_txn("CLAIM_SUBMITTED_CASHLESS", {
        "claimId": claim_id, 
        "patientId": request.patientId, 
        "amount": amount_text,
        "policy": request.policyType,
        "scheme": request.schemeName
    })
    
    return {
        "status": "success",
        "message": "Claim submitted and cashlessly verified.",
        "claim": {
            "id": claim_id,
            "patientId": request.patientId,
            "provider": request.provider,
            "service": request.service,
            "amount": amount_text,
            "status": status_text,
            "scheme": request.schemeName,
            "date": claim_date,
            "blockHeight": height
        }
    }

@app.get("/api/dashboard/loans/{patient_id}")
def get_loans(patient_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM loans WHERE patientId = ?", (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "loans": [dict(r) for r in rows]}

@app.post("/api/dashboard/loans/apply-collateral")
def apply_collateral_loan(request: InsuranceLoanRequest):
    loan_id = f"LON-{random.randint(1000, 9999)}"
    monthly_emi = request.loanAmount / request.tenureMonths
    loan_date = time.strftime("%Y-%m-%d")
    
    conn = get_db_conn()
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO loans (id, patientId, amount, collateralPolicy, tenureMonths, monthlyEmi, status, date, interestRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (loan_id, request.patientId, request.loanAmount, request.schemeUsed, request.tenureMonths, round(monthly_emi, 2), "Disbursed", loan_date, "0% APR (Pre-Approved)")
    )
    
    # Deduct from policy balance or log collateral hold
    h_id = request.patientId
    cursor.execute("SELECT * FROM abha_profiles WHERE userId = ?", (h_id,))
    profile = cursor.fetchone()
    if profile:
        try:
            bal_str = profile["insuranceBalance"].replace("Rs.", "").replace("₹", "").replace(",", "").split(" ")[0]
            curr_bal = float(bal_str)
            new_bal = max(0.0, curr_bal - request.loanAmount)
            new_bal_str = f"Rs.{new_bal:,.2f}".replace(".00", "")
            cursor.execute("UPDATE abha_profiles SET insuranceBalance = ? WHERE userId = ?", (new_bal_str, h_id))
        except Exception as e:
            print(f"[LOAN COLLATERAL HOLD ERROR]: {e}")
            
    conn.commit()
    conn.close()
    
    log_blockchain_txn("INSURANCE_LOAN_DISBURSED", {
        "loanId": loan_id,
        "patientId": request.patientId,
        "amount": request.loanAmount,
        "collateral": request.schemeUsed
    })
    
    return {
        "status": "success",
        "message": "Loan successfully approved and disbursed.",
        "loan": {
            "id": loan_id,
            "patientId": request.patientId,
            "amount": request.loanAmount,
            "collateralPolicy": request.schemeUsed,
            "tenureMonths": request.tenureMonths,
            "monthlyEmi": round(monthly_emi, 2),
            "status": "Disbursed",
            "date": loan_date,
            "interestRate": "0% APR (Pre-Approved)"
        }
    }

@app.post("/api/dashboard/emergency/book-ambulance")
def book_ambulance(request: AmbulanceBookRequest):
    amb_id = f"AMB-{random.randint(1000, 9999)}"
    amb_date = time.strftime("%Y-%m-%d")
    
    drivers = [
        {"name": "Driver Ramesh Kumar", "contact": "+91 9988776655", "vehicle": "MH-12-EQ-8892"},
        {"name": "Driver Anil Sharma", "contact": "+91 9977885566", "vehicle": "MH-12-DF-2241"},
        {"name": "Driver Sandeep Patil", "contact": "+91 9966554433", "vehicle": "MH-12-AS-9981"}
    ]
    driver = random.choice(drivers)
    
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO ambulance_bookings (id, patientId, ambulanceType, pickupAddress, status, etaMinutes, driverName, driverContact, vehicleNumber, date, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (amb_id, request.patientId, request.ambulanceType, request.pickupAddress, "Dispatched", 10, driver["name"], driver["contact"], driver["vehicle"], amb_date, time.time())
    )
    conn.commit()
    conn.close()
    
    log_blockchain_txn("EMERGENCY_AMBULANCE_DISPATCHED", {
        "bookingId": amb_id,
        "patientId": request.patientId,
        "type": request.ambulanceType,
        "driver": driver["name"]
    })
    
    return {
        "status": "success",
        "message": "Emergency ambulance dispatched instantly.",
        "booking": {
            "id": amb_id,
            "patientId": request.patientId,
            "ambulanceType": request.ambulanceType,
            "pickupAddress": request.pickupAddress,
            "status": "Dispatched",
            "etaMinutes": 10,
            "driverName": driver["name"],
            "driverContact": driver["contact"],
            "vehicleNumber": driver["vehicle"],
            "date": amb_date,
            "timestamp": time.time()
        }
    }

@app.get("/api/dashboard/emergency/ambulance-status/{patient_id}")
def get_ambulance_status(patient_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ambulance_bookings WHERE patientId = ? ORDER BY timestamp DESC LIMIT 1", (patient_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return {"status": "none"}
        
    latest = dict(row)
    
    # Calculate dynamic location progress
    elapsed = time.time() - latest["timestamp"]
    duration = 45.0
    progress = min(1.0, elapsed / duration)
    
    new_status = "Dispatched"
    new_eta = 8
    
    if progress >= 1.0:
        new_status = "Arrived"
        new_eta = 0
    elif progress >= 0.5:
        new_status = "En Route"
        new_eta = 4
        
    cursor.execute(
        "UPDATE ambulance_bookings SET status = ?, etaMinutes = ? WHERE id = ?",
        (new_status, new_eta, latest["id"])
    )
    conn.commit()
    conn.close()
    
    latest["status"] = new_status
    latest["etaMinutes"] = new_eta
        
    return {
        "status": "success",
        "booking": latest,
        "progress": progress
    }

# --- DIAGNOSTICS LAB & PACKAGES BOOKING ---
@app.post("/api/dashboard/diagnostics/book")
def book_diagnostic_test(req: DiagnosticBookingCreate):
    booking_id = f"DX-{random.randint(1000, 9999)}"
    
    # Assign a collection agent from a pool
    agents = [
        {"name": "Vikram Rathore", "contact": "+91 98765-01234"},
        {"name": "Amit Sharma", "contact": "+91 96543-98765"},
        {"name": "Rohan Sharma", "contact": "+91 91234-56789"}
    ]
    agent = random.choice(agents)
    
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO diagnostics_bookings (id, patientId, testName, provider, price, status, date, time, agentName, agentContact, agentEta, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (booking_id, req.patientId, req.testName, req.provider, req.price, "Booked", req.date, req.time, agent["name"], agent["contact"], 15, time.time())
    )
    conn.commit()
    conn.close()
    
    log_blockchain_txn("DIAGNOSTIC_TEST_BOOKED", {
        "bookingId": booking_id,
        "patientId": req.patientId,
        "testName": req.testName,
        "provider": req.provider,
        "price": req.price,
        "agent": agent["name"]
    })
    
    return {"status": "success", "bookingId": booking_id}

@app.get("/api/dashboard/diagnostics/bookings/{patient_id}")
def get_diagnostics_bookings(patient_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    
    # Update agent ETA dynamically based on booking elapsed time
    cursor.execute("SELECT * FROM diagnostics_bookings WHERE patientId = ? ORDER BY timestamp DESC", (patient_id,))
    bookings = [dict(r) for r in cursor.fetchall()]
    
    for b in bookings:
        if b["status"] in ["Booked", "Agent Dispatched"]:
            elapsed = time.time() - b["timestamp"]
            # After 45 seconds, the agent status advances to "Sample Collected"
            if elapsed >= 45:
                cursor.execute("UPDATE diagnostics_bookings SET status = 'Sample Collected', agentEta = 0 WHERE id = ?", (b["id"],))
                b["status"] = "Sample Collected"
                b["agentEta"] = 0
            # After 20 seconds, the status is "Agent Dispatched" with a lower ETA
            elif elapsed >= 20:
                new_eta = max(1, 15 - int(elapsed / 2))
                cursor.execute("UPDATE diagnostics_bookings SET status = 'Agent Dispatched', agentEta = ? WHERE id = ?", (new_eta, b["id"]))
                b["status"] = "Agent Dispatched"
                b["agentEta"] = new_eta
            else:
                new_eta = max(1, 15 - int(elapsed / 2))
                b["agentEta"] = new_eta
                cursor.execute("UPDATE diagnostics_bookings SET agentEta = ? WHERE id = ?", (new_eta, b["id"]))
                
    conn.commit()
    conn.close()
    
    return {"status": "success", "bookings": bookings}

@app.get("/api/dashboard/diagnostics/catalog")
def get_diagnostics_catalog():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM partner_lab_rates")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"status": "success", "catalog": rows}

@app.post("/api/dashboard/diagnostics/rate/update")
def update_diagnostics_rate(req: LabRateUpdate):
    conn = get_db_conn()
    cursor = conn.cursor()
    
    # Check if the rate exists
    cursor.execute("SELECT * FROM partner_lab_rates WHERE id = ?", (req.id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Partner lab test not found")
        
    cursor.execute(
        "UPDATE partner_lab_rates SET customPrice = ? WHERE id = ?",
        (req.customPrice, req.id)
    )
    conn.commit()
    conn.close()
    
    # Log to blockchain compliance ledger
    log_blockchain_txn("LAB_RATE_UPDATED", {
        "id": req.id,
        "labName": row["labName"],
        "testName": row["testName"],
        "basePrice": row["basePrice"],
        "customPrice": req.customPrice
    })
    
    return {"status": "success"}

# --- AUXILIARY AI DOCTOR RESPONSE HELPER ---
def generate_ai_doctor_reply(user_msg: str, doctor_name: str) -> str:
    msg_lower = user_msg.lower()
    
    specialty = "General Physician"
    if "dev kumar" in doctor_name.lower():
        specialty = "Cardiologist"
    elif "sarah" in doctor_name.lower():
        specialty = "Neurologist"
    elif "clara" in doctor_name.lower():
        specialty = "Pulmonologist"
        
    intro = f"Hello, I am {doctor_name} ({specialty}). "
    
    if any(k in msg_lower for k in ["heart", "chest pain", "bp", "cardiac", "pulse"]):
        if specialty == "Cardiologist":
            return intro + "Based on your cardiac concern, I recommend keeping track of your daily BP and heart rate. If you have chest tightness, please rest immediately and use the emergency sirens for basic lifesupport dispatch."
        else:
            return intro + "For cardiac symptoms like chest pain, please consult my colleague Dr. Dev Kumar (Cardiologist) immediately. I've noted this in your ledger."
            
    if any(k in msg_lower for k in ["headache", "migraine", "dizziness"]):
        if specialty == "Neurologist":
            return intro + "For migraine or headaches, stay hydrated and keep in dark, quiet spaces. I can prescribe a mild pain reliever if needed, but please schedule a slot to discuss detailed neurological scans."
        else:
            return intro + "I recommend consulting Dr. Sarah Johnson (Neurologist) for a complete diagnostic scan on headaches or dizzy spells."
            
    if any(k in msg_lower for k in ["cough", "breath", "lungs", "asthma", "wheezing"]):
        if specialty == "Pulmonologist":
            return intro + "For cough or respiratory congestion, avoid cold fluids, try steam inhalation, and track your oxygen levels (SpO2). If oxygen falls below 94%, seek emergency oxygen immediately."
        else:
            return intro + "Please contact Dr. Clara Barton (Pulmonologist) for chronic respiratory or congestion concerns."
            
    if any(k in msg_lower for k in ["blood", "transfusion", "blood group", "donor", "request"]):
        return intro + "If you are requesting a blood transfusion pack, please submit the official request form with a verified clean pathology test report. I will review and fulfill it instantly from our clinic bank."
        
    return intro + "Thank you for reaching out. I have reviewed your clinical records. Keep monitoring your live vitals telemetry in your command center, and let me know if you experience any persistent symptoms."

# --- BLOOD REQUESTS ENDPOINTS ---
@app.post("/api/dashboard/blood-requests")
def submit_blood_request(req: BloodRequestSubmit):
    req_id = f"BLD-{random.randint(1000, 9999)}"
    req_date = time.strftime("%Y-%m-%d")
    
    conn = get_db_conn()
    cursor = conn.cursor()
    
    cursor.execute("SELECT contact, fullName FROM users WHERE healthId = ?", (req.patientId,))
    rows = cursor.fetchall()
    
    patient_name = "Valued Patient"
    contact_phone = "Not Available"
    contact_email = "Not Available"
    
    for row in rows:
        patient_name = row["fullName"]
        contact_val = row["contact"]
        if "@" in contact_val:
            contact_email = contact_val
        else:
            contact_phone = contact_val
            
    cursor.execute(
        "INSERT INTO blood_requests (id, patientId, patientName, contact, email, bloodGroup, existingIllness, testReportName, status, date, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (req_id, req.patientId, patient_name, contact_phone, contact_email, req.bloodGroup, req.existingIllness, req.testReportName, "Pending", req_date, time.time())
    )
    conn.commit()
    conn.close()
    
    log_blockchain_txn("BLOOD_REQUEST_SUBMITTED", {
        "requestId": req_id,
        "patientId": req.patientId,
        "bloodGroup": req.bloodGroup
    })
    
    return {
        "status": "success",
        "message": "Blood request submitted and securely logged.",
        "requestId": req_id
    }

@app.get("/api/dashboard/blood-requests")
def get_all_blood_requests():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM blood_requests ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "requests": [dict(r) for r in rows]}

@app.get("/api/dashboard/blood-requests/patient/{patient_id}")
def get_patient_blood_requests(patient_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM blood_requests WHERE patientId = ? ORDER BY timestamp DESC", (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "requests": [dict(r) for r in rows]}

@app.post("/api/dashboard/blood-requests/{id}/status")
def update_blood_request_status(id: str, req: BloodRequestStatusUpdate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM blood_requests WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found.")
        
    cursor.execute("UPDATE blood_requests SET status = ? WHERE id = ?", (req.status, id))
    conn.commit()
    conn.close()
    
    log_blockchain_txn("BLOOD_REQUEST_STATUS_UPDATED", {
        "requestId": id,
        "status": req.status
    })
    return {"status": "success", "message": f"Blood request status updated to {req.status}."}

# --- DOCTOR-PATIENT CLINICAL CHAT ENDPOINTS ---
@app.post("/api/chat/send")
def send_chat_message(req: ChatMessageSend):
    msg_id = f"MSG-{uuid.uuid4().hex[:10].upper()}"
    msg_date = time.strftime("%Y-%m-%d %H:%M:%S")
    
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chat_messages (id, patientId, doctorName, sender, message, timestamp, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (msg_id, req.patientId, req.doctorName, req.sender, req.message, time.time(), msg_date)
    )
    conn.commit()
    conn.close()
    
    log_blockchain_txn("CHAT_MESSAGE_LOGGED", {
        "messageId": msg_id,
        "patientId": req.patientId,
        "doctor": req.doctorName,
        "sender": req.sender
    })
    
    if req.sender == "patient":
        ai_reply = generate_ai_doctor_reply(req.message, req.doctorName)
        reply_id = f"MSG-{uuid.uuid4().hex[:10].upper()}"
        reply_date = time.strftime("%Y-%m-%d %H:%M:%S")
        
        conn = get_db_conn()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chat_messages (id, patientId, doctorName, sender, message, timestamp, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (reply_id, req.patientId, req.doctorName, "doctor", ai_reply, time.time() + 1.0, reply_date)
        )
        conn.commit()
        conn.close()
        
        log_blockchain_txn("CHAT_MESSAGE_LOGGED", {
            "messageId": reply_id,
            "patientId": req.patientId,
            "doctor": req.doctorName,
            "sender": "doctor"
        })
        
    return {"status": "success", "message": "Message sent and logged successfully."}

@app.get("/api/chat/history/{patient_id}/{doctor_name}")
def get_chat_history(patient_id: str, doctor_name: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM chat_messages WHERE patientId = ? AND doctorName = ? ORDER BY timestamp ASC",
        (patient_id, doctor_name)
    )
    rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "history": [dict(r) for r in rows]}

@app.get("/api/chat/active-patients/{doctor_name}")
def get_active_patients(doctor_name: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT DISTINCT cm.patientId, u.fullName 
           FROM chat_messages cm 
           JOIN users u ON cm.patientId = u.healthId 
           WHERE cm.doctorName = ?""", 
        (doctor_name,)
    )
    rows = cursor.fetchall()
    conn.close()
    return {"status": "success", "patients": [dict(r) for r in rows]}

# --- PHARMACEUTICAL DIRECTORY ENDPOINTS ---
@app.get("/api/directory/medications")
def get_medications_directory():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medications")
    rows = cursor.fetchall()
    conn.close()
    
    meds = {}
    for r in rows:
        meds[r["key"]] = dict(r)
    return {"status": "success", "medications": meds}

@app.get("/api/directory/medications/{name}")
def get_medication_details(name: str):
    name_key = name.lower().strip()
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medications WHERE key = ?", (name_key,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {"status": "success", "medication": dict(row)}
    raise HTTPException(status_code=404, detail="Medication not found in directory.")

# --- NEW UNIFIED DASHBOARD API FOR UI REWIRE ---
@app.get("/api/dashboard/user/{user_id}")
def get_user_dashboard(user_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE healthId = ?", (user_id,))
    user = cursor.fetchone()
    
    cursor.execute("SELECT * FROM abha_profiles WHERE userId = ?", (user_id,))
    abha = cursor.fetchone()
    
    cursor.execute("SELECT * FROM bookings WHERE patientId = ? OR provider = ?", (user_id, user_id))
    bookings = cursor.fetchall()
    
    cursor.execute("SELECT * FROM prescriptions WHERE patientId = ? OR doctorName = ?", (user_id, user_id))
    prescriptions = cursor.fetchall()
    
    cursor.execute("SELECT * FROM orders WHERE patientId = ?", (user_id,))
    orders = cursor.fetchall()
    
    cursor.execute("SELECT * FROM documents WHERE patientId = ?", (user_id,))
    documents = cursor.fetchall()

    cursor.execute("SELECT * FROM claims WHERE patientId = ?", (user_id,))
    claims = cursor.fetchall()
    
    conn.close()
    
    return {
        "status": "success",
        "user": dict(user) if user else None,
        "abha": dict(abha) if abha else None,
        "bookings": [dict(r) for r in bookings],
        "prescriptions": [dict(r) for r in prescriptions],
        "orders": [dict(r) for r in orders],
        "documents": [dict(r) for r in documents],
        "claims": [dict(r) for r in claims]
    }

@app.get("/api/dashboard/pharmacy")
def get_pharmacy_dashboard():
    conn = get_db_conn()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM orders ORDER BY date DESC")
    orders = cursor.fetchall()
    
    cursor.execute("SELECT * FROM claims WHERE status LIKE '%Pending%'")
    pending_claims = cursor.fetchall()
    
    conn.close()
    
    return {
        "status": "success",
        "orders": [dict(r) for r in orders],
        "pendingClaims": [dict(r) for r in pending_claims]
    }

@app.post("/api/pharmacy/order")
def create_pharmacy_order(req: PharmacyOrderCreate):
    order_id = f"ORD-{random.randint(1000, 9999)}"
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO orders (id, patientId, prescriptionId, medications, originalPrice, discount, finalPrice, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (order_id, req.patientId, req.prescriptionId, req.medications, req.originalPrice, 0.0, req.originalPrice, "Pending", time.strftime("%Y-%m-%d"))
    )
    conn.commit()
    conn.close()
    return {"status": "success", "orderId": order_id}

@app.post("/api/pharmacy/billing/settle")
def settle_pharmacy_claim(req: ClaimSubmitRequest):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE claims SET status = 'Settled (100% Cashless)' WHERE id = ?",
        (req.claimId,)
    )
    conn.commit()
    conn.close()
    log_blockchain_txn("CLAIM_SETTLED", {"claimId": req.claimId, "patientId": req.patientId, "amount": f"Rs.{req.amount}"})
    return {"status": "success"}

# --- WHOLESALE LOGISTICS ENDPOINTS ---
@app.post("/api/wholesale/order")
def create_wholesale_order(req: WholesaleOrderCreate):
    if req.quantity < 1:
        raise HTTPException(status_code=400, detail="Minimum order quantity must be at least 1 box.")
    
    order_id = f"WSL-{uuid.uuid4().hex[:8].upper()}"
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO wholesale_orders (id, pharmacyId, item, formulation, quantity, totalAmount, status, date, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (order_id, req.pharmacyId, req.item, req.formulation, req.quantity, req.totalAmount, "Processing", time.strftime("%Y-%m-%d"), time.time())
    )
    conn.commit()
    conn.close()
    
    log_blockchain_txn("WHOLESALE_ORDER_PLACED", {"orderId": order_id, "pharmacy": req.pharmacyId, "item": req.item, "quantity": req.quantity})
    return {"status": "success", "orderId": order_id}

@app.get("/api/wholesale/orders")
def get_all_wholesale_orders():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM wholesale_orders ORDER BY timestamp DESC")
    orders = cursor.fetchall()
    conn.close()
    return {"status": "success", "orders": [dict(r) for r in orders]}

@app.get("/api/wholesale/orders/{pharmacy_id}")
def get_wholesale_orders_for_pharmacy(pharmacy_id: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM wholesale_orders WHERE pharmacyId = ? ORDER BY timestamp DESC", (pharmacy_id,))
    orders = cursor.fetchall()
    conn.close()
    return {"status": "success", "orders": [dict(r) for r in orders]}

@app.post("/api/wholesale/orders/{order_id}/status")
def update_wholesale_order_status(order_id: str, req: WholesaleOrderStatusUpdate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE wholesale_orders SET status = ? WHERE id = ?", (req.status, order_id))
    conn.commit()
    conn.close()
    
    log_blockchain_txn("WHOLESALE_STATUS_UPDATE", {"orderId": order_id, "status": req.status})
    return {"status": "success", "orderId": order_id}

class BlockchainLogRequest(BaseModel):
    actionType: str
    details: dict

@app.post("/api/blockchain/log")
def log_blockchain_frontend_txn(req: BlockchainLogRequest):
    block = log_blockchain_txn(req.actionType, req.details)
    return {"status": "success", "block_index": block.index, "hash": block.hash}

# --- PAGE SERVING ROUTES ---
@app.get("/")
def read_root():
    index_path = os.path.join("static", "index.html")
    if not os.path.exists(index_path):
        return HTMLResponse(content="<h1>SehatRecover Portal</h1><p>Static UI files are being set up. Please wait...</p>", status_code=200)
    with open(index_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/login")
def read_login():
    auth_path = os.path.join("static", "auth.html")
    if not os.path.exists(auth_path):
        return HTMLResponse(content="<h1>SehatRecover Portal</h1><p>Authentication UI files are being set up. Please wait...</p>", status_code=200)
    with open(auth_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/signup")
def read_signup():
    return read_login()

@app.get("/dashboard")
def read_dashboard():
    dashboard_path = os.path.join("static", "dashboard.html")
    if not os.path.exists(dashboard_path):
        return HTMLResponse(content="<h1>Dashboard</h1><p>Dashboard file is missing.</p>", status_code=404)
    with open(dashboard_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# Mount static folder
app.mount("/static", StaticFiles(directory="static"), name="static")
