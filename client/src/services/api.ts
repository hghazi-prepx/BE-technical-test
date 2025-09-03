import axios from "axios";
import { LoginCredentials, LoginResponse, Exam, ApiResponse } from "../types";

const API_BASE_URL = "http://localhost:3000";

// Create axios instance
const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("access_token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("access_token");
			localStorage.removeItem("user");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

export const authService = {
	login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
		try {
			// Use fetch instead of axios to avoid CORS preflight issues
			const response = await fetch(`${API_BASE_URL}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(credentials),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log("Login response:", data);

			// Backend returns { data: { user, accessToken } }, extract and transform
			const { user, accessToken } = data.data;

			// Store the token and user
			localStorage.setItem("access_token", accessToken);
			localStorage.setItem("user", JSON.stringify(user));

			return {
				access_token: accessToken, // Convert accessToken → access_token
				user: user,
			};
		} catch (error) {
			console.error("Login error:", error);
			throw error;
		}
	},

	logout: () => {
		localStorage.removeItem("access_token");
		localStorage.removeItem("user");
	},

	getCurrentUser: () => {
		const userStr = localStorage.getItem("user");
		return userStr ? JSON.parse(userStr) : null;
	},
};

export const examService = {
	getAllExams: async (params?: { search?: string; skip?: number; take?: number }): Promise<ApiResponse<Exam[]>> => {
		try {
			const token = localStorage.getItem("access_token");
			console.log("Getting exams with token:", {
				hasToken: !!token,
				tokenLength: token?.length,
				tokenStart: token?.substring(0, 20) + "...",
				tokenEnd: token?.substring(token.length - 20),
			});

			// Only include search parameter if it's not empty
			const queryParams: Record<string, string> = {};

			if (params?.search && params.search.trim() !== "") {
				queryParams.search = params.search.trim();
			}
			// If no search parameter, don't send it at all

			if (params?.skip !== undefined) {
				queryParams.skip = params.skip.toString();
			}

			if (params?.take !== undefined) {
				queryParams.take = params.take.toString();
			}

			const queryString = new URLSearchParams(queryParams).toString();
			const url = `${API_BASE_URL}/exams?${queryString}`;

			console.log("Making request to:", url);
			console.log("With headers:", {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			});

			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			console.log("Response status:", response.status);
			console.log("Response headers:", Object.fromEntries(response.headers.entries()));

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error("Get exams error:", errorData);
				throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || "Unknown error"}`);
			}

			const data = await response.json();
			console.log("Exams response:", data);
			console.log("Exams response type:", typeof data);
			console.log("Exams response keys:", Object.keys(data));
			console.log("Data.data type:", typeof data.data);
			console.log("Data.data:", data.data);
			console.log("Data.data length:", data.data?.length);

			// Backend returns nested structure: { data: { data: [...], totalRecords: X } }
			// Extract and transform to match client's expected ApiResponse<Exam[]> format
			const examsArray = data.data.data;

			// Transform time units for each exam:
			// - period: keep in minutes (for display)
			// - totalPausedTime: keep in milliseconds (as sent by backend)
			const transformedExams = examsArray.map((exam: any) => ({
				...exam,
				period: exam.period, // Keep in minutes for display
				totalPausedTime: exam.totalPausedTime, // Keep in milliseconds (as sent by backend)
			}));

			const transformedResponse: ApiResponse<Exam[]> = {
				data: transformedExams,
				totalRecords: data.data.totalRecords,
			};

			console.log("Transformed response:", transformedResponse);
			console.log("Exams array length:", transformedResponse.data.length);

			return transformedResponse;
		} catch (error: any) {
			console.error("Get exams error:", error);
			console.error("Error details:", {
				message: error?.message || "Unknown error",
				stack: error?.stack || "No stack trace",
				name: error?.name || "Unknown error type",
			});
			throw error;
		}
	},

	getExamById: async (id: number): Promise<Exam> => {
		try {
			const token = localStorage.getItem("access_token");

			const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log("Get exam by ID response:", data);

			// Backend returns nested structure: { data: { ...examData } }
			// Extract the actual exam data and transform time units
			const examData = data.data;

			// Transform time units:
			// - period: keep in minutes (for display)
			// - totalPausedTime: keep in milliseconds (as sent by backend)
			const transformedExam: Exam = {
				...examData,
				period: examData.period, // Keep in minutes for display
				totalPausedTime: examData.totalPausedTime, // Keep in milliseconds (as sent by backend)
			};

			console.log("Transformed exam data:", transformedExam);
			console.log("Period (minutes):", transformedExam.period);
			console.log("Total paused time (milliseconds):", transformedExam.totalPausedTime);

			return transformedExam;
		} catch (error: any) {
			console.error("Get exam by ID error:", error);
			console.error("Error details:", {
				message: error?.message || "Unknown error",
				stack: error?.stack || "No stack trace",
				name: error?.name || "Unknown error type",
			});
			throw error;
		}
	},

	pauseExam: async (id: number): Promise<Exam> => {
		try {
			const token = localStorage.getItem("access_token");

			const response = await fetch(`${API_BASE_URL}/exams/${id}/pause`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log("Pause exam response:", data);

			// Handle nested response and transform time units
			const examData = data.data || data;
			const transformedExam: Exam = {
				...examData,
				period: examData.period, // Keep in minutes for display
				totalPausedTime: examData.totalPausedTime, // Keep in milliseconds (as sent by backend)
			};

			return transformedExam;
		} catch (error: any) {
			console.error("Pause exam error:", error);
			throw error;
		}
	},

	unpauseExam: async (id: number): Promise<Exam> => {
		try {
			const token = localStorage.getItem("access_token");

			const response = await fetch(`${API_BASE_URL}/exams/${id}/unpause`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log("Unpause exam response:", data);

			// Handle nested response and transform time units
			const examData = data.data || data;
			const transformedExam: Exam = {
				...examData,
				period: examData.period, // Keep in minutes for display
				totalPausedTime: examData.totalPausedTime, // Keep in milliseconds (as sent by backend)
			};

			return transformedExam;
		} catch (error: any) {
			console.error("Unpause exam error:", error);
			throw error;
		}
	},
};

export default api;
