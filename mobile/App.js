import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, ScrollView, Switch, Modal, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Mobile screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dynamic base URL configuration
let DEFAULT_API_URL = 'http://127.0.0.1:8000';

export default function App() {
  // --- STATE TETHERS & SETTINGS ---
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [offlineMode, setOfflineMode] = useState(false);
  const [step, setStep] = useState(1); // 1: Entrance/Details, 2: Verification, 3: Dashboard Layout
  const [loading, setLoading] = useState(false);
  
  // Credentials & profile
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  
  // ABHA / Enrollment Portal state
  const [abhaId, setAbhaId] = useState('');
  const [stateScheme, setStateScheme] = useState('');
  const [linking, setLinking] = useState(false);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [enrollAadhaar, setEnrollAadhaar] = useState('');
  const [enrollName, setEnrollName] = useState('');
  const [enrollScheme, setEnrollScheme] = useState('');
  
  // Navigation
  const [currentTab, setCurrentTab] = useState('Overview'); // 'Overview', 'Vault', 'Pharmacy', 'Care', 'Fitness', 'Insurance', 'Loans', 'Emergency', 'Blockchain'
  
  // Sync Statuses
  const [syncingVitals, setSyncingVitals] = useState(false);
  const [heartRate, setHeartRate] = useState(72);
  const [oxygenLevel, setOxygenLevel] = useState(98);
  const [rewardPoints, setRewardPoints] = useState(250);
  
  // Dynamic Lists loaded from SQL Backend (or simulated locally)
  const [claimsList, setClaimsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [prescriptionsList, setPrescriptionsList] = useState([]);
  const [documentsList, setDocumentsList] = useState([]);
  const [fitnessBookings, setFitnessBookings] = useState([]);
  const [loansList, setLoansList] = useState([]);
  const [blockchainLedger, setBlockchainLedger] = useState([]);
  
  // --- SUB-WIDGET STATES ---
  
  // Vault Folder Explorer
  const [selectedFolder, setSelectedFolder] = useState(null); // 'prescriptions', 'diagnostics', 'insurance_docs', 'gov_cards'
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCat, setNewDocCat] = useState('');
  const [newDocFolder, setNewDocFolder] = useState('diagnostics');
  const [newDocSize, setNewDocSize] = useState('1.5 MB');
  
  // Timed NFC Share View (Google OTP-based feature)
  const [nfcTimerActive, setNfcTimerActive] = useState(false);
  const [nfcCountdown, setNfcCountdown] = useState(60);
  const [nfcCode, setNfcCode] = useState('000000');
  const [nfcShareFile, setNfcShareFile] = useState(null);
  const nfcIntervalRef = useRef(null);
  const nfcProgressAnim = useRef(new Animated.Value(1)).current;
  
  // Pharmacy Catalog & Cart
  const [rxMedsOrdered, setRxMedsOrdered] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0); // 0% default
  const [usePointsToggle, setUsePointsToggle] = useState(false);
  const [pointsRedeemedVal, setPointsRedeemedVal] = useState(0);
  const [royalCustomerToggle, setRoyalCustomerToggle] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [uploadPrescriptionModal, setUploadPrescriptionModal] = useState(false);
  const [prescFileName, setPrescFileName] = useState('');
  
  // Paid Bookings Form
  const [bookingType, setBookingType] = useState('Doctor Consultation');
  const [providerName, setProviderName] = useState('Dr. Dev Kumar (Cardiologist)');
  const [bookingDate, setBookingDate] = useState('2026-06-02');
  const [bookingTime, setBookingTime] = useState('10:30 AM');
  const [bookingReason, setBookingReason] = useState('');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState(null); // { id, name, price, type }
  const [payMethod, setPayMethod] = useState('UPI'); // 'UPI' or 'Card'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [payProcessing, setPayProcessing] = useState(false);
  
  // Fitness Booking Selector
  const [fitnessModalOpen, setFitnessModalOpen] = useState(false);
  const [selectedFitnessActivity, setSelectedFitnessActivity] = useState(null);
  const [fitnessDate, setFitnessDate] = useState('2026-06-03');
  const [fitnessTime, setFitnessTime] = useState('07:30 AM');
  
  // Claims Builder
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimProvider, setClaimProvider] = useState('');
  const [claimService, setClaimService] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimPolicyType, setClaimPolicyType] = useState('Government');
  const [claimDocSelected, setClaimDocSelected] = useState('');
  
  // Loan Engine / CIBIL Finance
  const [cibilState, setCibilState] = useState('idle'); // 'idle', 'checking', 'checked'
  const [cibilScore, setCibilScore] = useState(0);
  const [loanAmount, setLoanAmount] = useState(100000);
  const [loanTenure, setLoanTenure] = useState(12);
  const [loanCollateralType, setLoanCollateralType] = useState('Emergency Health Loan');
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [loanProcessing, setLoanProcessing] = useState(false);
  
  // Emergency Siren & Ambulance Sync
  const [sirenActive, setSirenActive] = useState(false);
  const [ambulanceType, setAmbulanceType] = useState('Basic Life Support');
  const [pickupAddress, setPickupAddress] = useState('');
  const [ambulanceBooking, setAmbulanceBooking] = useState(null);
  const [ambProgress, setAmbProgress] = useState(0);
  const ambulanceIntervalRef = useRef(null);

  // --- HEART PULSE SENSOR STIMULATOR ---
  useEffect(() => {
    let vitalsInterval;
    if (step === 3) {
      vitalsInterval = setInterval(() => {
        setHeartRate(prev => {
          const delta = Math.floor(Math.random() * 5) - 2;
          const next = prev + delta;
          return Math.max(60, Math.min(110, next));
        });
        setOxygenLevel(prev => {
          const delta = Math.floor(Math.random() * 3) - 1;
          const next = prev + delta;
          return Math.max(95, Math.min(100, next));
        });
      }, 3500);
    }
    return () => clearInterval(vitalsInterval);
  }, [step]);

  // --- RETRIEVE ALL API RECORDS FROM SQLite OR SIMULATOR ---
  const fetchAllData = async (patientId) => {
    if (!patientId) return;
    try {
      // 1. Fetch Prescriptions
      const rxResponse = await fetch(`${apiUrl}/api/dashboard/prescriptions`);
      if (rxResponse.ok) {
        const rxData = await rxResponse.json();
        // filter for this patient
        const rxFiltered = rxData.prescriptions.filter(p => p.patientId === patientId);
        setPrescriptionsList(rxFiltered);
      }
      
      // 2. Fetch Claims
      const claimsResponse = await fetch(`${apiUrl}/api/dashboard/claims/${patientId}`);
      if (claimsResponse.ok) {
        const claimsData = await claimsResponse.json();
        setClaimsList(claimsData.claims);
      }
      
      // 3. Fetch Bookings
      const bkResponse = await fetch(`${apiUrl}/api/dashboard/bookings/${patientId}`);
      if (bkResponse.ok) {
        const bkData = await bkResponse.json();
        setBookingsList(bkData.bookings);
      }
      
      // 4. Fetch Documents
      const docResponse = await fetch(`${apiUrl}/api/dashboard/documents/${patientId}`);
      if (docResponse.ok) {
        const docData = await docResponse.json();
        setDocumentsList(docData.documents);
      }
      
      // 5. Fetch Orders
      const ordResponse = await fetch(`${apiUrl}/api/dashboard/orders/${patientId}`);
      if (ordResponse.ok) {
        const ordData = await ordResponse.json();
        setOrdersList(ordData.orders);
      }
      
      // 6. Fetch Fitness Bookings
      const fitResponse = await fetch(`${apiUrl}/api/dashboard/fitness/bookings/${patientId}`);
      if (fitResponse.ok) {
        const fitData = await fitResponse.json();
        setFitnessBookings(fitData.bookings);
      }
      
      // 7. Fetch Loans
      const loanResponse = await fetch(`${apiUrl}/api/dashboard/loans/${patientId}`);
      if (loanResponse.ok) {
        const loanData = await loanResponse.json();
        setLoansList(loanData.loans);
      }
      
      // 8. Fetch Blockchain ledger
      const blockResponse = await fetch(`${apiUrl}/api/blockchain/blocks`);
      if (blockResponse.ok) {
        const blockData = await blockResponse.json();
        setBlockchainLedger(blockData.chain);
      }

      // 9. Fetch Ambulance Status
      const ambResponse = await fetch(`${apiUrl}/api/dashboard/emergency/ambulance-status/${patientId}`);
      if (ambResponse.ok) {
        const ambData = await ambResponse.json();
        if (ambData.status === 'success') {
          setAmbulanceBooking(ambData.booking);
          setAmbProgress(ambData.progress || 0);
          triggerAmbulanceTrackingPoll(patientId);
        }
      }
      
    } catch (error) {
      console.log('SQL Sync Error, enabling offline simulation modes: ', error.message);
      setOfflineMode(true);
      // Pre-populate offline lists if empty
      if (prescriptionsList.length === 0) {
        setPrescriptionsList([
          { id: "RX-9982", patientId: patientId, patientName: fullName, doctorName: "Dr. Dev Kumar", medications: "Amoxicillin 500mg (3x daily), Paracetamol 650mg (as needed)", status: "Active", date: "2026-06-01" }
        ]);
        setClaimsList([
          { id: "CLM-9011", patientId: patientId, provider: "Apollo Pharmacy #14", service: "Medication Dispatch (Amoxicillin)", amount: "Rs.450", status: "Settled (100% Cashless)", scheme: "AB-PMJAY Cover", date: "2026-05-18", blockHeight: 1 },
          { id: "CLM-8891", patientId: patientId, provider: "Metropolis Diagnostic Labs", service: "Complete Blood Count & Liver Panel", amount: "Rs.1,200", status: "Settled (100% Cashless)", scheme: "MJPJAY Maharashtra", date: "2026-05-24", blockHeight: 2 }
        ]);
        setBookingsList([
          { id: "BKG-3081", patientId: patientId, type: "Doctor Consultation", provider: "Dr. Dev Kumar (Cardiologist)", date: "2026-06-02", time: "10:30 AM", status: "Confirmed", details: "General heart checkup & post-triage consultation." }
        ]);
        setDocumentsList([
          { id: "DOC-7711", patientId: patientId, fileName: "Blood_Report_May_2026.pdf", fileType: "PDF", fileSize: "1.2 MB", category: "Lab Diagnosis", date: "2026-05-15", folder: "diagnostics" },
          { id: "DOC-8822", patientId: patientId, fileName: "Liver_Panel_Scans.pdf", fileType: "PDF", fileSize: "3.1 MB", category: "Lab Diagnosis", date: "2026-05-24", folder: "diagnostics" },
          { id: "DOC-9933", patientId: patientId, fileName: "Amoxicillin_Prescription_June.pdf", fileType: "PDF", fileSize: "850 KB", category: "Prescription", date: "2026-06-01", folder: "prescriptions" },
          { id: "DOC-1044", patientId: patientId, fileName: "HDFC_Ergo_Policy_Receipt.pdf", fileType: "PDF", fileSize: "2.4 MB", category: "Insurance Policy", date: "2026-05-10", folder: "insurance_docs" },
          { id: "DOC-2055", patientId: patientId, fileName: "Universal_Health_Card_Front.png", fileType: "PNG", fileSize: "350 KB", category: "Government Card", date: "2026-06-01", folder: "gov_cards" }
        ]);
        setOrdersList([
          { id: "ORD-5541", patientId: patientId, prescriptionId: "RX-9982", medications: "Amoxicillin 500mg (3x daily)", originalPrice: 450, discount: 450, finalPrice: 0, status: "Delivered", date: "2026-06-01" }
        ]);
        setFitnessBookings([
          { id: "FIT-1092", patientId: patientId, type: "Yoga Class", name: "Hatha Yoga Morning Session", date: "2026-06-03", time: "07:30 AM", price: "Rs.350", status: "Booked (Paid via UPI)" }
        ]);
        setBlockchainLedger([
          { block_index: 0, timestamp: 1774915200.0, data: "Genesis Block - SehatRecover HIPAA Compliant Cryptographic Ledger Init", previous_hash: "0", hash: "803a78d5e7e6f66345cb892a019b8822557e4e030a21" },
          { block_index: 1, timestamp: 1774916200.0, data: "{'action': 'CLAIM_SETTLED', 'details': {'claimId': 'CLM-9011', 'patientId': '" + patientId + "', 'amount': 'Rs.450'}}", previous_hash: "803a78d5e7e6f66345cb892a019b8822557e4e030a21", hash: "78152617f66a2b0057e4922acba122abfcd105a3" }
        ]);
      }
    }
  };

  // Trigger data load when step changes to 3 (logged in)
  useEffect(() => {
    if (step === 3 && userProfile) {
      fetchAllData(userProfile.healthId);
    }
  }, [step, userProfile]);

  // --- PASSWORDLESS ACCESS CONTROLLERS ---
  const handleSendOtp = async () => {
    if (!fullName.trim() || !mobileNumber.trim()) {
      Alert.alert('Details Required', 'Please enter your name and phone number/email.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: mobileNumber,
          channel: mobileNumber.includes('@') ? 'email' : 'mobile'
        })
      });
      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        setStep(2);
        Alert.alert(
          'Verification Code Issued', 
          `OTP Code generated: ${data.devOtp || '123456'}. Enter this passcode to log in.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Session Failed', data.detail || 'Could not send verification code.');
      }
    } catch (error) {
      setLoading(false);
      setOfflineMode(true);
      setStep(2);
      Alert.alert(
        'Connection Timeout',
        'Serving in Offline Simulation Mode. Use passcode 123456 to verify.',
        [{ text: 'Proceed Offline' }]
      );
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Code Required', 'Enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: mobileNumber,
          otpCode: otpCode,
          fullName: fullName
        })
      });
      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        setUserProfile(data.user);
        if (data.user.abhaProfile) {
          // Parse points balance from insurance balance or simulated points
          setRewardPoints(250);
        }
        setStep(3);
      } else {
        Alert.alert('Access Denied', data.detail || 'Incorrect passcode code.');
      }
    } catch (error) {
      setLoading(false);
      setOfflineMode(true);
      if (otpCode === '123456') {
        const mockHealthId = mobileNumber === '9876543210' ? 'SR-9982-1045-88' : `SR-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-10`;
        const mockUser = {
          fullName: fullName,
          contact: mobileNumber,
          healthId: mockHealthId,
          token: 'offline-token-session-key',
          qrCodeData: `sehatrecover://card/verify?id=${mockHealthId}&name=${encodeURIComponent(fullName)}`,
          abhaLinked: false,
          abhaProfile: null
        };
        // Auto load Anna Smith if phone matches
        if (mobileNumber === '9876543210') {
          mockUser.fullName = "Anna Smith";
          mockUser.abhaLinked = true;
          mockUser.abhaProfile = {
            abhaNumber: "AB-9982-1045-88",
            abhaAddress: "annasmith@abha",
            kycStatus: "VERIFIED (Aadhaar KYC)",
            linkedScheme: "AB-PMJAY + Dr. YSR Aarogyasri Health Scheme (Andhra Pradesh)",
            insuranceBalance: "Rs.10,00,000",
            governmentBenefitsActive: true,
            linkedUserId: mockHealthId,
            badgeText: "ABHA & AAROGYASRI LINKED"
          };
        }
        setUserProfile(mockUser);
        setStep(3);
      } else {
        Alert.alert('Verification Error', 'Invalid mock code.');
      }
    }
  };

  // --- ABHA PORTAL LINKAGE ---
  const handleLinkAbha = async () => {
    if (!abhaId.trim()) {
      Alert.alert('Input Missing', 'Enter your 14-digit ABHA ID or abha-address.');
      return;
    }
    setLinking(true);
    try {
      const response = await fetch(`${apiUrl}/api/abha/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abhaId: abhaId,
          userId: userProfile.healthId,
          stateScheme: stateScheme
        })
      });
      const data = await response.json();
      setLinking(false);

      if (response.ok) {
        setUserProfile(prev => ({
          ...prev,
          abhaLinked: true,
          abhaProfile: data.abhaProfile
        }));
        Alert.alert('Success', 'ABHA Portal and State Health Scheme integrated successfully!');
        fetchAllData(userProfile.healthId);
      } else {
        Alert.alert('Integration Failed', data.detail || 'Could not map ABHA identity.');
      }
    } catch (error) {
      setLinking(false);
      // Offline fallback
      let schemeName = "AB-PMJAY (Pradhan Mantri Jan Arogya Yojana)";
      let coverBal = "Rs.5,00,000";
      let badgeTxt = "ABHA LINKED";

      if (stateScheme) {
        const stateMapping = {
          mjpjay: { name: "AB-PMJAY + MJPJAY (Maharashtra)", bal: "Rs.5,00,000", badge: "ABHA & MJPJAY LINKED" },
          aarogyasri: { name: "AB-PMJAY + Aarogyasri (Andhra Pradesh)", bal: "Rs.10,00,000", badge: "ABHA & AAROGYASRI LINKED" },
          cmchis: { name: "AB-PMJAY + CMCHIS (Tamil Nadu)", bal: "Rs.5,00,000", badge: "ABHA & CMCHIS LINKED" },
          chiranjeevi: { name: "AB-PMJAY + Chiranjeevi (Rajasthan)", bal: "Rs.25,00,000", badge: "ABHA & CHIRANJEEVI LINKED" },
          bsky: { name: "AB-PMJAY + BSKY (Odisha)", bal: "Rs.5,00,000", badge: "ABHA & BSKY LINKED" }
        };
        const activeS = stateMapping[stateScheme];
        if (activeS) {
          schemeName = activeS.name;
          coverBal = activeS.bal;
          badgeTxt = activeS.badge;
        }
      }

      const newProfile = {
        abhaNumber: abhaId.length === 14 ? abhaId : "AB-4045-8891-22",
        abhaAddress: abhaId.includes('@') ? abhaId : `${userProfile.fullName.toLowerCase().replace(/\s/g, '')}@abha`,
        kycStatus: "VERIFIED (Aadhaar KYC)",
        linkedScheme: schemeName,
        insuranceBalance: coverBal,
        governmentBenefitsActive: true,
        linkedUserId: userProfile.healthId,
        badgeText: badgeTxt
      };

      setUserProfile(prev => ({
        ...prev,
        abhaLinked: true,
        abhaProfile: newProfile
      }));
      
      // Log to offline blockchain
      const newBlock = {
        block_index: blockchainLedger.length,
        timestamp: Date.now() / 1000,
        data: JSON.stringify({ action: "ABHA_LINKED", details: { userId: userProfile.healthId, abhaAddress: newProfile.abhaAddress, scheme: schemeName } }),
        previous_hash: blockchainLedger[blockchainLedger.length - 1]?.hash || "0",
        hash: Math.random().toString(16).substr(2, 32)
      };
      setBlockchainLedger(prev => [...prev, newBlock]);
      Alert.alert('Offline Success', 'Simulated mapping registered in local environment.');
    }
  };

  // --- ONE CLICK ABHA ENROLLMENT ---
  const handleEnrollAbha = async () => {
    if (!enrollAadhaar || enrollAadhaar.length !== 12) {
      Alert.alert('Error', 'Please input a valid 12-digit Aadhaar Card Number.');
      return;
    }
    setLinking(true);
    try {
      const response = await fetch(`${apiUrl}/api/abha/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaarNumber: enrollAadhaar,
          fullName: enrollName || userProfile.fullName,
          stateScheme: enrollScheme,
          userId: userProfile.healthId
        })
      });
      const data = await response.json();
      setLinking(false);
      setEnrollModalVisible(false);

      if (response.ok) {
        setUserProfile(prev => ({
          ...prev,
          abhaLinked: true,
          abhaProfile: data.abhaProfile
        }));
        Alert.alert('Enrolled Successfully', 'Your 1-Click ABHA Card has been generated!');
        fetchAllData(userProfile.healthId);
      } else {
        Alert.alert('Enrollment Error', data.detail);
      }
    } catch (e) {
      setLinking(false);
      setEnrollModalVisible(false);
      // Simulate locally
      let schemeName = "AB-PMJAY (Pradhan Mantri Jan Arogya Yojana)";
      let coverBal = "Rs.5,00,000";
      let badgeTxt = "ABHA LINKED";

      if (enrollScheme) {
        const stateMapping = {
          mjpjay: { name: "AB-PMJAY + MJPJAY (Maharashtra)", bal: "Rs.5,00,000", badge: "ABHA & MJPJAY LINKED" },
          aarogyasri: { name: "AB-PMJAY + Aarogyasri (Andhra Pradesh)", bal: "Rs.10,00,000", badge: "ABHA & AAROGYASRI LINKED" },
          cmchis: { name: "AB-PMJAY + CMCHIS (Tamil Nadu)", bal: "Rs.5,00,000", badge: "ABHA & CMCHIS LINKED" },
          chiranjeevi: { name: "AB-PMJAY + Chiranjeevi (Rajasthan)", bal: "Rs.25,00,000", badge: "ABHA & CHIRANJEEVI LINKED" },
          bsky: { name: "AB-PMJAY + BSKY (Odisha)", bal: "Rs.5,00,000", badge: "ABHA & BSKY LINKED" }
        };
        const activeS = stateMapping[enrollScheme];
        if (activeS) {
          schemeName = activeS.name;
          coverBal = activeS.bal;
          badgeTxt = activeS.badge;
        }
      }

      const generatedId = `AB-${Math.floor(1000+Math.random()*9000)}-${Math.floor(1000+Math.random()*9000)}-${Math.floor(10+Math.random()*90)}`;
      const newProfile = {
        abhaNumber: generatedId,
        abhaAddress: `${(enrollName || userProfile.fullName).toLowerCase().replace(/\s/g, '')}@abha`,
        kycStatus: "VERIFIED (Aadhaar KYC)",
        linkedScheme: schemeName,
        insuranceBalance: coverBal,
        governmentBenefitsActive: true,
        linkedUserId: userProfile.healthId,
        badgeText: badgeTxt
      };

      setUserProfile(prev => ({
        ...prev,
        abhaLinked: true,
        abhaProfile: newProfile
      }));
      
      const newBlock = {
        block_index: blockchainLedger.length,
        timestamp: Date.now() / 1000,
        data: JSON.stringify({ action: "ABHA_ENROLLED", details: { userId: userProfile.healthId, abhaNumber: generatedId, scheme: schemeName } }),
        previous_hash: blockchainLedger[blockchainLedger.length - 1]?.hash || "0",
        hash: Math.random().toString(16).substr(2, 32)
      };
      setBlockchainLedger(prev => [...prev, newBlock]);
      Alert.alert('Offline Enrollment Success', 'New ABHA Profile created & registered.');
    }
  };

  // --- IoMT DATA SYNCRONIZER ---
  const handleSyncVitals = async () => {
    setSyncingVitals(true);
    try {
      const response = await fetch(`${apiUrl}/api/dashboard/fitness/log-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userProfile.healthId,
          steps: 8420,
          distance: 5.8,
          calories: 350,
          durationMinutes: 42,
          pointsAwarded: 50
        })
      });
      setSyncingVitals(false);
      if (response.ok) {
        setRewardPoints(prev => prev + 50);
        Alert.alert('Vitals Synced', 'Real-time Heart Rate & SpO2 synced to HIPAA Ledger. Mints Block. +50 Reward points awarded!');
        fetchAllData(userProfile.healthId);
      } else {
        Alert.alert('Sync failed', 'Server returned error status.');
      }
    } catch (e) {
      setSyncingVitals(false);
      // Local sync simulation
      setRewardPoints(prev => prev + 50);
      const newBlock = {
        block_index: blockchainLedger.length,
        timestamp: Date.now() / 1000,
        data: JSON.stringify({ action: "FITNESS_GOAL_ACHIEVED", details: { patientId: userProfile.healthId, steps: 8420, heartRate: heartRate, oxygenLevel: oxygenLevel, points: 50 } }),
        previous_hash: blockchainLedger[blockchainLedger.length - 1]?.hash || "0",
        hash: Math.random().toString(16).substr(2, 32)
      };
      setBlockchainLedger(prev => [...prev, newBlock]);
      Alert.alert('Offline Sync Complete', 'Vitals synced locally. Block minted. Received 50 points!');
    }
  };

  // --- DOCUMENTS VAULT ACTIONS & TIMED ACCESS COUNTDOWN ---
  const triggerNfcTimer = (doc) => {
    if (nfcTimerActive) {
      clearInterval(nfcIntervalRef.current);
    }
    setNfcShareFile(doc);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setNfcCode(code);
    setNfcCountdown(60);
    setNfcTimerActive(true);
    
    // Reset animation
    nfcProgressAnim.setValue(1);
    
    // Animate timer progress bar
    Animated.timing(nfcProgressAnim, {
      toValue: 0,
      duration: 60000,
      useNativeDriver: false
    }).start();

    nfcIntervalRef.current = setInterval(() => {
      setNfcCountdown(prev => {
        if (prev <= 1) {
          clearInterval(nfcIntervalRef.current);
          setNfcTimerActive(false);
          setNfcShareFile(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (nfcIntervalRef.current) clearInterval(nfcIntervalRef.current);
    };
  }, []);

  const handleUploadDocument = async () => {
    if (!newDocName.trim() || !newDocCat.trim()) {
      Alert.alert('Error', 'Please fill in the document filename and category.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/dashboard/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userProfile.healthId,
          fileName: newDocName.includes('.') ? newDocName : `${newDocName}.pdf`,
          category: newDocCat,
          fileSize: newDocSize,
          folder: newDocFolder
        })
      });
      setLoading(false);
      setUploadModalOpen(false);
      if (response.ok) {
        Alert.alert('Success', 'Document uploaded to SehatRecover Vault securely.');
        setNewDocName('');
        setNewDocCat('');
        fetchAllData(userProfile.healthId);
      }
    } catch (e) {
      setLoading(false);
      setUploadModalOpen(false);
      // Offline fallback
      const generatedId = `DOC-${Math.floor(1000 + Math.random()*9000)}`;
      const fileExt = newDocName.includes('.') ? newDocName.split('.').pop().toUpperCase() : 'PDF';
      const cleanName = newDocName.includes('.') ? newDocName : `${newDocName}.pdf`;
      const docItem = {
        id: generatedId,
        patientId: userProfile.healthId,
        fileName: cleanName,
        fileType: fileExt,
        fileSize: newDocSize,
        category: newDocCat,
        date: new Date().toISOString().split('T')[0],
        folder: newDocFolder
      };
      setDocumentsList(prev => [docItem, ...prev]);
      
      const newBlock = {
        block_index: blockchainLedger.length,
        timestamp: Date.now() / 1000,
        data: JSON.stringify({ action: "DOCUMENT_UPLOADED", details: { docId: generatedId, patientId: userProfile.healthId, fileName: cleanName, folder: newDocFolder } }),
        previous_hash: blockchainLedger[blockchainLedger.length - 1]?.hash || "0",
        hash: Math.random().toString(16).substr(2, 32)
      };
      setBlockchainLedger(prev => [...prev, newBlock]);
      Alert.alert('Offline Upload Saved', 'Document simulated in local explorer vault.');
      setNewDocName('');
      setNewDocCat('');
    }
  };

  // --- ONLINE PHARMACY CART & SUB-FLOWS ---
  const otcItems = [
    { id: 'OTC-01', name: 'Multivitamins Forte', price: 150, desc: 'Essential daily vitamins & mineral support.' },
    { id: 'OTC-02', name: 'Herbal Cough Syrup', price: 120, desc: 'Soothing organic honey & ginger base.' },
    { id: 'OTC-03', name: 'Paracetamol 650mg', price: 40, desc: 'Rapid relief for fevers and mild body aches.' },
    { id: 'OTC-04', name: 'Vitamin C Chewables', price: 80, desc: 'Immune boosting orange flavored tabs.' },
    { id: 'OTC-05', name: 'Allergy Relief Fast-Act', price: 95, desc: 'Non-drowsy histaminic block (10 Tablets).' }
  ];

  const handleAddOtcToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    Alert.alert('Cart Updated', `${item.name} added to cart!`);
  };

  const handleQuantityChange = (id, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === id) {
          const nextQty = i.qty + delta;
          return nextQty > 0 ? { ...i, qty: nextQty } : null;
        }
        return i;
      }).filter(Boolean);
    });
  };

  const loadPrescriptionToCart = (rx) => {
    // Split medicines
    const meds = rx.medications.split(',').map(m => m.trim());
    const orderItems = meds.map((med, idx) => ({
      id: `RX-ITEM-${rx.id}-${idx}`,
      name: med,
      price: 150, // Default prescription cost simulation
      qty: 1
    }));
    setCart(orderItems);
    setCartOpen(true);
    Alert.alert('Rx Loaded', `Medications from prescription ${rx.id} added to cart.`);
  };

  const getCartTotals = () => {
    let subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    
    // Apply scheme subsidy if user is linked (Rx meds become free, OTC gets 50% off)
    let schemeSubsidy = 0;
    if (userProfile?.abhaLinked) {
      cart.forEach(i => {
        if (i.id.startsWith('RX-ITEM')) {
          schemeSubsidy += (i.price * i.qty); // Free Rx drugs
        } else {
          schemeSubsidy += (i.price * i.qty) * 0.3; // 30% Govt subsidy for OTC under Ayushman schemes
        }
      });
    }

    let couponDiscountAmount = (subtotal - schemeSubsidy) * couponDiscount;
    let pointsDiscount = usePointsToggle ? Math.min(rewardPoints, (subtotal - schemeSubsidy - couponDiscountAmount)) : 0;
    let royalDiscountAmount = royalCustomerToggle ? (subtotal - schemeSubsidy - couponDiscountAmount - pointsDiscount) * 0.1 : 0;

    let finalPrice = Math.max(0, subtotal - schemeSubsidy - couponDiscountAmount - pointsDiscount - royalDiscountAmount);

    return {
      subtotal,
      schemeSubsidy,
      couponDiscountAmount,
      pointsDiscount,
      royalDiscountAmount,
      finalPrice: Math.round(finalPrice)
    };
  };

  const handleApplyCoupon = () => {
    if (couponInput.toUpperCase() === 'SEHAT20') {
      setCouponDiscount(0.2);
      Alert.alert('Coupon Applied', '20% coupon code verified!');
    } else {
      setCouponDiscount(0);
      Alert.alert('Invalid Code', 'Coupon code is not valid.');
    }
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add pharmacy products to your cart first.');
      return;
    }

    const { finalPrice } = getCartTotals();

    // If final price is 0, process instantly as insurance cashless order
    if (finalPrice === 0) {
      processOrderBackend('Cashless Insurance / Points');
    } else {
      // Trigger paid payment flow checkout modal
      setCheckoutItem({
        id: `CART-${Math.floor(1000 + Math.random()*9000)}`,
        name: 'Pharmacy Online Purchase',
        price: finalPrice,
        type: 'pharmacy'
      });
      setCartOpen(false);
      setCheckoutModalOpen(true);
    }
  };

  const processOrderBackend = async (paymentMethodUsed) => {
    setLoading(true);
    const totals = getCartTotals();
    const medString = cart.map(i => `${i.name} x${i.qty}`).join(', ');
    
    try {
      const response = await fetch(`${apiUrl}/api/dashboard/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userProfile.healthId,
          prescriptionId: cart.find(i => i.id.startsWith('RX-ITEM'))?.id || 'NONE',
          medications: medString,
          price: totals.subtotal,
          discountApplied: totals.subtotal - totals.finalPrice,
          pointsRedeemed: usePointsToggle ? totals.pointsDiscount : 0,
          schemeUsed: userProfile.abhaLinked ? userProfile.abhaProfile.linkedScheme : ''
        })
      });
      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        // Dispatch order to deliver
        await fetch(`${apiUrl}/api/dashboard/orders/${data.order.id}/dispatch`, { method: 'POST' });
        
        // Deduct points
        if (usePointsToggle) {
          setRewardPoints(prev => Math.max(0, prev - totals.pointsDiscount));
        }
        setCart([]);
        setUsePointsToggle(false);
        setRoyalCustomerToggle(false);
        setCouponInput('');
        setCouponDiscount(0);
        Alert.alert('Order Placed Successfully', `Order ${data.order.id} verified, cashless claim processed, and dispatched!`);
        fetchAllData(userProfile.healthId);
      }
    } catch (e) {
      setLoading(false);
      // Offline simulation fallback
      const generatedOrderId = `ORD-${Math.floor(1000 + Math.random()*9000)}`;
      const newOrder = {
        id: generatedOrderId,
        patientId: userProfile.healthId,
        prescriptionId: 'RX-9982',
        medications: medString,
        originalPrice: totals.subtotal,
        discount: totals.subtotal - totals.finalPrice,
        finalPrice: totals.finalPrice,
        status: "Delivered",
        date: new Date().toISOString().split('T')[0]
      };
      setOrdersList(prev => [newOrder, ...prev]);

      if (usePointsToggle) {
        setRewardPoints(prev => Math.max(0, prev - totals.pointsDiscount));
      }

      // Sync cashless claim in local list if price was subsidized to 0
      if (totals.finalPrice === 0 && userProfile.abhaLinked) {
        const genClaimId = `CLM-${Math.floor(1000 + Math.random()*9000)}`;
        const claimItem = {
          id: genClaimId,
          patientId: userProfile.healthId,
          provider: "SehatRecover Network Pharmacy",
          service: `Medications: ${medString}`,
          amount: `Rs.${totals.subtotal}`,
          status: "Settled (100% Cashless)",
          scheme: userProfile.abhaProfile.linkedScheme,
          date: new Date().toISOString().split('T')[0],
          blockHeight: blockchainLedger.length
        };
        setClaimsList(prev => [claimItem, ...prev]);
        
        // Update balance
        try {
          let currentBal = parseFloat(userProfile.abhaProfile.insuranceBalance.replace(/[^\d.]/g, ''));
          let nextBal = Math.max(0, currentBal - totals.subtotal);
          userProfile.abhaProfile.insuranceBalance = `Rs.${nextBal.toLocaleString()}`;
        } catch(err){}
      }

      const newBlock = {
        block_index: blockchainLedger.length,
        timestamp: Date.now() / 1000,
        data: JSON.stringify({ action: "PHARMACY_ORDER_PLACED", details: { orderId: generatedOrderId, medications: medString, price: totals.finalPrice, method: paymentMethodUsed } }),
        previous_hash: blockchainLedger[blockchainLedger.length - 1]?.hash || "0",
        hash: Math.random().toString(16).substr(2, 32)
      };
      setBlockchainLedger(prev => [...prev, newBlock]);

      setCart([]);
      setUsePointsToggle(false);
      setRoyalCustomerToggle(false);
      setCouponInput('');
      setCouponDiscount(0);
      Alert.alert('Offline Order Settled', `Simulated order ${generatedOrderId} registered, and claims dispatched.`);
    }
  };

  const handlePrescriptionUpload = async () => {
    if (!prescFileName.trim()) {
      Alert.alert('Input Missing', 'Provide a filename for the prescription.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/dashboard/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userProfile.healthId,
          fileName: prescFileName.endsWith('.pdf') ? prescFileName : `${prescFileName}.pdf`,
          category: 'Prescription',
          fileSize: '720 KB',
          folder: 'prescriptions'
        })
      });
      setLoading(false);
      setUploadPrescriptionModal(false);
      if (response.ok) {
        // Auto issue matching prescription
        await fetch(`${apiUrl}/api/dashboard/prescriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: userProfile.healthId,
            patientName: userProfile.fullName,
            doctorName: "Uploaded Document Diagnostic",
            medications: "Paracetamol 650mg, Cough Syrup (OTC Oral Fluid)"
          })
        });
        Alert.alert('Prescription Parsed', 'Doctor prescription uploaded. System created active order flow.');
        setPrescFileName('');
        fetchAllData(userProfile.healthId);
      }
    } catch(e) {
      setLoading(false);
      setUploadPrescriptionModal(false);
      
      const cleanName = prescFileName.endsWith('.pdf') ? prescFileName : `${prescFileName}.pdf`;
      const docItem = {
        id: `DOC-${Math.floor(1000 + Math.random()*9000)}`,
        patientId: userProfile.healthId,
        fileName: cleanName,
        fileType: "PDF",
        fileSize: "720 KB",
        category: "Prescription",
        date: new Date().toISOString().split('T')[0],
        folder: "prescriptions"
      };
      setDocumentsList(prev => [docItem, ...prev]);

      const rxItem = {
        id: `RX-${Math.floor(1000 + Math.random()*9000)}`,
        patientId: userProfile.healthId,
        patientName: userProfile.fullName,
        doctorName: "Uploaded Doc Simulation",
        medications: "Paracetamol 650mg, Cough Syrup (OTC Oral Fluid)",
        status: "Active",
        date: new Date().toISOString().split('T')[0]
      };
      setPrescriptionsList(prev => [rxItem, ...prev]);
      Alert.alert('Offline Upload Success', 'Simulated prescription processed, available in active pharmacy feed.');
      setPrescFileName('');
    }
  };

  // --- APPOINTMENTS / CARE BOOKINGS DISPATCHER ---
  const careCatalog = [
    { type: 'Doctor Consultation', name: 'Dr. Dev Kumar (Cardiologist)', price: 500 },
    { type: 'Doctor Consultation', name: 'Dr. Anjali Mehta (Pediatrician)', price: 600 },
    { type: 'Home Care Service', name: 'Home Care Nurse (Elderly Support)', price: 1200 },
    { type: 'Home Care Service', name: 'Physical Therapist Visit', price: 800 }
  ];

  const handleInitBooking = () => {
    const catalogItem = careCatalog.find(c => c.name === providerName);
    const amount = catalogItem ? catalogItem.price : 500;
    
    setCheckoutItem({
      id: `BKG-${Math.floor(1000 + Math.random()*9000)}`,
      name: `${bookingType} - ${providerName}`,
      price: amount,
      type: 'booking'
    });
    setCheckoutModalOpen(true);
  };

  const processBookingBackend = async (method) => {
    setPayProcessing(true);
    try {
      const checkResponse = await fetch(`${apiUrl}/api/dashboard/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userProfile.healthId,
          itemId: checkoutItem.id,
          itemType: checkoutItem.type,
          amount: checkoutItem.price,
          paymentMethod: method,
          cardNumber: cardNumber,
          upiId: upiId
        })
      });
      
      if (checkResponse.ok) {
        const response = await fetch(`${apiUrl}/api/dashboard/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: userProfile.healthId,
            bookingType: bookingType,
            providerName: providerName,
            date: bookingDate,
            time: bookingTime,
            details: bookingReason || 'Paid appointment booked'
          })
        });

        if (response.ok) {
          Alert.alert('Care Scheduled', 'Paid consultation confirmed successfully!');
          setBookingReason('');
          setCheckoutModalOpen(false);
          setCheckoutItem(null);
          setUpiId('');
          setCardNumber('');
          fetchAllData(userProfile.healthId);
        }
      }
      setPayProcessing(false);
    } catch(e) {
      setPayProcessing(false);
      // Offline fallback
      setCheckoutModalOpen(false);
      const bId = checkoutItem.id;
      const newBk = {
        id: bId,
        patientId: userProfile.healthId,
        type: bookingType,
        provider: providerName,
        date: bookingDate,
        time: bookingTime,
        status: "Confirmed",
        details: bookingReason || "Paid local simulation"
      };
      setBookingsList(prev => [newBk, ...prev]);

      const newBlock = {
        block_index: blockchainLedger.length,
        timestamp: Date.now() / 1000,
        data: JSON.stringify({ action: "CARE_BOOKING", details: { bookingId: bId, provider: providerName, method: method } }),
        previous_hash: blockchainLedger[blockchainLedger.length - 1]?.hash || "0",
        hash: Math.random().toString(16).substr(2, 32)
      };
      setBlockchainLedger(prev => [...prev, newBlock]);
      Alert.alert('Offline Booking Saved', 'Appointment booked locally using simulated checkout.');
      setBookingReason('');
      setCheckoutItem(null);
      setUpiId('');
      setCardNumber('');
    }
  };

  // --- FITNESS CLASS SCHEDULER & BOOKER ---
  const fitnessActivities = [
    { type: 'Yoga Class', name: 'Hatha Yoga Morning Session', price: 350 },
    { type: 'Aerobics Class', name: 'Zumba & Aerobics Burnout', price: 300 },
    { type: 'Dance Class', name: 'Contemporary Dance Workout', price: 400 },
    { type: 'Gym Pass', name: 'FitClub Gym Day Pass Access', price: 250 }
  ];

  const handleBookFitnessSlot = (activity) => {
    setSelectedFitnessActivity(activity);
    setFitnessModalOpen(true);
  };

  const processFitnessBooking = async () => {
    if (!selectedFitnessActivity) return;
    setLoading(true);
    const finalPrice = usePointsToggle ? Math.max(0, selectedFitnessActivity.price - rewardPoints) : selectedFitnessActivity.price;
    const pointsDeducted = usePointsToggle ? Math.min(rewardPoints, selectedFitnessActivity.price) : 0;
    
    try {
      const response = await fetch(`${apiUrl}/api/dashboard/fitness/book-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userProfile.healthId,
          activityType: selectedFitnessActivity.type,
          activityName: selectedFitnessActivity.name,
          scheduleDate: fitnessDate,
          scheduleTime: fitnessTime,
          price: selectedFitnessActivity.price,
          discountApplied: pointsDeducted,
          pointsRedeemed: pointsDeducted,
          finalPrice: finalPrice,
          paymentMethod: finalPrice === 0 ? 'Points' : 'UPI'
        })
      });
      setLoading(false);
      setFitnessModalOpen(false);

      if (response.ok) {
        if (pointsDeducted > 0) {
          setRewardPoints(prev => Math.max(0, prev - pointsDeducted));
        }
        Alert.alert('Booking Confirmed', 'Fitness session schedule committed to ledger.');
        setUsePointsToggle(false);
        fetchAllData(userProfile.healthId);
      }
    } catch(e) {
      setLoading(false);
      setFitnessModalOpen(false);
      // Offline fallback
      const fId = `FIT-${Math.floor(1000 + Math.random()*9000)}`;
      const priceText = finalPrice === 0 ? "Booked (Points Redeemed)" : `Booked (Paid Rs.${finalPrice})`;
      
      const newFb = {
        id: fId,
        patientId: userProfile.healthId,
        type: selectedFitnessActivity.type,
        name: selectedFitnessActivity.name,
        date: fitnessDate,
        time: fitnessTime,
        price: `Rs.${finalPrice}`,
        status: priceText
      };
      setFitnessBookings(prev => [newFb, ...prev]);

      if (pointsDeducted > 0) {
        setRewardPoints(prev => Math.max(0, prev - pointsDeducted));
      }

      const newBlock = {
        block_index: blockchainLedger.length,
        timestamp: Date.now() / 1000,
        data: JSON.stringify({ action: "FITNESS_ACTIVITY_BOOKED", details: { bookingId: fId, activity: selectedFitnessActivity.name, price: finalPrice } }),
        previous_hash: blockchainLedger[blockchainLedger.length - 1]?.hash || "0",
        hash: Math.random().toString(16).substr(2, 32)
      };
      setBlockchainLedger(prev => [...prev, newBlock]);
      Alert.alert('Offline Slot Booked', 'Fitness session scheduled locally.');
      setUsePointsToggle(false);
    }
  };

  // --- INSURANCE CASHLESS CLAIMS ENGINE ---
  const handleSubmitCashlessClaim = async () => {
    if (!claimProvider.trim() || !claimService.trim() || !claimAmount.trim()) {
      Alert.alert('Input Missing', 'Fill out the healthcare provider, service details, and claim amount.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/dashboard/claims/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userProfile.healthId,
          documentId: claimDocSelected || 'NONE',
          provider: claimProvider,
          service: claimService,
          amount: parseFloat(claimAmount.replace(/,/g, '')),
          policyType: claimPolicyType,
          schemeName: userProfile.abhaProfile?.linkedScheme || 'Universal Private Policy'
        })
      });
      setLoading(false);
      setClaimModalOpen(false);

      if (response.ok) {
        Alert.alert('Claim Dispatched', 'Cashless medical claim approved. Balance updated.');
        setClaimProvider('');
        setClaimService('');
        setClaimAmount('');
        fetchAllData(userProfile.healthId);
        // Refresh User profile to sync coverage balance
        handleReloadProfile();
      }
    } catch(e) {
      setLoading(false);
      setClaimModalOpen(false);
      // Offline fallback
      const cId = `CLM-${Math.floor(1000 + Math.random()*9000)}`;
      const amtVal = parseFloat(claimAmount);
      const isGov = claimPolicyType === 'Government';
      const statusText = isGov ? "Settled (100% Cashless)" : "Approved (Direct Cashless)";
      const schemeText = isGov ? (userProfile.abhaProfile?.linkedScheme || 'AB-PMJAY Cover') : 'Universal Private Policy';

      const newCl = {
        id: cId,
        patientId: userProfile.healthId,
        provider: claimProvider,
        service: claimService,
        amount: `Rs.${amtVal.toLocaleString()}`,
        status: statusText,
        scheme: schemeText,
        date: new Date().toISOString().split('T')[0],
        blockHeight: blockchainLedger.length
      };
      setClaimsList(prev => [newCl, ...prev]);

      if (isGov && userProfile.abhaLinked) {
        try {
          let curr = parseFloat(userProfile.abhaProfile.insuranceBalance.replace(/[^\d.]/g, ''));
          let next = Math.max(0, curr - amtVal);
          userProfile.abhaProfile.insuranceBalance = `Rs.${next.toLocaleString()}`;
        } catch(err){}
      }

      const newBlock = {
        block_index: blockchainLedger.length,
        timestamp: Date.now() / 1000,
        data: JSON.stringify({ action: "CLAIM_SUBMITTED_CASHLESS", details: { claimId: cId, provider: claimProvider, amount: amtVal } }),
        previous_hash: blockchainLedger[blockchainLedger.length - 1]?.hash || "0",
        hash: Math.random().toString(16).substr(2, 32)
      };
      setBlockchainLedger(prev => [...prev, newBlock]);
      Alert.alert('Offline Claim Settled', 'Cashless medical claim simulated successfully.');
      setClaimProvider('');
      setClaimService('');
      setClaimAmount('');
    }
  };

  const handleReloadProfile = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: mobileNumber, otpCode: '123456', fullName: fullName })
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      }
    } catch(e){}
  };

  // --- LOANS & FINANCIAL COLLATERAL CREDIT CHECKS ---
  const handleCheckCibil = () => {
    setCibilState('checking');
    setTimeout(() => {
      setCibilScore(785);
      setCibilState('checked');
      Alert.alert('Credit Bureau Sync', 'CIBIL Score Loaded: 785 - Excellent. Limit Pre-Approved up to Rs. 5,00,000!');
    }, 2000);
  };

  const getLoanEMI = () => {
    const monthlyInt = 0.00; // 0% APR for pre-approved medical disburse
    const monthlyPayment = loanAmount / loanTenure;
    return Math.round(monthlyPayment);
  };

  const handleOneClickLoanDisburse = async () => {
    setLoanProcessing(true);
    try {
      let response;
      if (loanCollateralType === 'Collateral Against Insurance Cover' && userProfile.abhaLinked) {
        response = await fetch(`${apiUrl}/api/dashboard/loans/apply-collateral`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: userProfile.healthId,
            loanAmount: loanAmount,
            tenureMonths: loanTenure,
            schemeUsed: userProfile.abhaProfile.linkedScheme,
            policyBalance: parseFloat(userProfile.abhaProfile.insuranceBalance.replace(/[^\d.]/g, ''))
          })
        });
      } else {
        response = await fetch(`${apiUrl}/api/dashboard/loans/one-click-apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: userProfile.healthId,
            loanAmount: loanAmount,
            tenureMonths: loanTenure,
            loanType: loanCollateralType
          })
        });
      }
      setLoanProcessing(false);
      if (response.ok) {
        Alert.alert('Loan Disbursed', `Instant 1-Click disbursal of Rs.${loanAmount} successful! Sent to bank accounts.`);
        setLoanModalOpen(false);
        fetchAllData(userProfile.healthId);
        handleReloadProfile();
      }
    } catch(e) {
      setLoanProcessing(false);
      setLoanModalOpen(false);
      // Offline fallback
      const lId = `LON-${Math.floor(1000 + Math.random()*9000)}`;
      const emi = getLoanEMI();
      const schemeCollateral = loanCollateralType === 'Collateral Against Insurance Cover' ? (userProfile.abhaProfile?.linkedScheme || 'ABHA Govt Policy') : 'Credit Score Direct Collateral';
      
      const newLn = {
        id: lId,
        patientId: userProfile.healthId,
        amount: loanAmount,
        collateralPolicy: schemeCollateral,
        tenureMonths: loanTenure,
        monthlyEmi: emi,
        status: "Disbursed",
        date: new Date().toISOString().split('T')[0],
        interestRate: "0% APR (Pre-Approved)"
      };
      setLoansList(prev => [newLn, ...prev]);

      if (loanCollateralType === 'Collateral Against Insurance Cover' && userProfile.abhaLinked) {
        try {
          let curr = parseFloat(userProfile.abhaProfile.insuranceBalance.replace(/[^\d.]/g, ''));
          let next = Math.max(0, curr - loanAmount);
          userProfile.abhaProfile.insuranceBalance = `Rs.${next.toLocaleString()}`;
        } catch(err){}
      }

      const newBlock = {
        block_index: blockchainLedger.length,
        timestamp: Date.now() / 1000,
        data: JSON.stringify({ action: "ONE_CLICK_LOAN_DISBURSED", details: { loanId: lId, amount: loanAmount, collateral: schemeCollateral } }),
        previous_hash: blockchainLedger[blockchainLedger.length - 1]?.hash || "0",
        hash: Math.random().toString(16).substr(2, 32)
      };
      setBlockchainLedger(prev => [...prev, newBlock]);
      Alert.alert('Offline Loan Credited', `Simulated loan ${lId} approved at 0% APR. Check ledger.`);
    }
  };

  // --- EMERGENCY AMBULANCE TRAJECTORY DISPATCHER ---
  const handleBookAmbulance = async () => {
    if (!pickupAddress.trim()) {
      Alert.alert('Address Required', 'Enter pickup address coordinates.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/dashboard/emergency/book-ambulance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userProfile.healthId,
          ambulanceType: ambulanceType,
          pickupAddress: pickupAddress
        })
      });
      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        setAmbulanceBooking(data.booking);
        setAmbProgress(0);
        Alert.alert('Emergency Dispatched', 'Ambulance is en route. Dynamic tracking activated!');
        triggerAmbulanceTrackingPoll(userProfile.healthId);
      }
    } catch(e) {
      setLoading(false);
      // Offline Dispatch Simulation
      const ambId = `AMB-${Math.floor(1000 + Math.random()*9000)}`;
      const drivers = ["Driver Ramesh Kumar", "Driver Sandeep Patil", "Driver Anil Sharma"];
      const vehicles = ["MH-12-EQ-8892", "MH-12-AS-9981", "MH-12-DF-2241"];
      const selectIndex = Math.floor(Math.random() * 3);
      
      const mockAmb = {
        id: ambId,
        patientId: userProfile.healthId,
        ambulanceType: ambulanceType,
        pickupAddress: pickupAddress,
        status: "Dispatched",
        etaMinutes: 10,
        driverName: drivers[selectIndex],
        driverContact: "+91 99887 76655",
        vehicleNumber: vehicles[selectIndex],
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now() / 1000
      };
      setAmbulanceBooking(mockAmb);
      setAmbProgress(0);

      const newBlock = {
        block_index: blockchainLedger.length,
        timestamp: Date.now() / 1000,
        data: JSON.stringify({ action: "EMERGENCY_AMBULANCE_DISPATCHED", details: { bookingId: ambId, driver: mockAmb.driverName, type: ambulanceType } }),
        previous_hash: blockchainLedger[blockchainLedger.length - 1]?.hash || "0",
        hash: Math.random().toString(16).substr(2, 32)
      };
      setBlockchainLedger(prev => [...prev, newBlock]);
      Alert.alert('Offline Ambulance Sent', `Simulated dispatch of vehicle ${mockAmb.vehicleNumber} triggered.`);
      triggerAmbulanceTrackingPoll(userProfile.healthId);
    }
  };

  const triggerAmbulanceTrackingPoll = (patientId) => {
    if (ambulanceIntervalRef.current) clearInterval(ambulanceIntervalRef.current);
    
    ambulanceIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${apiUrl}/api/dashboard/emergency/ambulance-status/${patientId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setAmbulanceBooking(data.booking);
            setAmbProgress(data.progress);
            if (data.booking.status === 'Arrived') {
              clearInterval(ambulanceIntervalRef.current);
              Alert.alert('Arrived', 'Your Ambulance has arrived at pickup location!');
            }
          }
        }
      } catch(e) {
        // Offline tracking simulator
        setAmbProgress(prev => {
          const next = prev + 0.15;
          if (next >= 1.0) {
            clearInterval(ambulanceIntervalRef.current);
            setAmbulanceBooking(old => ({ ...old, status: 'Arrived', etaMinutes: 0 }));
            Alert.alert('Arrived', 'Simulated Ambulance has arrived!');
            return 1.0;
          } else if (next >= 0.5) {
            setAmbulanceBooking(old => ({ ...old, status: 'En Route', etaMinutes: 4 }));
          }
          return next;
        });
      }
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (ambulanceIntervalRef.current) clearInterval(ambulanceIntervalRef.current);
    };
  }, []);

  const handleTriggerSiren = () => {
    setSirenActive(prev => !prev);
    if (!sirenActive) {
      Alert.alert('Siren Triggered', 'Simulated loud rescue audio tone sent to local node emergency speakers.');
    }
  };

  // --- GENERAL LOGOUT & RESET ---
  const handleLogout = () => {
    setUserProfile(null);
    setFullName('');
    setMobileNumber('');
    setOtpCode('');
    setCurrentTab('Overview');
    setStep(1);
    setCart([]);
    setAmbulanceBooking(null);
    if (ambulanceIntervalRef.current) clearInterval(ambulanceIntervalRef.current);
    if (nfcIntervalRef.current) clearInterval(nfcIntervalRef.current);
  };

  // --- SUB-SCREEN RENDERS ---
  
  // LOGIN SCREEN
  const renderLoginScreen = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🔑 Passwordless Patient Gateway</Text>
      <Text style={styles.cardDesc}>Sign in instantly using your mobile number or email. Real-time encryption active.</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Patient Full Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Anna Smith" 
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="#7d9696"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mobile Phone or Email</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. 9876543210" 
          value={mobileNumber}
          onChangeText={setMobileNumber}
          placeholderTextColor="#7d9696"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Core API Backend Node Address</Text>
        <TextInput 
          style={[styles.input, { fontSize: 13 }]} 
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholderTextColor="#7d9696"
          autoCapitalize="none"
        />
        <Text style={{ fontSize: 10, color: '#7d9696', marginTop: 4 }}>
          *Use 'http://127.0.0.1:8000' or local laptop IP (e.g. 'http://192.168.1.100:8000')
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Dispatch Secure Passcode</Text>}
      </TouchableOpacity>
    </View>
  );

  // OTP VERIFY SCREEN
  const renderVerifyScreen = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🔐 Input Authenticator Passcode</Text>
      <Text style={styles.cardDesc}>A simulated OTP was sent to {mobileNumber}. Check the alert code popup.</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>6-Digit Verification Code</Text>
        <TextInput 
          style={[styles.input, styles.otpInput]} 
          placeholder="123456" 
          keyboardType="number-pad"
          maxLength={6}
          value={otpCode}
          onChangeText={setOtpCode}
          placeholderTextColor="#7d9696"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Authorize Identity & Unlock</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => setStep(1)}>
        <Text style={styles.linkText}>Modify Credentials</Text>
      </TouchableOpacity>
    </View>
  );

  // SUBPANEL: OVERVIEW TAB
  const renderOverviewTab = () => {
    // Determine card background style based on scheme
    let cardStyle = styles.cardTeal;
    if (userProfile?.abhaLinked) {
      if (userProfile.abhaProfile.badgeText.includes("MJPJAY")) cardStyle = styles.cardMjpjay;
      else if (userProfile.abhaProfile.badgeText.includes("AAROGYASRI")) cardStyle = styles.cardAarogyasri;
      else if (userProfile.abhaProfile.badgeText.includes("CMCHIS")) cardStyle = styles.cardCmchis;
      else if (userProfile.abhaProfile.badgeText.includes("CHIRANJEEVI")) cardStyle = styles.cardChiranjeevi;
      else if (userProfile.abhaProfile.badgeText.includes("BSKY")) cardStyle = styles.cardBsky;
    }

    return (
      <View>
        {/* Universal Health Card Front */}
        <View style={[styles.healthCard, cardStyle]}>
          <View style={styles.healthCardHeader}>
            <Text style={styles.healthCardLogo}>sehat<Text style={styles.healthCardLogoAlt}>recover</Text></Text>
            <Text style={styles.healthCardType}>
              {userProfile?.abhaLinked ? 'ABHA INTEGRATED CARD' : 'UNIVERSAL HEALTH CARD'}
            </Text>
          </View>

          <Text style={styles.patientName}>{userProfile?.fullName}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>HEALTH CARD NUMBER</Text>
              <Text style={styles.infoVal}>{userProfile?.healthId}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>MOBILE CONTACT</Text>
              <Text style={styles.infoVal}>{userProfile?.contact}</Text>
            </View>
          </View>

          {userProfile?.abhaLinked && (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>ABHA ADDRESS</Text>
                  <Text style={styles.infoVal}>{userProfile.abhaProfile.abhaAddress}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>ABHA NUMBER</Text>
                  <Text style={styles.infoVal}>{userProfile.abhaProfile.abhaNumber}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>GOVT INSURED SCHEME</Text>
                  <Text style={styles.infoVal} numberOfLines={1}>{userProfile.abhaProfile.linkedScheme}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>SCHEME CASHLESS BALANCE</Text>
                  <Text style={[styles.infoVal, { color: '#00ccb4' }]}>{userProfile.abhaProfile.insuranceBalance}</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.healthCardFooter}>
            <Text style={styles.secureBadge}>
              {userProfile?.abhaLinked ? `🇮🇳 ${userProfile.abhaProfile.badgeText}` : '🛡️ SECURE HEALTH ENCRYPTED'}
            </Text>
            <Text style={styles.cardCompany}>SehatRecover Network</Text>
          </View>
        </View>

        {/* Sync Mode Notification */}
        {offlineMode && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>⚠️ Connection Timeout. Sandbox Simulation Mode active.</Text>
          </View>
        )}

        {/* IoMT Sensors Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>📈 Real-Time IoMT Sync</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={handleSyncVitals} disabled={syncingVitals}>
            {syncingVitals ? <ActivityIndicator size="small" color="#00ccb4" /> : <Text style={styles.syncBtnText}>🔄 Sync Ledger</Text>}
          </TouchableOpacity>
        </View>
        
        <View style={styles.gridTwo}>
          <View style={styles.sensorCard}>
            <Text style={styles.sensorIcon}>❤️</Text>
            <Text style={styles.sensorVal}>{heartRate} <Text style={styles.sensorUnit}>BPM</Text></Text>
            <Text style={styles.sensorName}>Heart Rate Sensor</Text>
            <Text style={styles.sensorStatus}>● Synced & Pulsing</Text>
          </View>

          <View style={styles.sensorCard}>
            <Text style={styles.sensorIcon}>🫁</Text>
            <Text style={styles.sensorVal}>{oxygenLevel}%</Text>
            <Text style={styles.sensorName}>Pulse Oximeter SpO2</Text>
            <Text style={styles.sensorStatus}>● Normal Range</Text>
          </View>
        </View>

        <View style={styles.rewardContainer}>
          <Text style={styles.rewardTitle}>⭐ SehatRecover Patient Rewards</Text>
          <Text style={styles.rewardPointsVal}>{rewardPoints} Points</Text>
          <Text style={styles.rewardDesc}>Points earned from fitness logs and vitals syncs. Redeem at checkout for discounts.</Text>
        </View>

        {/* Active Prescriptions Feed */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>📋 Active Doctor Prescriptions</Text>
        {prescriptionsList.length === 0 ? (
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>No active prescriptions found.</Text></View>
        ) : (
          prescriptionsList.map(rx => (
            <View key={rx.id} style={styles.listItem}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Prescription {rx.id}</Text>
                <Text style={styles.badgeActive}>{rx.status}</Text>
              </View>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Doctor:</Text> {rx.doctorName}</Text>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Rx Meds:</Text> {rx.medications}</Text>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Date Issued:</Text> {rx.date}</Text>
              <View style={styles.listItemActions}>
                <TouchableOpacity style={styles.subButton} onPress={() => loadPrescriptionToCart(rx)}>
                  <Text style={styles.subButtonText}>🛒 Pre-fill Shopping Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  // SUBPANEL: RECORDS VAULT TAB (Google Drive layout)
  const renderRecordsVaultTab = () => {
    // Folders config
    const folders = [
      { key: 'prescriptions', name: 'Prescriptions', icon: '⚕️', color: '#0ea5e9' },
      { key: 'diagnostics', name: 'Lab Diagnostics', icon: '🔬', color: '#10b981' },
      { key: 'insurance_docs', name: 'Policies & Insurances', icon: '🛡️', color: '#f59e0b' },
      { key: 'gov_cards', name: 'Government Cards', icon: '🇮🇳', color: '#ef4444' }
    ];

    return (
      <View>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>📂 Records Vault (Google Drive Format)</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={() => setUploadModalOpen(true)}>
            <Text style={styles.syncBtnText}>➕ Upload Document</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.cardDesc}>Access, upload and share your diagnostic files, policies, and health IDs securely. Secure hash audit trails enabled.</Text>

        {selectedFolder === null ? (
          // Grid Folder View
          <View style={styles.gridTwo}>
            {folders.map(f => {
              const fileCount = documentsList.filter(d => d.folder === f.key).length;
              return (
                <TouchableOpacity key={f.key} style={styles.folderCard} onPress={() => setSelectedFolder(f.key)}>
                  <Text style={[styles.folderIcon, { color: f.color }]}>{f.icon}</Text>
                  <Text style={styles.folderName}>{f.name}</Text>
                  <Text style={styles.folderCount}>{fileCount} Items</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          // Inside Folder View
          <View>
            <TouchableOpacity style={styles.backFolderBtn} onPress={() => setSelectedFolder(null)}>
              <Text style={styles.backFolderText}>⬅️ Back to Folders Root</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
              📁 Category: {folders.find(f => f.key === selectedFolder)?.name}
            </Text>

            {documentsList.filter(d => d.folder === selectedFolder).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Folder is empty. Upload items above.</Text>
              </View>
            ) : (
              documentsList.filter(d => d.folder === selectedFolder).map(doc => (
                <View key={doc.id} style={styles.listItem}>
                  <View style={styles.listHeader}>
                    <Text style={styles.listTitle} numberOfLines={1}>{doc.fileName}</Text>
                    <Text style={styles.badgeFormat}>{doc.fileType}</Text>
                  </View>
                  <View style={styles.docRowDetails}>
                    <Text style={styles.listText}>Size: {doc.fileSize}  |  Uploaded: {doc.date}</Text>
                    <Text style={styles.docHashText}>Block Hashed #SHA256</Text>
                  </View>
                  <View style={styles.listItemActions}>
                    <TouchableOpacity style={styles.subButton} onPress={() => triggerNfcTimer(doc)}>
                      <Text style={styles.subButtonText}>📶 Time-limited NFC Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Timed verification NFC view overlay (Google countdown screen) */}
        {nfcTimerActive && nfcShareFile && (
          <View style={styles.nfcPanel}>
            <Text style={styles.nfcTitle}>📶 Google-Style Timed NFC Consent</Text>
            <Text style={styles.nfcSubtitle}>Sharing: {nfcShareFile.fileName}</Text>
            
            <View style={styles.nfcTimerRingContainer}>
              <View style={styles.nfcOtpBox}>
                <Text style={styles.nfcOtpCode}>{nfcCode}</Text>
              </View>
              <Text style={styles.nfcTimerSeconds}>{nfcCountdown}s remaining</Text>
            </View>

            {/* Countdown animation progress bar */}
            <View style={styles.progressBarBg}>
              <Animated.View style={[
                styles.progressBarFill, 
                { 
                  width: nfcProgressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]} />
            </View>

            <Text style={styles.nfcWarning}>
              NFC readers and Doctor panels can scan or use this OTP to securely fetch the file. Access automatically revokes when the timer hits zero.
            </Text>

            <TouchableOpacity style={styles.cancelNfcBtn} onPress={() => {
              clearInterval(nfcIntervalRef.current);
              setNfcTimerActive(false);
              setNfcShareFile(null);
            }}>
              <Text style={styles.cancelNfcText}>Revoke Share Consent</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // SUBPANEL: ONLINE PHARMACY
  const renderPharmacyTab = () => {
    const filteredOtc = otcItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const cartTotals = getCartTotals();

    return (
      <View>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>🛒 Pharmacy Online Purchase</Text>
          <TouchableOpacity style={styles.cartToggleBtn} onPress={() => setCartOpen(prev => !prev)}>
            <Text style={styles.cartToggleText}>💼 Cart ({cart.reduce((a,i) => a + i.qty, 0)})</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardDesc}>Order your medicines securely. Upload doctor prescriptions for scheme benefits or buy OTC health products.</Text>

        <View style={styles.pharmaActionRow}>
          <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => setUploadPrescriptionModal(true)}>
            <Text style={styles.secondaryActionBtnText}>📄 Upload Rx Prescription File</Text>
          </TouchableOpacity>
        </View>

        {/* Prescription List pre-fill */}
        <Text style={styles.subHeading}>Order Active Prescriptions</Text>
        {prescriptionsList.length === 0 ? (
          <Text style={styles.emptyTextSub}>No active prescriptions to auto-fill.</Text>
        ) : (
          prescriptionsList.map(rx => (
            <View key={rx.id} style={styles.miniRxItem}>
              <View style={{flex: 1}}>
                <Text style={styles.miniRxTitle}>Prescription {rx.id} ({rx.doctorName})</Text>
                <Text style={styles.miniRxMeds} numberOfLines={1}>{rx.medications}</Text>
              </View>
              <TouchableOpacity style={styles.miniRxBtn} onPress={() => loadPrescriptionToCart(rx)}>
                <Text style={styles.miniRxBtnText}>Auto-Order</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* OTC catalog */}
        <Text style={[styles.subHeading, { marginTop: 20 }]}>Over-The-Counter Catalog</Text>
        <TextInput
          style={styles.searchBar}
          placeholder="Search catalog (e.g. Paracetamol, vitamins...)"
          placeholderTextColor="#7d9696"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredOtc.map(item => (
          <View key={item.id} style={styles.catalogItem}>
            <View style={{flex: 1, paddingRight: 8}}>
              <Text style={styles.catalogName}>{item.name}</Text>
              <Text style={styles.catalogDesc}>{item.desc}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.catalogPrice}>Rs. {item.price}</Text>
              <TouchableOpacity style={styles.addCartBtn} onPress={() => handleAddOtcToCart(item)}>
                <Text style={styles.addCartBtnText}>Add +</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Cart Slide-up drawer (Simulated Modal) */}
        {cartOpen && (
          <View style={styles.cartDrawer}>
            <View style={styles.cartDrawerHeader}>
              <Text style={styles.cartDrawerTitle}>Shopping Cart Checklist</Text>
              <TouchableOpacity onPress={() => setCartOpen(false)}>
                <Text style={{color: '#ef4444', fontWeight: '700'}}>Close</Text>
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <Text style={styles.emptyCartText}>Your shopping cart is empty.</Text>
            ) : (
              <ScrollView style={{maxHeight: 200}}>
                {cart.map(item => (
                  <View key={item.id} style={styles.cartItemRow}>
                    <View style={{flex: 1}}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemSub}>Rs. {item.price} each</Text>
                    </View>
                    <View style={styles.qtyContainer}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQuantityChange(item.id, -1)}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{item.qty}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQuantityChange(item.id, 1)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.cartOptionsDivider} />

            {/* Coupons & Loyalty */}
            <View style={styles.cartRow}>
              <TextInput
                style={[styles.input, {flex: 1, height: 42, paddingVertical: 0, marginRight: 8}]}
                placeholder="Coupon Code (e.g. SEHAT20)"
                placeholderTextColor="#7d9696"
                value={couponInput}
                onChangeText={setCouponInput}
              />
              <TouchableOpacity style={styles.couponBtn} onPress={handleApplyCoupon}>
                <Text style={styles.couponBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {/* Points slider trigger */}
            <View style={styles.cartRowBetween}>
              <View>
                <Text style={styles.cartOptionLabel}>Redeem Reward Points (Points: {rewardPoints})</Text>
                <Text style={styles.cartOptionSub}>1 Point = Rs. 1.00 Off</Text>
              </View>
              <Switch
                value={usePointsToggle}
                onValueChange={(val) => {
                  setUsePointsToggle(val);
                  setPointsRedeemedVal(val ? Math.min(rewardPoints, cart.reduce((a,i)=>a+(i.price*i.qty), 0)) : 0);
                }}
                trackColor={{ false: "#1f2e2e", true: "#00ccb4" }}
                thumbColor={usePointsToggle ? "#fff" : "#7d9696"}
              />
            </View>

            {/* Royal Customer Switch */}
            <View style={styles.cartRowBetween}>
              <View>
                <Text style={styles.cartOptionLabel}>👑 Royal Loyalty Member Club</Text>
                <Text style={styles.cartOptionSub}>Extra 10% discount on final cart totals</Text>
              </View>
              <Switch
                value={royalCustomerToggle}
                onValueChange={setRoyalCustomerToggle}
                trackColor={{ false: "#1f2e2e", true: "#00ccb4" }}
                thumbColor={royalCustomerToggle ? "#fff" : "#7d9696"}
              />
            </View>

            <View style={styles.cartOptionsDivider} />

            {/* Cart Billing Summary Table */}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Original Subtotal</Text>
              <Text style={styles.billVal}>Rs. {cartTotals.subtotal}</Text>
            </View>
            {userProfile?.abhaLinked && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Govt Scheme subsidy (Ayushman)</Text>
                <Text style={[styles.billVal, {color: '#10b981'}]}>- Rs. {cartTotals.schemeSubsidy}</Text>
              </View>
            )}
            {couponDiscount > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Coupon Discount Applied</Text>
                <Text style={[styles.billVal, {color: '#10b981'}]}>- Rs. {cartTotals.couponDiscountAmount}</Text>
              </View>
            )}
            {usePointsToggle && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Redeemed Points saved</Text>
                <Text style={[styles.billVal, {color: '#10b981'}]}>- Rs. {cartTotals.pointsDiscount}</Text>
              </View>
            )}
            {royalCustomerToggle && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Royal Club Extra 10% Off</Text>
                <Text style={[styles.billVal, {color: '#10b981'}]}>- Rs. {cartTotals.royalDiscountAmount}</Text>
              </View>
            )}
            <View style={styles.cartOptionsDivider} />
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, {fontWeight: '800', fontSize: 16}]}>Final Amount</Text>
              <Text style={[styles.billVal, {fontWeight: '800', fontSize: 16, color: '#00ccb4'}]}>Rs. {cartTotals.finalPrice}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handlePlaceOrder}>
              <Text style={styles.buttonText}>
                {cartTotals.finalPrice === 0 ? 'Process Cashless Dispatch' : 'Initiate Secure Checkout'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // SUBPANEL: CARE BOOKINGS & PAYMENTS
  const renderBookCareTab = () => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👩‍⚕️ Schedule Clinical Consultation</Text>
        <Text style={styles.cardDesc}>Select your desired medical expert or home nursing assistance, and pay via secure checkouts.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Consultation/Care Type</Text>
          <View style={styles.chipsContainer}>
            {['Doctor Consultation', 'Home Care Service'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.chipButton, bookingType === type && styles.chipButtonActive]}
                onPress={() => {
                  setBookingType(type);
                  // Auto set first provider in sub list
                  if (type === 'Doctor Consultation') setProviderName('Dr. Dev Kumar (Cardiologist)');
                  else setProviderName('Home Care Nurse (Elderly Support)');
                }}
              >
                <Text style={[styles.chipText, bookingType === type && styles.chipTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Choose Provider (Pricing Details)</Text>
          <View style={styles.chipsContainer}>
            {careCatalog.filter(c => c.type === bookingType).map(p => (
              <TouchableOpacity
                key={p.name}
                style={[styles.chipButton, providerName === p.name && styles.chipButtonActive]}
                onPress={() => setProviderName(p.name)}
              >
                <Text style={[styles.chipText, providerName === p.name && styles.chipTextActive]}>
                  {p.name} (Rs.{p.price})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Appointment Date</Text>
          <TextInput 
            style={styles.input} 
            placeholder="YYYY-MM-DD" 
            value={bookingDate}
            onChangeText={setBookingDate}
            placeholderTextColor="#7d9696"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Appointment Slot Time</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. 10:30 AM" 
            value={bookingTime}
            onChangeText={setBookingTime}
            placeholderTextColor="#7d9696"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Symptoms or Reason details</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Describe reason..." 
            value={bookingReason}
            onChangeText={setBookingReason}
            placeholderTextColor="#7d9696"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleInitBooking}>
          <Text style={styles.buttonText}>Proceed to Payment Checkout</Text>
        </TouchableOpacity>

        {/* List current Bookings */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>📅 Scheduled Care History</Text>
        {bookingsList.length === 0 ? (
          <Text style={styles.emptyTextSub}>No active appointments booked.</Text>
        ) : (
          bookingsList.map(bk => (
            <View key={bk.id} style={styles.listItem}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{bk.type}</Text>
                <Text style={styles.badgeActive}>{bk.status}</Text>
              </View>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Provider:</Text> {bk.provider}</Text>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Schedule:</Text> {bk.date} at {bk.time}</Text>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Notes:</Text> {bk.details}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  // SUBPANEL: FITNESS TAB (Gym, Yoga & Aerobics)
  const renderFitnessTab = () => {
    return (
      <View>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>🏋️ Fitness Scheduler & Tracker</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={handleSyncVitals}>
            <Text style={styles.syncBtnText}>Sync Workout Logs</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardDesc}>Log activities and earn points. Book day passes for gyms, aerobics, dance, and yoga classes.</Text>

        {/* Steps Ring display */}
        <View style={styles.sensorCard}>
          <Text style={styles.fitnessRingTitle}>👣 Daily Step Goal Progress</Text>
          <Text style={styles.fitnessRingValue}>8,420 / 10,000 steps</Text>
          <View style={styles.fitnessBarBg}>
            <View style={[styles.fitnessBarFill, { width: '84.2%' }]} />
          </View>
          <Text style={styles.fitnessPointsNotice}>Earn 50 reward points every day you hit your goals!</Text>
        </View>

        {/* Bookings catalog */}
        <Text style={[styles.subHeading, { marginTop: 20 }]}>Available Fitness Day Passes</Text>
        {fitnessActivities.map(activity => (
          <View key={activity.name} style={styles.catalogItem}>
            <View style={{flex: 1, paddingRight: 8}}>
              <Text style={styles.catalogName}>{activity.name}</Text>
              <Text style={styles.catalogDesc}>Scheduled slots daily. Points redeemable.</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.catalogPrice}>Rs. {activity.price}</Text>
              <TouchableOpacity style={styles.addCartBtn} onPress={() => handleBookFitnessSlot(activity)}>
                <Text style={styles.addCartBtnText}>Book Slot</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Scheduled Slots */}
        <Text style={[styles.subHeading, { marginTop: 24 }]}>Booked Fitness Classes</Text>
        {fitnessBookings.length === 0 ? (
          <Text style={styles.emptyTextSub}>No active classes booked.</Text>
        ) : (
          fitnessBookings.map(fit => (
            <View key={fit.id} style={styles.listItem}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{fit.name}</Text>
                <Text style={styles.badgeFormat}>{fit.type}</Text>
              </View>
              <Text style={styles.listText}>Schedule: {fit.date} at {fit.time}</Text>
              <Text style={styles.listText}>Payment: {fit.price}</Text>
              <Text style={[styles.listText, {color: '#10b981', fontWeight: '700'}]}>{fit.status}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  // SUBPANEL: CLAIMS & INSURANCES TAB
  const renderInsuranceTab = () => {
    return (
      <View>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>🛡️ Universal Card Claims Process</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={() => setClaimModalOpen(true)}>
            <Text style={styles.syncBtnText}>Submit Cashless Claim</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardDesc}>Verify coverage balances and submit cashless claims for hospitalizations or pharmacies using linked insurance certificates.</Text>

        <View style={styles.sensorCard}>
          <Text style={styles.fitnessRingTitle}>🇮🇳 National Insurance Sync (AB-PMJAY)</Text>
          <Text style={styles.insuranceCoverBal}>
            {userProfile?.abhaLinked ? userProfile.abhaProfile.insuranceBalance : '₹0.00 (Unlinked)'}
          </Text>
          <Text style={styles.insuranceSchemeName}>
            {userProfile?.abhaLinked ? userProfile.abhaProfile.linkedScheme : 'No Active Scheme Integrations. Complete ABHA portal details.'}
          </Text>
        </View>

        {/* Claims lists */}
        <Text style={[styles.subHeading, { marginTop: 24 }]}>Settled Healthcare Claims Ledger</Text>
        {claimsList.length === 0 ? (
          <Text style={styles.emptyTextSub}>No medical claims processed yet.</Text>
        ) : (
          claimsList.map(claim => (
            <View key={claim.id} style={styles.listItem}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{claim.provider}</Text>
                <Text style={styles.badgeFormat}>{claim.id}</Text>
              </View>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Treatment Details:</Text> {claim.service}</Text>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Claim Amount:</Text> {claim.amount}</Text>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Sync Scheme:</Text> {claim.scheme}</Text>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Block Audit Height:</Text> Block #{claim.blockHeight}</Text>
              <Text style={[styles.listText, {color: '#10b981', fontWeight: '700'}]}>{claim.status}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  // SUBPANEL: LOANS & FINANCE HUB
  const renderLoansTab = () => {
    return (
      <View>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>💰 Loan Hub & Health Credit Checks</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={() => setLoanModalOpen(true)}>
            <Text style={styles.syncBtnText}>1-Click Apply</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardDesc}>Access pre-approved emergency funds up to Rs. 5,00,000 at 0% APR using credit scores or insurance balance as collateral.</Text>

        {/* Credit score check */}
        <View style={styles.sensorCard}>
          <Text style={styles.fitnessRingTitle}>📊 CIBIL Bureau Credit Score</Text>
          {cibilState === 'idle' && (
            <TouchableOpacity style={styles.button} onPress={handleCheckCibil}>
              <Text style={styles.buttonText}>Fetch Bureau Credit Score</Text>
            </TouchableOpacity>
          )}
          {cibilState === 'checking' && (
            <View style={{padding: 16, alignItems: 'center'}}>
              <ActivityIndicator color="#00ccb4" size="large" />
              <Text style={{color: '#7d9696', marginTop: 10}}>Reaching CIBIL Bureau nodes...</Text>
            </View>
          )}
          {cibilState === 'checked' && (
            <View style={{alignItems: 'center', marginVertical: 12}}>
              <Text style={styles.cibilScoreText}>{cibilScore}</Text>
              <Text style={styles.cibilScoreDesc}>EXCELLENT CREDIT STANDING</Text>
              <Text style={styles.cibilLimitText}>Instant Pre-Approved Limit: Rs. 5,00,000</Text>
            </View>
          )}
        </View>

        {/* Loans list */}
        <Text style={[styles.subHeading, { marginTop: 24 }]}>Active Disbursed Loans</Text>
        {loansList.length === 0 ? (
          <Text style={styles.emptyTextSub}>No active medical loans disbursed.</Text>
        ) : (
          loansList.map(loan => (
            <View key={loan.id} style={styles.listItem}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Loan Reference {loan.id}</Text>
                <Text style={styles.badgeActive}>{loan.status}</Text>
              </View>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Disbursed Amount:</Text> Rs. {loan.amount.toLocaleString()}</Text>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>Collateral Scheme:</Text> {loan.collateralPolicy}</Text>
              <Text style={styles.listText}><Text style={{fontWeight: '700'}}>EMI Matrix:</Text> Rs. {loan.monthlyEmi}/month for {loan.tenureMonths} months</Text>
              <Text style={[styles.listText, {color: '#00ccb4', fontWeight: '700'}]}>Interest Rate: {loan.interestRate}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  // SUBPANEL: EMERGENCY TRACKER (Ambulance Tracker)
  const renderEmergencyTab = () => {
    return (
      <View>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>🚨 Emergency Ambulance Dispatcher</Text>
          <TouchableOpacity style={[styles.syncBtn, {backgroundColor: '#ef4444'}]} onPress={handleTriggerSiren}>
            <Text style={styles.syncBtnText}>{sirenActive ? '🔔 Stop Siren' : '🔊 Play Siren'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardDesc}>Instant 1-Click dispatch for sirens and emergency rescue ambulances. Fully free under PM-JAY policy coverage.</Text>

        {!ambulanceBooking ? (
          <View style={styles.card}>
            <Text style={styles.label}>Select Ambulance Vehicle Grade</Text>
            <View style={styles.chipsContainer}>
              {['Basic Life Support', 'Advanced Life Support', 'Cardiac Care Intensive'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chipButton, ambulanceType === type && styles.chipButtonActive]}
                  onPress={() => setAmbulanceType(type)}
                >
                  <Text style={[styles.chipText, ambulanceType === type && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Emergency Pickup Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter patient location address..."
                placeholderTextColor="#7d9696"
                value={pickupAddress}
                onChangeText={setPickupAddress}
              />
            </View>

            <TouchableOpacity style={[styles.button, {backgroundColor: '#ef4444'}]} onPress={handleBookAmbulance} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>📢 Dispatch Rescue Ambulance</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sensorCard}>
            <Text style={styles.nfcTitle}>🚨 Dispatch Active: {ambulanceBooking.status}</Text>
            <Text style={styles.listText}>Vehicle Type: {ambulanceBooking.ambulanceType}</Text>
            <Text style={styles.listText}>ETA: {ambulanceBooking.etaMinutes} Minutes remaining</Text>
            <Text style={styles.listText}>Pickup: {ambulanceBooking.pickupAddress}</Text>
            
            <View style={styles.cartOptionsDivider} />
            <Text style={{color: '#fff', fontWeight: '700', fontSize: 13}}>Driver Details:</Text>
            <Text style={styles.listText}>{ambulanceBooking.driverName} ({ambulanceBooking.driverContact})</Text>
            <Text style={styles.listText}>Vehicle Registry: {ambulanceBooking.vehicleNumber}</Text>

            {/* Tracking progress bar */}
            <Text style={[styles.label, {marginTop: 16}]}>Live Location Progress HUD:</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${ambProgress * 100}%`, backgroundColor: '#ef4444' }]} />
            </View>

            {ambulanceBooking.status === 'Arrived' ? (
              <TouchableOpacity style={styles.button} onPress={() => setAmbulanceBooking(null)}>
                <Text style={styles.buttonText}>Complete Dispatch</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{color: '#7d9696', fontSize: 11, textAlign: 'center', marginTop: 12, fontStyle: 'italic'}}>
                *Syncing GPS nodes. The vehicle is moving in real-time.
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // SUBPANEL: BLOCKCHAIN LEDGER EXPLORER
  const renderBlockchainTab = () => {
    return (
      <View>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>⛓️ Persistent Blockchain Audit Logs</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={() => fetchAllData(userProfile?.healthId)}>
            <Text style={styles.syncBtnText}>🔄 Reload Blocks</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardDesc}>Cryptographic ledger tracking all healthcare events, bookings, claims, and dispatches. Validated block height secure.</Text>

        {blockchainLedger.length === 0 ? (
          <Text style={styles.emptyTextSub}>Blockchain node has no active blocks.</Text>
        ) : (
          [...blockchainLedger].reverse().map(block => (
            <View key={block.block_index} style={styles.blockCard}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockHeightText}>Block #{block.block_index}</Text>
                <Text style={styles.blockTimeText}>
                  {typeof block.timestamp === 'number' ? new Date(block.timestamp * 1000).toLocaleTimeString() : block.timestamp}
                </Text>
              </View>
              <Text style={styles.blockHashTextLabel}>Hash: <Text style={styles.blockHashVal}>{block.hash}</Text></Text>
              <Text style={styles.blockHashTextLabel}>Prev: <Text style={styles.blockHashVal}>{block.previous_hash}</Text></Text>
              <View style={styles.blockDataBox}>
                <Text style={styles.blockDataText}>{block.data}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.logoMain}>sehat<Text style={styles.logoSub}>recover</Text></Text>
            <Text style={styles.logoTag}>Mobile Triage Node</Text>
          </View>
          {step === 3 && (
            <TouchableOpacity style={styles.logoutHeaderBtn} onPress={handleLogout}>
              <Text style={styles.logoutHeaderText}>🚪 Exit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {step === 1 && renderLoginScreen()}
        {step === 2 && renderVerifyScreen()}
        
        {step === 3 && userProfile && (
          <View style={styles.successContainer}>
            {/* Top Bar Navigation tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navTabsScroll}>
              {[
                { key: 'Overview', label: '🏠 Overview' },
                { key: 'Vault', label: '📂 Vault Files' },
                { key: 'Pharmacy', label: '🛒 Pharmacy' },
                { key: 'Care', label: '👩‍⚕️ Book Care' },
                { key: 'Fitness', label: '🏋️ Fitness Hub' },
                { key: 'Insurance', label: '🛡️ Cashless Claims' },
                { key: 'Loans', label: '💰 Instant Loans' },
                { key: 'Emergency', label: '🚨 Emergency' },
                { key: 'Blockchain', label: '⛓️ Audit Logs' }
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabBtn, currentTab === tab.key && styles.tabBtnActive]}
                  onPress={() => {
                    setCurrentTab(tab.key);
                    // Close sidecart
                    setCartOpen(false);
                  }}
                >
                  <Text style={[styles.tabBtnText, currentTab === tab.key && styles.tabBtnTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Render selected subpanel */}
            <View style={{ width: '100%', marginTop: 8 }}>
              {currentTab === 'Overview' && renderOverviewTab()}
              {currentTab === 'Vault' && renderRecordsVaultTab()}
              {currentTab === 'Pharmacy' && renderPharmacyTab()}
              {currentTab === 'Care' && renderBookCareTab()}
              {currentTab === 'Fitness' && renderFitnessTab()}
              {currentTab === 'Insurance' && renderInsuranceTab()}
              {currentTab === 'Loans' && renderLoansTab()}
              {currentTab === 'Emergency' && renderEmergencyTab()}
              {currentTab === 'Blockchain' && renderBlockchainTab()}
            </View>

            {/* If ABHA is not linked, show enrollment promotion card under Overview */}
            {currentTab === 'Overview' && !userProfile.abhaLinked && (
              <View style={styles.abhaPortalCard}>
                <Text style={styles.abhaPortalTitle}>🇮🇳 National Health Scheme integration</Text>
                <Text style={styles.abhaPortalDesc}>
                  Map your Aadhaar-KYC authenticated Ayushman Bharat Health Account (ABHA ID) or state benefit program to unlock 100% cashless pharmacy orders.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Enter 14-Digit ABHA ID / Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 14-1234-5678-9012"
                    value={abhaId}
                    onChangeText={setAbhaId}
                    placeholderTextColor="#7d9696"
                  />
                </View>

                <Text style={styles.label}>Select State scheme benefits</Text>
                <View style={styles.chipsContainer}>
                  {[
                    { key: '', label: 'None' },
                    { key: 'mjpjay', label: 'MJPJAY (MH)' },
                    { key: 'aarogyasri', label: 'Aarogyasri (AP)' },
                    { key: 'cmchis', label: 'CMCHIS (TN)' },
                    { key: 'chiranjeevi', label: 'Chiranjeevi (RJ)' },
                    { key: 'bsky', label: 'BSKY (OD)' }
                  ].map(schemeOption => (
                    <TouchableOpacity
                      key={schemeOption.key}
                      style={[
                        styles.chipButton,
                        stateScheme === schemeOption.key && styles.chipButtonActive
                      ]}
                      onPress={() => setStateScheme(schemeOption.key)}
                    >
                      <Text style={[
                        styles.chipText,
                        stateScheme === schemeOption.key && styles.chipTextActive
                      ]}>
                        {schemeOption.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLinkAbha} disabled={linking}>
                  {linking ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>🔗 Connect Active Account</Text>}
                </TouchableOpacity>

                <View style={styles.cartOptionsDivider} />

                <Text style={styles.orRegisterText}>{"Don't"} have an ABHA Identity?</Text>
                <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => setEnrollModalVisible(true)}>
                  <Text style={styles.secondaryActionBtnText}>🇮🇳 Enroll Aadhaar & Generate Card</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* --- ALL FLOW DIALOG MODALS --- */}

      {/* 1. Enroll ABHA Modal */}
      <Modal animationType="slide" transparent={true} visible={enrollModalVisible} onRequestClose={() => setEnrollModalVisible(false)}>
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>🇮🇳 Aadhaar KYC ABHA Enrollment</Text>
            <Text style={styles.cardDesc}>Issue a secure government health identity instantly inside the SehatRecover wallet node.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Patient Full Name</Text>
              <TextInput style={styles.input} value={enrollName} onChangeText={setEnrollName} placeholder="Anna Smith" placeholderTextColor="#7d9696" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>12-Digit Aadhaar Number</Text>
              <TextInput style={styles.input} value={enrollAadhaar} onChangeText={setEnrollAadhaar} placeholder="123456789012" keyboardType="number-pad" maxLength={12} placeholderTextColor="#7d9696" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State sponsored benefits</Text>
              <View style={styles.chipsContainer}>
                {[
                  { key: 'mjpjay', label: 'MJPJAY (MH)' },
                  { key: 'aarogyasri', label: 'Aarogyasri (AP)' },
                  { key: 'cmchis', label: 'CMCHIS (TN)' },
                  { key: 'chiranjeevi', label: 'Chiranjeevi (RJ)' },
                  { key: 'bsky', label: 'BSKY (OD)' }
                ].map(opt => (
                  <TouchableOpacity key={opt.key} style={[styles.chipButton, enrollScheme === opt.key && styles.chipButtonActive]} onPress={() => setEnrollScheme(opt.key)}>
                    <Text style={[styles.chipText, enrollScheme === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleEnrollAbha} disabled={linking}>
              {linking ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Verification & Enroll</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelNfcBtn} onPress={() => setEnrollModalVisible(false)}>
              <Text style={styles.cancelNfcText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. Upload Document Modal */}
      <Modal animationType="slide" transparent={true} visible={uploadModalOpen} onRequestClose={() => setUploadModalOpen(false)}>
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>📄 Secure Vault Uploader</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Document Filename</Text>
              <TextInput style={styles.input} value={newDocName} onChangeText={setNewDocName} placeholder="Blood_Report_June.pdf" placeholderTextColor="#7d9696" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category details</Text>
              <TextInput style={styles.input} value={newDocCat} onChangeText={setNewDocCat} placeholder="Lab Diagnostic / MRI / Reciept" placeholderTextColor="#7d9696" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Folder</Text>
              <View style={styles.chipsContainer}>
                {[
                  { key: 'prescriptions', label: 'Prescriptions' },
                  { key: 'diagnostics', label: 'Diagnostics' },
                  { key: 'insurance_docs', label: 'Policies' },
                  { key: 'gov_cards', label: 'Cards' }
                ].map(fold => (
                  <TouchableOpacity key={fold.key} style={[styles.chipButton, newDocFolder === fold.key && styles.chipButtonActive]} onPress={() => setNewDocFolder(fold.key)}>
                    <Text style={[styles.chipText, newDocFolder === fold.key && styles.chipTextActive]}>{fold.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleUploadDocument}>
              <Text style={styles.buttonText}>Encrypt & Upload</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelNfcBtn} onPress={() => setUploadModalOpen(false)}>
              <Text style={styles.cancelNfcText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Prescription Upload Modal */}
      <Modal animationType="slide" transparent={true} visible={uploadPrescriptionModal} onRequestClose={() => setUploadPrescriptionModal(false)}>
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>📄 Upload Doctor Prescription</Text>
            <Text style={styles.cardDesc}>Upload prescription scan file to auto-parse details into active pharmacy shopping orders.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prescription File Name</Text>
              <TextInput style={styles.input} value={prescFileName} onChangeText={setPrescFileName} placeholder="Rx_Prescription_June.pdf" placeholderTextColor="#7d9696" />
            </View>

            <TouchableOpacity style={styles.button} onPress={handlePrescriptionUpload}>
              <Text style={styles.buttonText}>Submit Rx File</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelNfcBtn} onPress={() => setUploadPrescriptionModal(false)}>
              <Text style={styles.cancelNfcText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. Checkout Modal dialog */}
      <Modal animationType="slide" transparent={true} visible={checkoutModalOpen} onRequestClose={() => setCheckoutModalOpen(false)}>
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>💳 Secure Checkout Terminal</Text>
            {checkoutItem && (
              <View style={styles.sensorCard}>
                <Text style={styles.checkoutItemName}>{checkoutItem.name}</Text>
                <Text style={styles.checkoutItemPrice}>Total Payable: Rs. {checkoutItem.price}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Checkout Gateway</Text>
              <View style={styles.chipsContainer}>
                {['UPI', 'Card'].map(m => (
                  <TouchableOpacity key={m} style={[styles.chipButton, payMethod === m && styles.chipButtonActive]} onPress={() => setPayMethod(m)}>
                    <Text style={[styles.chipText, payMethod === m && styles.chipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {payMethod === 'UPI' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Unified Payments UPI ID</Text>
                <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} placeholder="e.g. annasmith@okaxis" placeholderTextColor="#7d9696" autoCapitalize="none" />
              </View>
            ) : (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Card Number</Text>
                  <TextInput style={styles.input} value={cardNumber} onChangeText={setCardNumber} placeholder="4111 2222 3333 4444" keyboardType="number-pad" placeholderTextColor="#7d9696" />
                </View>
                <View style={styles.gridTwo}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Expiry Date</Text>
                    <TextInput style={styles.input} value={cardExpiry} onChangeText={setCardExpiry} placeholder="MM/YY" placeholderTextColor="#7d9696" />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>CVV</Text>
                    <TextInput style={styles.input} value={cardCvv} onChangeText={setCardCvv} placeholder="123" secureTextEntry={true} keyboardType="number-pad" placeholderTextColor="#7d9696" />
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={() => {
              if (checkoutItem.type === 'booking') processBookingBackend(payMethod);
              else processOrderBackend(payMethod);
            }} disabled={payProcessing}>
              {payProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Secure Payment</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelNfcBtn} onPress={() => {
              setCheckoutModalOpen(false);
              setCheckoutItem(null);
            }}>
              <Text style={styles.cancelNfcText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5. Fitness activity booking modal */}
      <Modal animationType="slide" transparent={true} visible={fitnessModalOpen} onRequestClose={() => setFitnessModalOpen(false)}>
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>🏋️ Book Fitness Slot</Text>
            {selectedFitnessActivity && (
              <View style={styles.sensorCard}>
                <Text style={styles.checkoutItemName}>{selectedFitnessActivity.name}</Text>
                <Text style={styles.checkoutItemPrice}>Original Cost: Rs. {selectedFitnessActivity.price}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Booking Date</Text>
              <TextInput style={styles.input} value={fitnessDate} onChangeText={setFitnessDate} placeholder="YYYY-MM-DD" placeholderTextColor="#7d9696" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Slot Hour</Text>
              <TextInput style={styles.input} value={fitnessTime} onChangeText={setFitnessTime} placeholder="e.g. 07:30 AM" placeholderTextColor="#7d9696" />
            </View>

            <View style={styles.cartRowBetween}>
              <View>
                <Text style={styles.cartOptionLabel}>Redeem Reward Points (Points: {rewardPoints})</Text>
                <Text style={styles.cartOptionSub}>1 Point = Rs. 1.00 Off</Text>
              </View>
              <Switch
                value={usePointsToggle}
                onValueChange={setUsePointsToggle}
                trackColor={{ false: "#1f2e2e", true: "#00ccb4" }}
                thumbColor={usePointsToggle ? "#fff" : "#7d9696"}
              />
            </View>

            <View style={styles.cartOptionsDivider} />
            
            {selectedFitnessActivity && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, {fontWeight: '700'}]}>Total Payable:</Text>
                <Text style={[styles.billVal, {fontWeight: '700', color: '#00ccb4'}]}>
                  Rs. {usePointsToggle ? Math.max(0, selectedFitnessActivity.price - rewardPoints) : selectedFitnessActivity.price}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={processFitnessBooking}>
              <Text style={styles.buttonText}>Confirm Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelNfcBtn} onPress={() => {
              setFitnessModalOpen(false);
              setSelectedFitnessActivity(null);
            }}>
              <Text style={styles.cancelNfcText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 6. Cashless claim submission modal */}
      <Modal animationType="slide" transparent={true} visible={claimModalOpen} onRequestClose={() => setClaimModalOpen(false)}>
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>🛡️ Submit Cashless Medical Claim</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Document Evidence</Text>
              <View style={styles.chipsContainer}>
                {documentsList.map(doc => (
                  <TouchableOpacity key={doc.id} style={[styles.chipButton, claimDocSelected === doc.id && styles.chipButtonActive]} onPress={() => setClaimDocSelected(doc.id)}>
                    <Text style={[styles.chipText, claimDocSelected === doc.id && styles.chipTextActive]}>{doc.fileName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Healthcare Provider Hospital</Text>
              <TextInput style={styles.input} value={claimProvider} onChangeText={setClaimProvider} placeholder="e.g. Apollo Hospital #3" placeholderTextColor="#7d9696" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medical Service details</Text>
              <TextInput style={styles.input} value={claimService} onChangeText={setClaimService} placeholder="e.g. Chest Scans / Pharmacy dispatch" placeholderTextColor="#7d9696" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Claim Amount (Rs.)</Text>
              <TextInput style={styles.input} value={claimAmount} onChangeText={setClaimAmount} placeholder="e.g. 2400" keyboardType="number-pad" placeholderTextColor="#7d9696" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Policy Tier</Text>
              <View style={styles.chipsContainer}>
                {['Government', 'Private'].map(tier => (
                  <TouchableOpacity key={tier} style={[styles.chipButton, claimPolicyType === tier && styles.chipButtonActive]} onPress={() => setClaimPolicyType(tier)}>
                    <Text style={[styles.chipText, claimPolicyType === tier && styles.chipTextActive]}>{tier}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmitCashlessClaim}>
              <Text style={styles.buttonText}>Submit Cashless Claim</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelNfcBtn} onPress={() => setClaimModalOpen(false)}>
              <Text style={styles.cancelNfcText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 7. Loan setup modal */}
      <Modal animationType="slide" transparent={true} visible={loanModalOpen} onRequestClose={() => setLoanModalOpen(false)}>
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>💰 One-Click Loan Apply</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Collateral Setup Option</Text>
              <View style={styles.chipsContainer}>
                {['Emergency Health Loan', 'Collateral Against Insurance Cover'].map(cl => (
                  <TouchableOpacity key={cl} style={[styles.chipButton, loanCollateralType === cl && styles.chipButtonActive]} onPress={() => setLoanCollateralType(cl)}>
                    <Text style={[styles.chipText, loanCollateralType === cl && styles.chipTextActive]}>{cl}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Loan Amount: Rs. {loanAmount.toLocaleString()}</Text>
              <View style={styles.chipsContainer}>
                {[10000, 50000, 100000, 200000, 500000].map(amt => (
                  <TouchableOpacity key={amt} style={[styles.chipButton, loanAmount === amt && styles.chipButtonActive]} onPress={() => setLoanAmount(amt)}>
                    <Text style={[styles.chipText, loanAmount === amt && styles.chipTextActive]}>Rs. {amt.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tenure Period: {loanTenure} Months</Text>
              <View style={styles.chipsContainer}>
                {[3, 6, 12, 24, 36].map(t => (
                  <TouchableOpacity key={t} style={[styles.chipButton, loanTenure === t && styles.chipButtonActive]} onPress={() => setLoanTenure(t)}>
                    <Text style={[styles.chipText, loanTenure === t && styles.chipTextActive]}>{t} M</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sensorCard}>
              <Text style={styles.checkoutItemName}>Monthly EMI Calculation:</Text>
              <Text style={styles.checkoutItemPrice}>Rs. {getLoanEMI()} / month</Text>
              <Text style={{color: '#00ccb4', fontSize: 11, fontWeight: '700'}}>Interest Rate: 0% APR Medical Subvention</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleOneClickLoanDisburse} disabled={loanProcessing}>
              {loanProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Apply & Disburse instantly</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelNfcBtn} onPress={() => setLoanModalOpen(false)}>
              <Text style={styles.cancelNfcText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// --- CURATED COLOR SYSTEM & PREMIUM STYLING ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070f0f', // Curated Deep HSL dark teal theme
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0c1414',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoMain: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00ccb4', // Bright cyan accent
  },
  logoSub: {
    color: '#fff',
  },
  logoTag: {
    fontSize: 9,
    color: '#658282',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  logoutHeaderBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  logoutHeaderText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#7ba2a2',
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#658282',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '700',
    color: '#00ccb4',
  },
  button: {
    backgroundColor: '#008573', // Teal solid color
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#00ccb4',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  successContainer: {
    alignItems: 'center',
    width: '100%',
  },
  navTabsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
    width: SCREEN_WIDTH - 40,
  },
  tabBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtnActive: {
    backgroundColor: '#008573',
    borderColor: '#00ccb4',
  },
  tabBtnText: {
    color: '#7ba2a2',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  offlineBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    marginBottom: 16,
  },
  offlineBannerText: {
    color: '#f59e0b',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  healthCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 20,
    minHeight: 200,
  },
  cardTeal: { backgroundColor: '#003a32' },
  cardMjpjay: { backgroundColor: '#8a2b00' },
  cardAarogyasri: { backgroundColor: '#6e4505' },
  cardCmchis: { backgroundColor: '#561912' },
  cardChiranjeevi: { backgroundColor: '#11354c' },
  cardBsky: { backgroundColor: '#0c3d22' },
  healthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthCardLogo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00ccb4',
  },
  healthCardLogoAlt: {
    color: '#fff',
  },
  healthCardType: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00ccb4',
  },
  patientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700',
  },
  infoVal: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
    marginTop: 1,
  },
  healthCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
    marginTop: 8,
  },
  secureBadge: {
    fontSize: 8,
    color: '#00ccb4',
    fontWeight: '700',
  },
  cardCompany: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  syncBtn: {
    backgroundColor: 'rgba(0, 204, 180, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 204, 180, 0.25)',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  syncBtnText: {
    color: '#00ccb4',
    fontSize: 11,
    fontWeight: '700',
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  sensorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    flex: 1,
    minWidth: '45%',
  },
  sensorIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  sensorVal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  sensorUnit: {
    fontSize: 10,
    color: '#7ba2a2',
  },
  sensorName: {
    fontSize: 11,
    color: '#7ba2a2',
    marginTop: 2,
  },
  sensorStatus: {
    fontSize: 9,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  rewardContainer: {
    backgroundColor: 'rgba(0, 133, 115, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 133, 115, 0.2)',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginTop: 16,
  },
  rewardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00ccb4',
  },
  rewardPointsVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginVertical: 4,
  },
  rewardDesc: {
    fontSize: 11,
    color: '#7ba2a2',
    lineHeight: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 10,
    width: '100%',
  },
  emptyText: {
    color: '#658282',
    fontSize: 12,
  },
  listItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 10,
    width: '100%',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  badgeActive: {
    fontSize: 9,
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontWeight: '700',
  },
  badgeFormat: {
    fontSize: 9,
    color: '#00ccb4',
    backgroundColor: 'rgba(0, 204, 180, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontWeight: '700',
  },
  listText: {
    fontSize: 12,
    color: '#7ba2a2',
    lineHeight: 16,
    marginTop: 2,
  },
  listItemActions: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
  },
  subButton: {
    paddingVertical: 4,
  },
  subButtonText: {
    color: '#00ccb4',
    fontSize: 12,
    fontWeight: '700',
  },
  folderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    width: '48%',
    marginBottom: 12,
  },
  folderIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  folderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  folderCount: {
    fontSize: 10,
    color: '#658282',
    marginTop: 4,
  },
  backFolderBtn: {
    paddingVertical: 8,
  },
  backFolderText: {
    color: '#00ccb4',
    fontSize: 12,
    fontWeight: '700',
  },
  docRowDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  docHashText: {
    fontSize: 9,
    color: '#658282',
    fontWeight: '600',
  },
  nfcPanel: {
    backgroundColor: 'rgba(12, 20, 20, 0.95)',
    borderWidth: 1,
    borderColor: '#00ccb4',
    borderRadius: 16,
    padding: 20,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
  },
  nfcTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00ccb4',
  },
  nfcSubtitle: {
    fontSize: 12,
    color: '#7ba2a2',
    marginTop: 4,
    textAlign: 'center',
  },
  nfcTimerRingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  nfcOtpBox: {
    borderWidth: 2,
    borderColor: '#00ccb4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 204, 180, 0.05)',
  },
  nfcOtpCode: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 4,
  },
  nfcTimerSeconds: {
    fontSize: 11,
    color: '#7ba2a2',
    marginTop: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    width: '100%',
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00ccb4',
  },
  nfcWarning: {
    fontSize: 10,
    color: '#658282',
    lineHeight: 14,
    textAlign: 'center',
  },
  cancelNfcBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
  cancelNfcText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  cartToggleBtn: {
    backgroundColor: 'rgba(0, 204, 180, 0.1)',
    borderWidth: 1,
    borderColor: '#00ccb4',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  cartToggleText: {
    color: '#00ccb4',
    fontSize: 11,
    fontWeight: '700',
  },
  pharmaActionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  secondaryActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  secondaryActionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  miniRxItem: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniRxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  miniRxMeds: {
    fontSize: 10,
    color: '#7ba2a2',
    marginTop: 2,
  },
  miniRxBtn: {
    backgroundColor: '#008573',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  miniRxBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 13,
    marginBottom: 14,
  },
  catalogItem: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catalogName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  catalogDesc: {
    fontSize: 11,
    color: '#7ba2a2',
    marginTop: 2,
  },
  catalogPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00ccb4',
  },
  addCartBtn: {
    backgroundColor: 'rgba(0, 204, 180, 0.1)',
    borderWidth: 1,
    borderColor: '#00ccb4',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  addCartBtnText: {
    color: '#00ccb4',
    fontSize: 10,
    fontWeight: '700',
  },
  cartDrawer: {
    backgroundColor: '#0c1414',
    borderTopWidth: 2,
    borderTopColor: '#00ccb4',
    padding: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 16,
  },
  cartDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cartDrawerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  cartItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  cartItemSub: {
    fontSize: 10,
    color: '#7ba2a2',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  qtyVal: {
    color: '#fff',
    marginHorizontal: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  cartOptionsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  couponBtn: {
    backgroundColor: '#008573',
    borderRadius: 8,
    height: 42,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  couponBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cartRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  cartOptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  cartOptionSub: {
    fontSize: 10,
    color: '#7ba2a2',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  billLabel: {
    fontSize: 12,
    color: '#7ba2a2',
  },
  billVal: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  emptyCartText: {
    color: '#658282',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 12,
  },
  emptyTextSub: {
    color: '#658282',
    fontSize: 12,
    fontStyle: 'italic',
  },
  cibilScoreText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#10b981',
  },
  cibilScoreDesc: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 1,
    marginTop: 2,
  },
  cibilLimitText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    marginTop: 8,
  },
  insuranceCoverBal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00ccb4',
    marginVertical: 4,
  },
  insuranceSchemeName: {
    fontSize: 11,
    color: '#7ba2a2',
    lineHeight: 14,
  },
  blockCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  blockHeightText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00ccb4',
  },
  blockTimeText: {
    fontSize: 10,
    color: '#658282',
  },
  blockHashTextLabel: {
    fontSize: 9,
    color: '#658282',
    marginTop: 1,
  },
  blockHashVal: {
    color: '#7ba2a2',
    fontFamily: 'monospace',
  },
  blockDataBox: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 6,
    padding: 8,
  },
  blockDataText: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'monospace',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  chipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipButtonActive: {
    backgroundColor: '#008573',
    borderColor: '#00ccb4',
  },
  chipText: {
    color: '#7ba2a2',
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  abhaPortalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
    marginTop: 16,
    marginBottom: 20,
  },
  abhaPortalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  abhaPortalDesc: {
    fontSize: 12,
    color: '#7ba2a2',
    lineHeight: 16,
    marginBottom: 16,
  },
  orRegisterText: {
    fontSize: 12,
    color: '#658282',
    textAlign: 'center',
    marginVertical: 10,
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalView: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: '#0c1414',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#00ccb4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  checkoutItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  checkoutItemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00ccb4',
    marginTop: 4,
  },
  fitnessRingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  fitnessRingValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00ccb4',
  },
  fitnessBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    marginVertical: 10,
    overflow: 'hidden',
  },
  fitnessBarFill: {
    height: '100%',
    backgroundColor: '#00ccb4',
  },
  fitnessPointsNotice: {
    fontSize: 10,
    color: '#7ba2a2',
  },
});
