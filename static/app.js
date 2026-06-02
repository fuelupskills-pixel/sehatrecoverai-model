// ----------------------------------------------------
// SehatRecover Application Logic & Flow Simulator
// Pure Vanilla Javascript Integration with Python FastAPI Backend
// ----------------------------------------------------

// Global State
let authState = {
  channel: 'mobile',
  contact: '',
  fullName: '',
  user: null
};

let simulatorState = {
  currentRole: 'Patient',
  currentStep: 1,
  stepsData: [],
  selectedDocs: ['Health ID Card'],
  timerInterval: null
};

// ----------------------------------------------------
// Initial Page Hook
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setupCardInteraction();
  setupAISymptomChecker();
  initSimulator();
  checkExistingSession();
  
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }
});

// ----------------------------------------------------
// Card Flipping Mechanisms
// ----------------------------------------------------
function setupCardInteraction() {
  const flipCard = document.querySelector('.flip-card');
  if (flipCard) {
    flipCard.addEventListener('click', () => {
      flipCard.classList.toggle('flipped');
    });
  }
}

// ----------------------------------------------------
// Passwordless Auth Funnel Logic
// ----------------------------------------------------
function switchSignupChannel(channel) {
  authState.channel = channel;
  
  const tabMobile = document.getElementById('tab-mobile');
  const tabEmail = document.getElementById('tab-email');
  const groupMobile = document.getElementById('group-mobile');
  const groupEmail = document.getElementById('group-email');
  const errorDiv = document.getElementById('signup-error');
  
  if (errorDiv) errorDiv.classList.add('hidden');
  
  if (channel === 'mobile') {
    tabMobile.classList.add('active');
    tabEmail.classList.remove('active');
    groupMobile.classList.remove('hidden');
    groupEmail.classList.add('hidden');
  } else {
    tabMobile.classList.remove('active');
    tabEmail.classList.add('active');
    groupMobile.classList.add('hidden');
    groupEmail.classList.remove('hidden');
  }
}

async function sendAuthOtp() {
  const nameInput = document.getElementById('signup-name').value.trim();
  const mobileInput = document.getElementById('signup-mobile').value;
  const emailInput = document.getElementById('signup-email').value;
  const errorDiv = document.getElementById('signup-error');
  
  errorDiv.classList.add('hidden');
  
  if (!nameInput) {
    showError(errorDiv, 'Please enter your Full Name.');
    return;
  }
  
  let contact = '';
  if (authState.channel === 'mobile') {
    if (!mobileInput) {
      showError(errorDiv, 'Please enter your Mobile Number.');
      return;
    }
    contact = mobileInput;
  } else {
    if (!emailInput) {
      showError(errorDiv, 'Please enter your Email Address.');
      return;
    }
    contact = emailInput;
  }
  
  authState.contact = contact;
  authState.fullName = nameInput;
  
  try {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact: contact,
        channel: authState.channel
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showError(errorDiv, data.detail || 'Failed to send OTP.');
      return;
    }
    
    document.getElementById('signup-state-enter').classList.add('hidden');
    document.getElementById('signup-state-otp').classList.remove('hidden');
    document.getElementById('signup-otp-target').innerText = contact;
    
  } catch (err) {
    showError(errorDiv, 'Network error. Please ensure the Python server is running.');
  }
}

async function verifyAuthOtp() {
  const otpInput = document.getElementById('signup-otp').value.trim();
  const errorDiv = document.getElementById('otp-error');
  
  errorDiv.classList.add('hidden');
  
  if (!otpInput || otpInput.length < 6) {
    showError(errorDiv, 'Please enter a 6-digit OTP code.');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact: authState.contact,
        otpCode: otpInput,
        fullName: authState.fullName
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showError(errorDiv, data.detail || 'Verification failed.');
      return;
    }
    
    authState.user = data.user;
    sessionStorage.setItem('sehatrecover_user', JSON.stringify(data.user));
    updatePersonalizedUI(data.user);
    
    document.getElementById('signup-state-otp').classList.add('hidden');
    document.getElementById('signup-state-success').classList.remove('hidden');
    document.getElementById('signup-generated-id').innerText = data.user.healthId;
    
  } catch (err) {
    showError(errorDiv, 'Verification failed. Connection error.');
  }
}

