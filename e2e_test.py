import subprocess
import time
import urllib.request
import urllib.error
import json
import sys

API_URL = "http://localhost:8080/api"
backend_proc = None

def report_pass(name):
    print(f"[PASS] {name}")

def report_fail(name, reason):
    print(f"[FAIL] {name} - {reason}")
    if backend_proc:
        backend_proc.terminate()
    sys.exit(1)

def do_get(url):
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            return response.getcode(), json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def do_post(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            return response.getcode(), json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def run_tests():
    global backend_proc
    time.sleep(1) # wait for server to start

    try:
        # 3. GET /api/state
        code, state = do_get(f"{API_URL}/state")
        if code == 200:
            report_pass("GET /api/state")
        else:
            report_fail("GET /api/state", f"Status {code}")

        # 4. Create manual emergency #1
        payload1 = {"type": "Fire", "severity": 8, "peopleAffected": 5, "locationName": "North", "gridX": 1, "gridY": 2}
        code, res1 = do_post(f"{API_URL}/emergencies", payload1)
        if code == 201:
            report_pass("Create manual emergency #1")
        else:
            report_fail("Create manual emergency #1", str(res1))

        # 7. Create manual emergency #2 at a different coordinate
        payload2 = {"type": "Earthquake", "severity": 10, "peopleAffected": 100, "locationName": "South", "gridX": 5, "gridY": 6}
        code, res2 = do_post(f"{API_URL}/emergencies", payload2)
        if code == 201:
            report_pass("Create manual emergency #2")
        else:
            report_fail("Create manual emergency #2", str(res2))

        # 9. Create manual emergency #3
        payload3 = {"type": "Crime", "severity": 4, "peopleAffected": 1, "locationName": "East", "gridX": 8, "gridY": 1}
        code, res3 = do_post(f"{API_URL}/emergencies", payload3)
        if code == 201:
            report_pass("Create manual emergency #3")
        else:
            report_fail("Create manual emergency #3", str(res3))

        # 10. Verify all three have their own correct coordinates
        code, state = do_get(f"{API_URL}/state")
        emergencies = state["emergencies"]
        if len(emergencies) == 3 and emergencies[0]["gridX"] == 1 and emergencies[1]["gridX"] == 5 and emergencies[2]["gridX"] == 8:
            report_pass("Verify all three have correct coordinates")
        else:
            report_fail("Verify all three have correct coordinates", "Coordinates mismatch")

        # 11. Verify priority queue ordering (e2 should have higher priority than e3)
        pq = state["priorityQueue"]
        if pq[0]["id"] == res2["emergency"]["id"]:
            report_pass("Verify priority queue ordering (Emergency 2 is highest)")
        else:
            report_fail("Verify priority queue ordering", "Wrong emergency at top of PQ")

        # Test Invalid coordinates
        payload_inv = {"type": "Fire", "severity": 5, "peopleAffected": 1, "locationName": "Nowhere", "gridX": 10, "gridY": 10}
        code, res_inv = do_post(f"{API_URL}/emergencies", payload_inv)
        if code == 400 and "Invalid coordinates" in str(res_inv):
            report_pass("Invalid coordinates (10,10) rejected correctly")
        else:
            report_fail("Invalid coordinates", "Should have returned 400")

        # 12. Dispatch highest-priority emergency
        code, disp_data = do_post(f"{API_URL}/dispatch", {})
        if code == 200:
            report_pass("Dispatch highest-priority emergency")
            # 13. Verify compatible unit selection
            if disp_data["assignedUnit"]["type"] == "Rescue Team":
                report_pass("Verify compatible unit selection (Rescue Team for Earthquake)")
            else:
                report_fail("Compatible unit selection", f"Got {disp_data['assignedUnit']['type']} instead of Rescue Team")
        else:
            report_fail("Dispatch emergency", str(disp_data))

        # 14. Simulate movement
        unit_id = disp_data["assignedUnit"]["id"]
        em_id = disp_data["dispatchedEmergency"]["id"]
        
        # loop simulate until distance is 0
        max_steps = 20
        arrived = False
        for _ in range(max_steps):
            code, res_sim = do_post(f"{API_URL}/simulate", {})
            if code == 200:
                # check unit coordinates
                _, state = do_get(f"{API_URL}/state")
                unit = next(u for u in state["units"] if u["id"] == unit_id)
                em = next(e for e in state["emergencies"] if e["id"] == em_id)
                if unit["gridX"] == em["gridX"] and unit["gridY"] == em["gridY"]:
                    arrived = True
                    break
        
        if arrived:
            report_pass("Simulate movement (Unit arrived at destination)")
        else:
            report_fail("Simulate movement", "Unit did not arrive")

        # 16. Resolve emergency
        code, res_res = do_post(f"{API_URL}/resolve", {"id": em_id})
        if code == 200:
            report_pass("Resolve emergency")
            # 17. Verify unit becomes available
            _, state = do_get(f"{API_URL}/state")
            unit = next(u for u in state["units"] if u["id"] == unit_id)
            if unit["available"]:
                report_pass("Verify unit becomes available")
            else:
                report_fail("Verify unit becomes available", "Unit is not available")
            
            # 18. Verify resolved emergency disappears from active grid but remains in history
            em = next(e for e in state["emergencies"] if e["id"] == em_id)
            if em["status"] == "Resolved":
                report_pass("Verify resolved emergency remains in history with Resolved status")
            else:
                report_fail("Verify resolved emergency", "Status not resolved")
        else:
            report_fail("Resolve emergency", str(res_res))

        print("\nAll E2E tests passed successfully.")

    finally:
        if backend_proc:
            backend_proc.terminate()

if __name__ == "__main__":
    run_tests()
