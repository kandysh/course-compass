
/**
 * Represents a user in the system.
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'instructor';
  avatarUrl?: string | null;
  createdAt?: string;
}

/**
 * Represents detailed information about a student enrolled in a course.
 * Extends User and includes enrollment-specific details.
 */
export interface EnrolledStudentInfo {
  id: number;
  username: string;
  email: string;
  role: 'student';
  avatarUrl?: string | null; 
  enrollmentDate?: string;
  progressPercent?: number;
  completionTime?: string | null;
}

/**
 * Represents a course in the system.
 */
export interface Course {
  id: number;
  name: string;
  description?: string | null;
  instructorId: number;
  instructorUsername?: string;
  thumbnailUrl: string | null;
  dueDate: string | null;
  createdAt?: string;

  /** Indicates if the current user is enrolled in this course. */
  isEnrolled?: boolean;
  /** Indicates if the current user has completed this course. */
  isCompleted?: boolean;
  /** The current user's progress percentage in this course. */
  progressPercent?: number;
  /** The ID of the enrollment record if the current user is enrolled. */
  enrollmentId?: number;
  /** A list of students enrolled in this course (primarily for instructor view). */
  enrolledStudents?: EnrolledStudentInfo[];
  /** The total number of students enrolled in this course. */
  enrolledStudentCount?: number;
  /** The average progress percentage of all enrolled students in this course. */
  averageProgress?: number;
}

/**
 * Represents an enrollment record, linking a student to a course.
 */
export interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  markedCompleted: boolean;
  enrolledAt?: string;
}

/**
 * Represents a student's progress in an enrolled course.
 */
export interface CourseProgress {
  id: number;
  enrollmentId: number;
  progressPercent: number;
  updatedAt?: string;
}

/**
 * Represents a chat session between a student and the AI bot.
 */
export interface ChatSession {
  id: number;
  studentId: number;
  startedAt: string;
}

/**
 * Represents a single message within a chat session.
 */
export interface ChatMessage {
  id: number;
  sessionId: number;
  sender: 'student' | 'bot';
  message: string;
  sentAt: string;
}

/**
 * Represents the input for authentication forms.
 */
export interface AuthFormInput {
  email: string;
  password: string;
  username?: string;
  avatarUrl?: string | null;
}
