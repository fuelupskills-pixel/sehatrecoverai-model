// ----------------------------------------------------
// SehatRecover Core Dashboard Panel JS - Advanced Controls
// ----------------------------------------------------


// --- EXTENDED PHARMACY CART & PAYMENT GATEWAY STATES ---
let pharmacyCart = [];
let cartCouponApplied = false;
let cartRewardsPointsToRedeem = 0;
let cartRoyalCustomer = false;

let checkoutTransactionContext = null; 
let selectedPaymentMethod = 'UPI';

let activeFitnessBooking = {
  activityType: 'Yoga Class',
  price: 350,
  usePoints: false,
  finalPrice: 350
};

let toastInterval = null;
let toastTimeRemaining = 60;
let currentUser = {
  healthId: 'SR-9982-1045-88',
  fullName: 'Anna Smith',
  contact: '9876543210',
  abhaLinked: false,
  abhaProfile: null,
  rewardPoints: 240 // Initial points balance
};

// Available sidebar menus per role
const ROLE_SIDEBAR_MENUS = {
  Patient: [
    { id: 'overview', name: 'Overview Home', icon: 'fa-house' },
    { id: 'vault', name: 'Records Vault', icon: 'fa-folder-open' },
    { id: 'pharmacy', name: 'Online Pharmacy', icon: 'fa-prescription-bottle-medical' },
    { id: 'fitness', name: 'Fitness Hub', icon: 'fa-heart-pulse' },
    { id: 'insurance', name: 'Insurance Sync', icon: 'fa-shield-heart' },
    { id: 'loans', name: 'Loans & Finance', icon: 'fa-wallet' },
    { id: 'bookings', name: 'Book Care', icon: 'fa-calendar-check' },
    { id: 'consent', name: 'Sharing Consent', icon: 'fa-lock-open' },
    { id: 'ai-chat', name: 'AI Health Advisor', icon: 'fa-brain' },
    { id: 'emergency', name: 'Emergency Hub', icon: 'fa-truck-medical' }
  ],
  Doctor: [
    { id: 'consult', name: 'Consulting Desk', icon: 'fa-stethoscope' }
  ],
  Pharmacy: [
    { id: 'orders', name: 'Pharmacy Orders', icon: 'fa-prescription' }
  ],
  Admin: [
    { id: 'security', name: 'Blockchain Explorer', icon: 'fa-cubes' }
  ]
};

// Fitness tracker mock initial values
let fitnessState = {
  steps: 8432,
  walkKm: 5.8,
  runKm: 2.1,
  calories: 340,
  goalHit: false
};

// Active checkout variables
let activeCheckout = {
  prescriptionId: 'RX-9982',
  medications: 'Amoxicillin 500mg (3x daily)',
  price: 450,
  schemeDiscount: 450,
  rewardDiscount: 67.5,
  selectedVoucher: 'insurance', // Default: PMJAY cashless
  pointsRedeemed: 0
};

// Care booking dropdown configurations
const CARE_PROVIDERS = {
  "Doctor Consultation": [
    "Dr. Dev Kumar (Cardiologist)",
    "Dr. Sarah Johnson (Neurologist)",
    "Dr. Ramesh Patel (General Physician)",
    "Dr. Clara Barton (Pulmonologist)"
  ],
  "Home Care Nursing": [
    "Caregiver Rajesh (Elderly Support)",
    "Nurse Clara (IV Therapy / Wound Care)",
    "Physio Amit Sharma (Cardiac Rehabilitation)",
    "Caregiver Mary (Post-surgery Rehab)"
  ]
};

// Consent manager variables
let activeConsentOTP = "";
let otpCountdownTimer = null;
let simulatedNotificationTimer = null;
let iomtSyncInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

function initDashboard() {
  loadUserProfile();
  setupCardInteraction();
  startDashboardTimer();
  switchDashboardRole('Patient'); // Default role view on launch
  startIoMTSync();
  updateFitnessProgressRing();
  
  // Schedule simulated Google-like Notification Alert in 10 seconds
  simulatedNotificationTimer = setTimeout(() => {
    showGoogleToastNotification();
  }, 10000);
}

function loadUserProfile() {
  const sessionUser = sessionStorage.getItem('sehatrecover_user');
  const urlParams = new URLSearchParams(window.location.search);
  const isGuest = urlParams.get('guest') === 'true';

  if (sessionUser) {
    currentUser = JSON.parse(sessionUser);
    if (currentUser.rewardPoints === undefined) currentUser.rewardPoints = 240;
  } else if (!isGuest) {
    window.location.href = '/login';
    return;
  }
  
  // Set UI names
  document.getElementById('user-display-name').innerText = currentUser.fullName;
  document.getElementById('sidebar-name').innerText = currentUser.fullName;
  document.getElementById('sidebar-id').innerText = currentUser.healthId;
  
  // Populate Card Front details
  document.getElementById('card-patient-name-db').innerText = currentUser.fullName;
  document.getElementById('card-full-name-db').innerText = currentUser.fullName;
  document.getElementById('card-contact-db').innerText = currentUser.contact;
  document.getElementById('card-id-num-db').innerText = currentUser.healthId;

  // ABHA display sync
  if (currentUser.abhaLinked && currentUser.abhaProfile) {
    document.getElementById('card-abha-badge-db').innerHTML = `<i class="fa-solid fa-circle-check"></i> ${currentUser.abhaProfile.badgeText}`;
    document.getElementById('card-abha-badge-db').classList.remove('hidden');
    document.getElementById('card-type-main-db').innerText = 'Universal Health Card (ABHA Integrated)';
    
    document.getElementById('card-dynamic-col-1-db').innerHTML = `<span>ABHA Address</span><strong>${currentUser.abhaProfile.abhaAddress}</strong>`;
    document.getElementById('card-dynamic-col-2-db').innerHTML = `<span>ABHA ID Number</span><strong>${currentUser.abhaProfile.abhaNumber}</strong>`;
    
    document.getElementById('card-scheme-col-db').classList.remove('hidden');
    document.getElementById('card-balance-col-db').classList.remove('hidden');
    document.getElementById('card-scheme-name-db').innerText = currentUser.abhaProfile.linkedScheme;
    document.getElementById('card-insurance-balance-db').innerText = currentUser.abhaProfile.insuranceBalance;

    // Apply Card Theme
    const cardEl = document.getElementById('patient-card-element');
    if (cardEl && currentUser.abhaProfile.linkedScheme) {
      const schemeMap = {
        'mjpjay': 'scheme-mjpjay',
        'aarogyasri': 'scheme-aarogyasri',
        'cmchis': 'scheme-cmchis',
        'chiranjeevi': 'scheme-chiranjeevi',
        'bsky': 'scheme-bsky'
      };
      let matchedClass = 'scheme-pmjay';
      for (const key in schemeMap) {
        if (currentUser.abhaProfile.linkedScheme.toLowerCase().includes(key)) {
          matchedClass = schemeMap[key];
          break;
        }
      }
      cardEl.className = `flip-card ${matchedClass}`;
    }

    // Toggle linked block UI
    document.getElementById('benefit-unlinked-view').classList.add('hidden');
    const linkedView = document.getElementById('benefit-linked-view');
    linkedView.classList.remove('hidden');
    document.getElementById('db-benefit-abha').innerText = currentUser.abhaProfile.abhaNumber;
    document.getElementById('db-benefit-scheme').innerText = currentUser.abhaProfile.linkedScheme;
    document.getElementById('db-benefit-balance').innerText = currentUser.abhaProfile.insuranceBalance;
  }
}

function setupCardInteraction() {
  const flipCard = document.getElementById('patient-card-element');
  if (flipCard) {
    flipCard.addEventListener('click', () => {
      flipCard.classList.toggle('flipped');
    });
  }
}

// Role and Sub-panel navigation switching
function switchDashboardRole(role) {
  // Hide all main panel roles
  const panels = document.querySelectorAll('.dashboard-view-panel');
  panels.forEach(p => p.classList.add('hidden'));
  
  // Show active role panel
  const activePanel = document.getElementById(`view-${role}`);
  if (activePanel) activePanel.classList.remove('hidden');

  // Load specific navigation links for this role
  const menuList = document.getElementById('sidebar-menu-list');
  menuList.innerHTML = '';
  
  if (ROLE_SIDEBAR_MENUS[role]) {
    ROLE_SIDEBAR_MENUS[role].forEach((menu, index) => {
      const item = document.createElement('a');
      item.className = `menu-item ${index === 0 ? 'active' : ''}`;
      item.innerHTML = `<i class="fa-solid ${menu.icon}"></i> ${menu.name}`;
      
      // Wire up sidebar panel toggle listeners
      item.onclick = (e) => {
        e.preventDefault();
        menuList.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        if (role === 'Patient') {
          switchPatientSubPanel(menu.id);
        }
      };
      menuList.appendChild(item);
    });
  }

  // Set default subpanel visibility
  if (role === 'Patient') {
    switchPatientSubPanel('overview');
  } else if (role === 'Doctor') {
    addAuditLogLine('info', `Doctor portal launched. Scanning sensors and handshake nodes loaded.`);
  } else if (role === 'Pharmacy') {
    loadPharmacyOrdersFeed();
    addAuditLogLine('info', `Pharmacy console connected to network orders feed. Settle claims gateways initialized.`);
  } else if (role === 'Admin') {
    loadBlockchainBlockRegistry();
    addAuditLogLine('success', `Security Admin console unlocked. Ledger integrity check: VALID.`);
  }
}

