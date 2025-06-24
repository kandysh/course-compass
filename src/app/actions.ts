"use server";
import { cookies } from "next/headers";

import type { AuthFormInput } from "@/components/auth/AuthForm";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  type UserSession,
} from "@/lib/auth.config";
import type {
  ChatMessage,
  ChatSession,
  Course,
  EnrolledStudentInfo,
  Enrollment,
  User,
} from "@/lib/data";
import sql from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * Retrieves courses for a user based on their role and ID.
 * For instructors, it fetches courses they manage.
 * For students, it fetches all courses, indicating enrollment status and progress.
 * If no userId is provided, it fetches all courses (less detailed).
 * @param userRole - The role of the user ('student' or 'instructor').
 * @param userId - The optional ID of the user.
 * @returns A promise that resolves to an array of Course objects.
 * @throws An error if the database query fails.
 */
export async function getCoursesForUser(
  userRole: "student" | "instructor",
  userId?: number,
): Promise<Course[]> {
  try {
    let courses: Course[] = [];
    if (userRole === "instructor" && userId) {
      courses = await sql<Course[]>`
        SELECT
          c.id,
          c.name,
          c.description,
          u_instructor.username as "instructorUsername",
          c.instructor_id as "instructorId",
          c.thumbnail_url as "thumbnailUrl",
          c.due_date as "dueDate",
          c.created_at as "createdAt",
          COUNT(DISTINCT e.student_id) as "enrolledStudentCount",
          COALESCE(AVG(cp.progress_percent), 0.0) as "averageProgress"
        FROM courses c
        JOIN users u_instructor ON c.instructor_id = u_instructor.id
        LEFT JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN course_progress cp ON e.id = cp.enrollment_id
        WHERE c.instructor_id = ${userId}
        GROUP BY c.id, u_instructor.username, c.name, c.description, c.instructor_id, c.thumbnail_url, c.due_date, c.created_at
        ORDER BY c.name ASC
      `;
    } else if (userRole === "student" && userId) {
      courses = await sql<Course[]>`
        SELECT
          c.id,
          c.name,
          c.description,
          u_instructor.username as "instructorUsername",
          c.instructor_id as "instructorId",
          c.thumbnail_url as "thumbnailUrl",
          c.due_date as "dueDate",
          c.created_at as "createdAt",
          COALESCE(e.marked_completed, false) as "isCompleted",
          COALESCE(cp.progress_percent, 0.0) as "progressPercent",
          (e.id IS NOT NULL) AS "isEnrolled",
          e.id as "enrollmentId"
        FROM courses c
        JOIN users u_instructor ON c.instructor_id = u_instructor.id
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = ${userId}
        LEFT JOIN course_progress cp ON e.id = cp.enrollment_id
        ORDER BY c.name ASC
      `;
    } else {
      courses = await sql<Course[]>`
        SELECT
          c.id,
          c.name,
          c.description,
          u_instructor.username as "instructorUsername",
          c.instructor_id as "instructorId",
          c.thumbnail_url as "thumbnailUrl",
          c.due_date as "dueDate",
          c.created_at as "createdAt",
          false as "isCompleted",
          0.0 as "progressPercent",
          false as "isEnrolled"
        FROM courses c
        JOIN users u_instructor ON c.instructor_id = u_instructor.id
        ORDER BY c.name ASC
      `;
    }
    return courses.map((course) => ({
      ...course,
      description: course.description || null,
      dueDate: course.dueDate
        ? new Date(course.dueDate).toISOString().split("T")[0]
        : null,
      progressPercent: course.progressPercent
        ? parseFloat(course.progressPercent as any)
        : userRole === "student"
          ? 0.0
          : undefined,
      averageProgress: course.averageProgress
        ? parseFloat(course.averageProgress as any)
        : undefined,
      enrolledStudentCount: course.enrolledStudentCount
        ? parseInt(course.enrolledStudentCount as any, 10)
        : undefined,
      createdAt: course.createdAt
        ? new Date(course.createdAt).toISOString()
        : undefined,
    }));
  } catch (error) {
    throw new Error(
      `Failed to fetch courses. Please ensure your database is set up correctly and the POSTGRES_URL environment variable is configured.`,
    );
  }
}

/**
 * Retrieves detailed information for a specific course, including instructor details and enrolled students.
 * If a userId is provided, it also includes the user's enrollment status and progress for that course.
 * @param courseId - The ID of the course to retrieve.
 * @param userId - The optional ID of the user viewing the course.
 * @returns A promise that resolves to a Course object or null if not found.
 * @throws An error if the database query fails.
 */
