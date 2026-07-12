import urllib.request
import urllib.error
import urllib.parse
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req_data = None
    if data:
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

def test_flow():
    print("==================================================")
    print("STARTING OTP AND PASSWORD RECOVERY INTEGRATION TEST")
    print("==================================================")

    email = f"user_{int(time.time())}@transitops.com"
    password = "secretpassword123"

    # 1. Sign Up User (starts as unverified)
    print("\n1. Signing up user...")
    signup_payload = {
        "email": email,
        "password": password,
        "full_name": "OTP Tester",
        "role_name": "Fleet Manager"
    }
    try:
        user = make_request("/auth/register", "POST", signup_payload)
        print(f"[OK] Signup succeeded for {user['email']}. is_verified default: {user.get('is_verified', 'Missing')}")
    except Exception as e:
        print(f"[FAIL] Signup failed: {e}")
        return

    # 2. Login (should be blocked as unverified)
    print("\n2. Attempting normal login (should be blocked)...")
    login_url = f"{BASE_URL}/auth/login"
    login_data = urllib.parse.urlencode({
        "username": email,
        "password": password
    }).encode("utf-8")
    req = urllib.request.Request(
        login_url,
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    try:
        urllib.request.urlopen(req)
        print("[FAIL] Login was allowed for unverified user!")
        return
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        if "email_unverified" in body:
            print(f"[OK] Login blocked with expected status: email_unverified ({body.strip()})")
        else:
            print(f"[FAIL] Login blocked but with unexpected error: {e.code} - {body}")
            return

    # Since the test runs in a different process, query the debug OTP endpoint
    print("\n3. Retrieving OTP via debug endpoint...")
    try:
        otp_res = make_request(f"/auth/debug/otp?email={urllib.parse.quote(email)}", "GET")
        otp_code = otp_res["otp_code"]
        print(f"[OK] Found OTP: {otp_code}")
    except Exception as e:
        print(f"[FAIL] Could not retrieve OTP: {e}")
        return

    # 3. Verify OTP
    print("\n4. Verifying OTP...")
    verify_payload = {
        "email": email,
        "otp_code": otp_code,
        "purpose": "verify"
    }
    try:
        auth_data = make_request("/auth/verify-otp", "POST", verify_payload)
        token = auth_data["access_token"]
        print(f"[OK] Verification succeeded. Received JWT token: {token[:15]}...")
    except Exception as e:
        print(f"[FAIL] Verification failed: {e}")
        return

    # 4. Verify me endpoint returns verified user
    print("\n5. Checking /me endpoint...")
    try:
        me = make_request("/auth/me", "GET", token=token)
        print(f"[OK] User profile retrieved. is_verified: {me.get('is_verified')}")
        if not me.get("is_verified"):
            print("[FAIL] User is still not marked verified in DB!")
            return
    except Exception as e:
        print(f"[FAIL] Failed to retrieve profile: {e}")
        return

    # 5. Forgot password
    print("\n6. Requesting password reset...")
    try:
        res = make_request("/auth/forgot-password", "POST", {"email": email})
        print(f"[OK] Forgot password endpoint response: {res}")
    except Exception as e:
        print(f"[FAIL] Forgot password failed: {e}")
        return

    # Read reset OTP via debug endpoint
    print("Retrieving reset OTP via debug endpoint...")
    try:
        otp_res = make_request(f"/auth/debug/otp?email={urllib.parse.quote(email)}", "GET")
        reset_otp = otp_res["otp_code"]
        print(f"[OK] Found reset OTP: {reset_otp}")
    except Exception as e:
        print(f"[FAIL] Could not retrieve reset OTP: {e}")
        return

    # 6. Reset password
    print("\n7. Resetting password with new credentials...")
    new_password = "newsecretpassword456"
    reset_payload = {
        "email": email,
        "otp_code": reset_otp,
        "new_password": new_password
    }
    try:
        res_reset = make_request("/auth/reset-password", "POST", reset_payload)
        print(f"[OK] Password reset response: {res_reset}")
    except Exception as e:
        print(f"[FAIL] Password reset failed: {e}")
        return

    # Verify reset login works
    print("\n8. Logging in with new password...")
    new_login_data = urllib.parse.urlencode({
        "username": email,
        "password": new_password
    }).encode("utf-8")
    req_new = urllib.request.Request(
        login_url,
        data=new_login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req_new) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"[OK] Login with new password succeeded! Token: {data['access_token'][:15]}...")
    except Exception as e:
        print(f"[FAIL] Failed to log in with new password: {e}")
        return

    print("\n==================================================")
    print("ALL OTP AND PASS RECOVERY TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_flow()
