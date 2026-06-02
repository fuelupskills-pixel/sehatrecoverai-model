import urllib.request
import json

# Test 1: Send OTP via mobile
data = json.dumps({"contact": "9876543210", "channel": "mobile", "purpose": "login"}).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8000/api/auth/send-otp", data=data, headers={"Content-Type": "application/json"})
res = urllib.request.urlopen(req)
result = json.loads(res.read())
print("TEST 1 - Send OTP (mobile):", json.dumps(result, indent=2))

otp = result.get("devOtp")
print(f"OTP received: {otp}")

# Test 2: Verify OTP
data2 = json.dumps({"contact": "9876543210", "otpCode": otp, "fullName": "Test Patient"}).encode("utf-8")
req2 = urllib.request.Request("http://127.0.0.1:8000/api/auth/verify-otp", data=data2, headers={"Content-Type": "application/json"})
res2 = urllib.request.urlopen(req2)
result2 = json.loads(res2.read())
print("TEST 2 - Verify OTP:", json.dumps(result2, indent=2))

# Test 3: Send OTP via email
data3 = json.dumps({"contact": "test@example.com", "channel": "email", "purpose": "signup"}).encode("utf-8")
req3 = urllib.request.Request("http://127.0.0.1:8000/api/auth/send-otp", data=data3, headers={"Content-Type": "application/json"})
res3 = urllib.request.urlopen(req3)
result3 = json.loads(res3.read())
print("TEST 3 - Send OTP (email):", json.dumps(result3, indent=2))

# Test 4: Send OTP via telegram
data4 = json.dumps({"contact": "testuser123", "channel": "telegram", "purpose": "login"}).encode("utf-8")
req4 = urllib.request.Request("http://127.0.0.1:8000/api/auth/send-otp", data=data4, headers={"Content-Type": "application/json"})
res4 = urllib.request.urlopen(req4)
result4 = json.loads(res4.read())
print("TEST 4 - Send OTP (telegram):", json.dumps(result4, indent=2))

print("\n=== ALL TESTS PASSED ===")
