#ifndef EMERGENCY_H
#define EMERGENCY_H

#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <stack>
#include <queue>
#include <deque>
#include <algorithm>
#include <iomanip>
#include <cmath>
#include <ctime>
#include <sstream>
#include <utility>
#include <limits>

using namespace std;

// ======================== CITY GRID CONSTANTS ========================

const int GRID_ROWS = 10;
const int GRID_COLS = 10;

// Grid cell markers
const char CELL_ROAD     = '.';
const char CELL_BUILDING = '#';
const char CELL_HOSPITAL = 'H';
const char CELL_STATION  = 'S';
const char CELL_EMERGENCY = '!';
const char CELL_UNIT      = 'U';

// ======================== STRUCTURES ========================

// Core emergency record — stores all information about a single incident
struct Emergency {
    int id;
    string type;                     // Fire, Medical, Earthquake, Flood, Accident, Crime, Hazmat
    string description;
    pair<double, double> location;   // (latitude, longitude) — STL pair for coordinates
    string locationName;
    pair<int, int> gridPos;          // (row, col) position on city grid — Phase 2
    int severity;                    // 1 (minor) to 10 (catastrophic)
    int peopleAffected;
    string status;                   // Reported, Dispatched, Resolved, Waiting
    double priorityScore;            // Calculated from severity + people + type weight
    string timestamp;
    int assignedUnitId;              // -1 if none assigned — Phase 2
};

// Response unit — a deployable resource (truck, ambulance, etc.)
struct ResponseUnit {
    int id;
    string type;                     // Fire Truck, Ambulance, Police Car, Rescue Team, Hazmat Unit
    bool available;
    pair<double, double> location;   // Current position (lat/lon)
    pair<int, int> gridPos;          // (row, col) on city grid — Phase 2
    string assignedEmergency;        // "None" or assignment description
    int assignedEmergencyId;         // -1 if none — Phase 2
};

// Comparator for priority_queue — higher priorityScore = higher urgency (max-heap)
struct ComparePriority {
    bool operator()(const Emergency& a, const Emergency& b) {
        return a.priorityScore < b.priorityScore;
    }
};

// ======================== GLOBAL DATA STRUCTURES ========================
// Each container serves a specific, justified role in the system.

// vector — Dynamic storage of all emergency records
extern vector<Emergency> allEmergencies;

// map — O(log n) lookup of emergency ID to its index in the vector
extern map<int, int> emergencyIndex;

// set — Tracks unique emergency types and unique active locations
extern set<string> emergencyTypes;
extern set<string> activeLocations;

// priority_queue — Triage queue: highest-priority emergency is always on top
extern priority_queue<Emergency, vector<Emergency>, ComparePriority> triageQueue;

// queue — FIFO arrival order; demonstrates contrast with priority-based processing
extern queue<int> arrivalQueue;

// stack — Action history; most recent action on top (undo-style log)
extern stack<string> actionHistory;

// deque — Bounded event buffer; new events pushed to front, old ones trimmed from back
extern deque<string> eventLog;

// vector — All available response units
extern vector<ResponseUnit> responseUnits;

// 2D array — City grid (Phase 2)
extern char cityGrid[GRID_ROWS][GRID_COLS];

// ID counters
extern int nextEmergencyId;
extern int nextUnitId;

// ======================== FUNCTION DECLARATIONS ========================

// --- DataStructures.cpp ---
string getCurrentTimestamp();
double calculatePriority(const Emergency& e);
void addEmergency(const Emergency& e);
void addToEventLog(const string& event);
void logAction(const string& action);
void displayEmergencyBrief(const Emergency& e);
void displayEmergencyDetail(const Emergency& e);
void displayAllEmergencies();
void displayPriorityQueue();
void displayActionHistory();
void displayResponseUnits();
void displayCityGrid();
void initCityGrid();
void placeOnGrid(int row, int col, char marker);
void clearFromGrid(int row, int col);

// --- Algorithms.cpp ---
Emergency* searchById(int id);
Emergency* linearSearchById(int id);
int binarySearchById(vector<Emergency>& sorted, int targetId);
vector<Emergency> searchByType(const string& type);
void selectionSortBySeverity(vector<Emergency>& v, bool descending = true);
void sortByPriority(vector<Emergency>& v, bool descending = true);
int manhattanDistance(pair<int,int> a, pair<int,int> b);
int findNearestUnit(const string& unitType, pair<int,int> emergencyPos);

// --- EmergencyEngine.cpp ---
void initializeSystem();
void showBanner();
bool engineDispatchNext(Emergency& eOut, ResponseUnit& uOut, int& distOut, string& errOut);
int engineSimulateStep();
bool engineResolveEmergency(int id, Emergency& eOut, ResponseUnit& uOut, string& errOut);

#endif
