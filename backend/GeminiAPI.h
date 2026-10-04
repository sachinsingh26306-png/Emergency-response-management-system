// GeminiAPI.h
// Provides a simple, dependency-free C++ interface to the Gemini API.

#ifndef GEMINI_API_H
#define GEMINI_API_H

#include <string>
#include <utility>

using namespace std;

// Structured data extracted from natural language by Gemini
struct AIAnalysis {
    string type;             // Fire, Medical, Earthquake, Flood, Accident, Crime, Hazmat, Other
    int severity;            // 1-10
    int peopleAffected;      // Integer
    pair<int, int> gridPos;  // Row, Col (0-9)
    string locationName;     // String name
    string traffic;          // e.g. HIGH, LOW
    string urgency;          // e.g. CRITICAL, MODERATE
    string summary;          // Short description
    
    bool success;            // True if API call and parsing succeeded
    string errorMessage;     // Populated if success is false
};

// Sends the natural language description to Gemini and returns parsed data
AIAnalysis analyzeEmergencyWithAI(const string& description);

#endif
