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
        // MySQL doesn't support directly modifying enum values, so we need to recreate the column
        // First, drop the existing enum column
        Schema::table('student_timer_states', function (Blueprint $table) {
            $table->dropColumn('state');
        });

        // Then add it back with the new enum values including 'idle'
        Schema::table('student_timer_states', function (Blueprint $table) {
            $table->enum('state', ['running', 'paused', 'finished', 'idle'])->default('running')->after('student_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to the original enum values
        Schema::table('student_timer_states', function (Blueprint $table) {
            $table->dropColumn('state');
        });

        Schema::table('student_timer_states', function (Blueprint $table) {
            $table->enum('state', ['running', 'paused', 'finished'])->default('running')->after('student_id');
        });
    }
};