export async function getCourseDetails(
  courseId: number,
  userId?: number,
): Promise<Course | null> {
  try {
    let courseResult;
    if (userId) {
      courseResult = await sql<Course[]>`
        SELECT
            c.id,
            c.name,
            c.description,
            u_instructor.username as "instructorUsername",
            c.instructor_id as "instructorId",
            c.thumbnail_url as "thumbnailUrl",
            c.due_date as "dueDate",
            c.created_at as "createdAt",
            COALESCE(e.marked_completed, false) as "isCompleted",
            COALESCE(cp.progress_percent, 0.0) as "progressPercent",
            (e.id IS NOT NULL) AS "isEnrolled",
            e.id as "enrollmentId"
        FROM courses c
        JOIN users u_instructor ON c.instructor_id = u_instructor.id
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = ${userId}
        LEFT JOIN course_progress cp ON e.id = cp.enrollment_id
        WHERE c.id = ${courseId}
        `;
    } else {
      courseResult = await sql<Course[]>`
        SELECT
            c.id,
            c.name,
            c.description,
            u_instructor.username as "instructorUsername",
            c.instructor_id as "instructorId",
            c.thumbnail_url as "thumbnailUrl",
            c.due_date as "dueDate",
            c.created_at as "createdAt",
            null as "isCompleted",
            null as "progressPercent",
            null as "isEnrolled",
            null as "enrollmentId"
        FROM courses c
        JOIN users u_instructor ON c.instructor_id = u_instructor.id
        WHERE c.id = ${courseId}
        `;
    }

    if (!courseResult || courseResult.length === 0) return null;

    const course: Course = {
      ...courseResult[0],
      description: courseResult[0].description || null,
      dueDate: courseResult[0].dueDate
        ? new Date(courseResult[0].dueDate).toISOString().split("T")[0]
        : null,
      progressPercent: courseResult[0].progressPercent
        ? parseFloat(courseResult[0].progressPercent as any)
        : undefined,
      createdAt: courseResult[0].createdAt
        ? new Date(courseResult[0].createdAt).toISOString()
        : undefined,
    };

    const enrolledStudentsData = await sql<
      Array<EnrolledStudentInfo & { completionTime?: Date }>
    >`
        SELECT
            u.id,
            u.username,
            u.email,
            u.role,
            u.avatar_url as "avatarUrl",
            e.enrolled_at as "enrollmentDate",
            COALESCE(cp.progress_percent, 0.0) as "progressPercent",
            CASE
                WHEN COALESCE(cp.progress_percent, 0.0) = 100.00 THEN cp.updated_at
                ELSE NULL
            END as "completionTime"
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        LEFT JOIN course_progress cp ON e.id = cp.enrollment_id
        WHERE e.course_id = ${course.id} AND u.role = 'student'
        ORDER BY
            CASE WHEN COALESCE(cp.progress_percent, 0.0) = 100.00 THEN 0 ELSE 1 END ASC,
            "completionTime" ASC NULLS LAST,
            COALESCE(cp.progress_percent, 0.0) DESC,
            u.username ASC
    `;

    course.enrolledStudents = enrolledStudentsData.map((student) => ({
      ...student,
      enrollmentDate: student.enrollmentDate
        ? new Date(student.enrollmentDate).toISOString()
        : undefined,
      progressPercent: student.progressPercent
        ? parseFloat(student.progressPercent as any)
        : 0,
      completionTime: student.completionTime
        ? new Date(student.completionTime).toISOString()
        : null,
    }));

    course.enrolledStudentCount = course.enrolledStudents.length;
    if (course.enrolledStudents.length > 0) {
      const totalProgress = course.enrolledStudents.reduce(
        (sum, student) => sum + (student.progressPercent || 0),
        0,
      );
      course.averageProgress = totalProgress / course.enrolledStudents.length;
    } else {
      course.averageProgress = 0;
    }

    return course;
  } catch (error) {
    throw new Error(
      `Failed to fetch course details. Database connection or query error.`,
    );
  }
}

/**
 * Represents the data required to create a new course.
 */
interface CreateCourseActionData {
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  dueDate?: string | null;
}

/**
 * Creates a new course in the database.
 * @param courseData - The data for the new course.
 * @param instructorId - The ID of the instructor creating the course.
 * @returns A promise that resolves to the created Course object.
 * @throws An error if the database query fails.
 */
