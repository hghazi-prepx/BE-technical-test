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
        Schema::create('exam_timers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('duration_seconds'); // initial exam duration
            $table->enum('state', ['idle', 'running', 'paused', 'finished'])->default('idle');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('paused_at')->nullable();
            $table->unsignedBigInteger('paused_total_seconds')->default(0);
            $table->integer('global_adjust_seconds')->default(0); // denormalized sum for performance
            $table->unsignedInteger('version')->default(1); // optimistic concurrency control
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['exam_id', 'state']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_timers');
    }
};
