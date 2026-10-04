import urllib.request
import json
import sys

def get(path):
    req = urllib.request.Request('http://localhost:8080' + path)
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def post(path, data):
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request('http://localhost:8080' + path, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

print("--- Step 1: GET /api/state ---")
st, data = get("/api/state")
print(f"Status: {st}")
print(f"Initial emergencies: {len(data['emergencies'])}, PQ size: {len(data['priorityQueue'])}, Units: {len(data['units'])}")

print("\n--- Step 2: POST /api/emergencies ---")
new_em = {
    "type": "Fire",
    "severity": 9,
    "peopleAffected": 5,
    "location": "Block C",
    "gridX": 2,
    "gridY": 2
}
st, res = post("/api/emergencies", new_em)
print(f"Status: {st}, Success: {res.get('success')}")
created_id = res['emergency']['id']
print(f"Created Emergency ID: {created_id}, Type: {res['emergency']['type']}, Priority: {res['emergency']['priorityScore']}")

print("\n--- Step 3: GET /api/state (Verify C++ state updated) ---")
st, data = get("/api/state")
print(f"Status: {st}")
print(f"Emergencies count: {len(data['emergencies'])}, PQ count: {len(data['priorityQueue'])}")
print(f"Grid at (2,2): '{data['grid'][2][2]}' (Cell Emergency marker)")

print("\n--- Step 4: POST /api/dispatch ---")
st, res = post("/api/dispatch", {})
print(f"Status: {st}, Success: {res.get('success')}")
print(f"Dispatched ID: {res['dispatchedEmergency']['id']}, Assigned Unit: {res['assignedUnit']['type']} #{res['assignedUnit']['id']}, Distance: {res['distance']}")

print("\n--- Step 5: POST /api/simulate ---")
st, res = post("/api/simulate", {})
print(f"Status: {st}, Success: {res.get('success')}, Units moved: {res.get('movedCount')}")

print("\n--- Step 6: POST /api/resolve ---")
st, res = post("/api/resolve", {"id": created_id})
print(f"Status: {st}, Success: {res.get('success')}")
print(f"Resolved ID: {res['resolvedEmergency']['id']}, New Status: {res['resolvedEmergency']['status']}")
if res.get('assignedUnit'):
    print(f"Freed Unit: {res['assignedUnit']['type']} #{res['assignedUnit']['id']} available={res['assignedUnit']['available']}")

print("\n--- Step 7: POST /api/ai-emergency ---")
try:
    st, res = post("/api/ai-emergency", {"description": "Gas leak reported near Main Square, 2 people feeling dizzy, urgent help needed!"})
    print(f"Status: {st}, Success: {res.get('success')}")
    if res.get('success'):
        ai_em = res['emergency']
        print(f"AI Emergency Created ID: {ai_em['id']}, Type: {ai_em['type']}, Severity: {ai_em['severity']}, Location: {ai_em['location']}")
    else:
        print(f"AI Error: {res.get('error')}")
except Exception as e:
    print(f"AI call exception: {e}")

print("\n--- Step 8: FINAL GET /api/state ---")
st, data = get("/api/state")
print(f"Status: {st}")
print(f"Total Emergencies: {len(data['emergencies'])}, Priority Queue: {len(data['priorityQueue'])}, Action Stack: {len(data['actionHistory'])}, Event Deque: {len(data['recentActions'])}")
print(f"Summary Statistics: {data['summaryStatistics']}")
