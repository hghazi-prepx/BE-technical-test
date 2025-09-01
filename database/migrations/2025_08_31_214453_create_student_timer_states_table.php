<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('student_timer_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_timer_id')->constrained('exam_timers')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->enum('state', ['running', 'paused', 'finished'])->default('running');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('paused_at')->nullable();
            $table->bigInteger('paused_total_seconds')->default(0);
            $table->integer('student_adjust_seconds')->default(0);
            $table->integer('version')->default(1);
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            // Composite unique index to ensure one state per student per exam timer
            $table->unique(['exam_timer_id', 'student_id']);

            // Index for efficient queries
            $table->index(['exam_timer_id', 'state']);
            $table->index(['student_id', 'state']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_timer_states');
    }
};