function backToSignupDetails() {
  document.getElementById('signup-state-otp').classList.add('hidden');
  document.getElementById('signup-state-enter').classList.remove('hidden');
}

function showError(element, message) {
  element.innerText = message;
  element.classList.remove('hidden');
}

function updatePersonalizedUI(user) {
  document.getElementById('nav-login-btn').classList.add('hidden');
  const badge = document.getElementById('user-profile-badge');
  badge.classList.remove('hidden');
  document.getElementById('user-badge-name').innerText = user.fullName;
  
  document.getElementById('card-patient-name').innerText = user.fullName;
  document.getElementById('card-full-name').innerText = user.fullName;
  document.getElementById('card-contact').innerText = user.contact;
  document.getElementById('card-id-num').innerText = user.healthId;
  
  const actBtn = document.getElementById('health-card-action-btn');
  actBtn.innerText = 'Launch Flow Simulator';
  actBtn.setAttribute('onclick', 'scrollToSandbox()');
}

function highlightUserCard() {
  const showcase = document.getElementById('health-card-showcase');
  document.getElementById('benefits').scrollIntoView({ behavior: 'smooth' });
  showcase.style.transform = 'scale(1.05)';
  setTimeout(() => {
    showcase.style.transform = 'scale(1)';
  }, 1000);
}

function scrollToSandbox(optionalRole = null) {
  if (optionalRole) {
    selectSimulatorRole(optionalRole);
  }
  document.getElementById('ai-sandbox').scrollIntoView({ behavior: 'smooth' });
}

// ----------------------------------------------------
// Ayushman Bharat ABHA & State Schemes Integration
// ----------------------------------------------------
async function linkAbhaAccount() {
  const abhaInput = document.getElementById('abha-id-input').value.trim();
  const stateSchemeSelect = document.getElementById('abha-state-select').value;
  const errorDiv = document.getElementById('abha-error');
  
  errorDiv.classList.add('hidden');
  
  // Guard clause: Must be logged in first
  if (!authState.user) {
    showError(errorDiv, 'Please sign up or log in first via the Passwordless Sign-Up funnel at the top of the page to generate your SehatRecover Universal Health Card before linking your ABHA account.');
    return;
  }
  
  if (!abhaInput) {
    showError(errorDiv, 'Please enter a 14-digit ABHA Number or ABHA Address.');
    return;
  }
  
  try {
    const response = await fetch('/api/abha/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        abhaId: abhaInput,
        userId: authState.user.healthId,
        stateScheme: stateSchemeSelect
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showError(errorDiv, data.detail || 'Failed to link ABHA account.');
      return;
    }
    
    authState.user.abhaLinked = true;
    authState.user.abhaProfile = data.abhaProfile;
    sessionStorage.setItem('sehatrecover_user', JSON.stringify(authState.user));
    
    // Update UI elements using helper
    updateAbhaLinkedUI(data.abhaProfile);
    highlightUserCard();
    
  } catch (err) {
    showError(errorDiv, 'Network error. Make sure the FastAPI Python backend is running.');
  }
}

