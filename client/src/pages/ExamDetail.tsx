import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { examService, authService } from "../services/api";
import { socketService } from "../services/socket";
import { Exam, ExamStatus } from "../types";
import ExamTimer from "../components/ExamTimer";

const ExamDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [exam, setExam] = useState<Exam | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [pausing, setPausing] = useState(false);

	useEffect(() => {
		if (id) {
			fetchExam();
			// Connect to WebSocket
			socketService.connect();

			// Listen for exam updates
			const handleExamUpdate = (updatedExam: Exam) => {
				if (updatedExam.id === parseInt(id)) {
					console.log("Exam updated via WebSocket:", updatedExam);
					setExam(updatedExam);
				}
			};

			socketService.onExamUpdate(parseInt(id), handleExamUpdate);

			// Join exam room
			socketService.joinExamRoom(parseInt(id));

			return () => {
				socketService.offExamUpdate(parseInt(id), handleExamUpdate);
				socketService.leaveExamRoom(parseInt(id));
				socketService.disconnect();
			};
		}
	}, [id]);

	const fetchExam = async () => {
		try {
			setLoading(true);
			const examData = await examService.getExamById(parseInt(id!));
			setExam(examData);
		} catch (err: any) {
			setError(err.response?.data?.message || "Failed to fetch exam");
		} finally {
			setLoading(false);
		}
	};

	const handlePause = async () => {
		if (!exam) return;

		try {
			setPausing(true);
			const updatedExam = await examService.pauseExam(exam.id);
			setExam(updatedExam);
		} catch (err: any) {
			setError(err.response?.data?.message || "Failed to pause exam");
		} finally {
			setPausing(false);
		}
	};

	const handleUnpause = async () => {
		if (!exam) return;

		try {
			setPausing(true);
			const updatedExam = await examService.unpauseExam(exam.id);
			setExam(updatedExam);
		} catch (err: any) {
			setError(err.response?.data?.message || "Failed to resume exam");
		} finally {
			setPausing(false);
		}
	};

	const handleLogout = () => {
		authService.logout();
		navigate("/login");
	};

	const handleBackToExams = () => {
		navigate("/exams");
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-xl">Loading exam...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-600 text-xl mb-4">{error}</div>
					<button onClick={handleBackToExams} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
						Back to Exams
					</button>
				</div>
			</div>
		);
	}

	if (!exam) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="text-gray-600 text-xl mb-4">Exam not found</div>
					<button onClick={handleBackToExams} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
						Back to Exams
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<button onClick={handleBackToExams} className="mr-4 px-3 py-2 text-gray-600 hover:text-gray-900">
								← Back
							</button>
							<h1 className="text-xl font-semibold text-gray-900">Exam: {exam.name}</h1>
						</div>
						<div className="flex items-center">
							<button
								onClick={handleLogout}
								className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</nav>

			<div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					{/* WebSocket Connection Status */}
					<div className="mb-4 p-3 rounded-md bg-gray-100">
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-600">WebSocket Status:</span>
							<span className={`text-sm font-medium ${socketService.isConnected() ? "text-green-600" : "text-red-600"}`}>
								{socketService.getConnectionStatus()}
							</span>
						</div>
					</div>

					<ExamTimer exam={exam} onPause={handlePause} onUnpause={handleUnpause} />

					{/* Exam Content Area */}
					<div className="mt-6 bg-white rounded-lg shadow-md p-6">
						<h3 className="text-lg font-medium text-gray-900 mb-4">Exam Content</h3>

						{exam.status === ExamStatus.Pending && (
							<div className="text-center py-8">
								<p className="text-gray-600 mb-4">This exam will start at {new Date(exam.startDate).toLocaleString()}</p>
								<p className="text-sm text-gray-500">Duration: {exam.period} minutes</p>
							</div>
						)}

						{exam.status === ExamStatus.InProgress && (
							<div className="text-center py-8">
								<p className="text-green-600 font-medium mb-4">Exam is in progress. Good luck!</p>
								<p className="text-sm text-gray-500">Make sure to submit your answers before time runs out.</p>
							</div>
						)}

						{exam.status === ExamStatus.Paused && (
							<div className="text-center py-8">
								<p className="text-orange-600 font-medium mb-4">Exam is currently paused</p>
								<p className="text-sm text-gray-500">Click "Resume Exam" to continue when you're ready.</p>
							</div>
						)}

						{exam.status === ExamStatus.Completed && (
							<div className="text-center py-8">
								<p className="text-blue-600 font-medium mb-4">Exam completed successfully!</p>
								<p className="text-sm text-gray-500">Your answers have been submitted.</p>
							</div>
						)}

						{exam.status === ExamStatus.Expired && (
							<div className="text-center py-8">
								<p className="text-red-600 font-medium mb-4">Exam time has expired</p>
								<p className="text-sm text-gray-500">The exam period has ended.</p>
							</div>
						)}
					</div>

					{/* Exam Details */}
					<div className="mt-6 bg-white rounded-lg shadow-md p-6">
						<h3 className="text-lg font-medium text-gray-900 mb-4">Exam Details</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-gray-500">Created by:</span>
								<span className="ml-2 font-medium">{exam.trainee?.username || "Unknown"}</span>
							</div>
							<div>
								<span className="text-gray-500">Created at:</span>
								<span className="ml-2 font-medium">{new Date(exam.createdAt).toLocaleString()}</span>
							</div>
							<div>
								<span className="text-gray-500">Total paused time:</span>
								<span className="ml-2 font-medium">{Math.round((exam.totalPausedTime || 0) / 1000 / 60)} minutes</span>
							</div>
							{exam.pausedAt && (
								<div>
									<span className="text-gray-500">Last paused at:</span>
									<span className="ml-2 font-medium">{new Date(exam.pausedAt).toLocaleString()}</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ExamDetail;
