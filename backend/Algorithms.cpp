// Algorithms.cpp
// Searching and sorting algorithms with documented complexity analysis.

#include "Emergency.h"

// ======================== SEARCHING ALGORITHMS ========================

/*
 * Search by ID — Map Lookup
 * Uses STL map::find for balanced-BST-based retrieval.
 *
 * Time Complexity:  O(log n) — balanced BST traversal
 * Space Complexity: O(1)
 * Why: Fast indexed access when the ID is known.
 */
Emergency* searchById(int id) {
    auto it = emergencyIndex.find(id);       // map::find — O(log n)
    if (it != emergencyIndex.end()) {
        return &allEmergencies[it->second];  // vector random access — O(1)
    }
    return nullptr;
}

/*
 * Linear Search by ID
 * Scans the vector element by element until the target is found.
 *
 * Time Complexity:  O(n) — worst case visits every element
 * Space Complexity: O(1)
 * Why: Academic demonstration of brute-force search; contrast with map lookup.
 */
Emergency* linearSearchById(int id) {
    for (int i = 0; i < (int)allEmergencies.size(); i++) {
        if (allEmergencies[i].id == id) {
            return &allEmergencies[i];
        }
    }
    return nullptr;
}

/*
 * Binary Search by ID
 * Classic divide-and-conquer on a sorted array.
 *
 * Time Complexity:  O(log n) — halves search space each iteration
 * Space Complexity: O(1) — iterative, no recursion stack
 * Precondition:     Input vector must be sorted by ID (ascending).
 * Why: Demonstrates that sorted data enables logarithmic search without a map.
 */
int binarySearchById(vector<Emergency>& sorted, int targetId) {
    int low = 0;
    int high = (int)sorted.size() - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;    // avoids integer overflow
        if (sorted[mid].id == targetId) {
            return mid;                       // found
        } else if (sorted[mid].id < targetId) {
            low = mid + 1;                    // search right half
        } else {
            high = mid - 1;                   // search left half
        }
    }
    return -1;  // not found
}

/*
 * Search by Type — Linear Filter
 * Collects all emergencies matching a given type string.
 *
 * Time Complexity:  O(n) — examines every record
 * Space Complexity: O(k) — k = number of matching results
 * Why: Type is not the primary key; a full scan is the straightforward approach.
 */
vector<Emergency> searchByType(const string& type) {
    vector<Emergency> results;
    for (const auto& e : allEmergencies) {
        if (e.type == type) {
            results.push_back(e);
        }
    }
    return results;
}

// ======================== SORTING ALGORITHMS ========================

/*
 * Selection Sort by Severity
 * Repeatedly selects the extreme element and swaps it into position.
 *
 * Time Complexity:  O(n^2) — two nested loops regardless of input
 * Space Complexity: O(1) — in-place swaps
 * Why: Simple quadratic sort suitable for small datasets; easy to explain in viva.
 */
void selectionSortBySeverity(vector<Emergency>& v, bool descending) {
    int n = (int)v.size();
    for (int i = 0; i < n - 1; i++) {
        int sel = i;
        for (int j = i + 1; j < n; j++) {
            if (descending) {
                if (v[j].severity > v[sel].severity) sel = j;
            } else {
                if (v[j].severity < v[sel].severity) sel = j;
            }
        }
        if (sel != i) swap(v[i], v[sel]);
    }
}

/*
 * Sort by Priority Score — STL sort
 * Uses std::sort (introsort: quicksort + heapsort + insertion sort hybrid).
 *
 * Time Complexity:  O(n log n) — guaranteed by the standard
 * Space Complexity: O(log n) — recursion stack
 * Why: Efficient production-grade sort; contrast with O(n^2) selection sort above.
 */
void sortByPriority(vector<Emergency>& v, bool descending) {
    if (descending) {
        sort(v.begin(), v.end(),
             [](const Emergency& a, const Emergency& b) {
                 return a.priorityScore > b.priorityScore;
             });
    } else {
        sort(v.begin(), v.end(),
             [](const Emergency& a, const Emergency& b) {
                 return a.priorityScore < b.priorityScore;
             });
    }
}

// ======================== PHASE 2 — DISTANCE & DISPATCH ALGORITHMS ========================

/*
 * Manhattan Distance on a grid
 * Formula: |r1 - r2| + |c1 - c2|
 *
 * Time Complexity:  O(1)
 * Space Complexity: O(1)
 * Why: Appropriate for grid-based movement (no diagonal movement).
 */
int manhattanDistance(pair<int,int> a, pair<int,int> b) {
    return abs(a.first - b.first) + abs(a.second - b.second);
}

/*
 * Find Nearest Available Unit
 * Scans all response units, finds the closest available one of the preferred type.
 * Falls back to any available unit if the preferred type is exhausted.
 *
 * Time Complexity:  O(u) where u = number of response units
 * Space Complexity: O(1)
 * Returns: index into responseUnits vector, or -1 if none available
 */
int findNearestUnit(const string& unitType, pair<int,int> emergencyPos) {
    int bestIdx = -1;
    int bestDist = INT_MAX;

    // First pass: preferred unit type only
    for (int i = 0; i < (int)responseUnits.size(); i++) {
        if (responseUnits[i].available && responseUnits[i].type == unitType) {
            int dist = manhattanDistance(responseUnits[i].gridPos, emergencyPos);
            if (dist < bestDist) {
                bestDist = dist;
                bestIdx = i;
            }
        }
    }

    // Second pass: any available unit if preferred not found
    if (bestIdx == -1) {
        for (int i = 0; i < (int)responseUnits.size(); i++) {
            if (responseUnits[i].available) {
                int dist = manhattanDistance(responseUnits[i].gridPos, emergencyPos);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
        }
    }

    return bestIdx;
}
