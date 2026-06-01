import re

def main():
    file_path = "static/dashboard.js"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. State Variables Injection
    state_vars = """
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
"""
    content = content.replace("let currentUser = {", state_vars + "let currentUser = {")

    # 2. ROLE_SIDEBAR_MENUS replacement
    old_menus = """const ROLE_SIDEBAR_MENUS = {
  Patient: [
    { id: 'overview', name: 'Overview Home', icon: 'fa-house' },
    { id: 'vault', name: 'Records Vault', icon: 'fa-folder-open' },"""
    new_menus = """const ROLE_SIDEBAR_MENUS = {
  Patient: [
    { id: 'overview', name: 'Overview Home', icon: 'fa-house' },
    { id: 'vault', name: 'Records Vault', icon: 'fa-folder-open' },
    { id: 'pharmacy', name: 'Online Pharmacy', icon: 'fa-prescription-bottle-medical' },
    { id: 'fitness', name: 'Fitness Hub', icon: 'fa-heart-pulse' },"""
    content = content.replace(old_menus, new_menus)

    # 3. switchPatientSubPanel cases
    old_switch = """  } else if (panelId === 'loans') {
    loadPatientLoansLedger();
    loadLoanCollateralOptions();
  } else if (panelId === 'bookings') {"""
    new_switch = """  } else if (panelId === 'loans') {
    loadPatientLoansLedger();
    loadLoanCollateralOptions();
  } else if (panelId === 'pharmacy') {
    loadPharmacyShop();
  } else if (panelId === 'fitness') {
    loadFitnessHub();
  } else if (panelId === 'bookings') {"""
    content = content.replace(old_switch, new_switch)

    # 4. loadPatientDocuments and uploadPatientDocument replacement
    # We will locate the code of these functions and swap them out
    old_doc_funcs_pattern = r"async function loadPatientDocuments\(\)\s*\{.*?\}\s*async function uploadPatientDocument\(e\)\s*\{.*?\}"
    
    # Let's see if we can do re.DOTALL replace
    new_doc_funcs = """let currentVaultFolder = null;

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
}"""
    
    # We will search and replace using re.sub with re.DOTALL
    content, count = re.subn(old_doc_funcs_pattern, new_doc_funcs, content, flags=re.DOTALL)
    print(f"Substituted document functions: {count}")

    # 5. simulateFitnessWalk replacement to update both overview and fitness hub elements
    old_sim_walk = """  document.getElementById('fitness-steps').innerText = fitnessState.steps.toLocaleString();
  document.getElementById('fitness-walk').innerHTML = `${fitnessState.walkKm.toFixed(1)} <small>km</small>`;
  document.getElementById('fitness-run').innerHTML = `${fitnessState.runKm.toFixed(1)} <small>km</small>`;
  document.getElementById('fitness-calories').innerHTML = `${fitnessState.calories} <small>kcal</small>`;
  
  updateFitnessProgressRing();"""

    new_sim_walk = """  document.getElementById('fitness-steps').innerText = fitnessState.steps.toLocaleString();
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
  
  updateFitnessProgressRing();"""
    content = content.replace(old_sim_walk, new_sim_walk)

    # 6. updateFitnessProgressRing replacement
    old_progress_ring = """function updateFitnessProgressRing() {
  const bar = document.getElementById('fitness-progress-bar');
  if (!bar) return;
  
  const percentage = Math.min(100, Math.floor((fitnessState.steps / 10000) * 100));
  bar.style.background = `conic-gradient(var(--primary) ${percentage}%, rgba(255, 255, 255, 0.05) ${percentage}%)`;
}"""

    new_progress_ring = """function updateFitnessProgressRing() {
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
}"""
    content = content.replace(old_progress_ring, new_progress_ring)

    # 7. submitCareBooking intercept
    old_booking = """async function submitCareBooking(e) {
  e.preventDefault();
  const bkgType = document.getElementById('bkg-type').value;
  const provider = document.getElementById('bkg-provider').value;
  const dateVal = document.getElementById('bkg-date').value;
  const timeVal = document.getElementById('bkg-time').value;
  const details = document.getElementById('bkg-details').value.trim();

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
}"""

    new_booking = """async function submitCareBooking(e) {
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
}"""
    content = content.replace(old_booking, new_booking)

    # 8. applySurgeryLoan & applyEmergencyLoan replacement
    old_surgery_loan = """function applySurgeryLoan() {
  const amount = document.getElementById('calc-loan-amount').value;
  const tenure = document.getElementById('calc-loan-tenure').value;
  
  if (!amount || amount <= 0) {
    alert("Please enter a valid surgery loan cost amount.");
    return;
  }
  
  const monthly = Math.floor(amount / tenure);
  alert(`Surgery Loan Approved!\\nAmount: Rs.${amount}\\nTenure: ${tenure} Months\\nZero Interest Monthly EMI: Rs.${monthly}/month`);
  addAuditLogLine('success', `Medical loan checkout committed: Surgery EMI loan of Rs.${amount} approved over ${tenure} months.`);
  
  document.getElementById('calc-loan-amount').value = '';
}

function applyEmergencyLoan() {
  alert("Emergency Advance checkout confirmed!\\nImmediate cashless credit of Rs.50,000 synced with your card collateral.");
  addAuditLogLine('success', `Emergency advanceSOLUTION checked out: Rs.50,000 fund collateralized.`);
}"""

    new_surgery_loan = """async function applySurgeryLoan() {
  const amount = parseFloat(document.getElementById('calc-loan-amount').value);
  const tenure = parseInt(document.getElementById('calc-loan-tenure').value);
  
  if (!amount || amount <= 0) {
    alert("Please enter a valid surgery loan cost amount.");
    return;
  }
  
  try {
    const response = await fetch('/api/dashboard/loans/one-click-apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.healthId,
        loanAmount: amount,
        tenureMonths: tenure,
        loanType: 'Surgery EMI'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      alert(`Surgery Loan Approved!\\nAmount: Rs.${amount}\\nTenure: ${tenure} Months\\nZero Interest Monthly EMI: Rs.${data.loan.monthlyEmi}/month`);
      addAuditLogLine('success', `Medical loan checkout committed: Surgery EMI loan of Rs.${amount} approved over ${tenure} months.`);
      document.getElementById('calc-loan-amount').value = '';
      loadPatientLoansLedger();
    }
  } catch (err) {
    console.error(err);
  }
}

async function applyEmergencyLoan() {
  try {
    const response = await fetch('/api/dashboard/loans/one-click-apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.healthId,
        loanAmount: 50000,
        tenureMonths: 12,
        loanType: 'Emergency Advance'
      })
    });
    
    if (response.ok) {
      alert("Emergency Advance checkout confirmed!\\nImmediate cashless credit of Rs.50,000 synced with your card collateral.");
      addAuditLogLine('success', `Emergency advance solution checked out: Rs.50,000 fund collateralized.`);
      loadPatientLoansLedger();
    }
  } catch (err) {
    console.error(err);
  }
}"""
    content = content.replace(old_surgery_loan, new_surgery_loan)

    # 9. showGoogleToastNotification and dismissGoogleToast replacement
    old_toast_pattern = r"function showGoogleToastNotification\(title = .*?, msg = .*?\)\s*\{.*?\}\s*function approveToastConsent\(\)"
    new_toast_func = """function showGoogleToastNotification(title = "NFC Scanner Authorization Alert", msg = "Doctor Dev Kumar is requesting view access for pathology files.") {
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

function approveToastConsent()"""
    
    content, count = re.subn(old_toast_pattern, new_toast_func, content, flags=re.DOTALL)
    print(f"Substituted showGoogleToastNotification: {count}")

    old_dismiss = """function dismissGoogleToast() {
  const toast = document.getElementById('google-alert-toast');
  if (toast) toast.classList.add('hidden');
}"""
    new_dismiss = """function dismissGoogleToast() {
  const toast = document.getElementById('google-alert-toast');
  if (toast) toast.classList.add('hidden');
  clearInterval(toastInterval);
}"""
    content = content.replace(old_dismiss, new_dismiss)

    # 10. Append new methods to the end of the file
    new_methods = """

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
"""
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content + new_methods)
    print("Patched dashboard.js successfully!")

if __name__ == "__main__":
    main()
