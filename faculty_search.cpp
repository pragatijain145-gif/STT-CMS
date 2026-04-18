/*
 * ============================================================
 *  Smart Timetable & Classroom Monitoring System
 *  MITS Gwalior — Faculty Authentication Module
 *  Algorithm: Linear Search
 * ============================================================
 */

#include <iostream>
#include <string>
using namespace std;

// ── Linear Search Function ─────────────────────────────────
// Searches for 'query' in 'faculty[]' array of size 'n'.
// Returns the INDEX if found, -1 if not found.
// Time Complexity : O(n)
// Space Complexity: O(1)
int linearSearch(string faculty[], int n, string query) {
    for (int i = 0; i < n; i++) {
        if (faculty[i] == query) {
            return i;   // Found at index i
        }
    }
    return -1;          // Not found
}

// ── Authorized Faculty List ────────────────────────────────
// Only these faculty members are allowed to log in.
const int FACULTY_COUNT = 3;
string authorizedFaculty[FACULTY_COUNT] = {
    "Tejaswita Mishra",
    "Gulshan Soni",
    "Suchitra Agrawal"
};

// ── Department List ────────────────────────────────────────
string departments[] = { "CST", "CSBS" };

// ── Login Function ─────────────────────────────────────────
bool facultyLogin(string inputName, string inputPassword, string inputDept) {
    // Step 1: Validate password length (min 4 chars)
    if (inputPassword.length() < 4) {
        cout << " Password too short (minimum 4 characters).\n";
        return false;
    }

    // Step 2: Validate department
    bool deptValid = false;
    for (int d = 0; d < 2; d++) {
        if (departments[d] == inputDept) { deptValid = true; break; }
    }
    if (!deptValid) {
        cout << "Invalid department selected.\n";
        return false;
    }

    // Step 3: Linear search for faculty name
    int foundIndex = linearSearch(authorizedFaculty, FACULTY_COUNT, inputName);

    if (foundIndex != -1) {
        cout << " Login Successful!\n";
        cout << "   Welcome, " << authorizedFaculty[foundIndex] << "!\n";
        cout << "   Department: " << inputDept << "\n";
        cout << "   Redirecting to Faculty Dashboard...\n";
        return true;
    } else {
        cout << "Access Denied! '" << inputName
             << "' is not in the authorized faculty list.\n";
        cout << "   Authorized faculty members:\n";
        for (int i = 0; i < FACULTY_COUNT; i++) {
            cout << "   [" << i << "] " << authorizedFaculty[i] << "\n";
        }
        return false;
    }
}

// ── Main ───────────────────────────────────────────────────
int main() {
    cout << "==============================================\n";
    cout << "  Smart Classroom Monitoring System\n";
    cout << "  MITS Gwalior — Faculty Login\n";
    cout << "==============================================\n\n";

    string name, password, dept;

    cout << "Enter Faculty Full Name : ";
    getline(cin, name);

    cout << "Enter Password          : ";
    getline(cin, password);

    cout << "Enter Department (CST/CSBS): ";
    getline(cin, dept);

    cout << "\n";
    bool result = facultyLogin(name, password, dept);

    cout << "\nResult: " << (result ? "LOGIN SUCCESS" : "LOGIN FAILED") << "\n";
    return result ? 0 : 1;
}

/*
 * ── ALGORITHM WALKTHROUGH (Linear Search) ──────────────────
 *
 * Given: faculty[] = {"Tejaswita Mishra", "Gulshan Soni", "Suchitra Agrawal"}
 *        n = 3
 *        query = "Gulshan Soni"   (user input)
 *
 * Iteration i=0: faculty[0] = "Tejaswita Mishra" ≠ "Gulshan Soni" → skip
 * Iteration i=1: faculty[1] = "Gulshan Soni"     = "Gulshan Soni" → FOUND at index 1
 * Return: 1 → Login Successful
 *
 * If query = "Unknown Faculty Member":
 * Iteration i=0: "Tejaswita Mishra" ≠ "Unknown Faculty Member" → skip
 * Iteration i=1: "Gulshan Soni"     ≠ "Unknown Faculty Member" → skip
 * Iteration i=2: "Suchitra Agrawal" ≠ "Unknown Faculty Member" → skip
 * Return: -1 → Access Denied
 *
 * ── HOW TO COMPILE & RUN ───────────────────────────────────
 *
 *   g++ -o faculty_auth faculty_auth.cpp
 *   ./faculty_auth
 *
 * ── INTEGRATION WITH WEB SYSTEM ────────────────────────────
 * This C++ logic is mirrored in faculty_login.html using
 * JavaScript (same linear search algorithm).
 * In a full-stack deployment, this C++ code would run as a
 * backend server (e.g., via CGI or a REST API wrapper),
 * and the HTML page would call it via HTTP POST.
 */