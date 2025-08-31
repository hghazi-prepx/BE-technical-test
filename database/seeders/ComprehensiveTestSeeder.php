<?php

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\ExamRegistration;
use App\Models\ExamTimer;
use App\Models\TimerAdjustment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ComprehensiveTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create users with different roles
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $proctor1 = User::create([
            'name' => 'John Proctor',
            'email' => 'proctor@example.com',
            'password' => Hash::make('password'),
            'role' => 'proctor',
        ]);

        $proctor2 = User::create([
            'name' => 'Sarah Instructor',
            'email' => 'instructor@example.com',
            'password' => Hash::make('password'),
            'role' => 'proctor',
        ]);

        $student1 = User::create([
            'name' => 'Alice Student',
            'email' => 'student1@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
        ]);

        $student2 = User::create([
            'name' => 'Bob Student',
            'email' => 'student2@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
        ]);

        $student3 = User::create([
            'name' => 'Charlie Student',
            'email' => 'student3@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
        ]);

        // Create exams
        $mathExam = Exam::create([
            'title' => 'Advanced Mathematics Final',
            'description' => 'Comprehensive mathematics exam covering calculus, algebra, and statistics',
            'default_duration_seconds' => 7200, // 2 hours
            'created_by' => $proctor1->id,
        ]);

        $scienceExam = Exam::create([
            'title' => 'Physics Midterm',
            'description' => 'Physics concepts and problem solving',
            'default_duration_seconds' => 3600, // 1 hour
            'created_by' => $proctor2->id,
        ]);

        $historyExam = Exam::create([
            'title' => 'World History Quiz',
            'description' => 'Short quiz on modern world history',
            'default_duration_seconds' => 1800, // 30 minutes
            'created_by' => $proctor1->id,
        ]);

        // Register students for exams
        ExamRegistration::create([
            'exam_id' => $mathExam->id,
            'student_id' => $student1->id,
        ]);

        ExamRegistration::create([
            'exam_id' => $mathExam->id,
            'student_id' => $student2->id,
        ]);

        ExamRegistration::create([
            'exam_id' => $scienceExam->id,
            'student_id' => $student1->id,
        ]);

        ExamRegistration::create([
            'exam_id' => $scienceExam->id,
            'student_id' => $student3->id,
        ]);

        ExamRegistration::create([
            'exam_id' => $historyExam->id,
            'student_id' => $student2->id,
        ]);

        // Create exam timers with different states
        $mathTimer = ExamTimer::create([
            'exam_id' => $mathExam->id,
            'duration_seconds' => 7200,
            'state' => 'idle', // Ready to start
            'started_at' => null,
            'paused_at' => null,
            'paused_total_seconds' => 0,
            'global_adjust_seconds' => 0,
            'version' => 1,
            'updated_by' => $proctor1->id,
        ]);

        $scienceTimer = ExamTimer::create([
            'exam_id' => $scienceExam->id,
            'duration_seconds' => 3600,
            'state' => 'running', // Currently running
            'started_at' => now()->subMinutes(30), // Started 30 minutes ago
            'paused_at' => null,
            'paused_total_seconds' => 0,
            'global_adjust_seconds' => 300, // 5 minutes added globally
            'version' => 3,
            'updated_by' => $proctor2->id,
        ]);

        $historyTimer = ExamTimer::create([
            'exam_id' => $historyExam->id,
            'duration_seconds' => 1800,
            'state' => 'paused', // Currently paused
            'started_at' => now()->subMinutes(45), // Started 45 minutes ago
            'paused_at' => now()->subMinutes(15), // Paused 15 minutes ago
            'paused_total_seconds' => 900, // 15 minutes paused
            'global_adjust_seconds' => -120, // 2 minutes subtracted globally
            'version' => 2,
            'updated_by' => $proctor1->id,
        ]);

        // Create timer adjustments for different scenarios
        TimerAdjustment::create([
            'exam_timer_id' => $mathTimer->id,
            'student_id' => null, // Global adjustment
            'seconds' => 600, // 10 minutes added
            'reason' => 'Technical difficulties at start',
            'created_by' => $proctor1->id,
        ]);

        TimerAdjustment::create([
            'exam_timer_id' => $mathTimer->id,
            'student_id' => $student1->id, // Student-specific adjustment
            'seconds' => 300, // 5 minutes added for Alice
            'reason' => 'Bathroom break',
            'created_by' => $proctor1->id,
        ]);

        TimerAdjustment::create([
            'exam_timer_id' => $scienceTimer->id,
            'student_id' => null, // Global adjustment
            'seconds' => 300, // 5 minutes added
            'reason' => 'Fire alarm interruption',
            'created_by' => $proctor2->id,
        ]);

        TimerAdjustment::create([
            'exam_timer_id' => $historyTimer->id,
            'student_id' => $student2->id, // Student-specific adjustment
            'seconds' => -180, // 3 minutes subtracted for Bob
            'reason' => 'Late arrival',
            'created_by' => $proctor1->id,
        ]);

        // Update the global adjustment seconds to match the adjustments
        $mathTimer->update(['global_adjust_seconds' => 600]);
        $historyTimer->update(['global_adjust_seconds' => -120]);

        $this->command->info('✅ Comprehensive test data created successfully!');
        $this->command->info('');
        $this->command->info('📋 Test Users:');
        $this->command->info('   Admin: admin@example.com / password');
        $this->command->info('   Proctor 1: proctor@example.com / password');
        $this->command->info('   Proctor 2: instructor@example.com / password');
        $this->command->info('   Student 1: student1@example.com / password');
        $this->command->info('   Student 2: student2@example.com / password');
        $this->command->info('   Student 3: student3@example.com / password');
        $this->command->info('');
        $this->command->info('📚 Test Exams:');
        $this->command->info('   Math Exam (2 hours) - ID: '.$mathExam->id.' - State: IDLE');
        $this->command->info('   Science Exam (1 hour) - ID: '.$scienceExam->id.' - State: RUNNING');
        $this->command->info('   History Exam (30 min) - ID: '.$historyExam->id.' - State: PAUSED');
        $this->command->info('');
        $this->command->info('🧪 Test Scenarios Available:');
        $this->command->info('   • Start timer from idle state');
        $this->command->info('   • Resume paused timer');
        $this->command->info('   • Pause running timer');
        $this->command->info('   • Global time adjustments');
        $this->command->info('   • Student-specific adjustments');
        $this->command->info('   • Different user roles and permissions');
    }
}
