import urllib.request
import json

def test_endpoint(url, data=None):
    try:
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"} if data else {})
        res = urllib.request.urlopen(req)
        return json.loads(res.read().decode("utf-8")), res.status
    except Exception as e:
        return str(e), 500

print("1. Fetching blockchain blocks...")
res, status = test_endpoint("http://127.0.0.1:8000/api/blockchain/blocks")
print(f"Status: {status}, Result: {res}")

print("\n2. Logging blockchain transaction...")
log_data = json.dumps({"actionType": "TEST_ACTION", "details": {"info": "test"}}).encode("utf-8")
res, status = test_endpoint("http://127.0.0.1:8000/api/blockchain/log", data=log_data)
print(f"Status: {status}, Result: {res}")

print("\n3. Fetching wholesale orders...")
res, status = test_endpoint("http://127.0.0.1:8000/api/wholesale/orders")
print(f"Status: {status}, Result: {res}")
