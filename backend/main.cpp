// main.cpp
// Entry point for the Emergency Response Command Center.

#include "Emergency.h"
#include "ApiServer.h"
#include <iostream>
#include <string>
#include <fstream>
#include <cstdlib>


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
        std::cout << "The interactive CLI has been removed. Please run with --api to start the server.\n";
    }
    return 0;
}
