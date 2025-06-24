"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { ChatbotClient } from "@/components/dashboard/ChatbotClient";
import type { Course } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  MessageSquare,
  LayoutGrid,
  ListFilter,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getCoursesForUser,
  updateCourseProgress,
  enrollInCourse,
  getAuthenticatedUserSession,
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { decodeId, encodeId } from "@/lib/hashids";
import type { UserSession } from "@/lib/auth.config";

type FilterStatus = "all" | "enrolled" | "notEnrolled" | "completed";

export default function StudentDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const hashUserIdFromParams = params.hashUserId as string;

  const [courses, setCourses] = React.useState<Course[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isChatbotOpen, setIsChatbotOpen] = React.useState(false);
  const [selectedCourseForChat, setSelectedCourseForChat] =
    React.useState<Course | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<FilterStatus>("all");
  const [loggedInUser, setLoggedInUser] = React.useState<UserSession | null>(
    null,
  );

  React.useEffect(() => {
    async function fetchSessionAndVerify() {
      setIsLoading(true);
      const sessionUser = await getAuthenticatedUserSession();

      if (!sessionUser) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your dashboard.",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      const decodedParamsUserId = decodeId(hashUserIdFromParams);
      if (
        decodedParamsUserId === null ||
        decodedParamsUserId !== sessionUser.id ||
        sessionUser.role !== "student"
      ) {
        toast({
          title: "Access Denied",
          description: "You are not authorized to view this page.",
          variant: "destructive",
        });
        const correctDashboard = `/${sessionUser.role}/${encodeId(sessionUser.id)}/dashboard`;
        router.push(correctDashboard);
        return;
      }

      setLoggedInUser(sessionUser);
    }
    fetchSessionAndVerify();
  }, [hashUserIdFromParams, router, toast]);

  const loadCourses = React.useCallback(async () => {
    if (!loggedInUser || loggedInUser.role !== "student") {
      setIsLoading(false);
      return;
    }
    try {
      const studentCourses = await getCoursesForUser(
        "student",
        loggedInUser.id,
      );
      setCourses(studentCourses);
    } catch (error) {
      toast({
        title: "Error Loading Courses",
        description: "Could not fetch your courses. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loggedInUser, toast]);

  React.useEffect(() => {
    if (loggedInUser) {
      loadCourses();
    }
  }, [loggedInUser, loadCourses]);

  const handleUpdateProgress = React.useCallback(
    async (courseId: number, newProgress: number) => {
      if (!loggedInUser) {
        toast({
          title: "Error",
          description: "User ID is missing.",
          variant: "destructive",
        });
        return;
      }
      try {
        await updateCourseProgress(loggedInUser.id, courseId, newProgress);
        setCourses((prevCourses) =>
          prevCourses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  progressPercent: newProgress,
                  isCompleted: newProgress === 100,
                }
              : course,
          ),
        );
        toast({
          title: "Progress Updated",
          description: `Progress for the course has been set to ${newProgress}%.`,
        });
      } catch (error) {
        toast({
          title: "Update Failed",
          description: "Could not update course progress. Please try again.",
          variant: "destructive",
        });
      }
    },
    [loggedInUser, toast],
  );

  const handleEnrollInCourse = React.useCallback(
    async (courseId: number) => {
      if (!loggedInUser) {
        toast({
          title: "Error",
          description: "User ID is missing.",
          variant: "destructive",
        });
        return;
      }
      try {
        await enrollInCourse(loggedInUser.id, courseId);
        await loadCourses();
        toast({
          title: "Enrolled Successfully",
          description: "You have been enrolled in the course.",
        });
      } catch (error) {
        toast({
          title: "Enrollment Failed",
          description: "Could not enroll in the course. Please try again.",
          variant: "destructive",
        });
      }
    },
    [loggedInUser, toast, loadCourses],
  );

  const toggleChatbot = React.useCallback(
    (course?: Course) => {
      if (course) {
        setSelectedCourseForChat(course);
      } else if (!isChatbotOpen) {
        // Only reset to general if opening and no specific course
        setSelectedCourseForChat(null);
      }
      setIsChatbotOpen((prev) => !prev);
    },
    [isChatbotOpen, setSelectedCourseForChat, setIsChatbotOpen],
  );

  const displayedCourses = React.useMemo(() => {
    if (activeFilter === "enrolled")
      return courses.filter((course) => course.isEnrolled);
    if (activeFilter === "notEnrolled")
      return courses.filter((course) => !course.isEnrolled);
    if (activeFilter === "completed")
      return courses.filter(
        (course) => course.isEnrolled && course.isCompleted,
      );
    return courses;
  }, [courses, activeFilter]);

  if (isLoading || !loggedInUser) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/40">
        <Header loggedInUser={null} />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <Header
        loggedInUser={loggedInUser}
        onChatbotToggle={toggleChatbot}
        showChatbotButton={!!loggedInUser}
      />
      <main className="flex-1 container py-8">
        <>
          <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              My Learning Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <ListFilter className="h-4 w-4" />
                    <span>Filter Courses</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={activeFilter}
                    onValueChange={(value) =>
                      setActiveFilter(value as FilterStatus)
                    }
                  >
                    <DropdownMenuRadioItem value="all">
                      All Courses
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="enrolled">
                      Enrolled
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="notEnrolled">
                      Not Enrolled
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="completed">
                      Completed
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {loggedInUser && (
                <Button
                  variant="outline"
                  className="gap-1"
                  onClick={() => toggleChatbot()}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>AI Assistant</span>
                </Button>
              )}
            </div>
          </div>

          {isLoading && displayedCourses.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : displayedCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  userId={loggedInUser?.id}
                  onUpdateProgress={
                    course.isEnrolled ? handleUpdateProgress : undefined
                  }
                  onEnroll={
                    !course.isEnrolled ? handleEnrollInCourse : undefined
                  }
                  onChatRequest={
                    course.isEnrolled && loggedInUser
                      ? () => toggleChatbot(course)
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 text-center text-muted-foreground bg-card p-8 rounded-lg shadow">
              {isLoading ? (
                <Loader2 className="mx-auto h-16 w-16 mb-4 animate-spin text-primary/30" />
              ) : courses.length === 0 && loggedInUser !== null ? (
                <>
                  <LayoutGrid className="mx-auto h-16 w-16 mb-4 text-primary/30" />
                  <h2 className="text-2xl font-semibold mb-2">
                    No Courses Available Yet
                  </h2>
                  <p>
                    It looks like there are no courses in the catalog right now.
                  </p>
                  <p>Check back later or ask your instructor to add courses.</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="mx-auto h-16 w-16 mb-4 text-amber-500/70" />
                  <h2 className="text-2xl font-semibold mb-2">
                    No Courses Match Your Filter
                  </h2>
                  <p>
                    Try adjusting your filter settings or selecting "All
                    Courses" to see everything available.
                  </p>
                </>
              )}
            </div>
          )}
        </>
      </main>

      {loggedInUser && loggedInUser.role === "student" && (
        <Sheet open={isChatbotOpen} onOpenChange={setIsChatbotOpen}>
          <SheetContent
            className="w-full max-w-2xl p-0 sm:max-w-2xl flex flex-col"
            side="right"
          >
            <SheetHeader className="p-4 border-b">
              <SheetTitle>AI Course Assistant</SheetTitle>
              <SheetDescription>
                {selectedCourseForChat
                  ? `Ask questions about ${selectedCourseForChat.name}.`
                  : "Ask general questions or select a course for specific context."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto">
              <ChatbotClient
                studentId={loggedInUser.id}
                selectedCourse={selectedCourseForChat}
                allCourses={courses.filter((c) => c.isEnrolled)}
                onSetSelectedCourseAction={setSelectedCourseForChat}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
