import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { examService, authService } from "../services/api";
import { socketService } from "../services/socket";
import { Exam, ExamStatus } from "../types";

const Exams: React.FC = () => {
	const [exams, setExams] = useState<Exam[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		fetchExams();

		// Connect to WebSocket for real-time updates
		socketService.connect();

		// Listen for exam updates
		const handleExamUpdate = (updatedExam: Exam) => {
			console.log("Exam updated via WebSocket:", updatedExam);
			setExams((prevExams) => prevExams.map((exam) => (exam.id === updatedExam.id ? updatedExam : exam)));
		};

		socketService.onGlobalExamUpdate(handleExamUpdate);

		return () => {
			socketService.offGlobalExamUpdate(handleExamUpdate);
			socketService.disconnect();
		};
	}, []);

	const fetchExams = async () => {
		try {
			setLoading(true);
			const response = await examService.getAllExams({ search: searchTerm });
			setExams(response.data);
		} catch (err: any) {
			setError(err.response?.data?.message || "Failed to fetch exams");
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		fetchExams();
	};

	const handleLogout = () => {
		authService.logout();
		navigate("/login");
	};

	const getStatusColor = (status: ExamStatus) => {
		switch (status) {
			case ExamStatus.Pending:
				return "bg-yellow-100 text-yellow-800";
			case ExamStatus.InProgress:
				return "bg-green-100 text-green-800";
			case ExamStatus.Paused:
				return "bg-orange-100 text-orange-800";
			case ExamStatus.Completed:
				return "bg-blue-100 text-blue-800";
			case ExamStatus.Expired:
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleString();
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-xl">Loading exams...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<h1 className="text-xl font-semibold text-gray-900">Exams</h1>
						</div>
						<div className="flex items-center">
							<button
								onClick={handleLogout}
								className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</nav>

			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="mb-6">
						<form onSubmit={handleSearch} className="flex gap-4">
							<input
								type="text"
								placeholder="Search exams..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
							<button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
								Search
							</button>
						</form>
					</div>

					{error && <div className="mb-4 text-red-600 text-center">{error}</div>}

					<div className="bg-white shadow overflow-hidden sm:rounded-md">
						<ul className="divide-y divide-gray-200">
							{exams.map((exam) => (
								<li key={exam.id}>
									<div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
										<div className="flex-1">
											<div className="flex items-center justify-between">
												<div className="flex items-center">
													<h3 className="text-lg font-medium text-gray-900">{exam.name}</h3>
													<span
														className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
															exam.status
														)}`}
													>
														{exam.status}
													</span>
												</div>
												<div className="text-sm text-gray-500">{exam.period} minutes</div>
											</div>
											<div className="mt-2 text-sm text-gray-500">
												<p>Start Date: {formatDate(exam.startDate)}</p>
												{exam.trainee && <p>Created by: {exam.trainee.username}</p>}
											</div>
										</div>
										<div className="ml-4">
											<button
												onClick={() => navigate(`/exam/${exam.id}`)}
												className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
											>
												{exam.status === ExamStatus.InProgress ? "Continue" : "View"}
											</button>
										</div>
									</div>
								</li>
							))}
						</ul>
					</div>

					{exams.length === 0 && !loading && (
						<div className="text-center py-12">
							<p className="text-gray-500">No exams found.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Exams;
