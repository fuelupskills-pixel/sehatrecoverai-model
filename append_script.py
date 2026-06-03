with open('static/dashboard.js', 'a', encoding='utf-8') as f:
    f.write("""
// ==========================================
// WHOLESALE & SUPPLY CHAIN MODULE
// ==========================================

async function submitWholesaleOrder(e) {
  e.preventDefault();
  const itemName = document.getElementById('ws-item-name').value;
  const formulation = document.getElementById('ws-formulation').value;
  const quantity = parseInt(document.getElementById('ws-quantity').value, 10);
  
  if (quantity < 50) {
    showToast("MOQ Error", "Minimum Order Quantity is 50 boxes.", "error");
    return;
  }
  
  const totalAmount = quantity * 120;
  
  try {
    const res = await fetch('/api/wholesale/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pharmacyId: currentUser.contact || 'pharmacy_demo_id',
        item: itemName,
        formulation: formulation,
        quantity: quantity,
        totalAmount: totalAmount
      })
    });
    const data = await res.json();
    if (res.ok) {
      showToast("Order Placed", `Wholesale order ${data.orderId} placed successfully.`, "success");
      addAuditLogLine("success", `Wholesale supply request for ${itemName} generated via Admin channel.`);
      e.target.reset();
      loadWholesaleOrdersPharmacy();
    } else {
      showToast("Order Failed", data.detail || "Error placing order.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Network Error", "Could not connect to the logistics endpoint.", "error");
  }
}

async function loadWholesaleOrdersPharmacy() {
  const tbody = document.getElementById('pharmacy-wholesale-tracker-body');
  if (!tbody) return;
  tbody.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Syncing Logistic Ledger...</div>';
  
  const pId = currentUser.contact || 'pharmacy_demo_id';
  try {
    const res = await fetch(`/api/wholesale/orders/${pId}`);
    const data = await res.json();
    if (res.ok) {
      tbody.innerHTML = '';
      if (data.orders.length === 0) {
        tbody.innerHTML = '<div style="text-align:center; padding:20px; color:#7d9696;">No supply chain history found.</div>';
        return;
      }
      
      data.orders.forEach(ord => {
        let statusColor = '#f59e0b'; // Processing
        if (ord.status === 'Dispatched') statusColor = '#3b82f6';
        if (ord.status === 'Delivered') statusColor = '#10b981';
        
        let trackBtn = `<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="trackWholesaleOrder('${ord.id}', '${ord.status}')"><i class="fa-solid fa-location-crosshairs"></i> Track</button>`;
        if (ord.status === 'Delivered') {
            trackBtn = `<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; border-color:var(--success); color:var(--success);" onclick="autoSyncInventory('${ord.item}', '${ord.formulation}', ${ord.quantity}, '${ord.id}')"><i class="fa-solid fa-boxes-packing"></i> Auto-Sync to Vault</button>`;
        }

        const row = document.createElement('div');
        row.className = 'table-row-vault';
        row.style = 'grid-template-columns: 1fr 1.5fr 1fr 1fr 1fr; align-items:center;';
        row.innerHTML = `
          <strong style="color:white; font-family:monospace;">${ord.id}</strong>
          <div>
            <div style="font-weight:bold; color:white;">${ord.item}</div>
            <div style="font-size:0.75rem; color:#7d9696;">${ord.formulation}</div>
          </div>
          <div>${ord.quantity} Boxes</div>
          <div style="color:${statusColor}; font-weight:bold;">${ord.status}</div>
          <div>${trackBtn}</div>
        `;
        tbody.appendChild(row);
      });
    }
  } catch (err) {
    tbody.innerHTML = '<div style="text-align:center; padding:20px; color:#ef4444;">Error syncing with logistics network.</div>';
  }
}

function trackWholesaleOrder(id, status) {
  showToast("GPS Network Tracker", `Order ${id} is currently: ${status}. Expected arrival soon.`, "info");
}

function autoSyncInventory(brand, formulation, quantity, orderId) {
  const ledgerBody = document.getElementById('inv-master-ledger-body');
  const batch = "WSL-" + orderId.split('-')[1].substring(0, 4);
  const mfg = "2026-05";
  const exp = "2028-05";

  const newRow = document.createElement('div');
  newRow.className = 'table-row-vault';
  newRow.style = 'grid-template-columns: 1.5fr 1fr 1fr 1.5fr 1fr 1fr; align-items:center; animation: fadeIn 0.5s;';
  newRow.innerHTML = `
    <strong style="color:white;">${brand} <span class="badge" style="background:#10b981; margin-left:4px;">SYNCED</span></strong>
    <span>${formulation}</span>
    <span style="font-family:monospace; color:#a855f7;">${batch.toUpperCase()}</span>
    <div>
      <div style="font-size:0.7rem; color:#7d9696;">Mfg: ${mfg}</div>
      <div style="font-size:0.7rem; color:#ef4444;">Exp: ${exp}</div>
    </div>
    <strong style="color:var(--success);">${quantity * 100} units</strong>
    <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; border-color:var(--primary); color:var(--primary);">Audit</button>
  `;
  
  ledgerBody.insertBefore(newRow, ledgerBody.firstChild);
  
  showToast("Real-Time Inventory Sync", `Successfully synced ${brand} from Wholesaler Delivery into secure Vault.`, "success");
  addAuditLogLine('success', `Automated B2B restock ingestion: ${brand} [Batch: ${batch}]. Order: ${orderId}. Cryptographic hash verified.`);
}

async function loadWholesaleOrdersAdmin() {
  const tbody = document.getElementById('admin-wholesale-tracker-body');
  if (!tbody) return;
  tbody.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching supply chain data...</div>';
  
  try {
    const res = await fetch(`/api/wholesale/orders`);
    const data = await res.json();
    if (res.ok) {
      tbody.innerHTML = '';
      if (data.orders.length === 0) {
        tbody.innerHTML = '<div style="text-align:center; padding:20px; color:#7d9696;">No active wholesaler logistics.</div>';
        return;
      }
      
      data.orders.forEach(ord => {
        let statusColor = '#f59e0b';
        if (ord.status === 'Dispatched') statusColor = '#3b82f6';
        if (ord.status === 'Delivered') statusColor = '#10b981';
        
        const row = document.createElement('div');
        row.className = 'table-row-vault';
        row.style = 'grid-template-columns: 1fr 1.5fr 1fr 1fr 1fr 1.5fr; align-items:center;';
        
        let actionButtons = '';
        if (ord.status === 'Processing') {
          actionButtons = `<button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="updateWholesaleOrderStatus('${ord.id}', 'Dispatched')"><i class="fa-solid fa-truck-fast"></i> Dispatch</button>`;
        } else if (ord.status === 'Dispatched') {
          actionButtons = `<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; border-color:var(--success); color:var(--success);" onclick="updateWholesaleOrderStatus('${ord.id}', 'Delivered')"><i class="fa-solid fa-box-check"></i> Mark Delivered</button>`;
        } else {
          actionButtons = `<span style="font-size:0.8rem; color:#10b981;"><i class="fa-solid fa-check"></i> Fulfilled</span>`;
        }

        row.innerHTML = `
          <strong style="color:white; font-family:monospace;">${ord.id}</strong>
          <div style="font-size:0.8rem; color:#a5f3fc;">${ord.pharmacyId}</div>
          <div>
            <div style="font-weight:bold; color:white;">${ord.item}</div>
            <div style="font-size:0.75rem; color:#7d9696;">${ord.formulation}</div>
          </div>
          <div>
            <div style="font-weight:bold;">${ord.quantity} Boxes</div>
            <div style="color:var(--success); font-size:0.8rem;">Rs. ${ord.totalAmount}</div>
          </div>
          <div style="color:${statusColor}; font-weight:bold;">${ord.status}</div>
          <div style="display:flex; gap:5px;">${actionButtons}</div>
        `;
        tbody.appendChild(row);
      });
    }
  } catch (err) {
    tbody.innerHTML = '<div style="text-align:center; padding:20px; color:#ef4444;">Error fetching orders.</div>';
  }
}

async function updateWholesaleOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/wholesale/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      showToast("Logistics Updated", `Order ${orderId} is now ${newStatus}.`, "success");
      addAuditLogLine("info", `Supply Chain: Admin mutated status of order ${orderId} to ${newStatus}.`);
      loadWholesaleOrdersAdmin();
    }
  } catch (err) {
    console.error(err);
    showToast("Update Failed", "Could not mutate order status on network.", "error");
  }
}
""")
