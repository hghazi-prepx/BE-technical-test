<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamTimer;
use App\Models\TimerAdjustment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExamTimerControlTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $proctor;

    private User $student1;

    private User $student2;

    private Exam $exam;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test users
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->proctor = User::factory()->create(['role' => 'proctor']);
        $this->student1 = User::factory()->create(['role' => 'student']);
        $this->student2 = User::factory()->create(['role' => 'student']);

        // Create test exam
        $this->exam = Exam::factory()->create([
            'created_by' => $this->admin->id,
            'default_duration_seconds' => 3600, // 1 hour
        ]);

        // Register students for the exam
        $this->exam->students()->attach([$this->student1->id, $this->student2->id]);
    }

    public function test_admin_can_start_timer_for_specific_student(): void
    {
        $this->actingAs($this->admin);

        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/start-student", [
            'student_id' => $this->student1->id,
        ]);

        $response->assertOk()
            ->assertJson(['ok' => true])
            ->assertJsonStructure(['version']);

        // Verify timer state
        $timer = ExamTimer::where('exam_id', $this->exam->id)->first();
        $this->assertEquals('running', $timer->state);
        $this->assertNotNull($timer->started_at);
    }

    public function test_admin_can_pause_timer_for_specific_student(): void
    {
        $this->actingAs($this->admin);

        // First start the timer
        $this->postJson("/api/exams/{$this->exam->id}/timer/start-student", [
            'student_id' => $this->student1->id,
        ]);

        // Then pause it
        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/pause-student", [
            'student_id' => $this->student1->id,
        ]);

        $response->assertOk()
            ->assertJson(['ok' => true])
            ->assertJsonStructure(['version']);

        // Verify timer state
        $timer = ExamTimer::where('exam_id', $this->exam->id)->first();
        $this->assertEquals('paused', $timer->state);
        $this->assertNotNull($timer->paused_at);
    }

    public function test_admin_can_resume_timer_for_specific_student(): void
    {
        $this->actingAs($this->admin);

        // Start, pause, then resume
        $this->postJson("/api/exams/{$this->exam->id}/timer/start-student", [
            'student_id' => $this->student1->id,
        ]);

        $this->postJson("/api/exams/{$this->exam->id}/timer/pause-student", [
            'student_id' => $this->student1->id,
        ]);

        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/resume-student", [
            'student_id' => $this->student1->id,
        ]);

        $response->assertOk()
            ->assertJson(['ok' => true])
            ->assertJsonStructure(['version']);

        // Verify timer state
        $timer = ExamTimer::where('exam_id', $this->exam->id)->first();
        $this->assertEquals('running', $timer->state);
        $this->assertNull($timer->paused_at);
    }

    public function test_admin_can_reset_timer_for_specific_student(): void
    {
        $this->actingAs($this->admin);

        // Start the timer first
        $this->postJson("/api/exams/{$this->exam->id}/timer/start-student", [
            'student_id' => $this->student1->id,
        ]);

        // Then reset it
        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/reset-student", [
            'student_id' => $this->student1->id,
        ]);

        $response->assertOk()
            ->assertJson(['ok' => true])
            ->assertJsonStructure(['version']);

        // Verify timer state
        $timer = ExamTimer::where('exam_id', $this->exam->id)->first();
        $this->assertEquals('idle', $timer->state);
        $this->assertNull($timer->started_at);
        $this->assertNull($timer->paused_at);
    }

    public function test_admin_can_start_timer_for_all_students(): void
    {
        $this->actingAs($this->admin);

        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/start-all");

        $response->assertOk()
            ->assertJson(['ok' => true])
            ->assertJsonStructure(['version']);

        // Verify timer state
        $timer = ExamTimer::where('exam_id', $this->exam->id)->first();
        $this->assertEquals('running', $timer->state);
        $this->assertNotNull($timer->started_at);
    }

    public function test_admin_can_pause_timer_for_all_students(): void
    {
        $this->actingAs($this->admin);

        // Start first
        $this->postJson("/api/exams/{$this->exam->id}/timer/start-all");

        // Then pause
        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/pause-all");

        $response->assertOk()
            ->assertJson(['ok' => true])
            ->assertJsonStructure(['version']);

        // Verify timer state
        $timer = ExamTimer::where('exam_id', $this->exam->id)->first();
        $this->assertEquals('paused', $timer->state);
        $this->assertNotNull($timer->paused_at);
    }

    public function test_admin_can_resume_timer_for_all_students(): void
    {
        $this->actingAs($this->admin);

        // Start, pause, then resume
        $this->postJson("/api/exams/{$this->exam->id}/timer/start-all");
        $this->postJson("/api/exams/{$this->exam->id}/timer/pause-all");

        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/resume-all");

        $response->assertOk()
            ->assertJson(['ok' => true])
            ->assertJsonStructure(['version']);

        // Verify timer state
        $timer = ExamTimer::where('exam_id', $this->exam->id)->first();
        $this->assertEquals('running', $timer->state);
        $this->assertNull($timer->paused_at);
    }

    public function test_admin_can_reset_timer_for_all_students(): void
    {
        $this->actingAs($this->admin);

        // Start first
        $this->postJson("/api/exams/{$this->exam->id}/timer/start-all");

        // Then reset
        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/reset-all");

        $response->assertOk()
            ->assertJson(['ok' => true])
            ->assertJsonStructure(['version']);

        // Verify timer state
        $timer = ExamTimer::where('exam_id', $this->exam->id)->first();
        $this->assertEquals('idle', $timer->state);
        $this->assertNull($timer->started_at);
        $this->assertNull($timer->paused_at);
        $this->assertEquals(0, $timer->paused_total_seconds);
        $this->assertEquals(0, $timer->global_adjust_seconds);
    }

    public function test_admin_can_get_all_students_timer_states(): void
    {
        $this->actingAs($this->admin);

        $response = $this->getJson("/api/exams/{$this->exam->id}/timer/all-students-states");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'exam_id',
                        'student_id',
                        'state',
                        'duration_seconds',
                        'remaining_seconds',
                        'version',
                        'server_time',
                    ],
                ],
            ]);

        $this->assertCount(2, $response->json('data')); // Two students
    }

    public function test_proctor_can_control_student_timers(): void
    {
        $this->actingAs($this->proctor);

        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/start-student", [
            'student_id' => $this->student1->id,
        ]);

        $response->assertOk();

        // Verify timer state
        $timer = ExamTimer::where('exam_id', $this->exam->id)->first();
        $this->assertEquals('running', $timer->state);
    }

    public function test_student_cannot_control_other_student_timers(): void
    {
        $this->actingAs($this->student1);

        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/start-student", [
            'student_id' => $this->student2->id,
        ]);

        $response->assertForbidden();
    }

    public function test_student_cannot_control_all_student_timers(): void
    {
        $this->actingAs($this->student1);

        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/start-all");

        $response->assertForbidden();
    }

    public function test_validation_fails_with_invalid_student_id(): void
    {
        $this->actingAs($this->admin);

        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/start-student", [
            'student_id' => 999999, // Non-existent ID
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['student_id']);
    }

    public function test_validation_fails_without_student_id(): void
    {
        $this->actingAs($this->admin);

        $response = $this->postJson("/api/exams/{$this->exam->id}/timer/start-student", [
            // Missing student_id
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['student_id']);
    }

    public function test_get_users_returns_only_students(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson("/api/exams/{$this->exam->id}/users");

        $response->assertOk();
        $users = $response->json();

        // Should only return students, not admin or proctor
        $this->assertCount(2, $users);
        $this->assertEquals($this->student1->id, $users[0]['id']);
        $this->assertEquals($this->student2->id, $users[1]['id']);
    }

    public function test_reset_student_clears_timer_adjustments(): void
    {
        // Create some timer adjustments for student1
        $timer = ExamTimer::firstOrCreate(['exam_id' => $this->exam->id], [
            'duration_seconds' => $this->exam->default_duration_seconds,
        ]);

        // Add some timer adjustments for student1
        TimerAdjustment::create([
            'exam_timer_id' => $timer->id,
            'student_id' => $this->student1->id,
            'seconds' => 300, // 5 minutes added
            'reason' => 'Extra time for technical issue',
            'created_by' => $this->admin->id,
        ]);

        TimerAdjustment::create([
            'exam_timer_id' => $timer->id,
            'student_id' => $this->student1->id,
            'seconds' => -60, // 1 minute subtracted
            'reason' => 'Late arrival penalty',
            'created_by' => $this->admin->id,
        ]);

        // Also add adjustment for student2 to ensure it's not affected
        TimerAdjustment::create([
            'exam_timer_id' => $timer->id,
            'student_id' => $this->student2->id,
            'seconds' => 180, // 3 minutes added
            'reason' => 'Bathroom break',
            'created_by' => $this->admin->id,
        ]);

        // Verify adjustments exist
        $this->assertEquals(2, TimerAdjustment::where('exam_timer_id', $timer->id)
            ->where('student_id', $this->student1->id)->count());
        $this->assertEquals(1, TimerAdjustment::where('exam_timer_id', $timer->id)
            ->where('student_id', $this->student2->id)->count());

        // Reset timer for student1
        $response = $this->actingAs($this->admin)
            ->postJson("/api/exams/{$this->exam->id}/timer/reset-student", [
                'student_id' => $this->student1->id,
            ]);

        $response->assertOk();

        // Verify adjustments for student1 are cleared
        $this->assertEquals(0, TimerAdjustment::where('exam_timer_id', $timer->id)
            ->where('student_id', $this->student1->id)->count());

        // Verify adjustments for student2 are NOT affected
        $this->assertEquals(1, TimerAdjustment::where('exam_timer_id', $timer->id)
            ->where('student_id', $this->student2->id)->count());
    }

    public function test_reset_all_students_clears_all_timer_adjustments(): void
    {
        // Create some timer adjustments for both students and global
        $timer = ExamTimer::firstOrCreate(['exam_id' => $this->exam->id], [
            'duration_seconds' => $this->exam->default_duration_seconds,
        ]);

        // Add timer adjustments for student1
        TimerAdjustment::create([
            'exam_timer_id' => $timer->id,
            'student_id' => $this->student1->id,
            'seconds' => 300,
            'reason' => 'Extra time for student1',
            'created_by' => $this->admin->id,
        ]);

        // Add timer adjustments for student2
        TimerAdjustment::create([
            'exam_timer_id' => $timer->id,
            'student_id' => $this->student2->id,
            'seconds' => 180,
            'reason' => 'Extra time for student2',
            'created_by' => $this->admin->id,
        ]);

        // Add global adjustment (affects all students)
        TimerAdjustment::create([
            'exam_timer_id' => $timer->id,
            'student_id' => null, // Global adjustment
            'seconds' => 600,
            'reason' => 'Global extra time for technical issues',
            'created_by' => $this->admin->id,
        ]);

        // Verify adjustments exist
        $this->assertEquals(3, TimerAdjustment::where('exam_timer_id', $timer->id)->count());

        // Reset timer for all students
        $response = $this->actingAs($this->admin)
            ->postJson("/api/exams/{$this->exam->id}/timer/reset-all");

        $response->assertOk();

        // Verify ALL adjustments are cleared
        $this->assertEquals(0, TimerAdjustment::where('exam_timer_id', $timer->id)->count());
    }
}
