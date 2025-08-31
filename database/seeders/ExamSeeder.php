<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create demo users
        $proctor = \App\Models\User::create([
            'name' => 'John Proctor',
            'email' => 'proctor@example.com',
            'password' => bcrypt('password'),
            'role' => 'proctor',
        ]);

        $student1 = \App\Models\User::create([
            'name' => 'Alice Student',
            'email' => 'student1@example.com',
            'password' => bcrypt('password'),
            'role' => 'student',
        ]);

        $student2 = \App\Models\User::create([
            'name' => 'Bob Student',
            'email' => 'student2@example.com',
            'password' => bcrypt('password'),
            'role' => 'student',
        ]);

        // Create demo exam
        $exam = \App\Models\Exam::create([
            'title' => 'Sample Mathematics Exam',
            'description' => 'A demonstration exam for testing the timer system',
            'default_duration_seconds' => 3600, // 1 hour
            'scheduled_at' => now()->addDays(1),
            'status' => 'scheduled',
            'created_by' => $proctor->id,
        ]);

        // Register students for exam
        \App\Models\ExamRegistration::create([
            'exam_id' => $exam->id,
            'student_id' => $student1->id,
        ]);

        \App\Models\ExamRegistration::create([
            'exam_id' => $exam->id,
            'student_id' => $student2->id,
        ]);

        $this->command->info('Demo data created successfully!');
        $this->command->info('Exam ID: '.$exam->id);
        $this->command->info('Proctor: proctor@example.com (password: password)');
        $this->command->info('Student 1: student1@example.com (password: password)');
        $this->command->info('Student 2: student2@example.com (password: password)');
    }
}
