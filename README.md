# AI Emergency Response Command Center

A high-performance emergency response command center powered by a C++ Data Structures & Algorithms (DSA) engine, a C++ REST API, and a modern React command-center frontend.

---

## Current Architecture

- **React Frontend**: Modern Vite + React + TypeScript + Tailwind CSS command center dashboard.
- **C++ REST API**: Lightweight HTTP/JSON REST server (`cpp-httplib` + `nlohmann/json`) serving state and triage endpoints.
- **C++ DSA Engine**: Core data structures and algorithms implementing city grid simulation, priority queue triage, Manhattan distance routing, and unit dispatch.

---

## Prerequisites

- **C++ Compiler**: MinGW-w64 (g++ with C++17 support) or equivalent C++17 compiler with Winsock (`-lws2_32`).
- **Node.js & npm**: Node.js v18+ and npm installed.

---

## Setup & Running

### 1. Backend Setup & Start

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

**Compile (exact command):**
```bash
g++ -std=c++17 -Wall -Wextra -o emergency.exe main.cpp DataStructures.cpp EmergencyEngine.cpp Algorithms.cpp ApiServer.cpp -lws2_32
```

**Run REST API Server:**
```bash
.\emergency.exe --api
```

*(Optional: To run the interactive C++ console CLI instead, run `.\emergency.exe` without `--api`)*

### 2. Frontend Setup & Start

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

---

## Expected URLs

- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:8080](http://localhost:8080)
- **State Endpoint**: [http://localhost:8080/api/state](http://localhost:8080/api/state)

---

## Basic Workflow

The command center follows an automated real-time emergency lifecycle:

```
Report → Prioritize → Dispatch → Simulate → Resolve
```

1. **Report**: Operators log emergency incidents with severity, affected population, type, and 2D grid coordinates.
2. **Prioritize**: Incidents enter a max-heap Priority Queue evaluated using a weighted severity formula.
3. **Dispatch**: The nearest compatible emergency unit (Ambulance, Fire Truck, Police, Rescue Team) is assigned via Manhattan distance calculation.
4. **Simulate**: Units traverse the 10×10 city grid step-by-step toward the incident coordinates.
5. **Resolve**: Upon arrival, incidents are marked resolved and response units are freed back into the available fleet.

---

## Data Structures & Algorithms (DSA)

### Core Data Structures
- **2D Array (`cityGrid[10][10]`)**: Spatial representation of city coordinates, structures, units, and active incidents.
- **`std::priority_queue`**: Max-heap triage queue prioritizing incidents based on severity, population, and hazard type.
- **`std::vector` & `std::map`**: Dynamic entity storage and O(log n) lookup by incident and unit IDs.
- **`std::queue`**: FIFO tracking of incoming incident arrival stream.
- **`std::stack` & `std::deque`**: Action history undo/audit log and bounded rolling event stream.

### Priority Formula
```
Priority = severity × 3.0  +  min(peopleAffected, 100) × 0.5  +  typeWeight × 2.0
```

### Manhattan Routing Distance
```
Distance = |gridX_unit − gridX_target| + |gridY_unit − gridY_target|
```

---

## Testing

An end-to-end integration test verifying the entire C++ API and emergency lifecycle is included:

```bash
python e2e_test.py
```
