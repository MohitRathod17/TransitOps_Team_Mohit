import json
import urllib.request
import urllib.error
import sys
import os

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(path, method="GET", data=None, token=None, files=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req_data = None
    if files:
        # Multipart form data encoding for file upload in pure python
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        
        parts = []
        for key, val in data.items():
            parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{val}\r\n".encode("utf-8"))
            
        for key, file_info in files.items():
            filename, content_type, file_data = file_info
            parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n".encode("utf-8"))
            parts.append(file_data)
            parts.append(b"\r\n")
            
        parts.append(f"--{boundary}--\r\n".encode("utf-8"))
        req_data = b"".join(parts)
    elif data:
        headers["Content-Type"] = "application/json"
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            if res_data:
                return json.loads(res_data)
            return {}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(error_body)
            detail = err_json.get("detail", error_body)
        except:
            detail = error_body
        raise Exception(f"HTTP {e.code}: {detail}")

def run_tests():
    print("==================================================")
    print("STARTING DOCUMENT UPLOAD & AUDIT VERIFICATION TEST")
    print("==================================================")

    # 1. Create a Safety Officer user
    print("\n1. Registering Safety Officer...")
    officer_payload = {
        "email": "safety@transitops.com",
        "password": "safepassword456",
        "full_name": "Chief Safety Inspector",
        "role_name": "Safety Officer"
    }
    try:
        make_request("/auth/register", "POST", officer_payload)
        print("[OK] Registered Safety Officer.")
    except Exception as e:
        if "already registered" in str(e):
            print("[OK] Safety Officer already registered. Proceeding...")
        else:
            print(f"[FAIL] Registration failed: {e}")
            sys.exit(1)

    # 2. Login Safety Officer
    print("\n2. Logging in Safety Officer...")
    login_url = f"{BASE_URL}/auth/login"
    login_data = urllib.parse.urlencode({
        "username": "safety@transitops.com",
        "password": "safepassword456"
    }).encode("utf-8")
    req = urllib.request.Request(
        login_url,
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            officer_token = res["access_token"]
            print("[OK] Safety Officer logged in.")
    except Exception as e:
        print(f"[FAIL] Login failed: {e}")
        sys.exit(1)

    # 3. Register & Login Fleet Manager (to get token to upload/read)
    print("\n3. Registering Fleet Manager...")
    manager_payload = {
        "email": "manager@transitops.com",
        "password": "securepassword123",
        "full_name": "Fleet Director",
        "role_name": "Fleet Manager"
    }
    try:
        make_request("/auth/register", "POST", manager_payload)
        print("[OK] Registered Fleet Manager.")
    except Exception as e:
        if "already registered" in str(e):
            print("[OK] Fleet Manager already registered. Proceeding...")
        else:
            print(f"[FAIL] Registration failed: {e}")
            sys.exit(1)

    print("\n3b. Logging in Fleet Manager...")
    login_data_mgr = urllib.parse.urlencode({
        "username": "manager@transitops.com",
        "password": "securepassword123"
    }).encode("utf-8")
    req_mgr = urllib.request.Request(
        login_url,
        data=login_data_mgr,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req_mgr) as response:
            res = json.loads(response.read().decode("utf-8"))
            manager_token = res["access_token"]
            print("[OK] Fleet Manager logged in.")
    except Exception as e:
        print(f"[FAIL] Login failed: {e}")
        sys.exit(1)

    # Onboard driver Alex Smith
    print("\n3c. Onboarding driver Alex Smith...")
    driver_payload = {
        "name": "Alex Smith",
        "license_number": "DL-9834571",
        "license_category": "Class C",
        "license_expiry_date": "2030-12-31",
        "contact_number": "+1 555-0199"
    }
    try:
        make_request("/drivers/", "POST", driver_payload, token=manager_token)
        print("[OK] Onboarded driver Alex Smith.")
    except Exception as e:
        if "already exists" in str(e):
            print("[OK] Driver Alex Smith already exists. Proceeding...")
        else:
            print(f"[FAIL] Driver onboarding failed: {e}")
            sys.exit(1)

    # Fetch existing driver ID (Alex Smith should be ID 1)
    all_d = make_request("/drivers/", "GET", token=manager_token)
    if not all_d:
        print("[FAIL] No drivers registered to run tests.")
        sys.exit(1)
    driver_id = all_d[0]["id"]
    print(f"[OK] Found target driver {all_d[0]['name']} (ID: {driver_id})")

    # 4. Upload a mock document for the driver
    print("\n4. Uploading driving license document...")
    mock_file_content = b"This is a simulated driving license image bytes."
    files = {
        "file": ("license.jpg", "image/jpeg", mock_file_content)
    }
    form_data = {
        "document_type": "license"
    }
    
    doc = None
    try:
        doc = make_request(f"/documents/drivers/{driver_id}/upload", "POST", form_data, manager_token, files)
        print(f"[OK] Document uploaded successfully. Path: {doc['file_path']}, Status: {doc['verified_status']}")
        if doc["verified_status"] != "Pending":
            print("[FAIL] Initial verification status should be 'Pending'!")
            sys.exit(1)
    except Exception as e:
        print(f"[FAIL] Document upload failed: {e}")
        sys.exit(1)

    # 5. Fetch Safety Officer pending list & verify it shows up
    print("\n5. Checking Safety Officer pending audit queue...")
    try:
        pending = make_request("/documents/pending", "GET", token=officer_token)
        driver_pending_list = pending["driver_documents"]
        target_pending = [d for d in driver_pending_list if d["id"] == doc["id"]]
        
        if not target_pending:
            print("[FAIL] Uploaded document not found in Safety Officer's pending queue!")
            sys.exit(1)
        print(f"[OK] Document successfully retrieved in safety audit queue. Driver: {target_pending[0]['driver_name']}")
    except Exception as e:
        print(f"[FAIL] Pending queue retrieve failed: {e}")
        sys.exit(1)

    # 6. Verify/Approve the document as Safety Officer
    print(f"\n6. Approving driver document #{doc['id']}...")
    try:
        audited_doc = make_request(f"/documents/driver/{doc['id']}/verify?status=Verified", "POST", token=officer_token)
        print(f"[OK] Document verified. Updated status: {audited_doc['verified_status']}")
        if audited_doc["verified_status"] != "Verified":
            print("[FAIL] Audit status did not change to 'Verified'!")
            sys.exit(1)
    except Exception as e:
        print(f"[FAIL] Document approval failed: {e}")
        sys.exit(1)

    # 7. Check driver profile to confirm list contains the verified document
    print("\n7. Verifying document updates in Driver registry profile...")
    try:
        driver_profile = make_request(f"/drivers/{driver_id}", "GET", token=manager_token)
        doc_in_profile = [d for d in driver_profile["documents"] if d["id"] == doc["id"]][0]
        print(f"[OK] Verified status reflected in Driver profile: {doc_in_profile['verified_status']}")
        if doc_in_profile["verified_status"] != "Verified":
            print("[FAIL] Status was not updated in profile!")
            sys.exit(1)
    except Exception as e:
        print(f"[FAIL] Profile verify check failed: {e}")
        sys.exit(1)

    print("\n==================================================")
    print("ALL COMPLIANCE UPLOAD & AUDIT TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
