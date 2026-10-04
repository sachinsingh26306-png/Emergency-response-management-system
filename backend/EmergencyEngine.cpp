// EmergencyEngine.cpp
// Menu-driven console interface and core engine logic.
// Phase 2: City grid, nearest-unit dispatch, movement simulation, emergency lifecycle.

#include "Emergency.h"
#include "GeminiAPI.h"

// ======================== SYSTEM INITIALIZATION ========================

void showBanner() {
    cout << "\n";
    cout << "  ================================================================\n";
    cout << "  |                                                              |\n";
    cout << "  |       EMERGENCY RESPONSE COMMAND CENTER  v2.0                |\n";
    cout << "  |       Phase 2 -- City Simulation + Intelligent Dispatch      |\n";
    cout << "  |                                                              |\n";
    cout << "  ================================================================\n";
    cout << "\n";
}

void initializeSystem() {
    showBanner();

    // Initialize city grid (2D array)
    initCityGrid();

    // Pre-populate response units with grid positions
    // {id, type, available, {lat,lon}, {gridRow, gridCol}, assignedEmergency, assignedEmergencyId}
    responseUnits.push_back({nextUnitId++, "Fire Truck",   true, {40.73, -73.94}, {0, 0}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Ambulance",    true, {40.76, -73.99}, {4, 5}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Police Car",   true, {40.71, -74.01}, {9, 9}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Rescue Team",  true, {40.75, -73.97}, {2, 4}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Hazmat Unit",  true, {40.73, -73.79}, {5, 7}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Ambulance",    true, {40.69, -74.04}, {7, 3}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Fire Truck",   true, {40.76, -73.98}, {1, 8}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Police Car",   true, {40.78, -73.97}, {6, 2}, "None", -1});

    // Place units on grid
    for (const auto& unit : responseUnits) {
        placeOnGrid(unit.gridPos.first, unit.gridPos.second, CELL_UNIT);
    }

    logAction("System initialized -- " + to_string(responseUnits.size())
              + " units online, " + to_string(GRID_ROWS) + "x"
              + to_string(GRID_COLS) + " city grid active");

    cout << "  System ready. " << responseUnits.size() << " response units on "
         << GRID_ROWS << "x" << GRID_COLS << " city grid.\n\n";
}

// ======================== MENU ========================

void showMenu() {
    cout << "  +------------------------------------------+\n";
    cout << "  |          COMMAND CENTER MENU              |\n";
    cout << "  +------------------------------------------+\n";
    cout << "  |  1.  Report Emergency                    |\n";
    cout << "  |  2.  View All Emergencies                |\n";
    cout << "  |  3.  View Priority Queue                 |\n";
    cout << "  |  4.  Dispatch Next Emergency             |\n";
    cout << "  |  5.  View City Grid                      |\n";
    cout << "  |  6.  View Response Units                 |\n";
    cout << "  |  7.  Simulate Active Dispatch             |\n";
    cout << "  |  8.  Resolve Emergency                   |\n";
    cout << "  |  9.  View Action History                 |\n";
    cout << "  |  10. Search / Sort                       |\n";
    cout << "  |  11. Report Emergency Using AI           |\n";
    cout << "  |  0.  Exit                                |\n";
    cout << "  +------------------------------------------+\n";
    cout << "\n  Enter choice: ";
}

// ======================== REPORT EMERGENCY ========================

void reportEmergency() {
    Emergency e;
    e.id = nextEmergencyId++;
    e.assignedUnitId = -1;

    cout << "\n  ===== REPORT NEW EMERGENCY =====\n\n";

    cout << "  Types: Fire, Medical, Earthquake, Flood, Accident, Crime, Hazmat, Other\n";
    cout << "  Enter type: ";
    cin >> e.type;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    cout << "  Enter description: ";
    getline(cin, e.description);

    cout << "  Enter location name: ";
    getline(cin, e.locationName);

    cout << "  Enter grid row (0-" << GRID_ROWS - 1 << "): ";
    cin >> e.gridPos.first;
    cout << "  Enter grid col (0-" << GRID_COLS - 1 << "): ";
    cin >> e.gridPos.second;

    // Clamp to grid bounds
    if (e.gridPos.first < 0)  e.gridPos.first = 0;
    if (e.gridPos.first >= GRID_ROWS) e.gridPos.first = GRID_ROWS - 1;
    if (e.gridPos.second < 0) e.gridPos.second = 0;
    if (e.gridPos.second >= GRID_COLS) e.gridPos.second = GRID_COLS - 1;

    // Derive lat/lon from grid position (simple mapping for simulation)
    e.location.first  = 40.70 + e.gridPos.first * 0.01;
    e.location.second = -74.00 + e.gridPos.second * 0.01;

    cout << "  Enter severity (1-10): ";
    cin >> e.severity;
    if (e.severity < 1)  e.severity = 1;
    if (e.severity > 10) e.severity = 10;

    cout << "  Enter people affected: ";
    cin >> e.peopleAffected;
    if (e.peopleAffected < 0) e.peopleAffected = 0;

    e.status = "Reported";
    e.priorityScore = calculatePriority(e);
    e.timestamp = getCurrentTimestamp();

    addEmergency(e);
    placeOnGrid(e.gridPos.first, e.gridPos.second, CELL_EMERGENCY);

    logAction("REPORTED: Emergency #" + to_string(e.id) + " -- " + e.type
              + " at " + e.locationName + " (" + to_string(e.gridPos.first)
              + "," + to_string(e.gridPos.second) + ") [Priority: "
              + to_string((int)e.priorityScore) + "]");

    cout << "\n  >> Emergency #" << e.id << " registered at grid ("
         << e.gridPos.first << "," << e.gridPos.second << ").\n";
    cout << "  >> Priority Score: " << fixed << setprecision(1) << e.priorityScore << "\n";
    cout << "  >> Status: " << e.status << "\n\n";
}

// ======================== REPORT EMERGENCY USING AI (Phase 3) ========================

void reportEmergencyAI() {
    cout << "\n  ===== REPORT EMERGENCY USING AI =====\n\n";
    cout << "  Enter natural language emergency description (Press ENTER twice to finish):\n  > ";
    
    // Clear buffer if necessary
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    string description;
    string line;
    while (getline(cin, line) && !line.empty()) {
        description += line + "\n";
    }

    if (description.empty()) {
        cout << "  Description cannot be empty.\n\n";
        return;
    }

    cout << "\n  [Gemini API] Analyzing emergency report...\n";
    
    AIAnalysis aiData = analyzeEmergencyWithAI(description);

    if (!aiData.success) {
        cout << "\n  [ERROR] AI Analysis failed.\n";
        cout << "  Reason: " << aiData.errorMessage << "\n";
        cout << "  Falling back to manual entry. Please use Option 1.\n\n";
        return;
    }

    cout << "\n  ===== AI ANALYSIS =====\n";
    cout << "  Type:            " << aiData.type << "\n";
    cout << "  Severity:        " << aiData.severity << " / 10\n";
    cout << "  People Affected: " << aiData.peopleAffected << "\n";
    cout << "  Location:        " << aiData.locationName << "\n";
    cout << "  Grid Pos:        (" << aiData.gridPos.first << "," << aiData.gridPos.second << ")\n";
    cout << "  Traffic:         " << aiData.traffic << "\n";
    cout << "  Urgency:         " << aiData.urgency << "\n";
    cout << "  Summary:         " << aiData.summary << "\n";
    cout << "  =======================\n\n";

    cout << "  Confirm and create emergency? (y/n): ";
    char confirm;
    cin >> confirm;
    if (confirm != 'y' && confirm != 'Y') {
        cout << "\n  Emergency report cancelled.\n\n";
        return;
    }

    // Convert to C++ Emergency Object
    Emergency e;
    e.id = nextEmergencyId++;
    e.assignedUnitId = -1;
    
    e.type = aiData.type;
    e.description = aiData.summary;
    e.locationName = aiData.locationName;
    e.gridPos = aiData.gridPos;
    e.location.first  = 40.70 + e.gridPos.first * 0.01;
    e.location.second = -74.00 + e.gridPos.second * 0.01;
    e.severity = aiData.severity;
    e.peopleAffected = aiData.peopleAffected;

    e.status = "Reported";
    e.priorityScore = calculatePriority(e);
    e.timestamp = getCurrentTimestamp();

    // Hand off to existing C++ DSA engine
    addEmergency(e);
    placeOnGrid(e.gridPos.first, e.gridPos.second, CELL_EMERGENCY);

    logAction("REPORTED (AI): Emergency #" + to_string(e.id) + " -- " + e.type
              + " at " + e.locationName + " [Priority: "
              + to_string((int)e.priorityScore) + "]");

    cout << "\n  >> AI Emergency #" << e.id << " registered and queued for dispatch.\n";
    cout << "  >> Priority Score: " << fixed << setprecision(1) << e.priorityScore << "\n";
    cout << "  >> Status: " << e.status << "\n\n";
}

// ======================== DISPATCH NEXT EMERGENCY (Phase 2) ========================

void dispatchNextEmergency() {
    if (triageQueue.empty()) {
        cout << "\n    No emergencies pending in the triage queue.\n\n";
        return;
    }

    // Pop the highest-priority emergency
    Emergency e = triageQueue.top();
    triageQueue.pop();

    // Type-to-unit matching — uses map
    map<string, string> typeToUnit = {
        {"Fire", "Fire Truck"},    {"Medical", "Ambulance"},
        {"Crime", "Police Car"},   {"Earthquake", "Rescue Team"},
        {"Hazmat", "Hazmat Unit"}, {"Flood", "Rescue Team"},
        {"Accident", "Ambulance"}, {"Other", "Police Car"}
    };

    string preferredUnit = "Police Car";
    auto prefIt = typeToUnit.find(e.type);
    if (prefIt != typeToUnit.end()) {
        preferredUnit = prefIt->second;
    }

    // Find nearest available unit — Phase 2 distance-based dispatch
    int unitIdx = findNearestUnit(preferredUnit, e.gridPos);

    if (unitIdx == -1) {
        // No units available — mark as Waiting
        auto mapIt = emergencyIndex.find(e.id);
        if (mapIt != emergencyIndex.end()) {
            allEmergencies[mapIt->second].status = "Waiting";
        }

        cout << "\n  ===== DISPATCH FAILED =====\n";
        displayEmergencyDetail(e);
        cout << "    >> STATUS: WAITING FOR UNIT (no units available)\n\n";

        logAction("WAITING: Emergency #" + to_string(e.id) + " -- No units available");
        return;
    }

    // Assign the unit
    ResponseUnit& unit = responseUnits[unitIdx];
    int dist = manhattanDistance(unit.gridPos, e.gridPos);

    unit.available = false;
    unit.assignedEmergency = "Emergency #" + to_string(e.id) + " (" + e.type + ")";
    unit.assignedEmergencyId = e.id;

    // Update emergency in main vector
    auto mapIt = emergencyIndex.find(e.id);
    if (mapIt != emergencyIndex.end()) {
        allEmergencies[mapIt->second].status = "Dispatched";
        allEmergencies[mapIt->second].assignedUnitId = unit.id;
    }

    // Display dispatch result with lifecycle
    cout << "\n  ===== DISPATCHING EMERGENCY =====\n";
    cout << "\n    Emergency #" << e.id << " -- " << e.type << "\n";
    cout << "    Location: " << e.locationName << " (" << e.gridPos.first << "," << e.gridPos.second << ")\n";
    cout << "    Priority: " << fixed << setprecision(1) << e.priorityScore << "\n\n";

    cout << "    Lifecycle:\n";
    cout << "      REPORTED\n";
    cout << "       -> PRIORITIZED (score: " << fixed << setprecision(1) << e.priorityScore << ")\n";
    cout << "       -> UNIT ASSIGNED: " << unit.type << " #" << unit.id
         << " at (" << unit.gridPos.first << "," << unit.gridPos.second << ")\n";
    cout << "       -> DISPATCHED (distance: " << dist << " blocks)\n";
    cout << "\n    Estimated response time: " << dist << " units (1 block/step)\n\n";

    logAction("DISPATCHED: Emergency #" + to_string(e.id) + " (" + e.type
              + ") -- " + unit.type + " #" + to_string(unit.id)
              + " (dist: " + to_string(dist) + " blocks)");
}

// ======================== SIMULATE DISPATCH MOVEMENT (Phase 2) ========================

/*
 * Simulates unit movement step-by-step from its current position to the target.
 * Uses simple greedy movement: reduce row difference first, then column.
 * This is NOT pathfinding — it's a direct grid walk for educational demonstration.
 *
 * Time Complexity:  O(d) where d = Manhattan distance
 * Space Complexity: O(1)
 */
void simulateDispatch(int unitIdx, pair<int,int> target) {
    ResponseUnit& unit = responseUnits[unitIdx];
    pair<int,int> pos = unit.gridPos;

    cout << "\n    --- Movement Simulation ---\n";
    cout << "    " << unit.type << " #" << unit.id << "\n";
    cout << "    From: (" << pos.first << "," << pos.second << ")"
         << "  To: (" << target.first << "," << target.second << ")\n\n";

    int step = 1;
    cout << "    Start (" << pos.first << "," << pos.second << ")\n";

    // Move row-wise first, then column-wise (simple greedy approach)
    while (pos.first != target.first) {
        clearFromGrid(pos.first, pos.second);
        pos.first += (target.first > pos.first) ? 1 : -1;
        placeOnGrid(pos.first, pos.second, CELL_UNIT);
        cout << "      Step " << step++ << ": (" << pos.first << "," << pos.second << ")\n";
    }
    while (pos.second != target.second) {
        clearFromGrid(pos.first, pos.second);
        pos.second += (target.second > pos.second) ? 1 : -1;
        placeOnGrid(pos.first, pos.second, CELL_UNIT);
        cout << "      Step " << step++ << ": (" << pos.first << "," << pos.second << ")\n";
    }

    cout << "    Arrived! (" << pos.first << "," << pos.second << ")\n\n";

    // Update unit grid position
    unit.gridPos = pos;
}

// Menu option: simulate a dispatched unit's movement
void simulateActiveDispatch() {
    // Find units that are currently deployed
    vector<int> deployedIndices;
    for (int i = 0; i < (int)responseUnits.size(); i++) {
        if (!responseUnits[i].available && responseUnits[i].assignedEmergencyId != -1) {
            deployedIndices.push_back(i);
        }
    }

    if (deployedIndices.empty()) {
        cout << "\n    No active dispatches to simulate.\n\n";
        return;
    }

    cout << "\n  ===== ACTIVE DISPATCHES =====\n\n";
    for (int idx : deployedIndices) {
        const ResponseUnit& u = responseUnits[idx];
        cout << "    " << u.type << " #" << u.id
             << " at (" << u.gridPos.first << "," << u.gridPos.second << ")"
             << " -> " << u.assignedEmergency << "\n";
    }

    cout << "\n  Enter unit ID to simulate (0 = all): ";
    int unitId;
    cin >> unitId;

    for (int idx : deployedIndices) {
        ResponseUnit& u = responseUnits[idx];
        if (unitId != 0 && u.id != unitId) continue;

        // Find the target emergency position
        auto mapIt = emergencyIndex.find(u.assignedEmergencyId);
        if (mapIt != emergencyIndex.end()) {
            pair<int,int> target = allEmergencies[mapIt->second].gridPos;
            simulateDispatch(idx, target);
            logAction("SIMULATED: " + u.type + " #" + to_string(u.id)
                      + " moved to (" + to_string(target.first) + ","
                      + to_string(target.second) + ")");
        }
    }
}

// ======================== RESOLVE EMERGENCY (Phase 2) ========================

void resolveEmergency() {
    if (allEmergencies.empty()) {
        cout << "\n    No emergencies to resolve.\n\n";
        return;
    }

    // Show dispatched emergencies
    cout << "\n  ===== RESOLVE EMERGENCY =====\n\n";
    bool hasDispatched = false;
    for (const auto& e : allEmergencies) {
        if (e.status == "Dispatched") {
            displayEmergencyBrief(e);
            hasDispatched = true;
        }
    }

    if (!hasDispatched) {
        cout << "    No dispatched emergencies to resolve.\n\n";
        return;
    }

    cout << "\n  Enter emergency ID to resolve: ";
    int id;
    cin >> id;

    Emergency* ep = searchById(id);
    if (!ep) {
        cout << "\n    Emergency #" << id << " not found.\n\n";
        return;
    }
    if (ep->status != "Dispatched") {
        cout << "\n    Emergency #" << id << " is not in Dispatched status (current: "
             << ep->status << ").\n\n";
        return;
    }

    // Resolve the emergency
    ep->status = "Resolved";

    // Clear emergency from grid
    clearFromGrid(ep->gridPos.first, ep->gridPos.second);

    // Free the assigned unit
    for (auto& unit : responseUnits) {
        if (unit.assignedEmergencyId == id) {
            unit.available = true;
            unit.assignedEmergency = "None";
            unit.assignedEmergencyId = -1;
            // Unit stays at emergency location (ready for next dispatch from here)
            placeOnGrid(unit.gridPos.first, unit.gridPos.second, CELL_UNIT);

            cout << "\n    >> " << unit.type << " #" << unit.id << " is now available.\n";
            break;
        }
    }

    // Display lifecycle
    cout << "\n    Emergency #" << ep->id << " RESOLVED.\n\n";
    cout << "    Full Lifecycle:\n";
    cout << "      REPORTED\n";
    cout << "       -> PRIORITIZED\n";
    cout << "       -> DISPATCHED\n";
    cout << "       -> RESOLVED\n\n";

    logAction("RESOLVED: Emergency #" + to_string(id) + " (" + ep->type
              + ") at " + ep->locationName);
}

// ======================== SEARCH / SORT (preserves Phase 1) ========================

void searchEmergency() {
    if (allEmergencies.empty()) {
        cout << "\n    No emergencies to search.\n\n";
        return;
    }

    cout << "\n  ===== SEARCH EMERGENCY =====\n";
    cout << "  1. Search by ID  (Map lookup   -- O(log n))\n";
    cout << "  2. Search by ID  (Linear search -- O(n))\n";
    cout << "  3. Search by ID  (Binary search -- O(log n))\n";
    cout << "  4. Search by Type (Filter       -- O(n))\n";
    cout << "  Enter choice: ";

    int choice;
    cin >> choice;

    switch (choice) {
        case 1: {
            cout << "  Enter emergency ID: ";
            int id; cin >> id;
            Emergency* result = searchById(id);
            if (result) {
                cout << "\n    [Map lookup -- O(log n)]\n";
                displayEmergencyDetail(*result);
            } else {
                cout << "\n    Emergency #" << id << " not found.\n\n";
            }
            break;
        }
        case 2: {
            cout << "  Enter emergency ID: ";
            int id; cin >> id;
            Emergency* result = linearSearchById(id);
            if (result) {
                cout << "\n    [Linear search -- O(n)]\n";
                displayEmergencyDetail(*result);
            } else {
                cout << "\n    Emergency #" << id << " not found.\n\n";
            }
            break;
        }
        case 3: {
            cout << "  Enter emergency ID: ";
            int id; cin >> id;
            vector<Emergency> sorted = allEmergencies;
            sort(sorted.begin(), sorted.end(),
                 [](const Emergency& a, const Emergency& b) { return a.id < b.id; });
            int idx = binarySearchById(sorted, id);
            if (idx != -1) {
                cout << "\n    [Binary search -- O(log n), after O(n log n) sort]\n";
                displayEmergencyDetail(sorted[idx]);
            } else {
                cout << "\n    Emergency #" << id << " not found.\n\n";
            }
            break;
        }
        case 4: {
            cout << "  Known types: ";
            for (const auto& t : emergencyTypes) {
                cout << t << "  ";
            }
            cout << "\n  Enter type: ";
            string type; cin >> type;
            vector<Emergency> results = searchByType(type);
            if (results.empty()) {
                cout << "\n    No emergencies of type '" << type << "'.\n\n";
            } else {
                cout << "\n    Found " << results.size()
                     << " emergency(ies) of type '" << type << "':\n\n";
                for (const auto& e : results) {
                    displayEmergencyBrief(e);
                }
                cout << "\n";
            }
            break;
        }
        default:
            cout << "\n    Invalid choice.\n\n";
    }
}

void sortEmergencies() {
    if (allEmergencies.empty()) {
        cout << "\n    No emergencies to sort.\n\n";
        return;
    }

    cout << "\n  ===== SORT EMERGENCIES =====\n";
    cout << "  1. By Severity       (Selection Sort -- O(n^2))\n";
    cout << "  2. By Priority Score (STL Sort       -- O(n log n))\n";
    cout << "  Enter choice: ";

    int choice; cin >> choice;

    cout << "  Order?  1 = Descending (highest first)  2 = Ascending: ";
    int order; cin >> order;
    bool desc = (order != 2);

    vector<Emergency> sorted = allEmergencies;

    switch (choice) {
        case 1:
            selectionSortBySeverity(sorted, desc);
            cout << "\n    Sorted by Severity (Selection Sort -- O(n^2)):\n\n";
            break;
        case 2:
            sortByPriority(sorted, desc);
            cout << "\n    Sorted by Priority (STL Sort -- O(n log n)):\n\n";
            break;
        default:
            cout << "\n    Invalid choice.\n\n";
            return;
    }

    for (const auto& e : sorted) {
        displayEmergencyBrief(e);
    }
    cout << "\n";
}

// Search/Sort sub-menu (combines Phase 1 options 6+7 into one slot)
void searchSortMenu() {
    cout << "\n  ===== SEARCH / SORT =====\n";
    cout << "  1. Search\n";
    cout << "  2. Sort\n";
    cout << "  Enter choice: ";
    int c; cin >> c;
    if (c == 1) searchEmergency();
    else if (c == 2) sortEmergencies();
    else cout << "\n    Invalid choice.\n\n";
}

// ======================== MAIN ENGINE LOOP ========================

void runEngine() {
    int choice = 0;

    while (true) {
        showMenu();
        cin >> choice;

        // Handle EOF (end of piped input)
        if (cin.eof()) return;

        if (cin.fail()) {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "\n    Invalid input. Please enter a number 0-11.\n\n";
            continue;
        }

        switch (choice) {
            case 1:  reportEmergency();       break;
            case 2:  displayAllEmergencies(); break;
            case 3:  displayPriorityQueue();  break;
            case 4:  dispatchNextEmergency(); break;
            case 5:  displayCityGrid();       break;
            case 6:  displayResponseUnits();  break;
            case 7:  simulateActiveDispatch(); break;
            case 8:  resolveEmergency();      break;
            case 9:  displayActionHistory();  break;
            case 10: searchSortMenu();        break;
            case 11: reportEmergencyAI();     break;
            case 0:
                logAction("System shutdown");
                cout << "\n  Command Center shutting down. Stay safe.\n\n";
                return;
            default:
                cout << "\n    Invalid choice. Enter 0-11.\n\n";
        }
    }
}