// ----------------------------------------------------
// AI Symptom Triage Logic
// ----------------------------------------------------
function setupAISymptomChecker() {
  const btn = document.getElementById('btn-analyze-symptoms');
  if (btn) {
    btn.addEventListener('click', async () => {
      const symptoms = document.getElementById('symptoms-input').value.trim();
      const resultBox = document.getElementById('ai-result');
      
      if (!symptoms) {
        alert('Please describe your symptoms first.');
        return;
      }
      
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing...';
      btn.disabled = true;
      
      try {
        const response = await fetch('/api/ai/symptom-checker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms: symptoms })
        });
        
        const data = await response.json();
        
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Run AI Diagnostics';
        btn.disabled = false;
        
        if (!response.ok) {
          alert(data.detail || 'AI Engine failed to triage.');
          return;
        }
        
        document.getElementById('res-dept').innerText = data.department;
        document.getElementById('res-advice').innerText = data.advice;
        document.getElementById('res-insights').innerText = data.insights;
        
        const badge = document.getElementById('res-triage');
        badge.innerText = `${data.triage_level} PRIORITY`;
        badge.className = 'triage-badge';
        if (data.triage_level === 'HIGH') {
          badge.classList.add('triage-high');
        } else if (data.triage_level === 'MEDIUM') {
          badge.classList.add('triage-medium');
        } else {
          badge.classList.add('triage-low');
        }
        
        const tagsContainer = document.getElementById('res-keywords');
        tagsContainer.innerHTML = '';
        if (data.matched_terms && data.matched_terms.length > 0) {
          data.matched_terms.forEach(term => {
            const tag = document.createElement('span');
            tag.className = 'keyword-tag';
            tag.innerText = term;
            tagsContainer.appendChild(tag);
          });
        } else {
          tagsContainer.innerHTML = '<em style="font-size:0.8rem;color:#7d9696;">None</em>';
        }
        
        resultBox.classList.remove('hidden');
        
      } catch (err) {
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Run AI Diagnostics';
        btn.disabled = false;
        alert('Could not reach AI server. Ensure FastAPI is running.');
      }
    });
  }
}

// ----------------------------------------------------
// User Flowchart Simulator
// ----------------------------------------------------
async function initSimulator() {
  try {
    const response = await fetch('/api/flow-data');
    const data = await response.json();
    simulatorState.stepsData = data.steps;
    
    renderRoleTabs(Object.keys(data.roles));
    renderFlowchartSteps();
    renderInteractiveZone();
  } catch (err) {
    console.error('Failed to load flowchart simulator:', err);
  }
}

function renderRoleTabs(roles) {
  const container = document.getElementById('role-tab-container');
  container.innerHTML = '';
  
  roles.forEach(role => {
    const tab = document.createElement('button');
    tab.className = `role-tab ${role === simulatorState.currentRole ? 'active' : ''}`;
    tab.innerText = role;
    tab.onclick = () => selectSimulatorRole(role);
    container.appendChild(tab);
  });
}

