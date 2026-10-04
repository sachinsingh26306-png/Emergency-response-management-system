// ApiServer.cpp
#include "httplib.h"
#include "ApiServer.h"
#include "Emergency.h"
#include "GeminiAPI.h"
#include "json.hpp"
#include <iostream>

using namespace httplib;
using json = nlohmann::json;

static json emergencyToJson(const Emergency& e) {
    return {
        {"id", e.id},
        {"type", e.type},
        {"description", e.description},
        {"location", e.locationName},
        {"locationName", e.locationName},
        {"locationCoords", {e.location.first, e.location.second}},
        {"gridX", e.gridPos.first},
        {"gridY", e.gridPos.second},
        {"gridPos", {e.gridPos.first, e.gridPos.second}},
        {"severity", e.severity},
        {"peopleAffected", e.peopleAffected},
        {"status", e.status},
        {"priority", e.priorityScore},
        {"priorityScore", e.priorityScore},
        {"timestamp", e.timestamp},
        {"assignedUnitId", e.assignedUnitId},
        {"traffic", "Normal"},
        {"urgency", e.severity >= 8 ? "Critical" : (e.severity >= 5 ? "Moderate" : "Low")},
        {"summary", e.description}
    };
}

static json unitToJson(const ResponseUnit& u) {
    return {
        {"id", u.id},
        {"type", u.type},
        {"status", u.available ? "AVAILABLE" : "BUSY"},
        {"available", u.available},
        {"gridX", u.gridPos.first},
        {"gridY", u.gridPos.second},
        {"gridPos", {u.gridPos.first, u.gridPos.second}},
        {"location", {u.location.first, u.location.second}},
        {"assignedEmergency", u.assignedEmergency},
        {"assignedEmergencyId", u.assignedEmergencyId}
    };
}

