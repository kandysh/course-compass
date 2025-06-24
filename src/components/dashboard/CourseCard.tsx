"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Course } from "@/lib/data";
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  ExternalLink,
  MessageSquare,
  User as UserIcon,
  UserPlus,
  Users,
  TrendingUp,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { encodeId } from "@/lib/hashids";

interface CourseCardProps {
  course: Course;
  userId?: number | null;
  onUpdateProgress?: (courseId: number, newProgress: number) => void;
  onChatRequest?: () => void;
  onEnroll?: (courseId: number) => void;
}

const DEFAULT_THUMBNAIL_URL = "https://placehold.co/600x400.png";

export function CourseCard({
  course,
  userId,
  onUpdateProgress,
  onChatRequest,
  onEnroll,
}: CourseCardProps) {
  const handleMarkAsCompleted = () => {
    if (onUpdateProgress && userId && course.id) {
      onUpdateProgress(course.id, 100);
    }
  };

  const handleEnroll = () => {
    if (onEnroll && userId) {
      onEnroll(course.id);
    }
  };

  const isUserActuallyEnrolled = course.isEnrolled === true;
  const isViewingOwnCourseAsInstructor =
    !!userId && userId === course.instructorId;

  const showEnrollButton =
    !isUserActuallyEnrolled &&
    !!onEnroll &&
    !!userId &&
    !isViewingOwnCourseAsInstructor;
  const showChatButton =
    isUserActuallyEnrolled &&
    !!onChatRequest &&
    !!userId &&
    !isViewingOwnCourseAsInstructor;

  const isCourseMarkedCompleted =
    course.isCompleted === true || (course.progressPercent ?? 0) === 100;

  const formattedDueDate = course.dueDate
    ? new Date(course.dueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
    : "N/A";

  const courseDetailLink = `/courses/${encodeId(course.id)}${userId ? `?viewingUserId=${encodeId(userId)}` : ""}`;

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-lg shadow-md transition-shadow hover:shadow-lg">
      <Link
        href={courseDetailLink}
        className="block relative h-48 w-full bg-muted"
        aria-label={`View details for ${course.name}`}
      >
        <Image
          src={course.thumbnailUrl || DEFAULT_THUMBNAIL_URL}
          alt={course.name}
          fill
          className="object-cover"
          data-ai-hint={!course.thumbnailUrl ? "placeholder course" : undefined}
        />
      </Link>
      <CardHeader className="p-4">
        <CardTitle className="font-headline text-xl leading-tight">
          <Link
            href={courseDetailLink}
            className="hover:text-primary transition-colors"
          >
            {course.name}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground flex items-center">
          <UserIcon className="mr-1.5 h-4 w-4" />
          {course.instructorUsername || "N/A"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4 space-y-3">
        {course.dueDate && (
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Due: {formattedDueDate}</span>
          </div>
        )}

        {isViewingOwnCourseAsInstructor && (
          <>
            {typeof course.enrolledStudentCount === "number" && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-2 h-4 w-4 text-primary" />
                <span>{course.enrolledStudentCount} Enrolled</span>
              </div>
            )}
            {typeof course.averageProgress === "number" && (
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="mr-2 h-4 w-4 text-accent" />
                <span>Avg. Progress: {course.averageProgress.toFixed(1)}%</span>
              </div>
            )}
          </>
        )}

        {isUserActuallyEnrolled && !isViewingOwnCourseAsInstructor && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Your Progress:</span>
              <span className="font-semibold text-foreground">
                {course.progressPercent ?? 0}%
              </span>
            </div>
            <Progress
              value={course.progressPercent ?? 0}
              className="h-2"
              aria-label={`${course.name} progress ${course.progressPercent ?? 0}%`}
            />

            {isCourseMarkedCompleted ? (
              <div className="flex items-center text-sm font-medium text-green-600 pt-2">
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Course Completed!
              </div>
            ) : (
              onUpdateProgress && (
                <Button
                  onClick={handleMarkAsCompleted}
                  size="sm"
                  className="w-full mt-2"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Completed
                </Button>
              )
            )}
          </div>
        )}

        {!isCourseMarkedCompleted &&
          isUserActuallyEnrolled &&
          !isViewingOwnCourseAsInstructor &&
          course.dueDate &&
          new Date(course.dueDate) < new Date() && (
            <Badge variant="destructive" className="mt-1">
              <XCircle className="mr-1 h-4 w-4" />
              Overdue
            </Badge>
          )}

        {showEnrollButton && (
          <Button onClick={handleEnroll} size="sm" className="w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            Enroll in Course
          </Button>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t">
        <div className="flex w-full items-center justify-between gap-2">
          {showChatButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onChatRequest}
              className="text-muted-foreground hover:text-primary"
              aria-label={`Chat about ${course.name}`}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            asChild
            className={
              !showChatButton && !isViewingOwnCourseAsInstructor
                ? "w-full"
                : "ml-auto"
            }
          >
            <Link href={courseDetailLink}>
              View Course <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
