import { io, Socket } from "socket.io-client";
import { Exam } from "../types";

class SocketService {
	private socket: Socket | null = null;
	private examUpdateCallbacks: Map<number, ((exam: Exam) => void)[]> = new Map();
	private globalExamUpdateCallbacks: ((exam: Exam) => void)[] = [];

	connect() {
		try {
			console.log("Attempting to connect to WebSocket server at http://localhost:3000");

			this.socket = io("http://localhost:3000", {
				transports: ["websocket", "polling"],
				timeout: 10000,
				forceNew: true,
			});

			this.socket.on("connect", () => {
				console.log("✅ Connected to WebSocket server with ID:", this.socket?.id);
			});

			this.socket.on("connect_error", (error) => {
				console.error("❌ WebSocket connection error:", error);
			});

			this.socket.on("disconnect", (reason) => {
				console.log("🔌 Disconnected from WebSocket server. Reason:", reason);
			});

			this.socket.on("error", (error) => {
				console.error("❌ WebSocket error:", error);
			});

			// Listen for all exam update events
			this.socket.onAny((eventName: string, exam: Exam) => {
				console.log("📡 Received WebSocket event:", eventName, exam);

				// Check if it's an ExamUpdated event
				if (eventName.startsWith("ExamUpdated-")) {
					const examId = parseInt(eventName.split("-")[1]);
					console.log("🎯 Exam updated via WebSocket:", { examId, exam });

					// Notify specific exam listeners
					const callbacks = this.examUpdateCallbacks.get(examId);
					if (callbacks) {
						console.log(`🔔 Notifying ${callbacks.length} listeners for exam ${examId}`);
						callbacks.forEach((callback) => callback(exam));
					}

					// Notify global listeners
					console.log(`🔔 Notifying ${this.globalExamUpdateCallbacks.length} global listeners`);
					this.globalExamUpdateCallbacks.forEach((callback) => callback(exam));
				}
			});
		} catch (error) {
			console.error("❌ Failed to create WebSocket connection:", error);
		}
	}

	disconnect() {
		if (this.socket) {
			console.log("🔌 Disconnecting from WebSocket server");
			this.socket.disconnect();
			this.socket = null;
		}
	}

	// Listen for updates to a specific exam
	onExamUpdate(examId: number, callback: (exam: Exam) => void) {
		if (!this.examUpdateCallbacks.has(examId)) {
			this.examUpdateCallbacks.set(examId, []);
		}
		this.examUpdateCallbacks.get(examId)!.push(callback);
		console.log(`👂 Added listener for exam ${examId}. Total listeners: ${this.examUpdateCallbacks.get(examId)!.length}`);
	}

	// Remove listener for a specific exam
	offExamUpdate(examId: number, callback: (exam: Exam) => void) {
		const callbacks = this.examUpdateCallbacks.get(examId);
		if (callbacks) {
			const index = callbacks.indexOf(callback);
			if (index > -1) {
				callbacks.splice(index, 1);
				console.log(`👋 Removed listener for exam ${examId}. Remaining listeners: ${callbacks.length}`);
			}
		}
	}

	// Listen for all exam updates
	onGlobalExamUpdate(callback: (exam: Exam) => void) {
		this.globalExamUpdateCallbacks.push(callback);
		console.log(`👂 Added global exam listener. Total global listeners: ${this.globalExamUpdateCallbacks.length}`);
	}

	// Remove global listener
	offGlobalExamUpdate(callback: (exam: Exam) => void) {
		const index = this.globalExamUpdateCallbacks.indexOf(callback);
		if (index > -1) {
			this.globalExamUpdateCallbacks.splice(index, 1);
			console.log(`👋 Removed global exam listener. Remaining global listeners: ${this.globalExamUpdateCallbacks.length}`);
		}
	}

	joinExamRoom(examId: number) {
		if (this.socket) {
			this.socket.emit("joinExam", { examId });
			console.log("🚪 Joined exam room:", examId);
		} else {
			console.warn("⚠️ Cannot join exam room: WebSocket not connected");
		}
	}

	leaveExamRoom(examId: number) {
		if (this.socket) {
			this.socket.emit("leaveExam", { examId });
			console.log("🚪 Left exam room:", examId);
		}
	}

	// Check if connected
	isConnected(): boolean {
		return this.socket?.connected || false;
	}

	// Get connection status
	getConnectionStatus(): string {
		if (!this.socket) return "Not initialized";
		if (this.socket.connected) return "Connected";
		return "Disconnected";
	}
}

export const socketService = new SocketService();
export default socketService;
