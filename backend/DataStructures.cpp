// DataStructures.cpp
// Defines all global data structures and provides utility/display operations.

#include "Emergency.h"

// ======================== GLOBAL DEFINITIONS ========================

vector<Emergency> allEmergencies;                                          // vector
map<int, int> emergencyIndex;                                              // map
set<string> emergencyTypes;                                                // set
set<string> activeLocations;                                               // set
priority_queue<Emergency, vector<Emergency>, ComparePriority> triageQueue;  // priority_queue
queue<int> arrivalQueue;                                                   // queue
stack<string> actionHistory;                                               // stack
deque<string> eventLog;                                                    // deque
vector<ResponseUnit> responseUnits;                                        // vector

char cityGrid[GRID_ROWS][GRID_COLS];                                        // 2D array

int nextEmergencyId = 1;
int nextUnitId = 1;

// ======================== UTILITY FUNCTIONS ========================

// Returns current date-time as a formatted string
string getCurrentTimestamp() {
    time_t now = time(nullptr);
    struct tm ltm;
#if defined(_MSC_VER)
    localtime_s(&ltm, &now);          // MSVC-safe variant
#else
    ltm = *localtime(&now);           // POSIX / GCC / Clang
#endif
    ostringstream ss;
    ss << setfill('0')
       << setw(4) << (1900 + ltm.tm_year) << "-"
       << setw(2) << (1 + ltm.tm_mon)     << "-"
       << setw(2) << ltm.tm_mday          << " "
       << setw(2) << ltm.tm_hour          << ":"
       << setw(2) << ltm.tm_min           << ":"
       << setw(2) << ltm.tm_sec;
    return ss.str();
}

/*
 * Priority Calculation
 * ---------------------
 * Formula:  severity * 3.0  +  min(peopleAffected, 100) * 0.5  +  typeWeight * 2.0
 *
 * Type Weights:
 *   Fire = 5      Medical = 4      Earthquake = 5     Flood = 4
 *   Accident = 3  Crime = 3        Hazmat = 4.5       Other = 2
 *
 * Resulting score range: ~7 (minor incident) to ~90 (mass-casualty catastrophe)
 *
 * Time Complexity:  O(1) — constant number of lookups and arithmetic
 * Space Complexity: O(1)
 */
double calculatePriority(const Emergency& e) {
    // map used for type-weight lookup — demonstrates map with string keys
    map<string, double> typeWeights = {
        {"Fire", 5.0},  {"Medical", 4.0},  {"Earthquake", 5.0},
        {"Flood", 4.0}, {"Accident", 3.0}, {"Crime", 3.0},
        {"Hazmat", 4.5}, {"Other", 2.0}
    };

    double tw = 2.0;  // default weight for unknown types
    auto it = typeWeights.find(e.type);
    if (it != typeWeights.end()) {
        tw = it->second;
    }

    int capped = (e.peopleAffected < 100) ? e.peopleAffected : 100;
    return e.severity * 3.0 + capped * 0.5 + tw * 2.0;
}

// ======================== CITY GRID OPERATIONS (Phase 2) ========================

/*
 * Initialize 10x10 city grid with roads, buildings, hospitals, and stations.
 * Uses a 2D array — demonstrates fixed-size 2D array usage.
 * Time: O(ROWS * COLS)   Space: O(1) (grid is global fixed-size)
 */
void initCityGrid() {
    // Fill all cells with road
    for (int r = 0; r < GRID_ROWS; r++)
        for (int c = 0; c < GRID_COLS; c++)
            cityGrid[r][c] = CELL_ROAD;

    // Place buildings
    cityGrid[1][1] = CELL_BUILDING;  cityGrid[1][5] = CELL_BUILDING;
    cityGrid[3][3] = CELL_BUILDING;  cityGrid[3][8] = CELL_BUILDING;
    cityGrid[5][2] = CELL_BUILDING;  cityGrid[6][6] = CELL_BUILDING;
    cityGrid[7][1] = CELL_BUILDING;  cityGrid[8][7] = CELL_BUILDING;

    // Place hospitals
    cityGrid[0][9] = CELL_HOSPITAL;
    cityGrid[9][0] = CELL_HOSPITAL;

    // Place stations (where units start)
    cityGrid[0][0] = CELL_STATION;   // Fire station
    cityGrid[4][5] = CELL_STATION;   // Medical station
    cityGrid[9][9] = CELL_STATION;   // Police station
}