// Switches sub-panels for Patient dashboard role
function switchPatientSubPanel(panelId) {
  const panels = document.querySelectorAll('.patient-sub-panel');
  panels.forEach(p => p.classList.add('hidden'));
  
  const activePanel = document.getElementById(`patient-panel-${panelId}`);
  if (activePanel) activePanel.classList.remove('hidden');

  // Trigger loads
  if (panelId === 'overview') {
    loadPatientPrescriptionsFeed();
  } else if (panelId === 'vault') {
    loadPatientDocuments();
  } else if (panelId === 'insurance') {
    loadPatientClaimsLedger();
    loadClaimDocSelector();
  } else if (panelId === 'loans') {
    loadPatientLoansLedger();
    loadLoanCollateralOptions();
  } else if (panelId === 'pharmacy') {
    loadPharmacyShop();
  } else if (panelId === 'fitness') {
    loadFitnessHub();
  } else if (panelId === 'bookings') {
    populateBookingDropdowns('Doctor Consultation');
    loadPatientActiveBookings();
  } else if (panelId === 'consent') {
    loadPatientConsentSessions();
  } else if (panelId === 'emergency') {
    initAmbulanceTracking();
  }
  
  addAuditLogLine('info', `Patient navigating to: ${panelId.toUpperCase()} sub-view.`);
}

// --- IoMT WEARABLE DEVICE LIVE SIMULATION SYNC ---
function startIoMTSync() {
  clearInterval(iomtSyncInterval);
  const pulseVal = document.getElementById('iomt-pulse');
  const spo2Val = document.getElementById('iomt-spo2');
  const tempVal = document.getElementById('iomt-temp');
  const bpVal = document.getElementById('iomt-bp');
  
  iomtSyncInterval = setInterval(() => {
    if (!pulseVal) return;
    
    // Simulate heart rate slightly pulsing (70-78)
    const mockPulse = Math.floor(70 + Math.random() * 9);
    pulseVal.innerText = mockPulse;
    
    // Simulate SpO2 stable (98-99)
    const mockSpo2 = Math.floor(98 + Math.random() * 2);
    spo2Val.innerText = mockSpo2;
    
    // Simulate Temperature (98.3-98.5)
    const mockTemp = (98.3 + Math.random() * 0.3).toFixed(1);
    tempVal.innerText = mockTemp;
    
    // Apply normal BP values range
    const bpSystolic = Math.floor(118 + Math.random() * 5);
    const bpDiastolic = Math.floor(77 + Math.random() * 6);
    bpVal.innerText = `${bpSystolic}/${bpDiastolic}`;

  }, 3000);
}

// --- FITNESS ACTIVITIES WIDGET LOGIC ---
function simulateFitnessWalk() {
  fitnessState.steps += 1240;
  fitnessState.walkKm += 0.9;
  fitnessState.runKm += 0.3;
  fitnessState.calories += 58;
  
  document.getElementById('fitness-steps').innerText = fitnessState.steps.toLocaleString();
  document.getElementById('fitness-walk').innerHTML = `${fitnessState.walkKm.toFixed(1)} <small>km</small>`;
  document.getElementById('fitness-run').innerHTML = `${fitnessState.runKm.toFixed(1)} <small>km</small>`;
  document.getElementById('fitness-calories').innerHTML = `${fitnessState.calories} <small>kcal</small>`;
  
  const fpSteps = document.getElementById('fitpanel-steps');
  if (fpSteps) {
    fpSteps.innerText = fitnessState.steps.toLocaleString();
    document.getElementById('fitpanel-walk').innerHTML = `${fitnessState.walkKm.toFixed(1)} <small>km</small>`;
    document.getElementById('fitpanel-run').innerHTML = `${fitnessState.runKm.toFixed(1)} <small>km</small>`;
    document.getElementById('fitpanel-calories').innerHTML = `${fitnessState.calories} <small>kcal</small>`;
  }
  
  updateFitnessProgressRing();
  
  // Award points on crossing daily 10,000 steps limit!
  if (fitnessState.steps >= 10000 && !fitnessState.goalHit) {
    fitnessState.goalHit = true;
    currentUser.rewardPoints += 50;
    sessionStorage.setItem('sehatrecover_user', JSON.stringify(currentUser));
    
    // Flash notification banner
    showGoogleToastNotification("Daily Steps Goal Met!", "Awesome job! You reached 10,000 steps. 50 Reward points added to your card ledger.");
    addAuditLogLine('success', `Milestone crossed: 10,000 steps target achieved. 50 Reward Points cryptographically issued to ${currentUser.healthId}.`);
    
    // Post to backend blockchain logger
    fetch('/api/dashboard/fitness/log-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.healthId,
        steps: fitnessState.steps,
        distance: fitnessState.walkKm + fitnessState.runKm,
        calories: fitnessState.calories,
        durationMinutes: 45,
        pointsAwarded: 50
      })
    });
  } else {
    addAuditLogLine('info', `Fitness activity track updated (+1240 steps). Live telemetry synchronized.`);
  }
}

function updateFitnessProgressRing() {
  const percentage = Math.min(100, Math.floor((fitnessState.steps / 10000) * 100));
  const bar = document.getElementById('fitness-progress-bar');
  if (bar) {
    bar.style.background = `conic-gradient(var(--primary) ${percentage}%, rgba(255, 255, 255, 0.05) ${percentage}%)`;
  }
  const fpBar = document.getElementById('fitpanel-progress-bar');
  if (fpBar) {
    fpBar.style.background = `conic-gradient(var(--primary) ${percentage}%, rgba(255, 255, 255, 0.05) ${percentage}%)`;
  }
  const fpBadge = document.getElementById('fitness-reward-points-badge');
  if (fpBadge) {
    fpBadge.innerText = `${currentUser.rewardPoints} Points`;
  }
}

// --- ACTIVE PRESCRIPTIONS MODULE ---
async function loadPatientPrescriptionsFeed() {
  try {
    const response = await fetch('/api/dashboard/prescriptions');
    const data = await response.json();
    
    const container = document.getElementById('patient-prescriptions-feed');
    if (!container) return;
    container.innerHTML = '';
    
    const p_rx = data.prescriptions.filter(rx => rx.patientId === currentUser.healthId);
    
    if (p_rx && p_rx.length > 0) {
      p_rx.forEach(rx => {
        const item = document.createElement('div');
        item.className = 'bkg-card-row';
        
        let orderButton = "";
        if (rx.status === 'Active') {
          orderButton = `<button onclick="addPrescriptionToCart('${rx.id}', '${rx.medications}')" class="btn-dispense" style="padding: 6px 14px;">Order Now</button>`;
        } else {
          orderButton = `<span style="color:#10b981; font-weight:700; font-size:0.85rem;"><i class="fa-solid fa-circle-check"></i> Dispatched</span>`;
        }

        item.innerHTML = `
          <div class="bkg-info-col">
            <span class="bkg-title"><i class="fa-solid fa-signature"></i> Rx ID: ${rx.id}</span>
            <span class="bkg-provider">Doctor: ${rx.doctorName}</span>
            <span class="bkg-schedule">Meds: ${rx.medications}</span>
            <span class="bkg-details-text">Date Dispatched: ${rx.date}</span>
          </div>
          <div>${orderButton}</div>
        `;
        container.appendChild(item);
      });
    } else {
      container.innerHTML = '<p class="text-center" style="color:#7d9696; padding: 12px 0;">No active doctor dispatches</p>';
    }
  } catch (err) {
    console.error(err);
  }
}

// --- DOCUMENTS VAULT & ORDER CHECKOUTS ---
let currentVaultFolder = null;

function navigateVaultFolder(folder) {
  currentVaultFolder = folder;
  loadPatientDocuments();
}

