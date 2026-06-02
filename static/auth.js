// ----------------------------------------------------
// SehatRecover Auth Module JS - Passwordless Auth Portal
// ----------------------------------------------------

let authState = {
  tab: 'login',      // 'login' or 'signup'
  channel: 'mobile',  // 'mobile' or 'email'
  contact: '',
  fullName: ''
};

document.addEventListener('DOMContentLoaded', () => {
  // Read path to pre-select correct tab
  const path = window.location.pathname.toLowerCase();
  if (path.includes('signup')) {
    switchAuthTab('signup');
  } else {
    switchAuthTab('login');
  }
  
  // Enter key press triggers
  document.getElementById('auth-mobile')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendVerificationCode();
  });
  document.getElementById('auth-email')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendVerificationCode();
  });
  document.getElementById('auth-name')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendVerificationCode();
  });
  document.getElementById('auth-otp-code')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifyVerificationCode();
  });
});

// Switches between Log In and Sign Up states
function switchAuthTab(tab) {
  authState.tab = tab;
  
  const btnLogin = document.getElementById('btn-tab-login');
  const btnSignup = document.getElementById('btn-tab-signup');
  const fieldName = document.getElementById('field-signup-name');
  const btnSend = document.getElementById('btn-send-code');
  const errorAlert = document.getElementById('entry-error-alert');
  
  errorAlert.classList.add('hidden');

  if (tab === 'login') {
    btnLogin.classList.add('active');
    btnSignup.classList.remove('active');
    fieldName.classList.add('hidden');
    btnSend.querySelector('span').innerText = 'Send Login Verification Code';
  } else {
    btnLogin.classList.remove('active');
    btnSignup.classList.add('active');
    fieldName.classList.remove('hidden');
    btnSend.querySelector('span').innerText = 'Send Signup Verification Code';
  }
}

// Switches between Mobile, Email, and Telegram channels
function switchChannel(channel) {
  authState.channel = channel;
  
  document.getElementById('ch-mobile').classList.remove('active');
  document.getElementById('ch-email').classList.remove('active');
  document.getElementById('ch-telegram').classList.remove('active');
  
  document.getElementById('mobile-field').classList.add('hidden');
  document.getElementById('email-field').classList.add('hidden');
  document.getElementById('telegram-field').classList.add('hidden');
  
  document.getElementById('ch-' + channel).classList.add('active');
  document.getElementById(channel + '-field').classList.remove('hidden');
  
  document.getElementById('entry-error').classList.add('hidden');
}

// Sends authentication OTP request
async function sendVerificationCode() {
  const errorAlert = document.getElementById('entry-error-alert');
  const btnSend = document.getElementById('btn-send-code');
  errorAlert.classList.add('hidden');

  // Input retrievals
  const nameInput = document.getElementById('auth-name').value.trim();
  const mobileInput = document.getElementById('auth-mobile').value.trim();
  const emailInput = document.getElementById('auth-email').value.trim();
  const telegramInput = document.getElementById('auth-telegram').value.trim();

  // Validate inputs
  if (authState.tab === 'signup' && !nameInput) {
    showAuthError(errorAlert, 'Please enter your Full Name.');
    return;
  }

  let contact = '';
  if (authState.channel === 'mobile') {
    if (!mobileInput) {
      showAuthError(errorAlert, 'Please enter your Mobile Number.');
      return;
    }
    if (!/^\d{10}$/.test(mobileInput)) {
      showAuthError(errorAlert, 'Please enter a valid 10-digit Mobile Number.');
      return;
    }
    contact = mobileInput;
  } else if (authState.channel === 'email') {
    if (!emailInput) {
      showAuthError(errorAlert, 'Please enter your Email Address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      showAuthError(errorAlert, 'Please enter a valid Email Address.');
      return;
    }
    contact = emailInput;
  } else if (authState.channel === 'telegram') {
    if (!telegramInput) {
      showAuthError(errorAlert, 'Please enter your Telegram Username.');
      return;
    }
    contact = telegramInput;
  }

  authState.contact = contact;
  authState.fullName = nameInput;

  // Set button state
  btnSend.disabled = true;
  btnSend.querySelector('span').innerText = 'Sending Code...';
  btnSend.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';

  try {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact: contact,
        channel: authState.channel,
        purpose: authState.tab
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showAuthError(errorAlert, data.detail || 'Could not send verification OTP.');
      resetSendButton();
      return;
    }

    // Success transition
    document.getElementById('auth-step-entry').classList.add('hidden');
    document.getElementById('auth-step-otp').classList.remove('hidden');
    document.getElementById('otp-target-display').innerText = contact;
    
    // Clear and focus OTP input
    const otpInput = document.getElementById('auth-otp-code');
    otpInput.value = '';
    setTimeout(() => otpInput.focus(), 100);

  } catch (err) {
    showAuthError(errorAlert, 'Network connection error. Ensure the FastAPI backend is running.');
    resetSendButton();
  }
}

// Verifies the code entered by the user
async function verifyVerificationCode() {
  const errorAlert = document.getElementById('otp-error-alert');
  const btnVerify = document.getElementById('btn-verify-otp');
  errorAlert.classList.add('hidden');

  const otpCode = document.getElementById('auth-otp-code').value.trim();

  if (!otpCode || otpCode.length < 6) {
    showAuthError(errorAlert, 'Please enter a 6-digit OTP code.');
    return;
  }

  btnVerify.disabled = true;
  btnVerify.querySelector('span').innerText = 'Authenticating...';
  btnVerify.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';

  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact: authState.contact,
        otpCode: otpCode,
        fullName: authState.fullName || 'Valued Patient'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showAuthError(errorAlert, data.detail || 'Incorrect OTP code. Please try again.');
      resetVerifyButton();
      return;
    }

    // Success, save session!
    sessionStorage.setItem('sehatrecover_user', JSON.stringify(data.user));

    // Show success step
    document.getElementById('auth-step-otp').classList.add('hidden');
    document.getElementById('auth-step-success').classList.remove('hidden');
    document.getElementById('display-health-id').innerText = data.user.healthId;
    document.getElementById('display-account-name').innerText = data.user.fullName;

    // Timeout redirection to dashboard
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);

  } catch (err) {
    showAuthError(errorAlert, 'Network connection error. Ensure the FastAPI backend is running.');
    resetVerifyButton();
  }
}

// Resets buttons to their active states
function resetSendButton() {
  const btnSend = document.getElementById('btn-send-code');
  btnSend.disabled = false;
  if (authState.tab === 'login') {
    btnSend.querySelector('span').innerText = 'Send Login Verification Code';
  } else {
    btnSend.querySelector('span').innerText = 'Send Signup Verification Code';
  }
  btnSend.querySelector('i').className = 'fa-solid fa-chevron-right icon-arrow';
}

function resetVerifyButton() {
  const btnVerify = document.getElementById('btn-verify-otp');
  btnVerify.disabled = false;
  btnVerify.querySelector('span').innerText = 'Verify & Authenticate';
  btnVerify.querySelector('i').className = 'fa-solid fa-circle-check icon-check';
}

// Transitions back to details entry screen
function backToEntryStep() {
  document.getElementById('auth-step-otp').classList.add('hidden');
  document.getElementById('auth-step-entry').classList.remove('hidden');
  resetSendButton();
}

// Display error banner utilities
function showAuthError(element, message) {
  element.innerText = message;
  element.classList.remove('hidden');
}
