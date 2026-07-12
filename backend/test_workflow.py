import json
import time
import urllib.request
import urllib.error
import urllib.parse
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(path, method="GET", data=None, token=None, files=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req_data = None
    if files:
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        parts = []
        if data:
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
    else:
        headers["Content-Type"] = "application/json"
        
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
    print("STARTING TRANSITOPS AUTOMATED WORKFLOW TEST")
    print("==================================================")

    # 1. Register a Fleet Manager user
    print("\n1. Registering Fleet Manager...")
    manager_payload = {
        "email": "manager@transitops.com",
        "password": "securepassword123",
        "full_name": "Fleet Director",
        "role_name": "Fleet Manager"
    }
    try:
        manager = make_request("/auth/register", "POST", manager_payload)
        print(f"[OK] Registered Fleet Manager: {manager['email']} (ID: {manager['id']})")
    except Exception as e:
        if "Email already registered" in str(e):
            print("[OK] Fleet Manager already registered. Proceeding...")
        else:
            print(f"[FAIL] Registration failed: {e}")
            sys.exit(1)

    # 2. Login Fleet Manager to get JWT Token
    print("\n2. Logging in Fleet Manager...")
    login_url = "http://127.0.0.1:8000/api/auth/login"
    login_data = urllib.parse.urlencode({
        "username": "manager@transitops.com",
        "password": "securepassword123"
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
            token = res["access_token"]
            print("[OK] Login successful, JWT token acquired.")
    except Exception as e:
        print(f"[FAIL] Login failed: {e}")
        sys.exit(1)

    # 3. Register a vehicle 'Van-05' (Max Capacity 500 kg)
    print("\n3. Registering vehicle 'Van-05'...")
    vehicle_payload = {
        "registration_number": "VAN-05",
        "model": "Ford Transit 2026",
        "type": "Van",
        "max_load_capacity": 500.00,
        "odometer": 10000.00,
        "acquisition_cost": 30000.00,
        "region": "East Coast"
    }
    vehicle = None
    try:
        vehicle = make_request("/vehicles/", "POST", vehicle_payload, token)
        print(f"[OK] Registered vehicle {vehicle['registration_number']} (ID: {vehicle['id']}, Max Load: {vehicle['max_load_capacity']} kg)")
    except Exception as e:
        if "already exists" in str(e):
            # Fetch existing vehicle
            all_v = make_request("/vehicles/", "GET", token=token)
            vehicle = [v for v in all_v if v["registration_number"] == "VAN-05"][0]
            print(f"[OK] Vehicle VAN-05 already exists (ID: {vehicle['id']})")
        else:
            print(f"[FAIL] Vehicle registration failed: {e}")
            sys.exit(1)

    # 4. Register driver 'Alex'
    print("\n4. Onboarding driver 'Alex'...")
    driver_payload = {
        "name": "Alex Smith",
        "license_number": "DL-9834571",
        "license_category": "Class C",
        "license_expiry_date": "2030-12-31",
        "contact_number": "+1 555-0199"
    }
    driver = None
    try:
        driver = make_request("/drivers/", "POST", driver_payload, token)
        print(f"[OK] Onboarded driver {driver['name']} (ID: {driver['id']}, Status: {driver['status']})")
    except Exception as e:
        if "already exists" in str(e):
            all_d = make_request("/drivers/", "GET", token=token)
            driver = [d for d in all_d if d["license_number"] == "DL-9834571"][0]
            print(f"[OK] Driver Alex already exists (ID: {driver['id']})")
        else:
            print(f"[FAIL] Driver onboarding failed: {e}")
            sys.exit(1)

    # 4b. Perform compliance uploads and safety verification
    print("\n4b. Performing compliance document verification for Alex & Van-05...")
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
            print(f"[FAIL] Safety Officer registration failed: {e}")
            sys.exit(1)

    login_url = f"http://127.0.0.1:8000/api/auth/login"
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
        print(f"[FAIL] Safety Officer login failed: {e}")
        sys.exit(1)

    mock_file_content = b"Mock compliance document content"
    
    # Driver driving license
    files_drv = {"file": ("license.jpg", "image/jpeg", mock_file_content)}
    doc_drv = make_request(f"/documents/drivers/{driver['id']}/upload", "POST", {"document_type": "license"}, token, files_drv)
    make_request(f"/documents/driver/{doc_drv['id']}/verify?status=Verified", "POST", token=officer_token)
    
    # Vehicle registration
    files_reg = {"file": ("registration.jpg", "image/jpeg", mock_file_content)}
    doc_reg = make_request(f"/documents/vehicles/{vehicle['id']}/upload", "POST", {"document_type": "registration"}, token, files_reg)
    make_request(f"/documents/vehicle/{doc_reg['id']}/verify?status=Verified", "POST", token=officer_token)
    
    # Vehicle insurance
    files_ins = {"file": ("insurance.jpg", "image/jpeg", mock_file_content)}
    doc_ins = make_request(f"/documents/vehicles/{vehicle['id']}/upload", "POST", {"document_type": "insurance"}, token, files_ins)
    make_request(f"/documents/vehicle/{doc_ins['id']}/verify?status=Verified", "POST", token=officer_token)
    print("[OK] Compliance documents successfully uploaded and verified.")

    # 5. Check business rule: Cargo Weight exceeds load limit (600 kg > 500 kg)
    print("\n5. Verification: Attempting to create overweight trip (600 kg)...")
    overweight_payload = {
        "source": "Warehouse A",
        "destination": "Retail Outlet B",
        "vehicle_id": vehicle["id"],
        "driver_id": driver["id"],
        "cargo_weight": 600.00,
        "planned_distance": 150.00
    }
    try:
        make_request("/trips/", "POST", overweight_payload, token)
        print("[FAIL] FAILED: System allowed an overweight trip creation! Business rule violated.")
        sys.exit(1)
    except Exception as e:
        print(f"[OK] SUCCESS: Overweight trip was blocked. Error message: {e}")

    # 6. Create valid trip (450 kg <= 500 kg)
    print("\n6. Creating valid trip (450 kg)...")
    valid_payload = {
        "source": "Warehouse A",
        "destination": "Retail Outlet B",
        "vehicle_id": vehicle["id"],
        "driver_id": driver["id"],
        "cargo_weight": 450.00,
        "planned_distance": 150.00
    }
    trip = None
    try:
        trip = make_request("/trips/", "POST", valid_payload, token)
        print(f"[OK] Created trip #{trip['id']} in status: {trip['status']}")
    except Exception as e:
        print(f"[FAIL] Trip creation failed: {e}")
        sys.exit(1)

    # 7. Dispatch the trip (Transitions statuses to 'On Trip')
    print(f"\n7. Dispatching trip #{trip['id']}...")
    try:
        dispatched_trip = make_request(f"/trips/{trip['id']}/dispatch", "POST", token=token)
        print(f"[OK] Trip status is now: {dispatched_trip['status']}")
        
        # Verify vehicle/driver statuses in DB
        v_check = make_request(f"/vehicles/{vehicle['id']}", "GET", token=token)
        d_check = make_request(f"/drivers/{driver['id']}", "GET", token=token)
        print(f"  - Vehicle status: {v_check['status']} (Expected: On Trip)")
        print(f"  - Driver status: {d_check['status']} (Expected: On Trip)")
        
        if v_check["status"] != "On Trip" or d_check["status"] != "On Trip":
            print("[FAIL] FAILED: Auto-state transition on dispatch did not run correctly!")
            sys.exit(1)
        else:
            print("[OK] Dispatch state transition verified successfully.")
    except Exception as e:
        print(f"[FAIL] Dispatch failed: {e}")
        sys.exit(1)

    # 8. Complete the trip (Accepts final odometer 10160 km, fuel 18 Liters, revenue $400)
    print(f"\n8. Completing trip #{trip['id']}...")
    complete_payload = {
        "final_odometer": 10160.00, # initial 10000 + actual 160
        "fuel_consumed": 18.00,
        "revenue": 400.00
    }
    try:
        completed_trip = make_request(f"/trips/{trip['id']}/complete", "POST", complete_payload, token)
        print(f"[OK] Trip completed successfully. Actual Distance: {completed_trip['actual_distance']} km")
        
        # Verify vehicle/driver statuses are restored to 'Available' and odometer is updated
        v_check = make_request(f"/vehicles/{vehicle['id']}", "GET", token=token)
        d_check = make_request(f"/drivers/{driver['id']}", "GET", token=token)
        print(f"  - Vehicle status: {v_check['status']} (Expected: Available)")
        print(f"  - Vehicle odometer: {v_check['odometer']} km (Expected: 10160.0 km)")
        print(f"  - Driver status: {d_check['status']} (Expected: Available)")
        
        if v_check["status"] != "Available" or d_check["status"] != "Available" or float(v_check["odometer"]) != 10160.0:
            print("[FAIL] FAILED: Completion updates failed!")
            sys.exit(1)
        else:
            print("[OK] Completion state transition verified successfully.")
    except Exception as e:
        print(f"[FAIL] Completion failed: {e}")
        sys.exit(1)

    # 9. Create a Maintenance Log (Oil Change) -> switches vehicle to 'In Shop'
    print(f"\n9. Putting vehicle {vehicle['registration_number']} into maintenance shop...")
    maint_payload = {
        "vehicle_id": vehicle["id"],
        "description": "Oil change and tire rotation",
        "start_date": "2026-07-12"
    }
    maint = None
    try:
        maint = make_request("/maintenance/start", "POST", maint_payload, token)
        print(f"[OK] Maintenance log #{maint['id']} created. Status: {maint['status']}")
        
        v_check = make_request(f"/vehicles/{vehicle['id']}", "GET", token=token)
        print(f"  - Vehicle status: {v_check['status']} (Expected: In Shop)")
        if v_check["status"] != "In Shop":
            print("[FAIL] FAILED: Vehicle status did not switch to In Shop!")
            sys.exit(1)
        else:
            print("[OK] Vehicle locked to 'In Shop' successfully.")
    except Exception as e:
        print(f"[FAIL] Maintenance start failed: {e}")
        sys.exit(1)

    # 10. Close Maintenance Log (Cost $150) -> switches vehicle back to 'Available'
    print(f"\n10. Closing maintenance log #{maint['id']}...")
    close_payload = {
        "cost": 150.00,
        "end_date": "2026-07-12"
    }
    try:
        closed_maint = make_request(f"/maintenance/{maint['id']}/close", "POST", close_payload, token)
        print(f"[OK] Maintenance closed. Cost recorded: ${closed_maint['cost']}")
        
        v_check = make_request(f"/vehicles/{vehicle['id']}", "GET", token=token)
        print(f"  - Vehicle status: {v_check['status']} (Expected: Available)")
        if v_check["status"] != "Available":
            print("[FAIL] FAILED: Vehicle status did not restore to Available!")
            sys.exit(1)
        else:
            print("[OK] Vehicle restored to 'Available' successfully.")
    except Exception as e:
        print(f"[FAIL] Maintenance close failed: {e}")
        sys.exit(1)

    # 11. Verify Analytics Reports are updated
    print("\n11. Verifying analytics outputs...")
    try:
        kpis = make_request("/reports/dashboard-kpis", "GET", token=token)
        roi = make_request("/reports/vehicle-roi", "GET", token=token)
        efficiency = make_request("/reports/fuel-efficiency", "GET", token=token)
        
        print(f"[OK] Dashboard Fleet Utilization: {kpis['fleet_utilization']}%")
        print(f"[OK] Vehicle ROI listing loaded, vehicle count: {len(roi)}")
        print(f"[OK] Fuel Efficiency logs loaded, vehicle count: {len(efficiency)}")
        
        # Log calculated values
        for r in roi:
            if r["registration_number"] == "VAN-05":
                print(f"  - Vehicle VAN-05: Total Revenue: ${r['total_revenue']}, Maintenance: ${r['total_maintenance']}, Fuel: ${r['total_fuel']}, ROI: {float(r['roi'])*100:.2f}%")
    except Exception as e:
        print(f"[FAIL] Reports load failed: {e}")
        sys.exit(1)

    print("\n==================================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
