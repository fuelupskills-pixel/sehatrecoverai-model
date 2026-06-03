const fs = require('fs');
const path = require('path');

// Mock DOM environment
global.window = {
  location: { search: '' },
  addEventListener: () => {},
  sessionStorage: {
    getItem: (key) => JSON.stringify({
      healthId: 'SR-9982-1045-88',
      fullName: 'Anna Smith',
      contact: '9876543210',
      abhaLinked: false,
      abhaProfile: null,
      rewardPoints: 240
    }),
    setItem: () => {}
  }
};
global.sessionStorage = global.window.sessionStorage;

const elements = {};
function getElement(id) {
  if (!elements[id]) {
    elements[id] = {
      id: id,
      classList: {
        add: (cls) => console.log(`[DOM] add class '${cls}' to #${id}`),
        remove: (cls) => console.log(`[DOM] remove class '${cls}' from #${id}`),
        contains: (cls) => false,
        toggle: (cls, state) => console.log(`[DOM] toggle class '${cls}' on #${id} to ${state}`)
      },
      style: {},
      addEventListener: (event, cb) => {
        console.log(`[DOM] add event listener '${event}' to #${id}`);
      },
      appendChild: (child) => {
        console.log(`[DOM] append child to #${id}`);
      },
      querySelectorAll: (sel) => [],
      querySelector: (sel) => null,
      removeChild: () => {},
      cloneNode: () => ({}),
      reset: () => {},
      innerText: '',
      innerHTML: ''
    };
  }
  return elements[id];
}

global.document = {
  addEventListener: (event, cb) => {
    console.log(`[DOM] document add event listener '${event}'`);
    if (event === 'DOMContentLoaded') {
      global.DOMContentLoadedHandler = cb;
    }
  },
  getElementById: getElement,
  querySelector: (sel) => {
    console.log(`[DOM] document.querySelector(${sel})`);
    return getElement(sel.replace(/[.#]/g, ''));
  },
  querySelectorAll: (sel) => {
    console.log(`[DOM] document.querySelectorAll(${sel})`);
    return [];
  },
  createElement: (tag) => {
    return {
      tagName: tag,
      style: {},
      classList: { add: () => {}, remove: () => {} },
      innerHTML: '',
      appendChild: () => {}
    };
  }
};

global.fetch = async (url, options) => {
  console.log(`[FETCH] ${url}`);
  return {
    ok: true,
    json: async () => {
      if (url.includes('/api/blockchain/blocks')) {
        return {
          status: 'success',
          chain: [
            {
              block_index: 0,
              timestamp: 1774915200.0,
              data: 'Genesis Block - SehatRecover HIPAA Compliant Cryptographic Ledger Init',
              previous_hash: '0',
              hash: 'f679336e810f0cebf888b48623b420aa285094e229cd3fbc0cf9e28b2dc26c97'
            }
          ]
        };
      }
      return {};
    }
  };
};

global.Chart = function() {
  return { destroy: () => {} };
};
global.Chart.defaults = { color: '', font: {} };

console.log("Loading dashboard.js...");
const code = fs.readFileSync(path.join(__dirname, '../static/dashboard.js'), 'utf8');
// Evaluate the code
eval(code);

console.log("\nTriggering DOMContentLoaded...");
if (global.DOMContentLoadedHandler) {
  global.DOMContentLoadedHandler();
}

console.log("\nSwitching to Admin role...");
if (typeof switchDashboardRole === 'function') {
  switchDashboardRole('Admin');
} else {
  console.log("switchDashboardRole is not defined!");
}