async function loadPatientDocuments() {
  try {
    const response = await fetch(`/api/dashboard/documents/${currentUser.healthId}`);
    const data = await response.json();
    
    const foldersGrid = document.getElementById('drive-folders-grid');
    const filesContainer = document.getElementById('drive-files-container');
    const backBtn = document.getElementById('btn-drive-back');
    const separator = document.getElementById('drive-folder-separator');
    const folderNameLabel = document.getElementById('drive-current-folder-name');
    const container = document.getElementById('patient-documents-list');
    
    if (!container) return;
    
    // Group files by folder
    const docs = data.documents || [];
    const counts = {
      prescriptions: 0,
      diagnostics: 0,
      insurance_docs: 0,
      gov_cards: 0
    };
    
    docs.forEach(doc => {
      const f = doc.folder || 'diagnostics';
      if (counts[f] !== undefined) {
        counts[f]++;
      }
    });

    if (currentVaultFolder === null) {
      foldersGrid.classList.remove('hidden');
      filesContainer.classList.add('hidden');
      backBtn.classList.add('hidden');
      separator.classList.add('hidden');
      folderNameLabel.classList.add('hidden');
      
      foldersGrid.innerHTML = `
        <div class="folder-card" onclick="navigateVaultFolder('prescriptions')">
          <i class="fa-solid fa-folder-medical folder-icon"></i>
          <div class="folder-meta">
            <span class="folder-name">Doctor Prescriptions</span>
            <span class="folder-count">${counts.prescriptions} files</span>
          </div>
        </div>
        <div class="folder-card" onclick="navigateVaultFolder('diagnostics')">
          <i class="fa-solid fa-folder-closed folder-icon"></i>
          <div class="folder-meta">
            <span class="folder-name">Diagnostic Data</span>
            <span class="folder-count">${counts.diagnostics} files</span>
          </div>
        </div>
        <div class="folder-card" onclick="navigateVaultFolder('insurance_docs')">
          <i class="fa-solid fa-folder-shield folder-icon"></i>
          <div class="folder-meta">
            <span class="folder-name">Insurance Documents</span>
            <span class="folder-count">${counts.insurance_docs} files</span>
          </div>
        </div>
        <div class="folder-card" onclick="navigateVaultFolder('gov_cards')">
          <i class="fa-solid fa-folder-open folder-icon"></i>
          <div class="folder-meta">
            <span class="folder-name">Government Cards</span>
            <span class="folder-count">${counts.gov_cards} files</span>
          </div>
        </div>
      `;
    } else {
      foldersGrid.classList.add('hidden');
      filesContainer.classList.remove('hidden');
      backBtn.classList.remove('hidden');
      separator.classList.remove('hidden');
      folderNameLabel.classList.remove('hidden');
      
      const humanNames = {
        prescriptions: "Doctor Prescriptions",
        diagnostics: "Diagnostic Data",
        insurance_docs: "Insurance Documents",
        gov_cards: "Government Insurance Cards"
      };
      folderNameLabel.innerText = humanNames[currentVaultFolder] || "Sub Folder";
      
      // Update target upload folder selection to match current folder
      const folderSelect = document.getElementById('doc-folder-input');
      if (folderSelect) {
        folderSelect.value = currentVaultFolder;
      }
      
      const filteredDocs = docs.filter(doc => (doc.folder || 'diagnostics') === currentVaultFolder);
      container.innerHTML = '';
      
      if (filteredDocs.length > 0) {
        filteredDocs.forEach(doc => {
          const row = document.createElement('div');
          row.className = 'table-row-vault';
          
          let orderActionBtn = "";
          if (doc.folder === 'prescriptions' || doc.category === 'Prescription') {
            orderActionBtn = `<button onclick="addPrescriptionToCart('${doc.id}', '${doc.fileName.replace('.pdf','')}')" class="btn-dispense" style="padding: 4px 10px; font-size:0.75rem;">Order Meds</button>`;
          } else {
            orderActionBtn = `<button class="btn-logout" style="padding:4px 8px; color:var(--secondary); border-color:rgba(165,243,252,0.3);" onclick="alert('Viewing: ${doc.fileName}')">View File</button>`;
          }

          row.innerHTML = `
            <span class="file-name-cell"><i class="fa-solid fa-file-pdf"></i> ${doc.fileName}</span>
            <span><span class="category-badge-pill">${doc.category}</span></span>
            <span style="color:#7d9696;">${doc.fileSize}</span>
            <span style="color:#7d9696;">${doc.date}</span>
            <span>${orderActionBtn}</span>
          `;
          container.appendChild(row);
        });
      } else {
        container.innerHTML = '<p class="text-center" style="grid-column: span 5; color:#7d9696; padding: 24px 0;">No files in this folder. Upload one above!</p>';
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function uploadPatientDocument(e) {
  e.preventDefault();
  const name = document.getElementById('doc-name-input').value.trim();
  const category = document.getElementById('doc-category-input').value;
  const folder = document.getElementById('doc-folder-input').value;
  
  if (!name) return;

  try {
    const response = await fetch('/api/dashboard/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.healthId,
        fileName: name.endsWith('.pdf') ? name : `${name}.pdf`,
        category: category,
        fileSize: `${(1 + Math.random() * 4).toFixed(1)} MB`,
        folder: folder
      })
    });
    
    if (response.ok) {
      document.getElementById('doc-name-input').value = '';
      loadPatientDocuments();
      addAuditLogLine('success', `Document encrypted & added to folder '${folder}': ${name}`);
    }
  } catch (err) {
    console.error(err);
  }
}

// Pharmacy checkout calculator drawer
function openPharmacyCheckout(rxId, meds) {
  addPrescriptionToCart(rxId, meds);
}

async function loadPatientClaimsLedger() {
  try {
    const response = await fetch(`/api/dashboard/claims/${currentUser.healthId}`);
    const data = await response.json();
    
    const container = document.getElementById('patient-claims-ledger');
    if (!container) return;
    container.innerHTML = '';
    
    if (data.claims && data.claims.length > 0) {
      data.claims.forEach(claim => {
        const row = document.createElement('div');
        row.className = 'claims-row';
        row.innerHTML = `
          <strong style="color:#00ccb4;">${claim.id}</strong>
          <span>${claim.provider}</span>
          <span style="color:#7d9696;">${claim.service}</span>
          <strong style="color:#10b981;">${claim.amount}</strong>
          <span><span class="rx-status-pill rx-status-fulfilled">${claim.status}</span></span>
          <span style="color:#7d9696;">${claim.scheme}</span>
          <span style="color:#7d9696;">${claim.date}</span>
        `;
        container.appendChild(row);
      });
    } else {
      container.innerHTML = '<p class="text-center" style="grid-column: span 7; color:#7d9696; padding: 20px 0;">No claim transactions processed</p>';
    }
  } catch (err) {
    console.error(err);
  }
}

// --- LOANS & FINANCIAL DESK SPEEDOMETER ---
function simulateCreditCheck() {
  const btn = document.getElementById('btn-credit-check');
  const needle = document.getElementById('credit-needle');
  const scoreNum = document.getElementById('credit-score-num');
  const statusText = document.getElementById('credit-score-status');
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking Credit Registry...';
  
  // Reset needle
  needle.style.transform = 'rotate(-90deg)';
  scoreNum.innerText = '---';
  
  setTimeout(() => {
    // Generate pre-approved score 720 to 830
    const score = Math.floor(720 + Math.random() * 110);
    scoreNum.innerText = score;
    
    // Map score range 300-900 to degrees range -90deg to 90deg
    // Percentage ratio = (score - 300) / 600
    const ratio = (score - 300) / 600;
    const deg = -90 + (ratio * 180);
    needle.style.transform = `rotate(${deg}deg)`;
    
    btn.disabled = false;
    btn.innerHTML = 'Check Bureau Credit Score <i class="fa-solid fa-gauge-high" style="margin-left: 5px;"></i>';
    
    // Pre-approved limit displays
    const limit = score > 780 ? "₹2,50,000" : "₹1,50,000";
    document.getElementById('pre-approved-val').innerText = `${limit} Approved`;
    document.getElementById('loan-calculator-box').classList.remove('hidden');
    
    statusText.innerText = `CIBIL Score: ${score} - Pre-approved Limit: ${limit} at 0% EMI`;
    addAuditLogLine('success', `CIBIL credit check success: Score ${score}. Loan limit of ${limit} approved for ${currentUser.healthId}.`);
    
  }, 2000);
}

function applySurgeryLoan() {
  const amount = document.getElementById('calc-loan-amount').value;
  const tenure = document.getElementById('calc-loan-tenure').value;
  
  if (!amount || amount <= 0) {
    alert("Please enter a valid surgery loan cost amount.");
    return;
  }
  
  const monthly = Math.floor(amount / tenure);
  alert(`Surgery Loan Approved!\nAmount: ₹${amount}\nTenure: ${tenure} Months\nZero Interest Monthly EMI: ₹${monthly}/month`);
  addAuditLogLine('success', `Medical loan checkout committed: Surgery EMI loan of ₹${amount} approved over ${tenure} months.`);
  
  document.getElementById('calc-loan-amount').value = '';
}

function applyEmergencyLoan() {
  alert("Emergency Advance checkout confirmed!\nImmediate cashless credit of ₹50,000 synced with your card collateral.");
  addAuditLogLine('success', `Emergency advanceSOLUTION checked out: ₹50,000 fund collateralized.`);
}

// --- APPOINTMENTS & HOME CARE SCHEDULER ---
function toggleBookingFields(serviceType) {
  populateBookingDropdowns(serviceType);
}

function populateBookingDropdowns(serviceType) {
  const dropdown = document.getElementById('bkg-provider');
  const label = document.getElementById('bkg-provider-label');
  if (!dropdown) return;
  dropdown.innerHTML = '';
  
  if (serviceType === 'Doctor Consultation') {
    label.innerText = 'Consultant Doctor Specialist';
    CARE_PROVIDERS["Doctor Consultation"].forEach(doc => {
      const opt = document.createElement('option');
      opt.value = doc;
      opt.innerText = doc;
      dropdown.appendChild(opt);
    });
  } else {
    label.innerText = 'Home Care Specialist / Nurse';
    CARE_PROVIDERS["Home Care Nursing"].forEach(nurse => {
      const opt = document.createElement('option');
      opt.value = nurse;
      opt.innerText = nurse;
      dropdown.appendChild(opt);
    });
  }
}

async function submitCareBooking(e) {
  e.preventDefault();
  const bkgType = document.getElementById('bkg-type').value;
  const provider = document.getElementById('bkg-provider').value;
  const dateVal = document.getElementById('bkg-date').value;
  const timeVal = document.getElementById('bkg-time').value;
  const details = document.getElementById('bkg-details').value.trim();

  const fee = bkgType === 'Doctor Consultation' ? 500 : 1200;

  const receiptRows = [
    { label: `${bkgType} Pass`, val: `Rs.${fee}` },
    { label: `Provider: ${provider}`, val: 'Active' },
    { label: `Date & Time: ${dateVal} @ ${timeVal}`, val: 'Confirmed' }
  ];

  checkoutTransactionContext = {
    type: 'care',
    payableAmount: fee,
    onSuccess: async () => {
      try {
        const response = await fetch('/api/dashboard/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: currentUser.healthId,
            bookingType: bkgType,
            providerName: provider,
            date: dateVal,
            time: timeVal,
            details: details
          })
        });
        
        if (response.ok) {
          document.getElementById('bkg-date').value = '';
          document.getElementById('bkg-time').value = '';
          document.getElementById('bkg-details').value = '';
          
          alert("Appointment successfully booked online! Syncing blockchain...");
          loadPatientActiveBookings();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  openPaidCheckoutModal(`Book ${bkgType}`, receiptRows, fee);
}

async function loadPatientActiveBookings() {
  try {
    const response = await fetch(`/api/dashboard/bookings/${currentUser.healthId}`);
    const data = await response.json();
    
    const container = document.getElementById('patient-active-bookings');
    if (!container) return;
    container.innerHTML = '';
    
    if (data.bookings && data.bookings.length > 0) {
      data.bookings.forEach(bkg => {
        const row = document.createElement('div');
        row.className = 'bkg-card-row';
        row.innerHTML = `
          <div class="bkg-info-col">
            <span class="bkg-title"><i class="fa-solid fa-calendar-check"></i> ${bkg.type} (Status: ${bkg.status})</span>
            <span class="bkg-provider">Provider: ${bkg.provider}</span>
            <span class="bkg-schedule"><i class="fa-solid fa-clock"></i> Date: ${bkg.date} | Time: ${bkg.time}</span>
            <span class="bkg-details-text">Triage Context: "${bkg.details}"</span>
          </div>
        `;
        container.appendChild(row);
      });
    } else {
      container.innerHTML = '<p class="text-center" style="color:#7d9696; padding: 24px 0;">No active healthcare bookings scheduled</p>';
    }
  } catch (err) {
    console.error(err);
  }
}

// --- SHARING CONSENT & GOOGLE-LIKE NOTIFICATION SYSTEM ---
function generateConsentOTP() {
  // Generate random 6-digit number
  activeConsentOTP = Math.floor(100000 + Math.random() * 900000).toString();
  
  const otpLabel = document.getElementById('patient-consent-otp');
  const otpDesc = document.getElementById('patient-consent-otp-desc');
  const timerContainer = document.getElementById('otp-timer-container');
  const timerBar = document.getElementById('otp-countdown-bar');
  const timerSec = document.getElementById('otp-countdown-sec');
  
  otpLabel.innerText = activeConsentOTP;
  otpDesc.innerText = "Share with provider to grant temporal vault permissions.";
  
  // Start 30 seconds countdown
  let countdownSec = 30;
  timerContainer.classList.remove('hidden');
  timerBar.style.width = '100%';
  timerSec.innerText = countdownSec;
  
  clearInterval(otpCountdownTimer);
  otpCountdownTimer = setInterval(() => {
    countdownSec--;
    timerSec.innerText = countdownSec;
    
    const percentage = (countdownSec / 30) * 100;
    timerBar.style.width = `${percentage}%`;
    
    if (countdownSec <= 0) {
      clearInterval(otpCountdownTimer);
      otpLabel.innerText = "------";
      otpDesc.innerText = "Code expired. Generate a new OTP code.";
      timerContainer.classList.add('hidden');
      activeConsentOTP = "";
    }
  }, 1000);
  
  // Log to Blockchain Node
  log_blockchain_txn("OTP_CONSENT_GENERATED", {"patientId": currentUser.healthId, "otp": activeConsentOTP});
}

function showGoogleToastNotification(title = "NFC Scanner Authorization Alert", msg = "Doctor Dev Kumar is requesting view access for pathology files.") {
  const toast = document.getElementById('google-alert-toast');
  if (!toast) return;
  
  document.getElementById('toast-title').innerText = title;
  document.getElementById('toast-message').innerText = msg;
  
  toast.classList.remove('hidden');
  
  clearInterval(toastInterval);
  toastTimeRemaining = 60;
  
  const textEl = document.getElementById('toast-countdown-text');
  const barEl = document.getElementById('toast-progress-bar');
  
  if (textEl) textEl.innerText = `Expires in ${toastTimeRemaining}s`;
  if (barEl) barEl.style.width = '100%';
  
  toastInterval = setInterval(() => {
    toastTimeRemaining--;
    if (textEl) textEl.innerText = `Expires in ${toastTimeRemaining}s`;
    if (barEl) barEl.style.width = `${(toastTimeRemaining / 60) * 100}%`;
    
    if (toastTimeRemaining <= 0) {
      clearInterval(toastInterval);
      denyToastConsent();
    }
  }, 1000);
}

function approveToastConsent() {
  dismissGoogleToast();
  addAuditLogLine('success', `NFC handshake access approved. Doctor Dev Kumar session token verified.`);
  
  // Add Dev Kumar session to list
  const container = document.getElementById('patient-active-sessions-list');
  if (container) {
    container.innerHTML = `
      <div class="session-item-card" id="session-card-dev-kumar">
        <div class="session-provider-meta">
          <i class="fa-solid fa-circle-user"></i>
          <div>
            <strong>Dr. Dev Kumar (Cardiologist)</strong>
            <span>Token: TIMED VALID (15 mins countdown)</span>
          </div>
        </div>
        <button class="btn-logout" style="padding: 4px 10px;" onclick="revokeProviderSession('dev-kumar')">Revoke Access</button>
      </div>
    `;
  }
}

function denyToastConsent() {
  dismissGoogleToast();
  addAuditLogLine('warning', `NFC handshake access rejected by patient.`);
}

function dismissGoogleToast() {
  const toast = document.getElementById('google-alert-toast');
  if (toast) toast.classList.add('hidden');
  clearInterval(toastInterval);
}

function loadPatientConsentSessions() {
  const container = document.getElementById('patient-active-sessions-list');
  if (!container) return;
  
  // Populate default Doctor Dev Kumar session
  container.innerHTML = `
    <div class="session-item-card" id="session-card-dev-kumar">
      <div class="session-provider-meta">
        <i class="fa-solid fa-circle-user"></i>
        <div>
          <strong>Dr. Dev Kumar (Cardiologist)</strong>
          <span>Token: TIMED VALID (15 mins countdown)</span>
        </div>
      </div>
      <button class="btn-logout" style="padding: 4px 10px;" onclick="revokeProviderSession('dev-kumar')">Revoke Access</button>
    </div>
  `;
}

function revokeProviderSession(providerKey) {
  const card = document.getElementById(`session-card-${providerKey}`);
  if (card) card.remove();
  
  addAuditLogLine('warning', `Session revoked for provider key: ${providerKey}. Access token cleared.`);
  
  // Reset doctor's active consulting window if open (NFC simulation reset)
  const recordRequester = document.getElementById('record-docs-requester');
  const recordVault = document.getElementById('record-vault-files');
  if (recordRequester && recordVault) {
    recordRequester.classList.remove('hidden');
    recordVault.classList.add('hidden');
    document.getElementById('doc-otp-consent').value = '';
  }
}

// --- AI ADVANCED HEALTH ASSISTANT CHAT ---
function handleChatEnter(e) {
  if (e.key === 'Enter') sendAIChatQuery();
}

function sendQuickAIChat(text, context) {
  document.getElementById('ai-chat-input').value = text;
  sendAIChatQuery(context);
}

async function sendAIChatQuery(contextOverride = "general") {
  const input = document.getElementById('ai-chat-input');
  const text = input.value.trim();
  if (!text) return;
  
  input.value = '';
  appendChatBubble(text, 'sent');
  
  // Append loading bubble
  const chatLogs = document.getElementById('ai-chat-logs');
  const loadBubble = document.createElement('div');
  loadBubble.className = 'chat-bubble received loading-bubble';
  loadBubble.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> AI Advisor analyzing query...';
  chatLogs.appendChild(loadBubble);
  chatLogs.scrollTop = chatLogs.scrollHeight;

  try {
    const response = await fetch('/api/ai/health-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: text,
        patientId: currentUser.healthId,
        context: contextOverride
      })
    });
    
    const data = await response.json();
    
    // Remove loading bubble
    loadBubble.remove();
    
    if (response.ok) {
      let adviceText = `**Advice**: ${data.advice}\n\n${data.insights}`;
      appendChatBubble(adviceText, 'received');
    } else {
      appendChatBubble("AI Assistant failed to parse query terms.", 'received');
    }
  } catch (err) {
    loadBubble.remove();
    appendChatBubble("Network error connecting to SehatRecover AI Advisor.", 'received');
  }
}

