const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const path = require('path');
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const db = new sqlite3.Database('./campus.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the Campus database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT, room TEXT, time TEXT, status TEXT DEFAULT 'Vacant'
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, name TEXT NOT NULL)`);
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT, subject TEXT, date TEXT, status TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )`);
    db.run(`INSERT OR IGNORE INTO students (id, name) VALUES ('1', 'John Doe'), ('2', 'Jane Smith'), ('BTCB25O1001', 'AADITYA SHARMA')`);
    db.run(`INSERT OR IGNORE INTO attendance (student_id, subject, date, status) VALUES 
        (1, 'Advanced C++', '2024-01-01', 'Present'),(1, 'Advanced C++', '2024-01-08', 'Present'),
        (1, 'Advanced C++', '2024-01-15', 'Absent'),(1, 'Data Structures', '2024-01-02', 'Present'),
        (1, 'Data Structures', '2024-01-09', 'Present'),(1, 'Data Structures', '2024-01-16', 'Present'),
        (1, 'Data Structures', '2024-01-23', 'Absent'),(1, 'Algorithms', '2024-01-03', 'Present'),
        (1, 'Algorithms', '2024-01-10', 'Present'),(1, 'Algorithms', '2024-01-17', 'Present')`);
    db.run(`INSERT OR IGNORE INTO timetable (subject, room, time) VALUES 
        ('Advanced C++', 'Lab 3', '09:00 - 10:30'),
        ('Data Structures', 'Room 101', '11:00 - 12:30'),
        ('Algorithms', 'Lab 2', '14:00 - 15:30')`);
    console.log('Database initialized successfully');
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running at http://0.0.0.0:${port}`);
    });
});

app.get('/get-timetable', (req, res) => {
    db.all("SELECT * FROM timetable", [], (err, rows) => {
        if (err) { res.status(400).json({ error: err.message }); return; }
        res.json(rows);
    });
});
app.get('/get-student/:id', (req, res) => {
    db.get("SELECT * FROM students WHERE id = ?", [req.params.id], (err, row) => {
        if (err) { res.status(400).json({ error: err.message }); return; }
        res.json(row);
    });
});
app.get('/get-attendance/:studentId', (req, res) => {
    const sql = `SELECT subject, COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count
        FROM attendance WHERE student_id = ? GROUP BY subject`;
    db.all(sql, [req.params.studentId], (err, rows) => {
        if (err) { res.status(400).json({ error: err.message }); return; }
        res.json(rows);
    });
});
app.get('/get-overall-attendance/:studentId', (req, res) => {
    const sql = `SELECT COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count
        FROM attendance WHERE student_id = ?`;
    db.get(sql, [req.params.studentId], (err, row) => {
        if (err) { res.status(400).json({ error: err.message }); return; }
        const percentage = row.total_classes > 0 ? ((row.present_count / row.total_classes) * 100).toFixed(2) : 0;
        res.json({ total: row.total_classes, present: row.present_count, percentage });
    });
});
app.get('/get-low-attendance/:studentId', (req, res) => {
    const sql = `SELECT subject, COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
        (SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as percentage
        FROM attendance WHERE student_id = ? GROUP BY subject HAVING percentage < 75`;
    db.all(sql, [req.params.studentId], (err, rows) => {
        if (err) { res.status(400).json({ error: err.message }); return; }
        res.json(rows);
    });
});
app.get('/get-current-next-class/:studentId', (req, res) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    db.all("SELECT * FROM timetable ORDER BY time", [], (err, rows) => {
        if (err) { res.status(400).json({ error: err.message }); return; }
        let currentClass = null, nextClass = null;
        for (let i = 0; i < rows.length; i++) {
            const [startTime, endTime] = rows[i].time.split(' - ');
            const startMinutes = timeToMinutes(startTime);
            const endMinutes = timeToMinutes(endTime);
            if (currentTime >= startMinutes && currentTime < endMinutes) {
                currentClass = rows[i]; nextClass = rows[i + 1] || null; break;
            } else if (currentTime < startMinutes) {
                nextClass = rows[i]; break;
            }
        }
        res.json({ current: currentClass, next: nextClass });
    });
});
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Proxy attendance to Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz9BjdKlWguflTVUNA6VK_MMV_kJJweKDr2CUMpKNFJHEBFJw3abOJIAIBQVRVMSMWn/exec";
app.post('/submit-attendance', async (req, res) => {
    try {
        const body = JSON.stringify(req.body);
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: body,
            redirect: 'follow'
        });
        const text = await response.text();
        res.json({ success: true, message: text });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/add-class', (req, res) => {
    const { subject, room, time } = req.body;
    db.get("SELECT * FROM timetable WHERE room = ? AND time = ?", [room, time], (err, row) => {
        if (row) {
            res.status(400).json({ error: "Conflict! Room already booked at this time." });
        } else {
            db.run("INSERT INTO timetable (subject, room, time) VALUES (?, ?, ?)", [subject, room, time], function(err) {
                res.json({ message: "Class added successfully", id: this.lastID });
            });
        }
    });
});
