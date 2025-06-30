import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, BookUser, GraduationCap } from "lucide-react";
import { Logo } from "@/components/icons/Logo";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-8">
      <div className="mb-12 text-center">
        <div className="inline-block mb-6">
          <Logo className="h-16 w-16 text-primary" />
        </div>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Welcome to Course Compass
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Your intelligent guide to mastering your courses and educational
          journey.
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-8 md:grid-cols-2">
        <RoleCard
          icon={<GraduationCap className="h-12 w-12 text-primary" />}
          title="I am a Student"
          description="Access your courses, track progress, and get help from our AI assistant."
          loginLink="/student/login"
          signupLink="/student/signup"
        />
        <RoleCard
          icon={<BookUser className="h-12 w-12 text-secondary" />}
          title="I am an Instructor"
          description="Manage your courses, view student progress, and utilize teaching tools."
          loginLink="/instructor/login"
          signupLink="/instructor/signup"
        />
      </div>
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} Course Compass. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  loginLink: string;
  signupLink: string;
}

function RoleCard({
  icon,
  title,
  description,
  loginLink,
  signupLink,
}: RoleCardProps) {
  return (
    <Card className="transform overflow-hidden rounded-xl bg-card shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-primary/20">
      <CardHeader className="items-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          {icon}
        </div>
        <CardTitle className="font-headline text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col space-y-3 p-6 pt-0">
        <Button asChild size="lg" className="w-full text-base py-3">
          <Link href={loginLink}>
            Login <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full text-base py-3 border-primary text-primary hover:bg-primary/5 hover:text-primary"
        >
          <Link href={signupLink}>
            Sign Up <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
