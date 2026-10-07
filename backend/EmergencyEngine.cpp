// EmergencyEngine.cpp
// Core engine logic.

#include "Emergency.h"

void showBanner() {
    cout << "\n  ================================================================\n";
    cout << "  |       EMERGENCY RESPONSE COMMAND CENTER  v2.0                |\n";
    cout << "  |       Phase 2 -- City Simulation + Intelligent Dispatch      |\n";
    cout << "  ================================================================\n\n";
}

void initializeSystem() {
    showBanner();
    initCityGrid();
    responseUnits.push_back({nextUnitId++, "Fire Truck",   true, {40.73, -73.94}, {0, 0}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Ambulance",    true, {40.76, -73.99}, {4, 5}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Police Car",   true, {40.71, -74.01}, {9, 9}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Rescue Team",  true, {40.75, -73.97}, {2, 4}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Hazmat Unit",  true, {40.73, -73.79}, {5, 7}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Ambulance",    true, {40.69, -74.04}, {7, 3}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Fire Truck",   true, {40.76, -73.98}, {1, 8}, "None", -1});
    responseUnits.push_back({nextUnitId++, "Police Car",   true, {40.78, -73.97}, {6, 2}, "None", -1});

    for (const auto& unit : responseUnits) {
        placeOnGrid(unit.gridPos.first, unit.gridPos.second, CELL_UNIT);
    }
    logAction("System initialized -- " + to_string(responseUnits.size()) + " units online, " + to_string(GRID_ROWS) + "x" + to_string(GRID_COLS) + " city grid active");
}

bool engineDispatchNext(Emergency& eOut, ResponseUnit& uOut, int& distOut, string& errOut) {
    if (triageQueue.empty()) {
        errOut = "No emergencies pending in the priority queue.";
        return false;
    }
    Emergency e = triageQueue.top();
    triageQueue.pop();

    map<string, string> typeToUnit = {
        {"Fire", "Fire Truck"},    {"Medical", "Ambulance"},
        {"Crime", "Police Car"},   {"Earthquake", "Rescue Team"},
        {"Hazmat", "Hazmat Unit"}, {"Flood", "Rescue Team"},
        {"Accident", "Ambulance"}, {"Other", "Police Car"}
    };
    string preferredUnit = "Police Car";
    if (typeToUnit.count(e.type)) preferredUnit = typeToUnit[e.type];

    int unitIdx = findNearestUnit(preferredUnit, e.gridPos);
    if (unitIdx == -1) {
        auto mapIt = emergencyIndex.find(e.id);
        if (mapIt != emergencyIndex.end()) {
            allEmergencies[mapIt->second].status = "Waiting";
        }
        logAction("WAITING: Emergency #" + to_string(e.id) + " -- No units available");
        errOut = "No compatible units currently available for dispatch.";
        eOut = e;
        return false;
    }

    ResponseUnit& unit = responseUnits[unitIdx];
    int dist = manhattanDistance(unit.gridPos, e.gridPos);
    unit.available = false;
    unit.assignedEmergency = "Emergency #" + to_string(e.id) + " (" + e.type + ")";
    unit.assignedEmergencyId = e.id;

    auto mapIt = emergencyIndex.find(e.id);
    if (mapIt != emergencyIndex.end()) {
        allEmergencies[mapIt->second].status = "Dispatched";
        allEmergencies[mapIt->second].assignedUnitId = unit.id;
        eOut = allEmergencies[mapIt->second];
    }

    logAction("DISPATCHED: Emergency #" + to_string(e.id) + " (" + e.type + ") -- " + unit.type + " #" + to_string(unit.id) + " (dist: " + to_string(dist) + " blocks)");
    uOut = unit;
    distOut = dist;
    return true;
}

int engineSimulateStep() {
    int movedCount = 0;
    for (int i = 0; i < (int)responseUnits.size(); i++) {
        if (!responseUnits[i].available && responseUnits[i].assignedEmergencyId != -1) {
            ResponseUnit& u = responseUnits[i];
            auto mapIt = emergencyIndex.find(u.assignedEmergencyId);
            if (mapIt != emergencyIndex.end()) {
                pair<int,int> target = allEmergencies[mapIt->second].gridPos;
                if (u.gridPos != target) {
                    clearFromGrid(u.gridPos.first, u.gridPos.second);
                    if (u.gridPos.first != target.first) u.gridPos.first += (target.first > u.gridPos.first) ? 1 : -1;
                    else if (u.gridPos.second != target.second) u.gridPos.second += (target.second > u.gridPos.second) ? 1 : -1;
                    placeOnGrid(u.gridPos.first, u.gridPos.second, CELL_UNIT);
                    movedCount++;
                }
            }
        }
    }
    if (movedCount > 0) logAction("SIMULATION: Advanced " + to_string(movedCount) + " units by 1 block");
    return movedCount;
}

bool engineResolveEmergency(int id, Emergency& eOut, ResponseUnit& uOut, string& errOut) {
    auto mapIt = emergencyIndex.find(id);
    if (mapIt == emergencyIndex.end()) {
        errOut = "Emergency not found.";
        return false;
    }
    Emergency& e = allEmergencies[mapIt->second];
    if (e.status == "Resolved") {
        errOut = "Emergency is already resolved.";
        return false;
    }
    e.status = "Resolved";
    clearFromGrid(e.gridPos.first, e.gridPos.second);
    logAction("RESOLVED: Emergency #" + to_string(e.id) + " -- " + e.type);
    eOut = e;

    if (e.assignedUnitId != -1) {
        for (auto& u : responseUnits) {
            if (u.id == e.assignedUnitId) {
                u.available = true;
                u.assignedEmergency = "None";
                u.assignedEmergencyId = -1;
                uOut = u;
                logAction("UNIT FREED: " + u.type + " #" + to_string(u.id));
                return true;
            }
        }
    }
    return true;
}