function appendChatBubble(text, bubbleType) {
  const chatLogs = document.getElementById('ai-chat-logs');
  if (!chatLogs) return;
  
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${bubbleType}`;
  
  // Convert markdown-style ** to bold tags
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\n/g, '<br>');
  
  bubble.innerHTML = formatted;
  chatLogs.appendChild(bubble);
  chatLogs.scrollTop = chatLogs.scrollHeight;
}

// --- DOCTOR INTERFACE CONSENT CHECKS ---
function simulateDoctorScanner() {
  const input = document.getElementById('doc-patient-search');
  input.value = currentUser.healthId;
  searchPatientRecord();
  
  addAuditLogLine('info', `Doctor QR scan: fetched card parameters for patient: ${currentUser.healthId}`);
}

function searchPatientRecord() {
  const patientId = document.getElementById('doc-patient-search').value.trim();
  const detailsBox = document.getElementById('active-consultation-details');
  const recordRequester = document.getElementById('record-docs-requester');
  const recordVault = document.getElementById('record-vault-files');
  
  if (!patientId) {
    alert('Please enter a Patient ID or scan the card.');
    return;
  }
  
  detailsBox.classList.remove('hidden');
  recordRequester.classList.remove('hidden');
  recordVault.classList.add('hidden');
  
  document.getElementById('consulting-patient-name').innerText = currentUser.fullName;
  document.getElementById('consulting-patient-id').innerText = patientId;
  
  if (currentUser.abhaLinked && currentUser.abhaProfile) {
    document.getElementById('consulting-abha-linked').innerText = 'LINKED';
    document.getElementById('consulting-abha-linked').style.color = '#10b981';
    document.getElementById('consulting-state-scheme').innerText = currentUser.abhaProfile.linkedScheme;
  } else {
    document.getElementById('consulting-abha-linked').innerText = 'UNLINKED';
    document.getElementById('consulting-abha-linked').style.color = '#ef4444';
    document.getElementById('consulting-state-scheme').innerText = 'None (Central PM-JAY only)';
  }

  document.getElementById('rx-patient-details').value = `${patientId} | ${currentUser.fullName}`;
}

async function verifyConsentOtp() {
  const otpVal = document.getElementById('doc-otp-consent').value.trim();
  
  // Verify against dynamic consent OTP or developer bypass code
  const isMatch = (otpVal === '123456') || (activeConsentOTP && otpVal === activeConsentOTP);
  
  if (isMatch) {
    document.getElementById('record-docs-requester').classList.add('hidden');
    document.getElementById('record-vault-files').classList.remove('hidden');
    
    try {
      const response = await fetch(`/api/dashboard/documents/${currentUser.healthId}`);
      const data = await response.json();
      
      const container = document.getElementById('consulting-patient-files');
      container.innerHTML = '';
      
      if (data.documents && data.documents.length > 0) {
        data.documents.forEach(doc => {
          const chip = document.createElement('div');
          chip.className = 'vault-file-chip';
          chip.innerHTML = `
            <span><i class="fa-solid fa-file-pdf"></i> ${doc.fileName} (${doc.category})</span>
            <button onclick="window.open('/static/index.html')">View File</button>
          `;
          container.appendChild(chip);
        });
      } else {
        container.innerHTML = '<p style="color:#7d9696; font-size:0.85rem;">No files in vault</p>';
      }
      
      addAuditLogLine('success', `Consent OTP verified. Doctor Dev Kumar granted view permissions for ${currentUser.healthId}.`);
    } catch (err) {
      console.error(err);
    }
  } else {
    alert('Invalid OTP consent code.');
  }
}

async function dispatchDoctorPrescription(e) {
  e.preventDefault();
  const meds = document.getElementById('rx-medications').value;
  
  try {
    const response = await fetch('/api/dashboard/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.healthId,
        patientName: currentUser.fullName,
        doctorName: 'Dr. Dev Kumar',
        medications: meds
      })
    });
    
    if (response.ok) {
      document.getElementById('rx-medications').value = '';
      alert('Prescription successfully dispatched online!');
      addAuditLogLine('success', `Doctor Dev Kumar dispatched digital prescription: "${meds}". Block mined.`);
    }
  } catch (err) {
    console.error(err);
  }
}

// --- PHARMACY ORDERS LISTING ---
async function loadPharmacyOrdersFeed() {
  try {
    const response = await fetch(`/api/dashboard/orders/${currentUser.healthId}`);
    const data = await response.json();
    
    const container = document.getElementById('pharmacy-prescription-queue');
    if (!container) return;
    container.innerHTML = '';
    
    if (data.orders && data.orders.length > 0) {
      data.orders.forEach(order => {
        const row = document.createElement('div');
        row.className = 'rx-table-row';
        
        let statusStyle = 'rx-status-active';
        let actionBtn = "";
        
        if (order.status.includes('Pending')) {
          actionBtn = `<button onclick="fulfillPharmacyOrder('${order.id}')" class="btn-dispense">Dispatch Order</button>`;
        } else {
          statusStyle = 'rx-status-fulfilled';
          actionBtn = `<span style="color:#10b981; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Settle Claims</span>`;
        }

        row.innerHTML = `
          <strong style="color:#00ccb4;">${order.id}</strong>
          <span>${order.patientId}</span>
          <span style="color:#7d9696;">${order.medications}</span>
          <strong style="color:#fff;">₹${order.finalPrice}</strong>
          <span><span class="rx-status-pill ${statusStyle}">${order.status}</span></span>
          <span>${actionBtn}</span>
        `;
        container.appendChild(row);
      });
    } else {
      container.innerHTML = '<p class="text-center" style="grid-column: span 6; color:#7d9696; padding: 24px 0;">No pharmacy purchase orders placed</p>';
    }
  } catch (err) {
    console.error(err);
  }
}