export async function createNewCourse(
  courseData: CreateCourseActionData,
  instructorId: number,
): Promise<Course> {
  const {
    name,
    description,
    thumbnailUrl,
    dueDate: dueDateString,
  } = courseData;
  const dueDate = dueDateString ? new Date(dueDateString) : null;

  try {
    const [createdCourse] = await sql<Course[]>`
      INSERT INTO courses (name, description, instructor_id, thumbnail_url, due_date)
      VALUES (
        ${name},
        ${description || null},
        ${instructorId},
        ${thumbnailUrl || null},
        ${dueDate ? dueDate.toISOString().split("T")[0] : null}
      )
      RETURNING id, name, description, instructor_id as "instructorId", thumbnail_url as "thumbnailUrl", due_date as "dueDate", created_at as "createdAt"
    `;
    if (!createdCourse || !createdCourse.id) {
      throw new Error("Course ID was not returned after insert.");
    }
    const [instructor] = await sql<
      Array<{ username: string }>
    >`SELECT username FROM users WHERE id = ${createdCourse.instructorId}`;

    return {
      ...createdCourse,
      description: createdCourse.description || null,
      instructorUsername: instructor?.username || "N/A",
      dueDate: createdCourse.dueDate
        ? new Date(createdCourse.dueDate).toISOString().split("T")[0]
        : null,
      createdAt: createdCourse.createdAt
        ? new Date(createdCourse.createdAt).toISOString()
        : undefined,
      enrolledStudentCount: 0,
      averageProgress: 0,
    };
  } catch (error) {
    throw new Error(`Failed to create course. Database error.`);
  }
}

/**
 * Updates the progress of a student in a specific course.
 * @param userId - The ID of the student.
 * @param courseId - The ID of the course.
 * @param progress - The new progress percentage (0-100).
 * @returns A promise that resolves when the progress is updated.
 * @throws An error if the database query fails or user is not enrolled.
 */
export async function updateCourseProgress(
  userId: number,
  courseId: number,
  progress: number,
): Promise<void> {
  const sanitizedProgress = Math.max(0, Math.min(100, progress));
  const isNowCompleted = sanitizedProgress === 100;

  try {
    const [enrollment] = await sql<Enrollment[]>`
      SELECT id FROM enrollments WHERE student_id = ${userId} AND course_id = ${courseId}
    `;

    if (!enrollment || !enrollment.id) {
      throw new Error(
        `User ${userId} is not enrolled in course ${courseId}. Cannot update progress.`,
      );
    }

    const enrollmentId = enrollment.id;

    await sql`
      INSERT INTO course_progress (enrollment_id, progress_percent, updated_at)
      VALUES (${enrollmentId}, ${sanitizedProgress}, NOW())
      ON CONFLICT (enrollment_id)
      DO UPDATE SET
        progress_percent = EXCLUDED.progress_percent,
        updated_at = NOW();
    `;

    await sql`
      UPDATE enrollments
      SET marked_completed = ${isNowCompleted}
      WHERE id = ${enrollmentId};
    `;
  } catch (error) {
    throw new Error(`Failed to update course progress. Database error.`);
  }
}

/**
 * Enrolls a student in a course.
 * If the student is already enrolled, this operation does nothing.
 * Initializes course progress to 0% upon enrollment.
 * @param userId - The ID of the student to enroll.
 * @param courseId - The ID of the course to enroll in.
 * @returns A promise that resolves when the enrollment is successful.
 * @throws An error if the database query fails.
 */
export async function enrollInCourse(
  userId: number,
  courseId: number,
): Promise<void> {
  try {
    const [enrollment] = await sql<Array<{ id: number }>>`
      INSERT INTO enrollments (student_id, course_id, marked_completed, enrolled_at)
      VALUES (${userId}, ${courseId}, false, NOW())
      ON CONFLICT (student_id, course_id) DO NOTHING
      RETURNING id;
    `;

    let enrollmentId = enrollment?.id;

    if (!enrollmentId) {
      const [existingEnrollment] = await sql<Array<{ id: number }>>`
        SELECT id FROM enrollments WHERE student_id = ${userId} AND course_id = ${courseId};
      `;
      if (existingEnrollment) {
        enrollmentId = existingEnrollment.id;
      } else {
        throw new Error("Failed to create or find enrollment record.");
      }
    }

    await sql`
        INSERT INTO course_progress (enrollment_id, progress_percent, updated_at)
        VALUES (${enrollmentId}, 0.0, NOW())
        ON CONFLICT (enrollment_id) DO NOTHING;
    `;
  } catch (error) {
    throw new Error("Failed to enroll in course. Database error.");
  }
}

/**
 * Represents the result of an authentication attempt (login or signup).
 */
interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Creates a new session for a user and sets the session cookie.
 * @param userId - The ID of the user for whom to create a session.
 * @returns A promise that resolves to the session ID (UUID).
 */
