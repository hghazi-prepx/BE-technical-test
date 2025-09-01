<?php

namespace App\Console\Commands;

use App\Events\ServerTimeSync;
use Illuminate\Console\Command;

class BroadcastServerTime extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'broadcast:server-time {--interval=1 : Interval in seconds between broadcasts}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Broadcast server time to all connected clients for synchronization';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $interval = (int) $this->option('interval');
        $this->info("Starting server time broadcast every {$interval} second(s)...");
        $this->info('Press Ctrl+C to stop');

        while (true) {
            try {
                // Broadcast the current server time
                broadcast(new ServerTimeSync);

                // Log every 10th broadcast to avoid spam
                static $counter = 0;
                if (++$counter % 10 === 0) {
                    $this->info('Broadcasted server time: '.now()->toISOString());
                }

                // Wait for the specified interval
                sleep($interval);

            } catch (\Exception $e) {
                $this->error('Error broadcasting server time: '.$e->getMessage());
                sleep(1); // Wait a bit before retrying
            }
        }
    }
}