function selectSimulatorRole(role) {
  simulatorState.currentRole = role;
  simulatorState.currentStep = 1;
  
  const tabs = document.querySelectorAll('.role-tab');
  tabs.forEach(tab => {
    if (tab.innerText === role) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  renderFlowchartSteps();
  renderInteractiveZone();
}

function renderFlowchartSteps() {
  const container = document.getElementById('flowchart-steps-container');
  container.innerHTML = '';
  
  simulatorState.stepsData.forEach((step, idx) => {
    const stepNum = idx + 1;
    const stepNode = document.createElement('div');
    stepNode.className = 'flow-step-node';
    if (stepNum === simulatorState.currentStep) {
      stepNode.classList.add('active');
    } else if (stepNum < simulatorState.currentStep) {
      stepNode.classList.add('completed');
    }
    
    stepNode.innerHTML = `
      <div class="step-number" onclick="jumpToStep(${stepNum})">${stepNum < simulatorState.currentStep ? '<i class="fa-solid fa-check"></i>' : stepNum}</div>
      <div class="step-label">${step.name}</div>
    `;
    container.appendChild(stepNode);
  });
}

function jumpToStep(stepNum) {
  if (stepNum < simulatorState.currentStep || stepNum === simulatorState.currentStep + 1) {
    simulatorState.currentStep = stepNum;
    renderFlowchartSteps();
    renderInteractiveZone();
  }
}

function renderInteractiveZone() {
  const container = document.getElementById('interactive-zone');
  const step = simulatorState.stepsData[simulatorState.currentStep - 1];
  
  if (!step) return;
  
  let content = `
    <div class="sim-header">
      <h4>Step ${step.id}: ${step.name}</h4>
      <p>Role Profile: <strong>${simulatorState.currentRole}</strong> &mdash; ${step.desc}</p>
    </div>
    <div class="sim-body" id="sim-body-content">
  `;
  
  switch(simulatorState.currentStep) {
    case 1:
      content += `
        <div class="qr-scanner-placeholder">
          <div class="scanner-laser"></div>
          <i class="fa-solid fa-qrcode" style="font-size: 4rem; color: #7d9696;"></i>
        </div>
        <p>Scanning SehatRecover Digital Card for credential handshaking...</p>
        <button class="btn btn-primary" onclick="executeStep1Scan()">Scan Card Code <i class="fa-solid fa-camera" style="margin-left: 5px;"></i></button>
      `;
      break;
      
    case 2:
      content += `
        <p>Select which medical documents you want to request secure access to:</p>
        <div class="document-requests-list">
          <div class="doc-request-item selected" onclick="toggleDocSelect(this, 'Health ID Card')">
            <i class="fa-solid fa-circle-check"></i> Health Card Credentials
          </div>
          <div class="doc-request-item" onclick="toggleDocSelect(this, 'Lab Reports')">
            <i class="fa-solid fa-check"></i> Blood & Lab Reports
          </div>
          <div class="doc-request-item" onclick="toggleDocSelect(this, 'Prescriptions')">
            <i class="fa-solid fa-check"></i> Active Prescriptions (Pharmacy)
          </div>
        </div>
        <button class="btn btn-primary" onclick="executeStep2Request()">Request Credentials <i class="fa-solid fa-paper-plane" style="margin-left: 5px;"></i></button>
      `;
      break;
      
    case 3:
      content += `
        <div class="otp-verification-placeholder">
          <p>Please request and enter verification OTP code to authorize connection:</p>
          <div class="form-group" style="max-width: 280px; margin: 12px auto 0;">
            <input type="text" id="sim-otp-input" placeholder="e.g. 123456" maxlength="6" style="text-align: center; font-size: 1.2rem; letter-spacing: 4px; font-family: monospace;">
          </div>
        </div>
        <button class="btn btn-primary" onclick="executeStep3Verify()">Authorize Connection <i class="fa-solid fa-lock" style="margin-left: 5px;"></i></button>
      `;
      break;
      
    case 4:
      content += `
        <p>Simulating secure time window for patient data visibility:</p>
        <div class="countdown-timer" id="sim-timer-display">15:00</div>
        <p class="text-white-muted" style="color: #7d9696; font-size: 0.85rem;">Access automatically revokes upon countdown completion.</p>
        <button class="btn btn-primary" onclick="executeStep4Grant()">Grant Temporary Access <i class="fa-solid fa-clock" style="margin-left: 5px;"></i></button>
      `;
      break;
      
    case 5:
      content += `
        <i class="fa-solid fa-circle-check" style="font-size: 4rem; color: var(--success);"></i>
        <p>Commit data exchange and generate a secure receipt transaction block.</p>
        <button class="btn btn-primary" onclick="executeStep5Confirm()">Confirm & Log Transaction <i class="fa-solid fa-file-invoice" style="margin-left: 5px;"></i></button>
      `;
      break;
  }
  
  content += `</div>`;
  container.innerHTML = content;
}

// ----------------------------------------------------
// Simulator Step Operations
// ----------------------------------------------------
function executeStep1Scan() {
  const body = document.getElementById('sim-body-content');
  body.innerHTML = `
    <div class="qr-scanner-placeholder">
      <div class="scanner-laser" style="animation-duration: 0.8s;"></div>
      <i class="fa-solid fa-qrcode" style="font-size: 4rem; color: var(--primary);"></i>
    </div>
    <p>Card detected! Fetching layout parameters...</p>
    <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.5rem; color: var(--primary);"></i>
  `;
  
  setTimeout(() => {
    simulatorState.currentStep = 2;
    renderFlowchartSteps();
    renderInteractiveZone();
  }, 1500);
}

function toggleDocSelect(element, docName) {
  element.classList.toggle('selected');
  const icon = element.querySelector('i');
  
  if (element.classList.contains('selected')) {
    icon.className = 'fa-solid fa-circle-check';
    if (!simulatorState.selectedDocs.includes(docName)) {
      simulatorState.selectedDocs.push(docName);
    }
  } else {
    icon.className = 'fa-solid fa-check';
    simulatorState.selectedDocs = simulatorState.selectedDocs.filter(d => d !== docName);
  }
}

function executeStep2Request() {
  const body = document.getElementById('sim-body-content');
  body.innerHTML = `
    <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2.5rem; color: var(--primary);"></i>
    <p>Logging data access request for: <strong>${simulatorState.selectedDocs.join(', ')}</strong>...</p>
  `;
  
  setTimeout(() => {
    simulatorState.currentStep = 3;
    renderFlowchartSteps();
    renderInteractiveZone();
  }, 1200);
}

async function executeStep3Verify() {
  const code = document.getElementById('sim-otp-input').value.trim();
  if (!code || code.length < 6) {
    alert('Please enter verification OTP.');
    return;
  }
  
  const body = document.getElementById('sim-body-content');
  body.innerHTML = `
    <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2.5rem; color: var(--primary);"></i>
    <p>Authorizing connection via API node...</p>
  `;
  
  try {
    const response = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: authState.contact || '9876543210',
        otpCode: code
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      alert(data.detail || 'Authorization failed. Invalid OTP.');
      renderInteractiveZone();
      return;
    }
    
    simulatorState.currentStep = 4;
    renderFlowchartSteps();
    renderInteractiveZone();
    
  } catch (err) {
    alert('Network error validating OTP. Start FastAPI backend.');
    renderInteractiveZone();
  }
}

function executeStep4Grant() {
  const display = document.getElementById('sim-timer-display');
  const btn = document.querySelector('#sim-body-content button');
  
  if (btn) btn.style.display = 'none';
  let seconds = 900;
  
  clearInterval(simulatorState.timerInterval);
  simulatorState.timerInterval = setInterval(() => {
    seconds--;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (display) {
      display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    if (seconds <= 0) {
      clearInterval(simulatorState.timerInterval);
      alert('Secure session expired.');
      resetSimulator();
    }
  }, 1000);
  
  setTimeout(() => {
    simulatorState.currentStep = 5;
    renderFlowchartSteps();
    renderInteractiveZone();
  }, 2000);
}

async function executeStep5Confirm() {
  const body = document.getElementById('sim-body-content');
  body.innerHTML = `
    <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2.5rem; color: var(--primary);"></i>
    <p>Signing transaction receipts & saving encrypted audit block in-house...</p>
  `;
  
  const userId = authState.user ? authState.user.healthId : 'SR-GUEST-001';
  
  try {
    const response = await fetch('/api/confirm-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: simulatorState.currentRole,
        userId: userId,
        action: `Verified document access permissions for ${simulatorState.selectedDocs.join(', ')}`
      })
    });
    
    const data = await response.json();
    
    body.innerHTML = `
      <div class="receipt-box">
        <h5 style="color: var(--success); margin-bottom: 12px;"><i class="fa-solid fa-circle-check"></i> Transaction Confirmed</h5>
        <div class="receipt-row">
          <span>TXID:</span>
          <strong>${data.transactionId}</strong>
        </div>
        <div class="receipt-row">
          <span>Profile:</span>
          <strong>${data.role}</strong>
        </div>
        <div class="receipt-row">
          <span>Health ID:</span>
          <strong>${data.userId}</strong>
        </div>
        <div class="receipt-row">
          <span>Audit Log:</span>
          <strong style="text-align: right; font-size: 0.75rem;">HIPAA Encrypted Block</strong>
        </div>
      </div>
      <p>Flowchart sequence completed successfully!</p>
      <button class="btn btn-outline" onclick="resetSimulator()">Restart Sandbox Flow</button>
    `;
    
  } catch (err) {
    body.innerHTML = `
      <p style="color: var(--danger);">Failed to log transaction receipt via backend API.</p>
      <button class="btn btn-outline" onclick="resetSimulator()">Restart Sandbox Flow</button>
    `;
  }
}

