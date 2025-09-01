import './bootstrap';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Echo constructor available globally
window.EchoConstructor = Echo;
console.log('Laravel Echo constructor loaded:', window.EchoConstructor);
console.log('Echo constructor type:', typeof window.EchoConstructor);
console.log('Echo constructor properties:', Object.keys(window.EchoConstructor || {}));
