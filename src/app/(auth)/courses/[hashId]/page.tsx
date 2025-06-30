"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import type { Course, EnrolledStudentInfo, User } from "@/lib/data";
import type { UserSession } from "@/lib/auth.config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  CalendarDays,
  Info,
  BookOpen,
  User as UserIcon,
  Users,
  TrendingUp,
  Crown,
  Medal,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCourseDetails,
  getUserDetailsById,
  getAuthenticatedUserSession,
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { decodeId } from "@/lib/hashids";
import { cn } from "@/lib/utils";

const DEFAULT_THUMBNAIL_URL = "https://placehold.co/600x400.png";
const DEFAULT_AVATAR_URL = "https://placehold.co/40x40.png";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const hashId = params.hashId as string;
  const viewingUserHashId = searchParams.get("viewingUserId");

  const [course, setCourse] = React.useState<Course | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [numericCourseId, setNumericCourseId] = React.useState<number | null>(
    null,
  );
  const [numericViewingUserId, setNumericViewingUserId] = React.useState<
    number | null
  >(null);
  const [viewingUser, setViewingUser] = React.useState<User | null>(null);
  const [sessionUser, setSessionUser] = React.useState<UserSession | null>(
    null,
  );

  React.useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      const authenticatedUser = await getAuthenticatedUserSession();
      setSessionUser(authenticatedUser);

      const decodedCourseId = decodeId(hashId);
      if (decodedCourseId === null) {
        toast({
          title: "Invalid Course Identifier",
          description: "The course ID in the URL is invalid.",
          variant: "destructive",
        });
        setLoading(false);
        setCourse(null);
        return;
      }
      setNumericCourseId(decodedCourseId);

      let tempNumericViewingUserId: number | null = null;
      let viewingUserDetailsPromise: Promise<User | null> =
        Promise.resolve(null);

      if (viewingUserHashId) {
        const decodedViewingUserId = decodeId(viewingUserHashId);
        if (decodedViewingUserId !== null) {
          tempNumericViewingUserId = decodedViewingUserId;
          setNumericViewingUserId(decodedViewingUserId);
          viewingUserDetailsPromise = getUserDetailsById(decodedViewingUserId);
        }
      } else if (authenticatedUser?.role === "student") {
        // If no viewingUserHashId and logged in as student, they are the viewing user for progress
        tempNumericViewingUserId = authenticatedUser.id;
        setNumericViewingUserId(authenticatedUser.id);
        setViewingUser({
          id: authenticatedUser.id,
          username: authenticatedUser.username,
          role: authenticatedUser.role,
          avatarUrl: authenticatedUser.avatarUrl,
          email: "",
        });
      }

      const courseDetailsPromise = getCourseDetails(
        decodedCourseId,
        tempNumericViewingUserId ?? undefined,
      );

      try {
        const [fetchedViewingUser, courseData] = await Promise.all([
          viewingUserDetailsPromise,
          courseDetailsPromise,
        ]);

        // Only set viewingUser from fetch if viewingUserHashId was present
        if (viewingUserHashId) {
          setViewingUser(fetchedViewingUser);
        }
        // If viewingUserHashId was not present & auth user is student, setViewingUser was already handled.

        if (courseData) {
          setCourse(courseData);
        } else {
          setCourse(null);
          toast({
            title: "Course Not Found",
            description: "The course you are looking for does not exist.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error Loading Course",
          description:
            "Could not fetch course details. Please try again later.",
          variant: "destructive",
        });
        setCourse(null);
        if (viewingUserHashId) setViewingUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, [hashId, viewingUserHashId, toast]);

  if (loading) {
    return (
      <main className="flex-1 container py-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="overflow-hidden shadow-lg">
          <Skeleton className="h-64 w-full md:h-96" />
          <CardHeader className="p-6">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter className="p-6 bg-muted/50 border-t">
            <Skeleton className="h-4 w-1/4" />
          </CardFooter>
        </Card>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="flex-1 container py-8 text-center">
        <BookOpen className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="font-headline text-3xl font-bold mb-4">
          Course Not Found
        </h1>
        <p className="text-muted-foreground mb-6">
          Sorry, we couldn't find the course you were looking for or an error
          occurred.
        </p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-5 w-5" />
          Go Back
        </Button>
      </main>
    );
  }

  const formattedDueDate = course.dueDate
    ? new Date(course.dueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
    : "N/A";

  const currentProgress = course.progressPercent ?? 0;
  const isCourseCompletedByUser = course.isCompleted ?? false;
  const isUserActuallyEnrolled = course.isEnrolled ?? false;

  const isViewingInstructor =
    sessionUser?.role === "instructor" &&
    sessionUser?.id === course.instructorId;
  const canViewLeaderboard =
    isViewingInstructor ||
    (isUserActuallyEnrolled && sessionUser?.role === "student");

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Crown className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-semibold">{rank}</span>;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 container py-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-8 text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        <Card className="overflow-hidden rounded-xl shadow-2xl">
          <div className="relative h-56 w-full sm:h-72 md:h-96 bg-muted">
            <Image
              src={course.thumbnailUrl || DEFAULT_THUMBNAIL_URL}
              alt={`Thumbnail for ${course.name}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              data-ai-hint={
                !course.thumbnailUrl ? "placeholder course" : undefined
              }
            />
          </div>
          <CardHeader className="p-6 md:p-8">
            <CardTitle className="font-headline text-3xl md:text-4xl mb-2 leading-tight">
              {course.name}
            </CardTitle>
            <div className="flex flex-wrap items-center text-muted-foreground text-sm gap-x-6 gap-y-2 mb-4">
              <div className="flex items-center">
                <UserIcon className="mr-1.5 h-4 w-4 text-primary" />
                <span>Instructor: {course.instructorUsername || "N/A"}</span>
              </div>
              {course.dueDate && (
                <div className="flex items-center">
                  <CalendarDays className="mr-1.5 h-4 w-4 text-primary" />
                  <span>Due: {formattedDueDate}</span>
                </div>
              )}
              {typeof course.enrolledStudentCount === "number" && (
                <div className="flex items-center">
                  <Users className="mr-1.5 h-4 w-4 text-primary" />
                  <span>{course.enrolledStudentCount} Enrolled</span>
                </div>
              )}
              {typeof course.averageProgress === "number" && (
                <div className="flex items-center">
                  <TrendingUp className="mr-1.5 h-4 w-4 text-primary" />
                  <span>
                    Avg. Progress: {course.averageProgress.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            {isUserActuallyEnrolled &&
              typeof course.progressPercent !== "undefined" &&
              !isViewingInstructor && (
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground items-center">
                    <span>Your Progress</span>
                    <span className="font-semibold text-base text-foreground">
                      {currentProgress}%
                    </span>
                  </div>
                  <Progress
                    value={currentProgress}
                    className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent"
                    aria-label={`${course.name} progress ${currentProgress}%`}
                  />
                  <div className="mt-1">
                    {isCourseCompletedByUser ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200 text-xs py-0.5 px-2">
                        Completed
                      </Badge>
                    ) : course.dueDate &&
                      new Date(course.dueDate) < new Date() &&
                      !isCourseCompletedByUser ? (
                      <Badge
                        variant="destructive"
                        className="text-xs py-0.5 px-2"
                      >
                        Overdue
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-xs py-0.5 px-2"
                      >
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
              )}
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-0">
            <div className="text-base leading-relaxed whitespace-pre-line">
              {course.description || "No description provided for this course."}
            </div>
          </CardContent>
          <CardFooter className="p-6 md:p-8 bg-muted/30 border-t mt-4">
            <div className="flex items-center text-xs text-muted-foreground">
              <Info className="mr-2 h-3.5 w-3.5" />
              <span>
                Course ID: {hashId} (Internal: {course.id})
              </span>
            </div>
          </CardFooter>
        </Card>

        {canViewLeaderboard && course.enrolledStudents && (
          <div className="mt-10">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center font-headline text-xl sm:text-2xl">
                  <Users className="mr-3 h-6 w-6 text-primary" />
                  {isViewingInstructor
                    ? `Enrolled Students (${course.enrolledStudentCount ?? 0})`
                    : "Class Progress Leaderboard"}
                </CardTitle>
                {typeof course.averageProgress === "number" && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Average Class Progress: {course.averageProgress.toFixed(1)}%
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {course.enrolledStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16 text-center">
                            Rank
                          </TableHead>
                          <TableHead>Student</TableHead>
                          {isViewingInstructor && <TableHead>Email</TableHead>}
                          <TableHead className="text-center">
                            Progress
                          </TableHead>
                          {isViewingInstructor && (
                            <TableHead className="text-right">
                              Enrolled At
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {course.enrolledStudents.map(
                          (student: EnrolledStudentInfo, index: number) => (
                            <TableRow
                              key={student.id}
                              className={cn(
                                student.id === numericViewingUserId &&
                                  "bg-primary/10",
                              )}
                            >
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center">
                                  {getRankIcon(index + 1)}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={
                                        student.avatarUrl || DEFAULT_AVATAR_URL
                                      }
                                      alt={student.username}
                                      data-ai-hint="student avatar"
                                    />
                                    <AvatarFallback>
                                      {student.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {student.username}{" "}
                                    {student.id === numericViewingUserId &&
                                      "(You)"}
                                  </span>
                                </div>
                              </TableCell>
                              {isViewingInstructor && (
                                <TableCell>{student.email}</TableCell>
                              )}
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span>
                                    {typeof student.progressPercent === "number"
                                      ? `${student.progressPercent.toFixed(0)}%`
                                      : "N/A"}
                                  </span>
                                  <Progress
                                    value={student.progressPercent ?? 0}
                                    className="h-1.5 w-24 mt-1"
                                  />
                                </div>
                              </TableCell>
                              {isViewingInstructor && (
                                <TableCell className="text-right text-xs text-muted-foreground">
                                  {student.enrollmentDate
                                    ? new Date(
                                        student.enrollmentDate,
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        timeZone: "UTC",
                                      })
                                    : "N/A"}
                                </TableCell>
                              )}
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No students are currently enrolled in this course.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-12">
          <h2 className="font-headline text-xl sm:text-2xl font-semibold mb-4">
            Course Modules & Content
          </h2>
          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8 text-center text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4 text-primary/50" />
              <p className="text-lg mb-1">
                Detailed course content is coming soon!
              </p>
              <p className="text-sm">
                This section will feature modules, lessons, assignments,
                quizzes, and other learning materials.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