async function fulfillPharmacyOrder(orderId) {
  try {
    const response = await fetch(`/api/dashboard/orders/${orderId}/dispatch`, {
      method: 'POST'
    });
    if (response.ok) {
      loadPharmacyOrdersFeed();
      alert("Order successfully dispatched and cashless claim settled!");
      addAuditLogLine('success', `Pharmacy dispatch completed for ${orderId}. Claim committed.`);
    }
  } catch (err) {
    console.error(err);
  }
}

// --- ADMIN CRYPTOGRAPHIC BLOCKCHAIN EXPLORER ---
async function loadBlockchainBlockRegistry() {
  try {
    const response = await fetch('/api/blockchain/blocks');
    const data = await response.json();
    
    const container = document.getElementById('blockchain-block-nodes');
    if (!container) return;
    container.innerHTML = '';
    
    if (data.chain && data.chain.length > 0) {
      data.chain.forEach(block => {
        const card = document.createElement('div');
        card.className = `block-node-card ${block.index === 0 ? 'genesis-node' : ''}`;
        
        let blockDataText = block.data;
        try {
          // Pretty format JSON payload if it represents an object
          const obj = JSON.parse(block.data.replace(/'/g, '"'));
          blockDataText = JSON.stringify(obj, null, 2);
        } catch(e) {}

        card.innerHTML = `
          <div class="block-node-header">
            <span>BLOCK HEIGHT</span>
            <strong># ${block.index}</strong>
          </div>
          <div class="block-meta-row">
            <span>BLOCK HASH:</span>
            <strong>${block.hash.slice(0, 20)}...</strong>
          </div>
          <div class="block-meta-row">
            <span>PARENT HASH:</span>
            <strong>${block.previous_hash.slice(0, 20)}...</strong>
          </div>
          <div class="block-node-data">
            <pre style="margin:0; font-family:monospace; line-height:1.2; font-size:0.7rem;">${blockDataText}</pre>
          </div>
          <div class="block-meta-row" style="font-size:0.65rem; color:#7d9696; border-top:1px solid rgba(255,255,255,0.03); padding-top:4px;">
            <span>TIMESTAMP:</span>
            <strong>${new Date(block.timestamp * 1000).toISOString()}</strong>
          </div>
        `;
        container.appendChild(card);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

// --- REAL-TIME LEDGER AUDIT WRITERS ---
function addAuditLogLine(type, text) {
  const consoleEl = document.getElementById('admin-audit-console');
  if (!consoleEl) return;
  
  const timestamp = new Date().toISOString();
  const line = document.createElement('div');
  line.className = 'console-line';
  
  let typeClass = 'console-info';
  if (type === 'success') typeClass = 'console-success';
  if (type === 'warning') typeClass = 'console-warning';
  
  line.innerHTML = `
    <span class="console-timestamp">[${timestamp}]</span>
    <span class="${typeClass}">[${type.toUpperCase()}]</span>
    <span>${text}</span>
  `;
  
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

// Global Timed countdown
let sessionTime = 900;
function startDashboardTimer() {
  const display = document.getElementById('dashboard-timer');
  
  setInterval(() => {
    sessionTime--;
    const mins = Math.floor(sessionTime / 60);
    const secs = sessionTime % 60;
    
    if (display) {
      display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    

    if (sessionTime <= 0) {
      sessionTime = 900;
    }
  }, 1000);
}

function logoutDashboard() {
  sessionStorage.removeItem('sehatrecover_user');
  window.location.href = '/';
}

// ----------------------------------------------------
// NEW EXTENDED CLINICAL PORTAL CONTROLLER FUNCTIONS
// ----------------------------------------------------

async function enrollAbhaDashboard() {
  const aadhaar = document.getElementById('enroll-aadhaar-input').value.trim();
  const stateScheme = document.getElementById('enroll-state-select').value;
  
  if (aadhaar.length !== 12 || isNaN(aadhaar)) {
    alert("Please enter a valid 12-digit Aadhaar Card number.");
    return;
  }
  
  try {
    const response = await fetch('/api/abha/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aadhaarNumber: aadhaar,
        fullName: currentUser.fullName,
        stateScheme: stateScheme,
        userId: currentUser.healthId
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      currentUser.abhaLinked = true;
      currentUser.abhaProfile = data.abhaProfile;
      sessionStorage.setItem('sehatrecover_user', JSON.stringify(currentUser));
      
      alert("One-Click ABHA Card Generated and State Benefits Synced successfully!");
      addAuditLogLine('success', `Aadhaar verification success. ABHA profile linked for ${currentUser.healthId}.`);
      
      // Reload profile views
      loadUserProfile();
      switchPatientSubPanel('insurance');
    } else {
      alert("Enrollment failed: " + data.detail);
    }
  } catch (err) {
    console.error(err);
    alert("Connection error enrolling ABHA card.");
  }
}

async function loadClaimDocSelector() {
  try {
    const response = await fetch(`/api/dashboard/documents/${currentUser.healthId}`);
    const data = await response.json();
    const select = document.getElementById('claim-doc-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Document to Claim against...</option>';
    
    if (data.documents && data.documents.length > 0) {
      data.documents.forEach(doc => {
        const opt = document.createElement('option');
        opt.value = doc.id;
        opt.dataset.filename = doc.fileName;
        opt.innerText = `${doc.fileName} (${doc.category})`;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function submitCashlessClaim(e) {
  e.preventDefault();
  const docId = document.getElementById('claim-doc-select').value;
  const docSelect = document.getElementById('claim-doc-select');
  const selectedOpt = docSelect.options[docSelect.selectedIndex];
  const docName = selectedOpt ? selectedOpt.dataset.filename : "Document";
  
  const policyType = document.getElementById('claim-policy-select').value;
  const provider = document.getElementById('claim-provider-select').value;
  const amount = parseFloat(document.getElementById('claim-amount-input').value);
  
  if (!docId || isNaN(amount) || amount <= 0) {
    alert("Please select a document and enter a valid cost amount.");
    return;
  }
  
  let schemeName = "Private Policy Gateway";
  if (policyType === 'Government') {
    if (currentUser.abhaLinked && currentUser.abhaProfile) {
      schemeName = currentUser.abhaProfile.linkedScheme;
      const balStr = currentUser.abhaProfile.insuranceBalance.replace("₹", "").replace(",", "").split(" ")[0];
      const balVal = parseFloat(balStr);
      if (amount > balVal) {
        alert("Claim amount exceeds active government policy cover balance! Limit: ₹" + balVal.toLocaleString());
        return;
      }
    } else {
      alert("No ABHA government health scheme linked. Please link/enroll first.");
      return;
    }
  }
  
  try {
    const response = await fetch('/api/dashboard/claims/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.healthId,
        documentId: docId,
        provider: provider,
        service: `Medical record checkout: ${docName}`,
        amount: amount,
        policyType: policyType,
        schemeName: schemeName
      })
    });
    
    if (response.ok) {
      alert("Cashless claim successfully verified and settled!");
      addAuditLogLine('success', `Cashless claim verified for ${docId} (₹${amount}). Block committed.`);
      
      if (policyType === 'Government') {
        const balStr = currentUser.abhaProfile.insuranceBalance.replace("₹", "").replace(",", "").split(" ")[0];
        const balVal = parseFloat(balStr);
        const newBal = Math.max(0.0, balVal - amount);
        currentUser.abhaProfile.insuranceBalance = `₹${newBal.toLocaleString()}`;
        sessionStorage.setItem('sehatrecover_user', JSON.stringify(currentUser));
        loadUserProfile();
      }
      
      document.getElementById('claim-amount-input').value = '';
      document.getElementById('claim-doc-select').value = '';
      loadPatientClaimsLedger();
    }
  } catch (err) {
    console.error(err);
    alert("Error processing cashless claim.");
  }
}

function loadLoanCollateralOptions() {
  const select = document.getElementById('loan-collateral-policy-select');
  const box = document.getElementById('loan-collateral-box');
  const slider = document.getElementById('loan-collateral-slider');
  
  if (!select) return;
  select.innerHTML = '';
  
  if (currentUser.abhaLinked && currentUser.abhaProfile) {
    box.classList.remove('hidden');
    
    const opt = document.createElement('option');
    opt.value = currentUser.abhaProfile.linkedScheme;
    opt.innerText = `${currentUser.abhaProfile.linkedScheme} (Collateral Backed)`;
    select.appendChild(opt);
    
    const balStr = currentUser.abhaProfile.insuranceBalance.replace("₹", "").replace(",", "").split(" ")[0];
    const balVal = parseFloat(balStr);
    const maxLoan = Math.floor(balVal * 0.5);
    slider.max = maxLoan;
    slider.value = Math.min(50000, maxLoan);
    updateCollateralLoanAmount(slider.value);
  } else {
    box.classList.add('hidden');
  }
}

function updateCollateralLoanAmount(val) {
  const display = document.getElementById('loan-slider-val');
  if (display) display.innerText = `₹${parseInt(val).toLocaleString()}`;
}

async function submitCollateralLoan() {
  const policySelect = document.getElementById('loan-collateral-policy-select');
  const amount = parseFloat(document.getElementById('loan-collateral-slider').value);
  const tenure = parseInt(document.getElementById('loan-collateral-tenure').value);
  
  if (!policySelect || !policySelect.value) {
    alert("No active insurance policy found to back as collateral.");
    return;
  }
  
  try {
    const response = await fetch('/api/dashboard/loans/apply-collateral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.healthId,
        loanAmount: amount,
        tenureMonths: tenure,
        schemeUsed: policySelect.value,
        policyBalance: amount * 2
      })
    });
    
    if (response.ok) {
      alert("Insurance-backed loan successfully approved and disbursed cashlessly!");
      addAuditLogLine('success', `Collateral loan disbursed: ₹${amount} approved against ${policySelect.value}.`);
      
      const balStr = currentUser.abhaProfile.insuranceBalance.replace("₹", "").replace(",", "").split(" ")[0];
      const balVal = parseFloat(balStr);
      const newBal = Math.max(0.0, balVal - amount);
      currentUser.abhaProfile.insuranceBalance = `₹${newBal.toLocaleString()}`;
      sessionStorage.setItem('sehatrecover_user', JSON.stringify(currentUser));
      loadUserProfile();
      
      loadPatientLoansLedger();
      loadLoanCollateralOptions();
    }
  } catch (err) {
     console.error(err);
     alert("Error applying for collateral loan.");
  }
}

async function loadPatientLoansLedger() {
  try {
    const response = await fetch(`/api/dashboard/loans/${currentUser.healthId}`);
    const data = await response.json();
    
    const container = document.getElementById('patient-loans-ledger');
    if (!container) return;
    container.innerHTML = '';
    
    if (data.loans && data.loans.length > 0) {
      data.loans.forEach(loan => {
        const row = document.createElement('div');
        row.className = 'loans-grid-row';
        row.innerHTML = `
          <strong style="color:#00ccb4;">${loan.id}</strong>
          <strong>₹${loan.amount.toLocaleString()}</strong>
          <span style="color:#7d9696; font-size:0.78rem; word-break:break-all;">${loan.collateralPolicy}</span>
          <span>${loan.tenureMonths} Months</span>
          <strong style="color:var(--accent);">₹${loan.monthlyEmi.toLocaleString()}</strong>
          <span style="color:#10b981;">${loan.interestRate}</span>
          <span><span class="rx-status-pill rx-status-fulfilled">${loan.status}</span></span>
        `;
        container.appendChild(row);
      });
    } else {
      container.innerHTML = '<p class="text-center" style="color:#7d9696; padding:15px 0; font-size:0.85rem;">No active medical loans disbursed</p>';
    }
  } catch (err) {
    console.error(err);
  }
}

let ambulanceTrackingInterval = null;

function initAmbulanceTracking() {
  checkAmbulanceDispatchStatus();
}

async function checkAmbulanceDispatchStatus() {
  try {
    const response = await fetch(`/api/dashboard/emergency/ambulance-status/${currentUser.healthId}`);
    const data = await response.json();
    
    const emptyView = document.getElementById('tracker-empty');
    const hud = document.getElementById('ambulance-hud');
    const pin = document.getElementById('map-ambulance-pin');
    
    if (data.status === 'success' && data.booking) {
      emptyView.style.display = 'none';
      hud.classList.remove('hidden');
      pin.style.display = 'block';
      
      document.getElementById('hud-status-text').innerText = data.booking.status.toUpperCase();
      document.getElementById('hud-eta-minutes').innerText = `${data.booking.etaMinutes} mins`;
      document.getElementById('hud-driver-name').innerText = data.booking.driverName;
      document.getElementById('hud-driver-contact').innerText = data.booking.driverContact;
      document.getElementById('hud-vehicle-num').innerText = data.booking.vehicleNumber;
      
      drawAmbulanceTrackingMap(data.progress);
      
      clearInterval(ambulanceTrackingInterval);
      if (data.booking.status !== 'Arrived') {
        ambulanceTrackingInterval = setInterval(checkAmbulanceDispatchStatus, 3000);
      } else {
        addAuditLogLine('success', `Ambulance booking ${data.booking.id} status update: ARRIVED at destination.`);
      }
    } else {
      emptyView.style.display = 'flex';
      hud.classList.add('hidden');
      pin.style.display = 'none';
      
      drawAmbulanceTrackingMap(0.0);
    }
  } catch (err) {
    console.error(err);
  }
}

function drawAmbulanceTrackingMap(progress) {
  const canvas = document.getElementById('ambulance-route-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const w = canvas.width;
  const h = canvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSpacing = 20;
  for (let x = 0; x < w; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  
  const hospitalX = 50;
  const hospitalY = 30;
  const homeX = w - 60;
  const homeY = h - 30;
  
  const way1X = 180;
  const way1Y = 30;
  const way2X = 180;
  const way2Y = h - 30;
  
  ctx.strokeStyle = 'rgba(165, 243, 252, 0.15)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(hospitalX, hospitalY);
  ctx.lineTo(way1X, way1Y);
  ctx.lineTo(way2X, way2Y);
  ctx.lineTo(homeX, homeY);
  ctx.stroke();
  
  ctx.strokeStyle = 'var(--primary)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(hospitalX, hospitalY);
  
  let currentX = hospitalX;
  let currentY = hospitalY;
  
  const len1 = Math.abs(way1X - hospitalX);
  const len2 = Math.abs(way2Y - way1Y);
  const len3 = Math.abs(homeX - way2X);
  const totalLen = len1 + len2 + len3;
  
  const currentProgressLen = progress * totalLen;
  
  if (currentProgressLen <= len1) {
    currentX = hospitalX + currentProgressLen;
    currentY = hospitalY;
    ctx.lineTo(currentX, currentY);
  } else if (currentProgressLen <= len1 + len2) {
    ctx.lineTo(way1X, way1Y);
    currentX = way1X;
    currentY = way1Y + (currentProgressLen - len1);
    ctx.lineTo(currentX, currentY);
  } else {
    ctx.lineTo(way1X, way1Y);
    ctx.lineTo(way2X, way2Y);
    currentX = way2X + (currentProgressLen - len1 - len2);
    currentY = homeY;
    ctx.lineTo(currentX, currentY);
  }
  ctx.stroke();
  
  const pin = document.getElementById('map-ambulance-pin');
  if (pin && progress > 0.0) {
    pin.style.left = `${currentX - 10}px`;
    pin.style.top = `${currentY - 14}px`;
  }
}

async function submitAmbulanceBooking(e) {
  e.preventDefault();
  const type = document.getElementById('amb-type-select').value;
  const address = document.getElementById('amb-pickup-address').value.trim();
  
  if (!address) return;
  
  try {
    const response = await fetch('/api/dashboard/emergency/book-ambulance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.healthId,
        ambulanceType: type,
        pickupAddress: address
      })
    });
    
    if (response.ok) {
      document.getElementById('amb-pickup-address').value = '';
      alert("Emergency Ambulance Dispatched! Rescuer active on radar.");
      addAuditLogLine('warning', `EMERGENCY Ambulance Dispatched: ${type} routed to pickup.`);
      
      checkAmbulanceDispatchStatus();
    }
  } catch (err) {
    console.error(err);
    alert("Connection error requesting emergency response.");
  }
}

function logoutDashboard() {
  sessionStorage.removeItem('sehatrecover_user');
  window.location.href = '/';
}


// ====================================================================
// ONLINE PHARMACY CART MODULE
// ====================================================================
function loadPharmacyShop() {
  loadPharmacyShopPrescriptions();
  renderPharmacyCart();
}

async function loadPharmacyShopPrescriptions() {
  try {
    const response = await fetch('/api/dashboard/prescriptions');
    const data = await response.json();
    
    const container = document.getElementById('pharmacy-shop-prescriptions');
    if (!container) return;
    container.innerHTML = '';
    
    const activeRxs = data.prescriptions.filter(rx => rx.patientId === currentUser.healthId && rx.status === 'Active');
    
    if (activeRxs.length > 0) {
      activeRxs.forEach(rx => {
        const item = document.createElement('div');
        item.style = 'background:rgba(255,255,255,0.02); border:1px solid rgba(165,243,252,0.1); padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;';
        item.innerHTML = `
          <div>
            <strong style="color:var(--primary); font-size:0.95rem;">${rx.id} &mdash; ${rx.doctorName}</strong>
            <span style="display:block; color:#7d9696; font-size:0.8rem; margin-top:4px;">Meds: ${rx.medications}</span>
            <span style="display:block; color:#7d9696; font-size:0.75rem; margin-top:2px;">Date: ${rx.date}</span>
          </div>
          <button onclick="addPrescriptionToCart('${rx.id}', '${rx.medications}')" class="btn btn-primary" style="font-size:0.8rem; padding:6px 12px;">Add to Cart</button>
        `;
        container.appendChild(item);
      });
    } else {
      container.innerHTML = '<p style="color:#7d9696; padding:10px 0; font-size:0.85rem;">No active verified doctor prescriptions available for checkout.</p>';
    }
  } catch (err) {
    console.error(err);
  }
}

function addPrescriptionToCart(rxId, meds) {
  const exists = pharmacyCart.some(item => item.id === rxId);
  if (exists) {
    alert("This prescription is already in your cart!");
    return;
  }
  
  pharmacyCart.push({
    id: rxId,
    name: `Rx Prescription ${rxId}`,
    details: meds,
    price: 450,
    type: 'prescription'
  });
  
  alert(`Added ${rxId} to Cart!`);
  renderPharmacyCart();
  
  // Switch to Pharmacy tab if called from vault
  switchPatientSubPanel('pharmacy');
  
  // Highlight sidebar
  const menuList = document.getElementById('sidebar-menu-list');
  if (menuList) {
    menuList.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    const pharmItem = Array.from(menuList.querySelectorAll('.menu-item')).find(el => el.innerText.includes('Pharmacy'));
    if (pharmItem) pharmItem.classList.add('active');
  }
}

function addOtcToCart(name, price) {
  pharmacyCart.push({
    id: `OTC-${Math.floor(1000 + Math.random() * 9000)}`,
    name: name,
    details: 'Over-the-counter wellness product',
    price: price,
    type: 'otc'
  });
  
  alert(`Added ${name} to Cart!`);
  renderPharmacyCart();
}

function removeFromCart(id) {
  pharmacyCart = pharmacyCart.filter(item => item.id !== id);
  renderPharmacyCart();
}

function renderPharmacyCart() {
  const badge = document.getElementById('pharmacy-cart-count-badge');
  const emptyView = document.getElementById('pharmacy-cart-empty-view');
  const contentView = document.getElementById('pharmacy-cart-content-view');
  const itemsContainer = document.getElementById('pharmacy-cart-items');
  const availablePointsText = document.getElementById('cart-rewards-available-text');
  const slider = document.getElementById('cart-rewards-slider');
  
  if (!badge) return;
  
  badge.innerText = `${pharmacyCart.length} Items`;
  
  if (pharmacyCart.length === 0) {
    emptyView.classList.remove('hidden');
    contentView.classList.add('hidden');
    return;
  }
  
  emptyView.classList.add('hidden');
  contentView.classList.remove('hidden');
  
  itemsContainer.innerHTML = '';
  let subtotal = 0;
  pharmacyCart.forEach(item => {
    subtotal += item.price;
    const row = document.createElement('div');
    row.style = 'display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.04); padding:8px 10px; border-radius:4px; font-size:0.8rem;';
    row.innerHTML = `
      <div style="flex:1;">
        <strong style="color:white; display:block;">${item.name}</strong>
        <span style="color:#7d9696; font-size:0.7rem;">${item.details}</span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <strong style="color:var(--accent);">Rs.${item.price}</strong>
        <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:0.9rem;"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    itemsContainer.appendChild(row);
  });
  
  availablePointsText.innerText = `Available: ${currentUser.rewardPoints} pts`;
  
  let couponDiscount = 0;
  if (cartCouponApplied) {
    couponDiscount = subtotal * 0.2;
    document.getElementById('cart-coupon-line').style.display = 'flex';
    document.getElementById('cart-coupon-val').innerText = `-Rs.${Math.round(couponDiscount)}`;
  } else {
    document.getElementById('cart-coupon-line').style.display = 'none';
  }
  
  let remainingAfterCoupon = subtotal - couponDiscount;
  
  const maxRedeem = Math.min(currentUser.rewardPoints, Math.floor(remainingAfterCoupon));
  slider.max = maxRedeem;
  if (cartRewardsPointsToRedeem > maxRedeem) {
    cartRewardsPointsToRedeem = maxRedeem;
  }
  slider.value = cartRewardsPointsToRedeem;
  document.getElementById('cart-rewards-slider-val').innerText = `${cartRewardsPointsToRedeem} pts`;
  
  if (cartRewardsPointsToRedeem > 0) {
    document.getElementById('cart-rewards-line').style.display = 'flex';
    document.getElementById('cart-rewards-val').innerText = `-Rs.${cartRewardsPointsToRedeem}`;
  } else {
    document.getElementById('cart-rewards-line').style.display = 'none';
  }
  
  let remainingAfterRewards = remainingAfterCoupon - cartRewardsPointsToRedeem;
  
  let royalDiscount = 0;
  if (cartRoyalCustomer) {
    royalDiscount = remainingAfterRewards * 0.1;
    document.getElementById('cart-royal-line').style.display = 'flex';
    document.getElementById('cart-royal-val').innerText = `-Rs.${Math.round(royalDiscount)}`;
  } else {
    document.getElementById('cart-royal-line').style.display = 'none';
  }
  
  let remainingAfterRoyal = remainingAfterRewards - royalDiscount;
  
  let deliveryFee = 50;
  if (cartRoyalCustomer || subtotal > 500) {
    deliveryFee = 0;
  }
  document.getElementById('cart-delivery-val').innerText = deliveryFee === 0 ? "FREE" : `Rs.${deliveryFee}`;
  
  let netTotal = remainingAfterRoyal + deliveryFee;
  netTotal = Math.max(0, Math.round(netTotal));
  
  document.getElementById('cart-subtotal-val').innerText = `Rs.${subtotal}`;
  document.getElementById('cart-net-total-val').innerText = `Rs.${netTotal}`;
}

function applyCartCoupon() {
  const code = document.getElementById('cart-coupon-input').value.trim();
  const msgEl = document.getElementById('cart-coupon-message');
  
  if (code.toUpperCase() === 'SEHAT20') {
    cartCouponApplied = true;
    msgEl.style.display = 'block';
    msgEl.style.color = 'var(--success)';
    msgEl.innerText = "Coupon SEHAT20 applied! 20% discount activated.";
    addAuditLogLine('success', "Discount coupon applied: SEHAT20 (20% off).");
  } else if (code === '') {
    cartCouponApplied = false;
    msgEl.style.display = 'none';
  } else {
    cartCouponApplied = false;
    msgEl.style.display = 'block';
    msgEl.style.color = 'var(--danger)';
    msgEl.innerText = "Invalid coupon code!";
  }
  renderPharmacyCart();
}

function updateCartRewardsSlider(val) {
  cartRewardsPointsToRedeem = parseInt(val);
  renderPharmacyCart();
}

function toggleCartRoyalCustomer(checked) {
  cartRoyalCustomer = checked;
  addAuditLogLine('info', `Royal Customer privilege toggle: ${checked ? "ENABLED" : "DISABLED"}`);
  renderPharmacyCart();
}

function openCartPaymentCheckout() {
  let subtotal = 0;
  pharmacyCart.forEach(item => subtotal += item.price);
  
  let couponDiscount = cartCouponApplied ? subtotal * 0.2 : 0;
  let remainingAfterCoupon = subtotal - couponDiscount;
  let pointsDiscount = cartRewardsPointsToRedeem;
  let remainingAfterRewards = remainingAfterCoupon - pointsDiscount;
  let royalDiscount = cartRoyalCustomer ? remainingAfterRewards * 0.1 : 0;
  let remainingAfterRoyal = remainingAfterRewards - royalDiscount;
  
  let deliveryFee = (cartRoyalCustomer || subtotal > 500) ? 0 : 50;
  let payable = Math.max(0, Math.round(remainingAfterRoyal + deliveryFee));

  const receiptRows = [
    { label: "Items Total", val: `Rs.${subtotal}` }
  ];
  if (cartCouponApplied) {
    receiptRows.push({ label: "Coupon SEHAT20 (20% off)", val: `-Rs.${Math.round(couponDiscount)}` });
  }
  if (pointsDiscount > 0) {
    receiptRows.push({ label: `Redeemed ${pointsDiscount} Points`, val: `-Rs.${pointsDiscount}` });
  }
  if (cartRoyalCustomer) {
    receiptRows.push({ label: "Royal Member Extra 10% off", val: `-Rs.${Math.round(royalDiscount)}` });
  }
  receiptRows.push({ label: "Delivery Fee", val: deliveryFee === 0 ? "FREE" : `Rs.${deliveryFee}` });

  checkoutTransactionContext = {
    type: 'pharmacy',
    payableAmount: payable,
    pointsRedeemed: pointsDiscount,
    onSuccess: async () => {
      const medsList = pharmacyCart.map(i => i.name).join(", ");
      const firstRx = pharmacyCart.find(i => i.type === 'prescription');
      
      const response = await fetch('/api/dashboard/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentUser.healthId,
          prescriptionId: firstRx ? firstRx.id : `OTC-ORDER`,
          medications: medsList,
          price: subtotal,
          discountApplied: subtotal - payable,
          pointsRedeemed: pointsDiscount,
          schemeUsed: selectedPaymentMethod === 'Cashless' ? 'PMJAY cover' : `${selectedPaymentMethod} payment`
        })
      });
      
      if (response.ok) {
        for (const item of pharmacyCart) {
          if (item.type === 'prescription') {
            await fetch(`/api/dashboard/prescriptions/${item.id}/fulfill`, { method: 'POST' });
          }
        }
        
        if (pointsDiscount > 0) {
          currentUser.rewardPoints -= pointsDiscount;
        }
        
        if (payable > 0) {
          const earned = Math.floor(payable * 0.1);
          if (earned > 0) {
            currentUser.rewardPoints += earned;
            addAuditLogLine('success', `Earned ${earned} reward points from pharmacy purchase!`);
          }
        }
        
        sessionStorage.setItem('sehatrecover_user', JSON.stringify(currentUser));
        
        pharmacyCart = [];
        cartCouponApplied = false;
        cartRewardsPointsToRedeem = 0;
        cartRoyalCustomer = false;
        document.getElementById('cart-royal-toggle').checked = false;
        document.getElementById('cart-coupon-input').value = '';
        
        loadPharmacyShop();
        loadPatientDocuments();
        alert("Pharmacy order placed and cashless claims synced successfully!");
      }
    }
  };

  openPaidCheckoutModal("Pharmacy Purchase Order", receiptRows, payable);
}

// ====================================================================
// FITNESS HUB PANEL & CLASSES SCHEDULER
// ====================================================================
function loadFitnessHub() {
  document.getElementById('fitpanel-steps').innerText = fitnessState.steps.toLocaleString();
  document.getElementById('fitpanel-walk').innerText = `${fitnessState.walkKm.toFixed(1)} km`;
  document.getElementById('fitpanel-run').innerText = `${fitnessState.runKm.toFixed(1)} km`;
  document.getElementById('fitpanel-calories').innerText = `${fitnessState.calories} kcal`;
  
  const pct = Math.min(100, (fitnessState.steps / 10000) * 100);
  document.getElementById('fitpanel-progress-bar').style.background = `conic-gradient(var(--primary) ${pct}%, rgba(255,255,255,0.05) 0)`;
  
  document.getElementById('fitness-reward-points-badge').innerText = `${currentUser.rewardPoints} Points`;
  
  document.getElementById('fit-redeem-points-toggle').checked = false;
  document.getElementById('fit-price-points-row').style.display = 'none';
  
  updateFitnessActivityPrices('Yoga Class');
  loadFitnessPassesList();
}

const FITNESS_PRICES = {
  'Yoga Class': 350,
  'Dance Class': 250,
  'Aerobic Class': 300,
  'Gym Pass': 200,
  'Sports Club': 400
};

function updateFitnessActivityPrices(activityType) {
  const price = FITNESS_PRICES[activityType] || 350;
  activeFitnessBooking.activityType = activityType;
  activeFitnessBooking.price = price;
  
  calculateFitnessBookingTotal();
}

function toggleFitnessPointsRedeem(checked) {
  activeFitnessBooking.usePoints = checked;
  calculateFitnessBookingTotal();
}

function calculateFitnessBookingTotal() {
  let subtotal = activeFitnessBooking.price;
  let discount = 0;
  
  if (activeFitnessBooking.usePoints) {
    discount = Math.min(currentUser.rewardPoints, subtotal);
    document.getElementById('fit-price-points-row').style.display = 'flex';
    document.getElementById('fit-price-points-discount').innerText = `-Rs.${discount}`;
  } else {
    document.getElementById('fit-price-points-row').style.display = 'none';
  }
  
  let final = subtotal - discount;
  activeFitnessBooking.finalPrice = final;
  
  document.getElementById('fit-price-subtotal').innerText = `Rs.${subtotal}`;
  document.getElementById('fit-price-final').innerText = `Rs.${final}`;
}

async function submitFitnessActivityBooking(e) {
  e.preventDefault();
  const select = document.getElementById('fit-activity-select');
  const activityName = select.options[select.selectedIndex].text.split(" (")[0];
  const dateVal = document.getElementById('fit-booking-date').value;
  const timeVal = document.getElementById('fit-booking-time').value;
  
  if (!dateVal) {
    alert("Please select a date for booking.");
    return;
  }
  
  const subtotal = activeFitnessBooking.price;
  const pointsRedeemed = activeFitnessBooking.usePoints ? Math.min(currentUser.rewardPoints, subtotal) : 0;
  const finalPrice = activeFitnessBooking.finalPrice;

  const receiptRows = [
    { label: `Activity Class: ${select.value}`, val: `Rs.${subtotal}` }
  ];
  if (pointsRedeemed > 0) {
    receiptRows.push({ label: `Redeemed ${pointsRedeemed} Points`, val: `-Rs.${pointsRedeemed}` });
  }

  checkoutTransactionContext = {
    type: 'fitness',
    payableAmount: finalPrice,
    pointsRedeemed: pointsRedeemed,
    onSuccess: async () => {
      try {
        const response = await fetch('/api/dashboard/fitness/book-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: currentUser.healthId,
            activityType: select.value,
            activityName: activityName,
            scheduleDate: dateVal,
            scheduleTime: timeVal,
            price: subtotal,
            discountApplied: pointsRedeemed,
            pointsRedeemed: pointsRedeemed,
            finalPrice: finalPrice,
            paymentMethod: selectedPaymentMethod === 'Cashless' ? 'Free Pass (Insurance)' : (finalPrice === 0 ? 'Free Pass (Points)' : selectedPaymentMethod)
          })
        });
        
        if (response.ok) {
          if (pointsRedeemed > 0) {
            currentUser.rewardPoints -= pointsRedeemed;
            sessionStorage.setItem('sehatrecover_user', JSON.stringify(currentUser));
          }
          
          alert("Activity session successfully booked! Block added to registry.");
          loadFitnessHub();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  openPaidCheckoutModal(`Book ${select.value}`, receiptRows, finalPrice);
}

async function loadFitnessPassesList() {
  try {
    const response = await fetch(`/api/dashboard/fitness/bookings/${currentUser.healthId}`);
    const data = await response.json();
    
    const container = document.getElementById('patient-fitness-bookings-list');
    if (!container) return;
    container.innerHTML = '';
    
    if (data.bookings && data.bookings.length > 0) {
      data.bookings.forEach(bkg => {
        const row = document.createElement('div');
        row.style = 'display:grid; grid-template-columns: 1fr 1.5fr 1fr 1fr 1fr 1.2fr; gap:10px; padding:10px; border-bottom:1px solid rgba(255,255,255,0.03); align-items:center; font-size:0.8rem; color:#fff;';
        row.innerHTML = `
          <strong style="color:var(--primary);">${bkg.id}</strong>
          <span>${bkg.name}</span>
          <span><span class="category-badge-pill" style="background:rgba(168,85,247,0.1); color:#a855f7; border-color:rgba(168,85,247,0.2);">${bkg.type}</span></span>
          <span style="color:#7d9696;">${bkg.date} @ ${bkg.time}</span>
          <strong style="color:var(--accent);">${bkg.price}</strong>
          <span style="color:var(--success); font-weight:600;"><i class="fa-solid fa-circle-check"></i> ${bkg.status}</span>
        `;
        container.appendChild(row);
      });
    } else {
      container.innerHTML = '<p class="text-center" style="grid-column:span 6; color:#7d9696; padding: 20px 0; font-size:0.85rem;">No active wellness passes reserved</p>';
    }
  } catch (err) {
    console.error(err);
  }
}

// ====================================================================
// UNIFIED PAID CHECKOUT GATEWAY LOGIC
// ====================================================================
function openPaidCheckoutModal(title, receiptRows, payableAmount) {
  document.getElementById('chkmodal-title').innerText = title;
  document.getElementById('chkmodal-payable-total').innerText = `Rs.${payableAmount}`;
  
  const container = document.getElementById('chkmodal-receipt-rows');
  container.innerHTML = '';
  receiptRows.forEach(row => {
    const el = document.createElement('div');
    el.style = 'display:flex; justify-content:space-between; font-size:0.8rem; color:#7d9696;';
    el.innerHTML = `<span>${row.label}</span><strong style="color:white;">${row.val}</strong>`;
    container.appendChild(el);
  });
  
  switchPayMethod('UPI');
  document.getElementById('paid-checkout-modal').classList.remove('hidden');
}

function closePaidCheckoutModal() {
  document.getElementById('paid-checkout-modal').classList.add('hidden');
  checkoutTransactionContext = null;
}

function switchPayMethod(method) {
  selectedPaymentMethod = method;
  
  const upiItem = document.getElementById('paymethod-upi');
  const cardItem = document.getElementById('paymethod-card');
  const cashlessItem = document.getElementById('paymethod-cashless');
  
  const upiFields = document.getElementById('checkout-upi-fields');
  const cardFields = document.getElementById('checkout-card-fields');
  const cashlessFields = document.getElementById('checkout-cashless-fields');
  
  upiItem.classList.remove('active');
  cardItem.classList.remove('active');
  cashlessItem.classList.remove('active');
  
  upiFields.classList.add('hidden');
  cardFields.classList.add('hidden');
  cashlessFields.classList.add('hidden');
  
  if (method === 'UPI') {
    upiItem.classList.add('active');
    upiFields.classList.remove('hidden');
    document.getElementById('chk-upi-id').required = true;
    document.getElementById('chk-card-number').required = false;
  } else if (method === 'Card') {
    cardItem.classList.add('active');
    cardFields.classList.remove('hidden');
    document.getElementById('chk-upi-id').required = false;
    document.getElementById('chk-card-number').required = true;
  } else if (method === 'Cashless') {
    cashlessItem.classList.add('active');
    cashlessFields.classList.remove('hidden');
    document.getElementById('chk-upi-id').required = false;
    document.getElementById('chk-card-number').required = false;
  }
}

async function processPaidCheckoutSubmit(e) {
  e.preventDefault();
  if (!checkoutTransactionContext) return;
  
  const payable = checkoutTransactionContext.payableAmount;
  let methodText = selectedPaymentMethod;
  let detailsText = "";
  
  if (selectedPaymentMethod === 'UPI') {
    detailsText = document.getElementById('chk-upi-id').value.trim();
  } else if (selectedPaymentMethod === 'Card') {
    detailsText = document.getElementById('chk-card-number').value.trim().substring(0, 4) + " **** **** ****";
  } else if (selectedPaymentMethod === 'Cashless') {
    if (!currentUser.abhaLinked) {
      alert("No ABHA or insurance covers linked to card! Link universal schemes first.");
      return;
    }
    methodText = 'Insurance Cashless';
    detailsText = currentUser.abhaProfile.linkedScheme;
  }
  
  try {
    const response = await fetch('/api/dashboard/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.healthId,
        itemId: checkoutTransactionContext.type + '-' + Math.floor(Math.random() * 1000),
        itemType: checkoutTransactionContext.type,
        amount: payable,
        paymentMethod: methodText,
        cardNumber: selectedPaymentMethod === 'Card' ? detailsText : '',
        upiId: selectedPaymentMethod === 'UPI' ? detailsText : ''
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      addAuditLogLine('success', `Payment settled: Rs.${payable} processed via ${methodText}. TxId: ${data.transactionId}`);
      
      document.getElementById('chk-upi-id').value = '';
      document.getElementById('chk-card-number').value = '';
      
      if (checkoutTransactionContext.onSuccess) {
        await checkoutTransactionContext.onSuccess();
      }
      
      closePaidCheckoutModal();
    }
  } catch (err) {
    console.error(err);
  }
}