void startApiServer(int port) {
    Server svr;
    
    // CORS middleware
    svr.set_post_routing_handler([](const Request&, Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
    });

    svr.Options(R"(.*)", [](const Request&, Response& res) {
        res.status = 200;
    });

    // GET /api/state
    svr.Get("/api/state", [](const Request&, Response& res) {
        json state;
        
        // Emergencies
        state["emergencies"] = json::array();
        int reportedCount = 0, dispatchedCount = 0, resolvedCount = 0, waitingCount = 0;
        for (const auto& e : allEmergencies) {
            state["emergencies"].push_back(emergencyToJson(e));
            if (e.status == "Reported") reportedCount++;
            else if (e.status == "Dispatched") dispatchedCount++;
            else if (e.status == "Resolved") resolvedCount++;
            else if (e.status == "Waiting") waitingCount++;
        }
        
        // Units
        state["units"] = json::array();
        int availableUnits = 0, busyUnits = 0;
        for (const auto& u : responseUnits) {
            state["units"].push_back(unitToJson(u));
            if (u.available) availableUnits++;
            else busyUnits++;
        }
        
        // Grid
        state["grid"] = json::array();
        for (int r = 0; r < GRID_ROWS; r++) {
            json row = json::array();
            for (int c = 0; c < GRID_COLS; c++) {
                row.push_back(std::string(1, cityGrid[r][c]));
            }
            state["grid"].push_back(row);
        }
        
        // Priority Queue (preserve original)
        auto tempTriage = triageQueue;
        state["priorityQueue"] = json::array();
        state["triageQueue"] = json::array();
        while (!tempTriage.empty()) {
            json item = emergencyToJson(tempTriage.top());
            state["priorityQueue"].push_back(item);
            state["triageQueue"].push_back(item);
            tempTriage.pop();
        }

        // Arrival Queue
        auto tempArrival = arrivalQueue;
        state["arrivalQueue"] = json::array();
        while (!tempArrival.empty()) {
            state["arrivalQueue"].push_back(tempArrival.front());
            tempArrival.pop();
        }

        // Action History (Stack)
        auto tempHistory = actionHistory;
        state["actionHistory"] = json::array();
        while (!tempHistory.empty()) {
            state["actionHistory"].push_back(tempHistory.top());
            tempHistory.pop();
        }

        // Recent Actions (Deque)
        state["recentActions"] = json::array();
        state["eventLog"] = json::array();
        for (const auto& evt : eventLog) {
            state["recentActions"].push_back(evt);
            state["eventLog"].push_back(evt);
        }

        // Summary statistics
        state["summaryStatistics"] = {
            {"totalEmergencies", (int)allEmergencies.size()},
            {"reported", reportedCount},
            {"dispatched", dispatchedCount},
            {"resolved", resolvedCount},
            {"waiting", waitingCount},
            {"availableUnits", availableUnits},
            {"busyUnits", busyUnits},
            {"activeEmergencies", reportedCount + dispatchedCount + waitingCount}
        };

        // DSA container sizes
        state["dsa"] = {
            {"vectorSize", allEmergencies.size()},
            {"mapSize", emergencyIndex.size()},
            {"setTypesSize", emergencyTypes.size()},
            {"setLocationsSize", activeLocations.size()},
            {"triageQueueSize", triageQueue.size()},
            {"arrivalQueueSize", arrivalQueue.size()},
            {"stackSize", actionHistory.size()},
            {"dequeSize", eventLog.size()}
        };

        res.set_content(state.dump(), "application/json");
    });

    // POST /api/emergencies
    svr.Post("/api/emergencies", [](const Request& req, Response& res) {
        try {
            auto body = json::parse(req.body);
            Emergency e;
            e.id = nextEmergencyId++;
            e.assignedUnitId = -1;
            
            e.type = body.value("type", "Other");
            e.severity = body.value("severity", 5);
            e.peopleAffected = body.value("peopleAffected", 1);
            
            if (body.contains("location")) {
                e.locationName = body["location"];
            } else if (body.contains("locationName")) {
                e.locationName = body["locationName"];
            } else {
                e.locationName = "Downtown";
            }

            if (body.contains("description")) {
                e.description = body["description"];
            } else {
                e.description = e.locationName + " - " + e.type;
            }

            int gx = body.contains("gridX") ? body["gridX"].get<int>() : (body.contains("gridRow") ? body["gridRow"].get<int>() : 0);
            int gy = body.contains("gridY") ? body["gridY"].get<int>() : (body.contains("gridCol") ? body["gridCol"].get<int>() : 0);
            if (gx < 0) {
                gx = 0;
            }
            if (gx >= GRID_ROWS) {
                gx = GRID_ROWS - 1;
            }
            if (gy < 0) {
                gy = 0;
            }
            if (gy >= GRID_COLS) {
                gy = GRID_COLS - 1;
            }
            e.gridPos = {gx, gy};

            e.location.first  = 40.70 + e.gridPos.first * 0.01;
            e.location.second = -74.00 + e.gridPos.second * 0.01;
            
            e.status = "Reported";
            e.priorityScore = calculatePriority(e);
            e.timestamp = getCurrentTimestamp();

            addEmergency(e);
            placeOnGrid(e.gridPos.first, e.gridPos.second, CELL_EMERGENCY);
            logAction("REPORTED: Emergency #" + std::to_string(e.id) + " -- " + e.type
                      + " at " + e.locationName + " (" + std::to_string(e.gridPos.first)
                      + "," + std::to_string(e.gridPos.second) + ") [Priority: "
                      + std::to_string((int)e.priorityScore) + "]");

            res.status = 201;
            res.set_content(json{
                {"success", true},
                {"emergency", emergencyToJson(e)}
            }.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{
                {"success", false},
                {"error", std::string("Invalid JSON: ") + e.what()}
            }.dump(), "application/json");
        }
    });

    // POST /api/ai-emergency (and alias /api/emergencies/ai/analyze)
    auto handleAiEmergency = [](const Request& req, Response& res) {
        try {
            auto body = json::parse(req.body);
            if (!body.contains("description") || body["description"].get<std::string>().empty()) {
                res.status = 400;
                res.set_content(json{
                    {"success", false},
                    {"error", "Description is required"}
                }.dump(), "application/json");
                return;
            }

            std::string desc = body["description"];
            AIAnalysis aiData = analyzeEmergencyWithAI(desc);
            
            if (!aiData.success) {
                res.status = 500;
                res.set_content(json{
                    {"success", false},
                    {"error", aiData.errorMessage}
                }.dump(), "application/json");
                return;
            }

            // Create emergency into engine
            Emergency e;
            e.id = nextEmergencyId++;
            e.assignedUnitId = -1;
            e.type = aiData.type;
            e.description = aiData.summary.empty() ? desc : aiData.summary;
            e.locationName = aiData.locationName;
            e.gridPos = aiData.gridPos;
            if (e.gridPos.first < 0) {
                e.gridPos.first = 0;
            }
            if (e.gridPos.first >= GRID_ROWS) {
                e.gridPos.first = GRID_ROWS - 1;
            }
            if (e.gridPos.second < 0) {
                e.gridPos.second = 0;
            }
            if (e.gridPos.second >= GRID_COLS) {
                e.gridPos.second = GRID_COLS - 1;
            }

            e.location.first  = 40.70 + e.gridPos.first * 0.01;
            e.location.second = -74.00 + e.gridPos.second * 0.01;
            e.severity = aiData.severity;
            e.peopleAffected = aiData.peopleAffected;
            e.status = "Reported";
            e.priorityScore = calculatePriority(e);
            e.timestamp = getCurrentTimestamp();

            addEmergency(e);
            placeOnGrid(e.gridPos.first, e.gridPos.second, CELL_EMERGENCY);
            logAction("REPORTED (AI): Emergency #" + std::to_string(e.id) + " -- " + e.type
                      + " at " + e.locationName + " [Priority: "
                      + std::to_string((int)e.priorityScore) + "]");

            json aiAnalysis = {
                {"type", aiData.type},
                {"severity", aiData.severity},
                {"peopleAffected", aiData.peopleAffected},
                {"gridX", aiData.gridPos.first},
                {"gridY", aiData.gridPos.second},
                {"location", aiData.locationName},
                {"traffic", aiData.traffic},
                {"urgency", aiData.urgency},
                {"summary", aiData.summary}
            };

            res.status = 201;
            res.set_content(json{
                {"success", true},
                {"aiAnalysis", aiAnalysis},
                {"emergency", emergencyToJson(e)}
            }.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{
                {"success", false},
                {"error", std::string("Invalid JSON: ") + e.what()}
            }.dump(), "application/json");
        }
    };

    svr.Post("/api/ai-emergency", handleAiEmergency);
    
    svr.Post("/api/emergencies/ai/analyze", [](const Request& req, Response& res) {
        try {
            auto body = json::parse(req.body);
            std::string desc = body.value("description", "");
            if (desc.empty()) {
                res.status = 400;
                res.set_content(json{{"success", false}, {"error", "Description is required"}}.dump(), "application/json");
                return;
            }

            AIAnalysis aiData = analyzeEmergencyWithAI(desc);
            if (!aiData.success) {
                res.status = 500;
                res.set_content(json{{"success", false}, {"error", aiData.errorMessage}}.dump(), "application/json");
                return;
            }

            json aiAnalysis = {
                {"type", aiData.type},
                {"severity", aiData.severity},
                {"peopleAffected", aiData.peopleAffected},
                {"gridX", aiData.gridPos.first},
                {"gridY", aiData.gridPos.second},
                {"location", aiData.locationName},
                {"traffic", aiData.traffic},
                {"urgency", aiData.urgency},
                {"summary", aiData.summary}
            };

            res.status = 200;
            res.set_content(json{
                {"success", true},
                {"aiAnalysis", aiAnalysis}
            }.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"success", false}, {"error", std::string("Invalid JSON: ") + e.what()}}.dump(), "application/json");
        }
    });

    // POST /api/dispatch
    svr.Post("/api/dispatch", [](const Request&, Response& res) {
        if (triageQueue.empty()) {
            res.status = 409;
            res.set_content(json{
                {"success", false},
                {"error", "No emergencies pending in the priority queue."}
            }.dump(), "application/json");
            return;
        }

        Emergency e = triageQueue.top();
        triageQueue.pop();

        std::map<std::string, std::string> typeToUnit = {
            {"Fire", "Fire Truck"},    {"Medical", "Ambulance"},
            {"Crime", "Police Car"},   {"Earthquake", "Rescue Team"},
            {"Hazmat", "Hazmat Unit"}, {"Flood", "Rescue Team"},
            {"Accident", "Ambulance"}, {"Other", "Police Car"}
        };

        std::string preferredUnit = "Police Car";
        if (typeToUnit.count(e.type)) preferredUnit = typeToUnit[e.type];

        int unitIdx = findNearestUnit(preferredUnit, e.gridPos);

        if (unitIdx == -1) {
            auto mapIt = emergencyIndex.find(e.id);
            if (mapIt != emergencyIndex.end()) {
                allEmergencies[mapIt->second].status = "Waiting";
            }
            logAction("WAITING: Emergency #" + std::to_string(e.id) + " -- No units available");
            res.status = 409;
            res.set_content(json{
                {"success", false},
                {"error", "No compatible units currently available for dispatch."},
                {"emergency", emergencyToJson(e)}
            }.dump(), "application/json");
            return;
        }

        ResponseUnit& unit = responseUnits[unitIdx];
        int dist = manhattanDistance(unit.gridPos, e.gridPos);

        unit.available = false;
        unit.assignedEmergency = "Emergency #" + std::to_string(e.id) + " (" + e.type + ")";
        unit.assignedEmergencyId = e.id;

        auto mapIt = emergencyIndex.find(e.id);
        if (mapIt != emergencyIndex.end()) {
            allEmergencies[mapIt->second].status = "Dispatched";
            allEmergencies[mapIt->second].assignedUnitId = unit.id;
            e = allEmergencies[mapIt->second];
        }

        logAction("DISPATCHED: Emergency #" + std::to_string(e.id) + " (" + e.type
                  + ") -- " + unit.type + " #" + std::to_string(unit.id)
                  + " (dist: " + std::to_string(dist) + " blocks)");

        res.status = 200;
        res.set_content(json{
            {"success", true},
            {"dispatchedEmergency", emergencyToJson(e)},
            {"assignedUnit", unitToJson(unit)},
            {"distance", dist}
        }.dump(), "application/json");
    });

    // POST /api/simulate
    svr.Post("/api/simulate", [](const Request&, Response& res) {
        int movedCount = 0;
        for (int i = 0; i < (int)responseUnits.size(); i++) {
            if (!responseUnits[i].available && responseUnits[i].assignedEmergencyId != -1) {
                ResponseUnit& u = responseUnits[i];
                auto mapIt = emergencyIndex.find(u.assignedEmergencyId);
                if (mapIt != emergencyIndex.end()) {
                    std::pair<int,int> target = allEmergencies[mapIt->second].gridPos;
                    if (u.gridPos != target) {
                        clearFromGrid(u.gridPos.first, u.gridPos.second);
                        if (u.gridPos.first != target.first) {
                            u.gridPos.first += (target.first > u.gridPos.first) ? 1 : -1;
                        } else if (u.gridPos.second != target.second) {
                            u.gridPos.second += (target.second > u.gridPos.second) ? 1 : -1;
                        }
                        placeOnGrid(u.gridPos.first, u.gridPos.second, CELL_UNIT);
                        movedCount++;
                    }
                }
            }
        }
        if (movedCount > 0) {
            logAction("SIMULATED: Advanced " + std::to_string(movedCount) + " units by 1 step.");
        }

        json unitsArr = json::array();
        for (const auto& u : responseUnits) {
            unitsArr.push_back(unitToJson(u));
        }

        json gridArr = json::array();
        for (int r = 0; r < GRID_ROWS; r++) {
            json row = json::array();
            for (int c = 0; c < GRID_COLS; c++) {
                row.push_back(std::string(1, cityGrid[r][c]));
            }
            gridArr.push_back(row);
        }

        res.status = 200;
        res.set_content(json{
            {"success", true},
            {"movedCount", movedCount},
            {"units", unitsArr},
            {"grid", gridArr}
        }.dump(), "application/json");
    });

    // POST /api/resolve
    svr.Post("/api/resolve", [](const Request& req, Response& res) {
        try {
            auto body = json::parse(req.body);
            if (!body.contains("id")) {
                res.status = 400;
                res.set_content(json{
                    {"success", false},
                    {"error", "Emergency ID is required"}
                }.dump(), "application/json");
                return;
            }

            int id = body["id"];
            Emergency* ep = searchById(id);
            if (!ep) {
                res.status = 404;
                res.set_content(json{
                    {"success", false},
                    {"error", "Emergency not found"}
                }.dump(), "application/json");
                return;
            }
            if (ep->status != "Dispatched") {
                res.status = 400;
                res.set_content(json{
                    {"success", false},
                    {"error", "Emergency is not in Dispatched state"}
                }.dump(), "application/json");
                return;
            }

            ep->status = "Resolved";
            clearFromGrid(ep->gridPos.first, ep->gridPos.second);

            ResponseUnit* freedUnit = nullptr;
            for (auto& unit : responseUnits) {
                if (unit.assignedEmergencyId == id) {
                    unit.available = true;
                    unit.assignedEmergency = "None";
                    unit.assignedEmergencyId = -1;
                    placeOnGrid(unit.gridPos.first, unit.gridPos.second, CELL_UNIT);
                    freedUnit = &unit;
                    break;
                }
            }

            logAction("RESOLVED: Emergency #" + std::to_string(id) + " (" + ep->type + ") at " + ep->locationName);
            
            res.status = 200;
            res.set_content(json{
                {"success", true},
                {"resolvedEmergency", emergencyToJson(*ep)},
                {"assignedUnit", freedUnit ? unitToJson(*freedUnit) : nullptr}
            }.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{
                {"success", false},
                {"error", std::string("Invalid JSON: ") + e.what()}
            }.dump(), "application/json");
        }
    });

    std::cout << "[API] Emergency Response API running on http://localhost:" << port << "\n";
    std::cout.flush();
    svr.listen("0.0.0.0", port);
}
