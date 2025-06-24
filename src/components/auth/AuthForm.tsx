"use client";

import {
  GenerateUserAvatarInput,
  generateUserAvatarFlow,
} from "@/ai/flows/generate-user-avatar-flow";
import { loginUser, signupUser } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/data";
import { encodeId } from "@/lib/hashids";
import { runFlow } from "@genkit-ai/next/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  Sparkles,
  UserCircle,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import * as z from "zod";

const baseAuthFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

const signupAuthFormSchema = baseAuthFormSchema
  .extend({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters." })
      .max(50, { message: "Username cannot exceed 50 characters." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password." }),
    avatarUrl: z.string().url().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

const loginAuthFormSchema = baseAuthFormSchema;

export type AuthFormInput = z.infer<typeof baseAuthFormSchema> & {
  username?: string;
  confirmPassword?: string;
  avatarUrl?: string;
};

/**
 * Props for the AuthForm component.
 */
interface AuthFormProps {
  formType: "login" | "signup";
  userType: "student" | "instructor";
}

/**
 * Generates a user avatar image using an AI flow. This is intended to be called from the client.
 * @param username - The username to generate an avatar for.
 * @returns A promise that resolves to the image data URI.
 * @throws An error if AI generation fails.
 */
async function getAIGeneratedUserAvatar(username: string): Promise<string> {
  try {
    const input: GenerateUserAvatarInput = { username };
    const result = await runFlow<typeof generateUserAvatarFlow>({
      url: "/api/genkit/generateUserAvatarFlow",
      input,
    });
    return result.imageDataUri;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to generate user avatar with AI: ${error.message}`,
      );
    }
    throw new Error(
      "Failed to generate user avatar with AI. An unknown error occurred.",
    );
  }
}

/**
 * A comprehensive authentication form for both logging in and signing up.
 * Handles user input, validation, and submission for both user roles.
 * Includes client-side AI avatar generation for the signup flow.
 * @param props - The props for the component, specifying form type and user role.
 * @returns The AuthForm React element.
 */
export function AuthForm({ formType, userType }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  const resolver =
    formType === "signup"
      ? zodResolver(signupAuthFormSchema)
      : zodResolver(loginAuthFormSchema);

  const form = useForm<AuthFormInput>({
    resolver,
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      avatarUrl: "",
    },
  });

  const watchedUsername = form.watch("username");

  const onSubmit: SubmitHandler<AuthFormInput> = async (data) => {
    setIsLoading(true);
    form.clearErrors();

    try {
      let result: { success: boolean; user?: User; error?: string };
      if (formType === "login") {
        result = await loginUser(data, userType);
      } else {
        result = await signupUser(data, userType);
      }

      if (result.success && result.user && typeof result.user.id === "number") {
        const hashedUserId = encodeId(result.user.id);
        router.push(`/${userType}/${hashedUserId}/dashboard`);
      } else {
        const errorMessage = result.error || "An unknown error occurred.";
        form.setError("root.serverError", {
          type: "manual",
          message: errorMessage,
        });
        toast({
          title: formType === "login" ? "Login Failed" : "Signup Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = "A server error occurred. Please try again later.";
      form.setError("root.serverError", {
        type: "manual",
        message: errorMessage,
      });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAvatar = async () => {
    const username = form.getValues("username");
    if (!username || username.trim().length < 3) {
      toast({
        title: "Username Required",
        description:
          "Please enter a valid username (at least 3 characters) before generating an avatar.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingAvatar(true);
    try {
      const avatarDataUri = await getAIGeneratedUserAvatar(username);
      form.setValue("avatarUrl", avatarDataUri, { shouldValidate: true });
      setAvatarPreview(avatarDataUri);
      toast({
        title: "Avatar Generated",
        description: "A new avatar has been created for your profile.",
      });
    } catch (error) {
      toast({
        title: "Avatar Generation Failed",
        description:
          "Could not generate an avatar. Please try again or proceed without one.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const title = formType === "login" ? "Login" : "Sign Up";
  const description = `Enter your credentials to ${formType} as a ${userType}.`;
  const submitButtonText = formType === "login" ? "Login" : "Create Account";
  const switchLinkText =
    formType === "login"
      ? "Don't have an account?"
      : "Already have an account?";
  const switchLinkHref =
    formType === "login" ? `/signup/${userType}` : `/login/${userType}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {formType === "login" ? (
              <LogIn className="h-6 w-6" />
            ) : (
              <UserPlus className="h-6 w-6" />
            )}
          </div>
          <CardTitle className="font-headline text-3xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {formType === "signup" && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="yourusername"
                          {...field}
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {formType === "signup" && (
                <FormItem>
                  <FormLabel>Avatar (Optional)</FormLabel>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt="Avatar preview"
                          layout="fill"
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAvatar}
                      disabled={
                        isGeneratingAvatar ||
                        !watchedUsername ||
                        watchedUsername.trim().length < 3
                      }
                    >
                      {isGeneratingAvatar ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Generate AI Avatar
                    </Button>
                  </div>
                </FormItem>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        {...field}
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="text-base pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {formType === "signup" && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.formState.errors.root?.serverError && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.root.serverError.message}
                </p>
              )}
              <Button
                type="submit"
                className="w-full text-base py-3"
                disabled={isLoading || isGeneratingAvatar}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {submitButtonText}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {switchLinkText}{" "}
            <Link
              href={switchLinkHref}
              className="font-medium text-primary hover:underline"
            >
              {formType === "login" ? "Sign up" : "Login"}
            </Link>
          </p>
          <Button
            variant="link"
            asChild
            className="text-sm text-muted-foreground"
          >
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
