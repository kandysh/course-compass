"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";
import {
  GenerateCourseDescriptionInput,
  generateCourseDescriptionFlow,
  GenerateCourseDescriptionOutput,
} from "@/ai/flows/generate-course-description-flow";
import {
  GenerateCourseThumbnailInput,
  generateCourseThumbnailFlow,
  GenerateCourseThumbnailOutput,
} from "@/ai/flows/generate-course-thumbnail-flow";
import { runFlow } from "@genkit-ai/next/client";

const courseFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Course name must be at least 3 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." })
    .max(5000, { message: "Description cannot exceed 5000 characters." })
    .optional()
    .or(z.literal("")),
  dueDate: z.string().optional(),
  thumbnailUrl: z
    .string()
    .url({
      message:
        "Please enter a valid URL or generate one with AI (Data URIs are also URLs).",
    })
    .optional()
    .or(z.literal("")),
});

export type CreateCourseFormData = z.infer<typeof courseFormSchema>;

interface CreateCourseFormProps {
  isOpen: boolean;
  onOpenChangeAction: (isOpen: boolean) => void;
  onSubmitAction: (data: CreateCourseFormData) => void;
}

const getOneMonthFromNow = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function CreateCourseForm({
  isOpen,
  onOpenChangeAction: onOpenChange,
  onSubmitAction: onSubmit,
}: CreateCourseFormProps) {
  const { toast } = useToast();
  const [isGeneratingDescription, setIsGeneratingDescription] =
    React.useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] =
    React.useState(false);

  const form = useForm<CreateCourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      dueDate: getOneMonthFromNow(),
      thumbnailUrl: "",
    },
  });

  const watchedCourseName = form.watch("name");

  const handleSubmit = (data: CreateCourseFormData) => {
    onSubmit(data);
    form.reset({
      name: "",
      description: "",
      dueDate: getOneMonthFromNow(),
      thumbnailUrl: "",
    });
    onOpenChange(false);
  };

  const onFormError = (errors: any) => {
    let errorMessage = "Please correct the errors in the form.";
    const firstErrorKey = Object.keys(errors)[0] as
      | keyof CreateCourseFormData
      | undefined;
    if (firstErrorKey && errors[firstErrorKey]?.message) {
      errorMessage = errors[firstErrorKey]?.message as string;
    }
    toast({
      title: "Validation Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const handleGenerateDescription = async () => {
    const courseName = form.getValues("name");
    if (!courseName || courseName.trim().length < 3) {
      toast({
        title: "Course Name Required",
        description:
          "Please enter a valid course name (at least 3 characters) before generating a description.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const input: GenerateCourseDescriptionInput = { courseName };
      const result: GenerateCourseDescriptionOutput = await runFlow<
        typeof generateCourseDescriptionFlow
      >({ url: "/api/genkit/generateCourseDescriptionFlow", input });
      form.setValue("description", result.description, {
        shouldValidate: true,
      });
    } catch (error: any) {
      toast({
        title: "Description Generation Failed",
        description:
          error.message ||
          "Could not generate course description. Please try again or write one manually.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    const courseName = form.getValues("name");
    if (!courseName || courseName.trim().length < 3) {
      toast({
        title: "Course Name Required",
        description:
          "Please enter a valid course name (at least 3 characters) before generating a thumbnail.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingThumbnail(true);
    try {
      const input: GenerateCourseThumbnailInput = { courseName };
      const result: GenerateCourseThumbnailOutput = await runFlow<
        typeof generateCourseThumbnailFlow
      >({
        url: "/api/genkit/generateCourseThumbnailFlow",
        input,
      });
      form.setValue("thumbnailUrl", result.imageDataUri, {
        shouldValidate: true,
      });
    } catch (error: any) {
      toast({
        title: "Thumbnail Generation Failed",
        description:
          error.message ||
          "Could not generate course thumbnail. Please try again or provide a URL manually.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          form.reset({
            name: "",
            description: "",
            dueDate: getOneMonthFromNow(),
            thumbnailUrl: "",
          });
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new course. You can use AI to
            help generate content.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, onFormError)}
            className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Advanced React Patterns"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your course, its objectives, and what students will learn."
                      {...field}
                      rows={4}
                      className="resize-y"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={
                      isGeneratingDescription ||
                      !watchedCourseName ||
                      watchedCourseName.trim().length < 3
                    }
                    className="text-xs mt-2"
                  >
                    {isGeneratingDescription ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    AI Generate Description
                  </Button>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="https://example.com/image.png or generate with AI"
                      {...field}
                    />
                  </FormControl>
                  <div className="mt-2 flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateThumbnail}
                      disabled={
                        isGeneratingThumbnail ||
                        !watchedCourseName ||
                        watchedCourseName.trim().length < 3
                      }
                      className="text-xs self-start"
                    >
                      {isGeneratingThumbnail ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      AI Generate Thumbnail
                    </Button>
                    {field.value && field.value.startsWith("data:image") && (
                      <div className="mt-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          AI Generated Thumbnail Preview:
                        </p>
                        <Image
                          src={field.value}
                          alt="AI Generated Thumbnail Preview"
                          width={120}
                          height={90}
                          className="rounded border object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 sticky bottom-0 bg-background py-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    form.reset({
                      name: "",
                      description: "",
                      dueDate: getOneMonthFromNow(),
                      thumbnailUrl: "",
                    })
                  }
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  isGeneratingDescription ||
                  isGeneratingThumbnail
                }
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Course
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
