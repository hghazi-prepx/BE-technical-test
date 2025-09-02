export interface User {
	id: number;
	username: string;
	role: UserRole;
}

export enum UserRole {
	Students = "Students",
	Trainee = "Trainee",
	Admin = "Admin",
}

export interface Exam {
	id: number;
	name: string;
	startDate: Date;
	period: number;
	status: ExamStatus;
	createdAt: Date;
	traineeId: number;
	trainee?: {
		id: number;
		username: string;
	};
	passedTime?: number;
	pausedAt?: Date;
	totalPausedTime?: number;
}

export enum ExamStatus {
	Pending = "Pending",
	InProgress = "InProgress",
	Paused = "Paused",
	Completed = "Completed",
	Expired = "Expired",
}

export enum ExamPeriod {
	MIN_15 = 15,
	MIN_30 = 30,
	MIN_60 = 60,
	MIN_90 = 90,
	MIN_120 = 120,
}

export interface LoginCredentials {
	username: string;
	password: string;
}

export interface LoginResponse {
	access_token: string;
	user: User;
}

export interface ApiResponse<T> {
	data: T;
	totalRecords: number;
}
