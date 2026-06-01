import re

def main():
    file_path = "static/dashboard.js"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Reroute "Order Now" in loadPatientPrescriptionsFeed
    content = content.replace(
        'orderButton = `<button onclick="openPharmacyCheckout(\'${rx.id}\', \'${rx.medications}\')" class="btn-dispense" style="padding: 6px 14px;">Order Now</button>`;',
        'orderButton = `<button onclick="addPrescriptionToCart(\'${rx.id}\', \'${rx.medications}\')" class="btn-dispense" style="padding: 6px 14px;">Order Now</button>`;'
    )

    # 2. Reroute "Order Now" in overview feed if written differently
    content = content.replace(
        'openPharmacyCheckout(',
        'addPrescriptionToCart('
    )

    # Note: Since we replaced all 'openPharmacyCheckout(' with 'addPrescriptionToCart(',
    # let's verify if the function definition 'function openPharmacyCheckout' was changed to 'function addPrescriptionToCart'.
    # Yes, 'function openPharmacyCheckout' would have become 'function addPrescriptionToCart'.
    # Let's revert that specific function definition name so it is clean.
    content = content.replace(
        'function addPrescriptionToCart(rxId, meds) {\n  activeCheckout.prescriptionId = rxId;',
        'function openPharmacyCheckout(rxId, meds) {\n  activeCheckout.prescriptionId = rxId;'
    )

    # Actually, let's just do a clean replacement of the whole legacy block using a regex or simple string replacement.
    # Let's find the legacy block. It starts with "function openPharmacyCheckout" (or "function addPrescriptionToCart" due to our previous replacement)
    # and ends before "async function loadPatientClaimsLedger()".
    # Let's reload the file fresh to do it cleanly.

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Reroute the call in loadPatientPrescriptionsFeed
    content = content.replace(
        'onclick="openPharmacyCheckout(\'${rx.id}\', \'${rx.medications}\')"',
        'onclick="addPrescriptionToCart(\'${rx.id}\', \'${rx.medications}\')"'
    )

    # Locate start of openPharmacyCheckout
    start_idx = content.find("function openPharmacyCheckout(rxId, meds)")
    end_idx = content.find("async function loadPatientClaimsLedger()")

    if start_idx != -1 and end_idx != -1:
        legacy_block = content[start_idx:end_idx]
        new_block = """function openPharmacyCheckout(rxId, meds) {
  addPrescriptionToCart(rxId, meds);
}

"""
        content = content[:start_idx] + new_block + content[end_idx:]
        print("Legacy checkout block cleaned successfully!")
    else:
        print(f"Error: start_idx={start_idx}, end_idx={end_idx}")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Cleanup completed!")

if __name__ == "__main__":
    main()
