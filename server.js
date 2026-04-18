const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 18080;

// Middleware
app.use(cors()); // Allows your HTML to talk to this server
app.use(express.json());

// 1. Initialize Database
const db = new sqlite3.Database('./campus.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the Campus database.');
});

// 2. Create Tables and insert sample data
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT,
        room TEXT,
        time TEXT,
        status TEXT DEFAULT 'Vacant'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT,
        subject TEXT,
        date TEXT,
        status TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )`);

    // Insert sample students
    db.run(`INSERT OR IGNORE INTO students (id, name) VALUES ('1', 'John Doe'), ('2', 'Jane Smith'), ('BTCB25O1001', 'AADITYA SHARMA')`);

    // Insert sample attendance data
    db.run(`INSERT OR IGNORE INTO attendance (student_id, subject, date, status) VALUES 
        (1, 'Advanced C++', '2024-01-01', 'Present'),
        (1, 'Advanced C++', '2024-01-08', 'Present'),
        (1, 'Advanced C++', '2024-01-15', 'Absent'),
        (1, 'Data Structures', '2024-01-02', 'Present'),
        (1, 'Data Structures', '2024-01-09', 'Present'),
        (1, 'Data Structures', '2024-01-16', 'Present'),
        (1, 'Data Structures', '2024-01-23', 'Absent'),
        (1, 'Algorithms', '2024-01-03', 'Present'),
        (1, 'Algorithms', '2024-01-10', 'Present'),
        (1, 'Algorithms', '2024-01-17', 'Present')`);

    // Insert sample timetable
    db.run(`INSERT OR IGNORE INTO timetable (subject, room, time) VALUES 
        ('Advanced C++', 'Lab 3', '09:00 - 10:30'),
        ('Data Structures', 'Room 101', '11:00 - 12:30'),
        ('Algorithms', 'Lab 2', '14:00 - 15:30')`);

    console.log('Database initialized successfully');

    // Start server after database is ready
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});

// 3. Route: Get all classes (For your HTML table)
app.get('/get-timetable', (req, res) => {
    const sql = "SELECT * FROM timetable";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// 4. Route: Get student by ID
app.get('/get-student/:id', (req, res) => {
    const sql = "SELECT * FROM students WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(row);
    });
});

// 5. Route: Get student's attendance
app.get('/get-attendance/:studentId', (req, res) => {
    const sql = `
        SELECT subject, 
               COUNT(*) as total_classes,
               SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count
        FROM attendance 
        WHERE student_id = ? 
        GROUP BY subject
    `;
    db.all(sql, [req.params.studentId], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// 6. Route: Get overall attendance percentage
app.get('/get-overall-attendance/:studentId', (req, res) => {
    const sql = `
        SELECT 
            COUNT(*) as total_classes,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count
        FROM attendance 
        WHERE student_id = ?
    `;
    db.get(sql, [req.params.studentId], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        const percentage = row.total_classes > 0 ? ((row.present_count / row.total_classes) * 100).toFixed(2) : 0;
        res.json({ total: row.total_classes, present: row.present_count, percentage: percentage });
    });
});

// 7. Route: Get classes with low attendance (<75%)
app.get('/get-low-attendance/:studentId', (req, res) => {
    const sql = `
        SELECT subject, 
               COUNT(*) as total_classes,
               SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
               (SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as percentage
        FROM attendance 
        WHERE student_id = ? 
        GROUP BY subject
        HAVING percentage < 75
    `;
    db.all(sql, [req.params.studentId], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// 8. Route: Get current and next class for student
app.get('/get-current-next-class/:studentId', (req, res) => {
    // This is simplified - in real app, you'd have student timetable mapping
    // For now, assume all students have the same timetable
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    const sql = "SELECT * FROM timetable ORDER BY time";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        let currentClass = null;
        let nextClass = null;

        for (let i = 0; i < rows.length; i++) {
            const timeRange = rows[i].time; // e.g., "09:00 - 10:30"
            const [startTime, endTime] = timeRange.split(' - ');
            const startMinutes = timeToMinutes(startTime);
            const endMinutes = timeToMinutes(endTime);

            if (currentTime >= startMinutes && currentTime < endMinutes) {
                currentClass = rows[i];
                nextClass = rows[i + 1] || null;
                break;
            } else if (currentTime < startMinutes) {
                nextClass = rows[i];
                break;
            }
        }

        res.json({ current: currentClass, next: nextClass });
    });
});

// Helper function to convert HH:MM to minutes since midnight
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// 4. Route: Add a class (Smart Logic)
app.post('/add-class', (req, res) => {
    const { subject, room, time } = req.body;

    // Smart Conflict Check: Is the room already busy at this time?
    const checkSql = "SELECT * FROM timetable WHERE room = ? AND time = ?";
    db.get(checkSql, [room, time], (err, row) => {
        if (row) {
            res.status(400).json({ "error": "Conflict! Room already booked at this time." });
        } else {
            const insertSql = "INSERT INTO timetable (subject, room, time) VALUES (?, ?, ?)";
            db.run(insertSql, [subject, room, time], function (err) {
                res.json({ "message": "Class added successfully", "id": this.lastID });
            });
        }
    });
});