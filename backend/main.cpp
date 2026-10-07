// main.cpp
// Entry point for the Emergency Response Command Center.

#include "Emergency.h"
#include "ApiServer.h"
#include <iostream>
#include <string>
#include <fstream>
#include <cstdlib>

#include <vector>
#include <filesystem>
#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#endif

void loadEnvFile() {
    std::vector<std::string> candidatePaths = {
        "backend/.env",
        ".env",
        "../backend/.env",
        "EmergencyResponse/backend/.env"
    };

#ifdef _WIN32
    char modulePath[MAX_PATH];
    DWORD len = GetModuleFileNameA(NULL, modulePath, MAX_PATH);
    if (len > 0 && len < MAX_PATH) {
        try {
            std::filesystem::path exeDir = std::filesystem::path(modulePath).parent_path();
            candidatePaths.insert(candidatePaths.begin(), (exeDir / ".env").string());
            candidatePaths.insert(candidatePaths.begin(), (exeDir / "backend" / ".env").string());
        } catch (...) {}
    }
#endif

    std::ifstream file;
    for (const auto& path : candidatePaths) {
        file.open(path);
        if (file.is_open()) {
            break;
        }
    }

    if (!file.is_open()) return;

    std::string line;
    while (std::getline(file, line)) {
        if (line.empty() || line[0] == '#') continue;
        size_t pos = line.find('=');
        if (pos != std::string::npos) {
            std::string key = line.substr(0, pos);
            std::string value = line.substr(pos + 1);
            
            auto trim = [](std::string& s) {
                size_t first = s.find_first_not_of(" \t\r\n");
                if (first == std::string::npos) {
                    s.clear();
                    return;
                }
                size_t last = s.find_last_not_of(" \t\r\n");
                s = s.substr(first, last - first + 1);
            };
            trim(key);
            trim(value);

            if (value.size() >= 2) {
                if ((value.front() == '"' && value.back() == '"') ||
                    (value.front() == '\'' && value.back() == '\'')) {
                    value = value.substr(1, value.size() - 2);
                }
            }

            if (!key.empty()) {
#ifdef _WIN32
                _putenv_s(key.c_str(), value.c_str());
#else
                setenv(key.c_str(), value.c_str(), 1);
#endif
            }
        }
    }
}

int main(int argc, char* argv[]) {
    loadEnvFile();
    initializeSystem();
    
    bool runApi = false;
    for (int i = 1; i < argc; i++) {
        if (std::string(argv[i]) == "--api") {
            runApi = true;
        }
    }

    if (runApi) {
        startApiServer(8080);
    } else {
        std::cout << "The interactive CLI has been removed. Please run with --api to start the server.\n";
    }
    return 0;
}
