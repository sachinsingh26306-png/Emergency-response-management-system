// GeminiAPI.cpp
// Implementation of Gemini AI integration using native system curl and regex.

#include "GeminiAPI.h"
#include <iostream>
#include <cstdlib>
#include <cstdio>
#include <regex>
#include <memory>

using namespace std;

// Escapes double quotes for JSON payload
string escapeJSON(const string& s) {
    string res;
    for (char c : s) {
        if (c == '"') res += "\\\"";
        else res += c;
    }
    return res;
}

// Un-escapes JSON stringified newlines and quotes
string unescapeJSONString(const string& s) {
    string res;
    for (size_t i = 0; i < s.length(); ++i) {
        if (s[i] == '\\' && i + 1 < s.length()) {
            if (s[i+1] == 'n') { res += '\n'; ++i; }
            else if (s[i+1] == '"') { res += '"'; ++i; }
            else if (s[i+1] == '\\') { res += '\\'; ++i; }
            else { res += s[i+1]; ++i; }
        } else {
            res += s[i];
        }
    }
    return res;
}

// Helper to extract a string field using regex
string extractStringField(const string& json, const string& field) {
    regex r("\"" + field + "\"\\s*:\\s*\"([^\"]+)\"");
    smatch match;
    if (regex_search(json, match, r)) {
        return match[1].str();
    }
    return "";
}

// Helper to extract an integer field using regex
int extractIntField(const string& json, const string& field, int defaultVal) {
    regex r("\"" + field + "\"\\s*:\\s*(-?\\d+)");
    smatch match;
    if (regex_search(json, match, r)) {
        return stoi(match[1].str());
    }
    return defaultVal;
}

AIAnalysis analyzeEmergencyWithAI(const string& description) {
    AIAnalysis result;
    result.success = false;

    // SECURITY: API key is read from environment variable, never hard-coded.
    const char* apiKey = getenv("GEMINI_API_KEY");
    if (!apiKey) {
        result.errorMessage = "GEMINI_API_KEY environment variable is not set. Please set it to use AI.";
        return result;
    }

    // Prepare the prompt to enforce strict JSON structure
    string prompt = "Analyze this emergency report and return ONLY a valid JSON object. "
                    "Do not include markdown blocks around it, just raw JSON. "
                    "Extract the following fields:\n"
                    "- type (must be one of: Fire, Medical, Earthquake, Flood, Accident, Crime, Hazmat, Other)\n"
                    "- severity (integer 1 to 10)\n"
                    "- peopleAffected (integer)\n"
                    "- gridRow (integer 0 to 9 representing location)\n"
                    "- gridCol (integer 0 to 9 representing location)\n"
                    "- locationName (short string)\n"
                    "- traffic (string e.g. HIGH/LOW/CLEAR)\n"
                    "- urgency (string e.g. CRITICAL/HIGH/MODERATE/LOW)\n"
                    "- summary (short string description)\n\n"
                    "Report: " + description;

    string escapedPrompt = escapeJSON(prompt);
    string url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" + string(apiKey);
    
    // Write the payload to a temporary file to avoid command-line escaping nightmares
    FILE* tempFile = fopen("gemini_payload.json", "w");
    if (!tempFile) {
        result.errorMessage = "Failed to create temporary file for API payload.";
        return result;
    }
    fprintf(tempFile, "{\"contents\": [{\"parts\":[{\"text\": \"%s\"}]}]}", escapedPrompt.c_str());
    fclose(tempFile);

    // Call curl via popen (Windows 10+ includes curl natively)
    string cmd = "curl.exe -s -X POST -H \"Content-Type: application/json\" -d @gemini_payload.json \"" + url + "\"";
    string response;

#ifdef _WIN32
    FILE* pipe = _popen(cmd.c_str(), "r");
#else
    FILE* pipe = popen(cmd.c_str(), "r");
#endif

    if (!pipe) {
        result.errorMessage = "Failed to execute curl. Is curl available on the system path?";
        remove("gemini_payload.json");
        return result;
    }

    char buffer[256];
    while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
        response += buffer;
    }
    
#ifdef _WIN32
    _pclose(pipe);
#else
    pclose(pipe);
#endif

    remove("gemini_payload.json");

    // Basic API error check
    if (response.find("\"error\"") != string::npos) {
        result.errorMessage = "API Error: " + extractStringField(response, "message");
        if (result.errorMessage.empty()) result.errorMessage = "Unknown API error (Invalid Key or Quota Exceeded?)";
        return result;
    }

    // Extract the text content from Gemini's response structure
    regex textRegex("\"text\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");
    smatch textMatch;
    string aiText;
    if (regex_search(response, textMatch, textRegex)) {
        aiText = unescapeJSONString(textMatch[1].str());
    } else {
        result.errorMessage = "Failed to parse AI response. Unexpected format.";
        return result;
    }

    // Parse the structured data
    result.type = extractStringField(aiText, "type");
    if (result.type.empty()) result.type = "Other";
    
    result.severity = extractIntField(aiText, "severity", 5);
    // Validate severity bounds
    if (result.severity < 1) result.severity = 1;
    if (result.severity > 10) result.severity = 10;

    result.peopleAffected = extractIntField(aiText, "peopleAffected", 0);
    
    result.gridPos.first = extractIntField(aiText, "gridRow", 5);
    result.gridPos.second = extractIntField(aiText, "gridCol", 5);
    // Validate grid bounds
    if (result.gridPos.first < 0) result.gridPos.first = 0;
    if (result.gridPos.first > 9) result.gridPos.first = 9;
    if (result.gridPos.second < 0) result.gridPos.second = 0;
    if (result.gridPos.second > 9) result.gridPos.second = 9;

    result.locationName = extractStringField(aiText, "locationName");
    if (result.locationName.empty()) result.locationName = "Unknown Location";
    
    result.traffic = extractStringField(aiText, "traffic");
    result.urgency = extractStringField(aiText, "urgency");
    result.summary = extractStringField(aiText, "summary");

    result.success = true;
    return result;
}
