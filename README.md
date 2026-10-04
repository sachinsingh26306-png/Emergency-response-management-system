# Emergency Response Command Center

## Phase 2 — City Simulation + Intelligent Dispatch

A menu-driven console application that simulates an emergency-response command center on a 2D city grid. Built as the academic core of a multi-phase project, it demonstrates **C++ data structures, algorithms, and simulation**.

---

## Project Purpose

Demonstrate real-world application of data structures taught in a *Data Structures using C++* course by modelling an emergency triage and dispatch system where:

- Incoming emergencies are **prioritised** based on severity, affected population, and type.
- A **10×10 city grid** tracks emergency and unit positions visually.
- The **nearest available unit** is dispatched using Manhattan distance.
- Response units **simulate movement** step-by-step to the emergency location.
- Emergencies follow a full **lifecycle**: Reported → Dispatched → Resolved.
- Every action is **logged** via stack (history) and deque (event buffer).
- Operators can **search**, **sort**, and **analyse** emergency records.

---

## Scope

| Phase 1 (Done) | Phase 2 (Current) | Future Phases |
|---|---|---|
| STL data structures | 2D city grid | React/Vite UI |
| Search & sort algorithms | Nearest-unit dispatch | Gemini AI integration |
| Priority-based triage | Movement simulation | REST API |
| Unit dispatch logic | Emergency lifecycle | Database persistence |

---

## File Structure

```
EmergencyResponse/
│
├── backend/
│   ├── Emergency.h          — Structures, global declarations, function prototypes
│   ├── DataStructures.cpp    — Global data definitions, utility & display functions
│   ├── Algorithms.cpp        — Searching and sorting algorithms
│   ├── EmergencyEngine.cpp   — Menu interface, reporting, processing, engine loop
│   └── main.cpp              — Entry point
│
└── README.md
```

---

## Data Structures Used

| Data Structure | Purpose in Project | Location |
|---|---|---|
| **struct** (Emergency, ResponseUnit) | Core data models with grid positions, lifecycle status, assigned units | `Emergency.h` |
| **2D array** (`cityGrid[10][10]`) | Fixed-size city grid storing road/building/hospital/unit/emergency markers | `DataStructures.cpp` |
| **vector** | Dynamic storage of all emergency records and response units | `DataStructures.cpp` |
| **map** | O(log n) ID→index lookup; type-weight mapping; type-to-unit matching | `DataStructures.cpp`, `EmergencyEngine.cpp` |
| **set** | Track unique emergency types and active locations (auto-sorted, no duplicates) | `DataStructures.cpp` |
| **pair<double,double>** | Geographic coordinates (latitude, longitude) | `Emergency.h` |
| **pair<int,int>** | Grid coordinates (row, col) for emergencies and units | `Emergency.h`, `Algorithms.cpp` |
| **priority_queue** | Triage queue — always surfaces the highest-priority emergency for processing | `DataStructures.cpp` |
| **queue** | FIFO arrival order — demonstrates contrast with priority-based processing | `DataStructures.cpp` |
| **stack** | Action history log — most recent action on top, undo-style audit trail | `DataStructures.cpp` |
| **deque** | Bounded recent-events buffer (max 50) — new events at front, old trimmed from back | `DataStructures.cpp` |
| **iterators** | Used to traverse vector, set, and deque in display functions | `DataStructures.cpp` |

---

## Algorithms Implemented

### Searching

| Algorithm | Complexity | Description |
|---|---|---|
| Map Lookup (`searchById`) | O(log n) time, O(1) space | Uses `map::find` for balanced-BST retrieval by emergency ID |
| Linear Search (`linearSearchById`) | O(n) time, O(1) space | Scans vector sequentially; academic baseline comparison |
| Binary Search (`binarySearchById`) | O(log n) time, O(1) space | Classic divide-and-conquer on a sorted copy; requires pre-sort |
| Type Filter (`searchByType`) | O(n) time, O(k) space | Linear scan collecting all matches of a given type |

### Sorting

| Algorithm | Complexity | Description |
|---|---|---|
| Selection Sort (`selectionSortBySeverity`) | O(n²) time, O(1) space | Quadratic in-place sort; simple to explain and implement |
| STL Sort (`sortByPriority`) | O(n log n) time, O(log n) space | Introsort hybrid (quicksort + heapsort + insertion sort) |

### Phase 2 Algorithms

| Algorithm | Complexity | Description |
|---|---|---|
| Manhattan Distance (`manhattanDistance`) | O(1) time, O(1) space | Grid distance = \|r1−r2\| + \|c1−c2\|; appropriate for grid movement |
| Find Nearest Unit (`findNearestUnit`) | O(u) time, O(1) space | Scans units for closest available; prefers matching type, falls back to any |
| Grid Movement (`simulateDispatch`) | O(d) time, O(1) space | Greedy step-by-step walk: rows first, then columns (d = Manhattan distance) |
| Grid Init (`initCityGrid`) | O(R×C) time, O(1) space | Fills 10×10 grid with roads, buildings, hospitals, stations |