function resetSimulator() {
  clearInterval(simulatorState.timerInterval);
  simulatorState.currentStep = 1;
  renderFlowchartSteps();
  renderInteractiveZone();
}

function checkExistingSession() {
  const sessionUser = sessionStorage.getItem('sehatrecover_user');
  if (sessionUser) {
    try {
      const user = JSON.parse(sessionUser);
      authState.user = user;
      updatePersonalizedUI(user);
      if (user.abhaLinked && user.abhaProfile) {
        updateAbhaLinkedUI(user.abhaProfile);
      }
    } catch (e) {
      console.error('Failed to parse user session:', e);
    }
  }
}

function updateAbhaLinkedUI(profile) {
  // Update Linkage UI panel
  const unlinkedBox = document.getElementById('abha-state-unlinked');
  if (unlinkedBox) unlinkedBox.classList.add('hidden');
  const linkedState = document.getElementById('abha-state-linked');
  if (linkedState) linkedState.classList.remove('hidden');
  
  const displayNum = document.getElementById('abha-display-num');
  if (displayNum) displayNum.innerText = profile.abhaNumber;
  const displayAddr = document.getElementById('abha-display-addr');
  if (displayAddr) displayAddr.innerText = profile.abhaAddress;
  const displayScheme = document.getElementById('abha-display-scheme');
  if (displayScheme) displayScheme.innerText = profile.linkedScheme;
  const displayBal = document.getElementById('abha-display-bal');
  if (displayBal) displayBal.innerText = profile.insuranceBalance;
  
  // Dynamic Updates to Front of Universal Health Card
  const abhaBadge = document.getElementById('card-abha-badge');
  if (abhaBadge) {
    abhaBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${profile.badgeText}`;
    abhaBadge.classList.remove('hidden');
  }
  
  const cardTypeMain = document.getElementById('card-type-main');
  if (cardTypeMain) cardTypeMain.innerText = 'Universal Health Card (ABHA Integrated)';
  
  // Swap columns with ABHA credentials
  const col1 = document.getElementById('card-dynamic-col-1');
  if (col1) {
    col1.innerHTML = `
      <span>ABHA Address</span>
      <strong>${profile.abhaAddress}</strong>
    `;
  }
  
  const col2 = document.getElementById('card-dynamic-col-2');
  if (col2) {
    col2.innerHTML = `
      <span>ABHA ID Number</span>
      <strong>${profile.abhaNumber}</strong>
    `;
  }
  
  // Update Scheme and Balance fields on card
  const schemeCol = document.getElementById('card-scheme-col');
  if (schemeCol) schemeCol.classList.remove('hidden');
  const balanceCol = document.getElementById('card-balance-col');
  if (balanceCol) balanceCol.classList.remove('hidden');
  
  const schemeName = document.getElementById('card-scheme-name');
  if (schemeName) schemeName.innerText = profile.linkedScheme;
  const insuranceBalance = document.getElementById('card-insurance-balance');
  if (insuranceBalance) insuranceBalance.innerText = profile.insuranceBalance;

  // Reset and apply state-specific card theme classes
  const cardEl = document.querySelector('.flip-card');
  if (cardEl && profile.linkedScheme) {
    cardEl.classList.forEach(className => {
      if (className.startsWith('scheme-')) {
        cardEl.classList.remove(className);
      }
    });
    // Match state scheme keys
    const schemes = ['mjpjay', 'aarogyasri', 'cmchis', 'chiranjeevi', 'bsky'];
    for (const key of schemes) {
      if (profile.linkedScheme.toLowerCase().includes(key)) {
        cardEl.classList.add(`scheme-${key}`);
        break;
      }
    }
  }
}
