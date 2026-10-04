// main.cpp
// Entry point for the Emergency Response Command Center.

#include "Emergency.h"
#include "ApiServer.h"
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
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
        runEngine();
    }
    return 0;
}
