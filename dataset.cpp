#include <sqlite3.h>
#include <iostream>
#include <vector>
#include <string>
using namespace std;

class DatabaseManager {
private:
    sqlite3* DB;

public:
    DatabaseManager() {
        // Opens the database file (creates it if it doesn't exist)
        if (sqlite3_open("campus.db", &DB) != SQLITE_OK) {
            cerr << "Error opening database!" << endl;
        }
        createTables();
    }

    void createTables() {
        string sql = "CREATE TABLE IF NOT EXISTS TIMETABLE("
                    "ID INTEGER PRIMARY KEY AUTOINCREMENT, "
                    "SUBJECT TEXT NOT NULL, "
                    "ROOM TEXT NOT NULL, "
                    "TIME TEXT NOT NULL, "
                    "OCCUPIED INT DEFAULT 0);";
        
        char* messageError;
        sqlite3_exec(DB, sql.c_str(), NULL, 0, &messageError);
    }

    // Function to add a class (You can call this from your Crow routes)
    void addClass(string subject, string room, string time) {
        string sql = "INSERT INTO TIMETABLE (SUBJECT, ROOM, TIME) VALUES ('" 
                        + subject + "', '" + room + "', '" + time + "');";
        sqlite3_exec(DB, sql.c_str(), NULL, 0, NULL);
    }

    ~DatabaseManager() {
        sqlite3_close(DB);
    }
};