void placeOnGrid(int row, int col, char marker) {
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS)
        cityGrid[row][col] = marker;
}

void clearFromGrid(int row, int col) {
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS)
        cityGrid[row][col] = CELL_ROAD;
}

// Renders the 2D city grid with row/col headers and legend
void displayCityGrid() {
    cout << "\n    ========== CITY GRID (" << GRID_ROWS << "x" << GRID_COLS << ") ==========\n\n";

    // Column headers
    cout << "      ";
    for (int c = 0; c < GRID_COLS; c++) cout << c << " ";
    cout << "\n      ";
    for (int c = 0; c < GRID_COLS; c++) cout << "--";
    cout << "\n";

    // Grid rows
    for (int r = 0; r < GRID_ROWS; r++) {
        cout << "    " << r << "| ";
        for (int c = 0; c < GRID_COLS; c++) {
            cout << cityGrid[r][c] << " ";
        }
        cout << "\n";
    }

    cout << "\n    Legend: . = Road   # = Building   H = Hospital\n";
    cout << "            S = Station ! = Emergency  U = Unit\n\n";
}

// ======================== DATA STRUCTURE OPERATIONS ========================

// Inserts an emergency into every relevant data structure
void addEmergency(const Emergency& e) {
    allEmergencies.push_back(e);                                 // vector: append
    emergencyIndex[e.id] = (int)allEmergencies.size() - 1;       // map: ID -> index
    emergencyTypes.insert(e.type);                               // set: unique types
    activeLocations.insert(e.locationName);                      // set: unique locations
    triageQueue.push(e);                                         // priority_queue: triage
    arrivalQueue.push(e.id);                                     // queue: FIFO order
}

// Deque-based event buffer — most recent events at front, capped at 50 entries
void addToEventLog(const string& event) {
    string entry = "[" + getCurrentTimestamp() + "] " + event;
    eventLog.push_front(entry);              // deque: push to front
    while (eventLog.size() > 50) {
        eventLog.pop_back();                 // deque: trim oldest from back
    }
}

// Stack-based action log — most recent action on top
void logAction(const string& action) {
    string entry = "[" + getCurrentTimestamp() + "] " + action;
    actionHistory.push(entry);               // stack: push
    addToEventLog(action);
}

// ======================== DISPLAY FUNCTIONS ========================

// One-line summary of an emergency (for lists)
void displayEmergencyBrief(const Emergency& e) {
    cout << "    #" << setw(3) << left << e.id
         << " | " << setw(12) << left << e.type
         << " | " << setw(15) << left << e.locationName
         << " | (" << e.gridPos.first << "," << e.gridPos.second << ")"
         << " | Sev: " << setw(2) << right << e.severity
         << " | Pri: " << setw(5) << fixed << setprecision(1) << e.priorityScore
         << " | " << e.status << "\n";
}

// Detailed multi-line view of a single emergency
void displayEmergencyDetail(const Emergency& e) {
    cout << "\n    ------------------------------------\n";
    cout << "    Emergency #" << e.id << "\n";
    cout << "    ------------------------------------\n";
    cout << "    Type:        " << e.type << "\n";
    cout << "    Description: " << e.description << "\n";
    cout << "    Location:    " << e.locationName
         << " (" << fixed << setprecision(4)
         << e.location.first << ", " << e.location.second << ")\n";
    cout << "    Grid Pos:    (" << e.gridPos.first << ", " << e.gridPos.second << ")\n";
    cout << "    Severity:    " << e.severity << " / 10\n";
    cout << "    Affected:    " << e.peopleAffected << " people\n";
    cout << "    Priority:    " << fixed << setprecision(1) << e.priorityScore << "\n";
    cout << "    Status:      " << e.status << "\n";
    cout << "    Reported:    " << e.timestamp << "\n";
    if (e.assignedUnitId != -1)
        cout << "    Unit:        #" << e.assignedUnitId << "\n";
    cout << "    ------------------------------------\n";
}

