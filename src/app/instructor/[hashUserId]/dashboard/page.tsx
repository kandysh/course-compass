"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { CourseCard } from "@/components/dashboard/CourseCard";
import {
  CreateCourseForm,
  type CreateCourseFormData,
} from "@/components/dashboard/CreateCourseForm";
import type { Course } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, Loader2 } from "lucide-react";
import {
  getCoursesForUser,
  createNewCourse,
  getAuthenticatedUserSession,
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { decodeId, encodeId } from "@/lib/hashids";
import type { UserSession } from "@/lib/auth.config";

export default function InstructorDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const hashUserIdFromParams = params.hashUserId as string;

  const [courses, setCourses] = React.useState<Course[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] =
    React.useState(false);
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
        sessionUser.role !== "instructor"
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

  React.useEffect(() => {
    async function loadCourses() {
      if (!loggedInUser || loggedInUser.role !== "instructor") {
        setIsLoading(false);
        return;
      }
      try {
        const instructorCourses = await getCoursesForUser(
          "instructor",
          loggedInUser.id,
        );
        setCourses(instructorCourses);
      } catch (error) {
        toast({
          title: "Error Loading Courses",
          description: "Could not fetch your courses. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    if (loggedInUser) {
      loadCourses();
    }
  }, [loggedInUser, toast]);

  const handleCreateCourse = React.useCallback(
    async (data: CreateCourseFormData) => {
      if (!loggedInUser || loggedInUser.role !== "instructor") {
        toast({
          title: "Error",
          description: "Cannot create course. Invalid user session.",
          variant: "destructive",
        });
        return;
      }
      try {
        const newCourse = await createNewCourse(data, loggedInUser.id);
        setCourses((prevCourses) =>
          [newCourse, ...prevCourses].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
        setIsCreateCourseDialogOpen(false);
        toast({
          title: "Course Created",
          description: `Successfully created "${newCourse.name}".`,
        });
      } catch (error: any) {
        toast({
          title: "Creation Failed",
          description:
            error.message || "Could not create the course. Please try again.",
          variant: "destructive",
        });
      }
    },
    [loggedInUser, toast, setIsCreateCourseDialogOpen],
  );

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
      <Header loggedInUser={loggedInUser} />
      <main className="flex-1 container py-8">
        <>
          <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Managed Courses
            </h1>
            <Button onClick={() => setIsCreateCourseDialogOpen(true)}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Course
            </Button>
          </div>

          {isLoading && courses.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  userId={loggedInUser?.id}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 text-center text-muted-foreground">
              <LayoutGrid className="mx-auto h-12 w-12 mb-4" />
              <p className="text-xl">
                You haven't created or been assigned any courses yet.
              </p>
              <Button
                size="lg"
                className="mt-4"
                onClick={() => setIsCreateCourseDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Your First Course
              </Button>
            </div>
          )}

          <div className="mt-12 p-6 bg-card rounded-lg shadow-md">
            <h2 className="font-headline text-2xl font-semibold mb-4">
              Instructor Tools
            </h2>
            <p className="text-muted-foreground">
              Future features like student analytics, assignment grading, and
              communication tools will appear here.
            </p>
          </div>
          <CreateCourseForm
            isOpen={isCreateCourseDialogOpen}
            onOpenChangeAction={setIsCreateCourseDialogOpen}
            onSubmitAction={handleCreateCourse}
          />
        </>
      </main>
    </div>
  );
}
