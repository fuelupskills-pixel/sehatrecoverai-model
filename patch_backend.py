with open('backend/app.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
'''    # Log to Blockchain
    log_blockchain_txn("OTP_ISSUED", {"contact": contact, "purpose": request.purpose})

    return {''',
'''    # Log to Blockchain
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

    return {'''
)

with open('backend/app.py', 'w', encoding='utf-8') as f:
    f.write(content)