// Lists all emergencies stored in the vector; also shows unique types (set) and locations (set)
void displayAllEmergencies() {
    if (allEmergencies.empty()) {
        cout << "\n    No emergencies recorded.\n\n";
        return;
    }

    cout << "\n    ========== ALL EMERGENCIES (" << allEmergencies.size() << ") ==========\n\n";

    // Using iterator to traverse vector — demonstrates iterator usage
    for (auto it = allEmergencies.begin(); it != allEmergencies.end(); ++it) {
        displayEmergencyBrief(*it);
    }

    // Display unique types from set — demonstrates set iteration
    cout << "\n    Unique types (set): ";
    for (auto it = emergencyTypes.begin(); it != emergencyTypes.end(); ++it) {
        if (it != emergencyTypes.begin()) cout << ", ";
        cout << *it;
    }

    cout << "\n    Active locations:   " << activeLocations.size() << "\n\n";
}

// Shows the triage priority queue alongside the FIFO arrival queue for comparison
void displayPriorityQueue() {
    if (triageQueue.empty()) {
        cout << "\n    Triage queue is empty.\n\n";
        return;
    }

    // --- Priority Queue (max-heap order) ---
    cout << "\n    ========== TRIAGE PRIORITY QUEUE ==========\n";
    cout << "    (Highest priority processed first)\n\n";

    // priority_queue has no iterators — must copy and pop to display
    auto temp = triageQueue;
    int rank = 1;
    while (!temp.empty()) {
        const Emergency& e = temp.top();
        cout << "    " << setw(2) << right << rank++ << ". "
             << "[Pri: " << fixed << setprecision(1) << setw(5) << e.priorityScore << "] "
             << setw(12) << left << e.type
             << " at " << setw(20) << left << e.locationName
             << " (Sev: " << e.severity << ", Affected: " << e.peopleAffected << ")\n";
        temp.pop();
    }

    // --- FIFO Arrival Queue (for academic comparison) ---
    if (!arrivalQueue.empty()) {
        cout << "\n    ---- FIFO ARRIVAL ORDER (Queue) ----\n";
        cout << "    (If we processed in arrival order instead)\n\n";

        auto tempQ = arrivalQueue;
        int pos = 1;
        while (!tempQ.empty()) {
            int id = tempQ.front();
            tempQ.pop();
            auto mapIt = emergencyIndex.find(id);
            if (mapIt != emergencyIndex.end()) {
                const Emergency& e = allEmergencies[mapIt->second];
                cout << "    " << setw(2) << right << pos++ << ". Emergency #" << e.id
                     << " - " << setw(12) << left << e.type
                     << " Pri: " << fixed << setprecision(1) << e.priorityScore
                     << "  [" << e.status << "]\n";
            }
        }
    }
    cout << "\n";
}

// Shows action history (stack) and recent event buffer (deque)
void displayActionHistory() {
    // --- Stack: Action History ---
    if (actionHistory.empty()) {
        cout << "\n    No actions recorded.\n\n";
        return;
    }

    cout << "\n    ========== ACTION HISTORY (Stack) ==========\n";
    cout << "    (Most recent action on top)\n\n";

    // stack has no iterators — must copy and pop to display
    auto temp = actionHistory;
    int count = 1;
    while (!temp.empty()) {
        cout << "    " << setw(2) << right << count++ << ". " << temp.top() << "\n";
        temp.pop();
    }

    // --- Deque: Recent Event Buffer ---
    if (!eventLog.empty()) {
        cout << "\n    ---- RECENT EVENTS (Deque Buffer, max 50) ----\n\n";
        // deque supports random-access iterators
        for (auto it = eventLog.begin(); it != eventLog.end(); ++it) {
            cout << "    " << *it << "\n";
        }
    }
    cout << "\n";
}

// Lists all response units and their availability
void displayResponseUnits() {
    cout << "\n    ========== RESPONSE UNITS (" << responseUnits.size() << ") ==========\n\n";

    for (const auto& unit : responseUnits) {
        cout << "    Unit #" << setw(2) << left << unit.id
             << " | " << setw(14) << left << unit.type
             << " | (" << unit.gridPos.first << "," << unit.gridPos.second << ")"
             << " | " << (unit.available ? "Available " : "Deployed  ")
             << " | " << unit.assignedEmergency << "\n";
    }
    cout << "\n";
}