async function createSession(userId: number): Promise<string> {
  const cookieStore = await cookies();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + AUTH_COOKIE_OPTIONS.maxAge! * 1000);

  await sql`
    INSERT INTO user_sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})
  `;

  cookieStore.set(AUTH_COOKIE_NAME, sessionId, AUTH_COOKIE_OPTIONS);
  return sessionId;
}

/**
 * Signs up a new user with the provided credentials and role.
 * @param formData - The user's signup details including username, email, password, and an optional avatarUrl.
 * @param role - The role of the user ('student' or 'instructor').
 * @returns A promise that resolves to an AuthResult object.
 */
export async function signupUser(
  formData: AuthFormInput,
  role: "student" | "instructor",
): Promise<AuthResult> {
  const { username, email, password, avatarUrl } = formData;

  if (!username) {
    return { success: false, error: "Username is required." };
  }

  try {
    const existingUserByEmail = await sql<Array<{ id: number }>>`
      SELECT id FROM users WHERE email = ${email}
    `;
    if (existingUserByEmail.length > 0) {
      return { success: false, error: "User with this email already exists." };
    }

    const existingUserByUsername = await sql<Array<{ id: number }>>`
      SELECT id FROM users WHERE username = ${username}
    `;
    if (existingUserByUsername.length > 0) {
      return { success: false, error: "Username is already taken." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUserFields] = await sql<
      Array<{
        id: number;
        username: string;
        email: string;
        role: "student" | "instructor";
        created_at: Date;
        avatarUrl: string | null;
      }>
    >`
      INSERT INTO users (username, email, password_hash, role, avatar_url)
      VALUES (${username}, ${email}, ${hashedPassword}, ${role}, ${avatarUrl || null})
      RETURNING id, username, email, role, created_at, avatar_url
    `;

    if (!newUserFields || !newUserFields.id) {
      throw new Error("User ID was not returned after insert.");
    }

    await createSession(newUserFields.id);

    const userDataForClient: User = {
      id: newUserFields.id,
      username: newUserFields.username,
      email: newUserFields.email,
      role: newUserFields.role,
      avatarUrl: newUserFields.avatarUrl,
      createdAt: newUserFields.created_at
        ? new Date(newUserFields.created_at).toISOString()
        : undefined,
    };

    return { success: true, user: userDataForClient };
  } catch (error) {
    let errorMessage = "An error occurred during signup. Please try again.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Logs in an existing user with the provided credentials and role.
 * @param formData - The user's login details (email, password).
 * @param role - The role the user is attempting to log in as ('student' or 'instructor').
 * @returns A promise that resolves to an AuthResult object.
 */
export async function loginUser(
  formData: AuthFormInput,
  role: "student" | "instructor",
): Promise<AuthResult> {
  const { email, password } = formData;

  try {
    const users = await sql<Array<User & { password_hash?: string }>>`
      SELECT id, username, email, password_hash, role, avatar_url as "avatarUrl", created_at as "createdAt"
      FROM users
      WHERE email = ${email} AND role = ${role}
    `;

    if (users.length === 0) {
      return { success: false, error: "Invalid email, password, or role." };
    }

    const userFromDb = users[0];

    if (!userFromDb.password_hash) {
      return {
        success: false,
        error: "User data incomplete. Cannot verify password.",
      };
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      userFromDb.password_hash,
    );

    if (!isPasswordValid) {
      return { success: false, error: "Invalid email, password, or role." };
    }

    await createSession(userFromDb.id);

    const userDataForClient: User = {
      id: userFromDb.id,
      username: userFromDb.username,
      email: userFromDb.email,
      role: userFromDb.role,
      avatarUrl: userFromDb.avatarUrl,
      createdAt: userFromDb.createdAt
        ? new Date(userFromDb.createdAt).toISOString()
        : undefined,
    };

    return { success: true, user: userDataForClient };
  } catch (error) {
    return {
      success: false,
      error: "An error occurred during login. Please try again.",
    };
  }
}

/**
 * Retrieves the authenticated user's session based on the session cookie.
 * Validates the session against the database and checks for expiry.
 * @returns A promise that resolves to a UserSession object or null if not authenticated or session is invalid.
 */
export async function getAuthenticatedUserSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  try {
    const [sessionRecord] = await sql<
      Array<{ id: string; user_id: number; expires_at: Date }>
    >`
      SELECT id, user_id, expires_at FROM user_sessions WHERE id = ${sessionId}
    `;

    if (!sessionRecord) {
      return null;
    }

    if (new Date(sessionRecord.expires_at) < new Date()) {
      await sql`DELETE FROM user_sessions WHERE id = ${sessionId}`;
      return null;
    }

    const [userRecord] = await sql<Array<User>>`
      SELECT id, username, email, role, avatar_url as "avatarUrl", created_at as "createdAt"
      FROM users
      WHERE id = ${sessionRecord.user_id}
    `;

    if (!userRecord) {
      await sql`DELETE FROM user_sessions WHERE id = ${sessionId}`;
      return null;
    }

    return {
      id: userRecord.id,
      username: userRecord.username,
      role: userRecord.role,
      avatarUrl: userRecord.avatarUrl,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Logs out the current user by deleting their session from the database and clearing the session cookie.
 * @returns A promise that resolves when the logout process is complete.
 */
export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (sessionId) {
    try {
      await sql`DELETE FROM user_sessions WHERE id = ${sessionId}`;
    } catch (error) {}
  }
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Retrieves full user details for a given user ID.
 * @param userId - The ID of the user to retrieve.
 * @returns A promise that resolves to a User object or null if not found.
 * @throws An error if the database query fails.
 */
export async function getUserDetailsById(userId: number): Promise<User | null> {
  try {
    const [user] = await sql<User[]>`
      SELECT id, username, email, role, avatar_url as "avatarUrl", created_at as "createdAt"
      FROM users
      WHERE id = ${userId}
    `;
    if (!user) {
      return null;
    }
    return {
      ...user,
      createdAt: user.createdAt
        ? new Date(user.createdAt).toISOString()
        : undefined,
    };
  } catch (error) {
    throw new Error("Failed to fetch user details.");
  }
}

/**
 * Starts a new chat session for a student or retrieves an existing one if created within the last hour.
 * @param studentId - The ID of the student.
 * @returns A promise that resolves to a ChatSession object.
 * @throws An error if the database query fails.
 */
export async function startOrGetChatSession(
  studentId: number,
): Promise<ChatSession> {
  try {
    const recentSession = await sql<ChatSession[]>`
      SELECT id, student_id as "studentId", started_at as "startedAt"
      FROM chat_sessions
      WHERE student_id = ${studentId} AND started_at > NOW() - INTERVAL '1 hour'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (recentSession.length > 0) {
      return {
        ...recentSession[0],
        startedAt: new Date(recentSession[0].startedAt).toISOString(),
      };
    }

    const [session] = await sql<ChatSession[]>`
      INSERT INTO chat_sessions (student_id)
      VALUES (${studentId})
      RETURNING id, student_id as "studentId", started_at as "startedAt"
    `;
    if (!session || !session.id) {
      throw new Error("Failed to create or retrieve chat session.");
    }

    return {
      ...session,
      startedAt: new Date(session.startedAt).toISOString(),
    };
  } catch (error) {
    throw new Error("Failed to manage chat session.");
  }
}

/**
 * Retrieves all chat messages for a given chat session ID.
 * @param sessionId - The ID of the chat session.
 * @returns A promise that resolves to an array of ChatMessage objects.
 * @throws An error if the database query fails.
 */
export async function getChatMessages(
  sessionId: number,
): Promise<ChatMessage[]> {
  try {
    const messages = await sql<ChatMessage[]>`
      SELECT id, session_id as "sessionId", sender, message, sent_at as "sentAt"
      FROM chat_messages
      WHERE session_id = ${sessionId}
      ORDER BY sent_at ASC
    `;
    return messages.map((msg) => ({
      ...msg,
      sentAt: new Date(msg.sentAt).toISOString(),
    }));
  } catch (error) {
    throw new Error("Failed to fetch chat messages.");
  }
}

/**
 * Saves a new chat message to the database.
 * @param sessionId - The ID of the chat session.
 * @param sender - The sender of the message ('student' or 'bot').
 * @param messageText - The content of the message.
 * @returns A promise that resolves to the saved ChatMessage object.
 * @throws An error if the database query fails.
 */
export async function saveChatMessage(
  sessionId: number,
  sender: "student" | "bot",
  messageText: string,
): Promise<ChatMessage> {
  try {
    const [message] = await sql<ChatMessage[]>`
      INSERT INTO chat_messages (session_id, sender, message)
      VALUES (${sessionId}, ${sender}, ${messageText})
      RETURNING id, session_id as "sessionId", sender, message, sent_at as "sentAt"
    `;
    if (!message || !message.id) {
      throw new Error("Message ID was not returned after insert.");
    }
    return {
      ...message,
      sentAt: new Date(message.sentAt).toISOString(),
    };
  } catch (error) {
    throw new Error("Failed to save chat message.");
  }
}