### Priority Calculation

```
Priority = severity × 3.0  +  min(peopleAffected, 100) × 0.5  +  typeWeight × 2.0
```

| Type | Weight |
|---|---|
| Fire | 5.0 |
| Medical | 4.0 |
| Earthquake | 5.0 |
| Flood | 4.0 |
| Accident | 3.0 |
| Crime | 3.0 |
| Hazmat | 4.5 |
| Other | 2.0 |

**Score range:** ~7 (minor) to ~90 (mass-casualty catastrophe). O(1) time and space.

---

## How to Compile and Run

### Using g++ (MinGW / Linux / macOS)

```bash
cd EmergencyResponse/backend
g++ -std=c++17 -Wall -o emergency main.cpp DataStructures.cpp Algorithms.cpp EmergencyEngine.cpp
./emergency          # Linux/macOS
.\emergency.exe      # Windows
```

### Using MSVC (Visual Studio Developer Prompt)

```bash
cd EmergencyResponse\backend
cl /EHsc /std:c++17 /Fe:emergency.exe main.cpp DataStructures.cpp Algorithms.cpp EmergencyEngine.cpp
emergency.exe
```

---

## Phase 2 — City Simulation Details

### 2D City Grid

A `10×10` char array represents the city. Each cell contains a marker:

| Marker | Meaning |
|---|---|
| `.` | Road (passable) |
| `#` | Building |
| `H` | Hospital |
| `S` | Station |
| `!` | Active emergency |
| `U` | Response unit |

### Dispatch Logic

1. Pop highest-priority emergency from the `priority_queue`.
2. Determine the preferred unit type (e.g., Fire → Fire Truck).
3. Scan all units; find the nearest available one of that type (Manhattan distance).
4. If none of that type, fall back to any nearest available unit.
5. If no units available, mark the emergency as **Waiting**.
6. Assign the unit, mark it deployed, and log the dispatch.

### Distance Formula

```
Manhattan Distance = |row1 − row2| + |col1 − col2|
Estimated Response Time = distance (1 block per step)
```

### Emergency Lifecycle

```
REPORTED  →  PRIORITIZED  →  UNIT ASSIGNED  →  DISPATCHED  →  RESOLVED
```

If no unit is available: `REPORTED → WAITING FOR UNIT`

### Movement Simulation

Unit moves from its current grid position to the emergency location step by step:
- First resolves the row difference (move up/down)
- Then resolves the column difference (move left/right)
- Grid markers update at each step

---

## Menu Options

```
 1. Report Emergency          — Enter incident details with grid coordinates
 2. View All Emergencies      — Lists all records with grid positions
 3. View Priority Queue       — Triage order (priority_queue) + arrival order (queue)
 4. Dispatch Next Emergency   — Nearest-unit dispatch with distance calculation
 5. View City Grid            — 10x10 grid showing units, emergencies, buildings
 6. View Response Units       — All units with grid positions and deployment status
 7. Simulate Active Dispatch  — Step-by-step movement of deployed units
 8. Resolve Emergency         — Mark resolved, free the assigned unit
 9. View Action History       — Stack (most recent first) + deque event buffer
10. Search / Sort             — All Phase 1 search and sort algorithms
 0. Exit                      — Shutdown
```

---

## Example Workflow (Phase 2)

```
1. Start → 10x10 grid initialized, 8 units placed.
2. Report Fire at grid (3,7), Severity 9, 45 people → Priority 59.5
3. Report Earthquake at grid (5,5), Severity 10, 500 people → Priority 90.0
4. View City Grid → See '!' at (3,7) and (5,5), 'U' at unit positions.
5. Dispatch → Earthquake processed first (highest priority).
         Rescue Team #4 at (2,4) assigned (distance: 4 blocks).
6. Dispatch → Fire processed second.
         Fire Truck #7 at (1,8) assigned (distance: 3 blocks).
7. Simulate → Units move step-by-step on grid to emergency locations.
8. Resolve Emergency #1 → Fire Truck #7 freed, available for next dispatch.
9. View Grid → Updated positions reflect unit movements.
```

---

## Future Phases

| Phase | Description |
|---|---|
| Phase 3 | Gemini AI intelligence layer |
| Phase 4 | React/Vite/Tailwind command-center UI |
| Phase 5 | C++ REST API + full integration |

---

*Phase 2 complete. Awaiting confirmation before starting Phase 3.*
