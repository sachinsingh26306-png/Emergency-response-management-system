// GeminiAPI.cpp
// Implementation of Gemini AI integration using native system curl and regex.

#include "GeminiAPI.h"
#include <iostream>
#include <cstdlib>
#include <cstdio>
#include <regex>
#include <memory>
#include <thread>
#include <chrono>
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

static bool containsIgnoreCase(const string& text, const string& sub) {
    auto it = std::search(
        text.begin(), text.end(),
        sub.begin(), sub.end(),
        [](char ch1, char ch2) { return std::tolower(ch1) == std::tolower(ch2); }
    );
    return it != text.end();
}

AIAnalysis analyzeEmergencyWithAI(const string& description) {
    AIAnalysis result;
    result.success = false;

    // SECURITY: API key is read from environment variable, never hard-coded.
    const char* apiKey = getenv("GEMINI_API_KEY");
    if (!apiKey || string(apiKey).empty()) {
        result.errorType = "AUTH_ERROR";
        result.errorMessage = "GEMINI_API_KEY environment variable is not set. Please set it in backend/.env to use AI.";
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
    const char* modelEnv = getenv("GEMINI_MODEL");
    string modelName = (modelEnv && string(modelEnv).length() > 0) ? modelEnv : "gemini-3.8-flash";
    string url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + string(apiKey);
    
    const int maxAttempts = 2;
    for (int attempt = 1; attempt <= maxAttempts; ++attempt) {
        // Generate a unique, thread-safe temporary filename
        auto nowStr = std::to_string(std::chrono::steady_clock::now().time_since_epoch().count());
        auto tidStr = std::to_string(std::hash<std::thread::id>{}(std::this_thread::get_id()));
        string tempFileName = "gemini_payload_" + nowStr + "_" + tidStr + ".json";

        FILE* tempFile = fopen(tempFileName.c_str(), "w");
        if (!tempFile) {
            result.errorType = "IO_ERROR";
            result.errorMessage = "Failed to create temporary file for API payload.";
            return result;
        }
        fprintf(tempFile, "{\"contents\": [{\"parts\":[{\"text\": \"%s\"}]}]}", escapedPrompt.c_str());
        fclose(tempFile);

        // Call curl via popen (Windows 10+ includes curl natively)
        // Preserving: --max-time 10 and --connect-timeout 5 for firm timeouts
        string cmd = "curl.exe -s --max-time 10 --connect-timeout 5 -X POST -H \"Content-Type: application/json\" -d @" + tempFileName + " \"" + url + "\"";
        string response;

#ifdef _WIN32
        FILE* pipe = _popen(cmd.c_str(), "r");
#else
        FILE* pipe = popen(cmd.c_str(), "r");
#endif

        if (!pipe) {
            result.errorType = "SYSTEM_ERROR";
            result.errorMessage = "Failed to execute curl. Is curl available on the system path?";
            remove(tempFileName.c_str());
            return result;
        }

        char buffer[256];
        while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
            response += buffer;
        }
        
        int status = -1;
#ifdef _WIN32
        status = _pclose(pipe);
#else
        status = pclose(pipe);
#endif

        remove(tempFileName.c_str());

        if (status != 0) {
            if (attempt < maxAttempts) {
                std::this_thread::sleep_for(std::chrono::milliseconds(1000));
                continue;
            }
            result.errorType = "NETWORK_ERROR";
            result.errorMessage = "API request failed or timed out (Curl exit code: " + std::to_string(status) + ").";
            return result;
        }

        // Basic API error check
        if (response.find("\"error\"") != string::npos) {
            string msg = extractStringField(response, "message");
            int code = extractIntField(response, "code", 0);
            string statusStr = extractStringField(response, "status");

            // 1. Confirmed Exhausted Quota (DO NOT RETRY)
            bool isQuotaExhausted = (code == 429 || statusStr == "RESOURCE_EXHAUSTED") &&
                                    (containsIgnoreCase(msg, "quota") ||
                                     containsIgnoreCase(msg, "free_tier") ||
                                     containsIgnoreCase(msg, "billing"));

            if (isQuotaExhausted) {
                result.errorType = "QUOTA_EXHAUSTED";
                result.errorMessage = "Quota Exhausted (429): " + (msg.empty() ? "Free tier quota exceeded." : msg);
                return result;
            }

            // 2. Temporary Rate Limiting (Retry if attempt 1 and within deadline)
            if (code == 429 || statusStr == "RESOURCE_EXHAUSTED") {
                if (attempt < maxAttempts) {
                    std::this_thread::sleep_for(std::chrono::milliseconds(1500));
                    continue;
                }
                result.errorType = "RATE_LIMIT";
                result.errorMessage = "Rate Limit Exceeded (429): " + (msg.empty() ? "Temporary rate limit exceeded." : msg);
                return result;
            }

            // 3. Service Overload / Unavailable 503 (Preserve bounded retry)
            if (code == 503 || statusStr == "UNAVAILABLE" || containsIgnoreCase(msg, "high demand")) {
                if (attempt < maxAttempts) {
                    std::this_thread::sleep_for(std::chrono::milliseconds(1000));
                    continue;
                }
                result.errorType = "SERVICE_UNAVAILABLE";
                result.errorMessage = "Service Unavailable (503): " + (msg.empty() ? "Service is temporarily overloaded." : msg);
                return result;
            }

            // 4. Authentication / Permission Errors (DO NOT RETRY)
            if (code == 401 || code == 403 || statusStr == "UNAUTHENTICATED" || statusStr == "PERMISSION_DENIED" || containsIgnoreCase(msg, "API key")) {
                result.errorType = "AUTH_ERROR";
                result.errorMessage = "Authentication Error (" + std::to_string(code != 0 ? code : 401) + "): " + (msg.empty() ? "Invalid API key or unauthorized." : msg);
                return result;
            }

            // 5. Request / Argument Errors (DO NOT RETRY)
            if (code == 400 || code == 404 || statusStr == "INVALID_ARGUMENT" || statusStr == "NOT_FOUND") {
                result.errorType = "INVALID_REQUEST";
                result.errorMessage = "Invalid Request (" + std::to_string(code != 0 ? code : 400) + "): " + (msg.empty() ? "Malformed request or resource not found." : msg);
                return result;
            }

            // Other general API errors
            result.errorType = "API_ERROR";
            string codeInfo = code != 0 ? std::to_string(code) : statusStr;
            result.errorMessage = "API Error" + (!codeInfo.empty() ? " (" + codeInfo + ")" : "") + ": " + (msg.empty() ? "Unknown API error." : msg);
            return result;
        }

        // Extract the text content from Gemini's response structure
        regex textRegex("\"text\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");
        smatch textMatch;
        string aiText;
        if (regex_search(response, textMatch, textRegex)) {
            aiText = unescapeJSONString(textMatch[1].str());
        } else {
            if (attempt < maxAttempts) {
                std::this_thread::sleep_for(std::chrono::milliseconds(1000));
                continue;
            }
            result.errorType = "PARSE_ERROR";
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

    return result;
}
