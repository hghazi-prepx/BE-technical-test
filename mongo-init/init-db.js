// Initialize PrepX Timer Database
print('Starting database initialization...');

// Switch to prepx-timer database
db = db.getSiblingDB('prepx-timer');

// Create collections
db.createCollection('exams');
db.createCollection('studenttimers');

print('Collections created: exams, studenttimers');

// Create indexes for better performance
db.exams.createIndex({ "instructorId": 1 });
db.exams.createIndex({ "status": 1 });
db.exams.createIndex({ "createdAt": 1 });

db.studenttimers.createIndex({ "examId": 1 });
db.studenttimers.createIndex({ "studentId": 1 });
db.studenttimers.createIndex({ "examId": 1, "studentId": 1 }, { unique: true });

print('Indexes created successfully');

// Insert sample data for testing (optional)
const sampleExam = {
  title: "Sample Math Exam",
  description: "A sample exam for testing the timer system",
  duration: 3600, // 1 hour in seconds
  remainingTime: 3600,
  status: "pending",
  startedAt: null,
  pausedAt: null,
  completedAt: null,
  connectedStudents: [],
  instructorId: "instructor_001",
  createdAt: new Date(),
  updatedAt: new Date()
};

db.exams.insertOne(sampleExam);
print('Sample exam inserted');

print('Database initialization completed successfully!');