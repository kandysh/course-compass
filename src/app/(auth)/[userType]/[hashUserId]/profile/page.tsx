
'use client';

import type { User } from '@/lib/data';
import type { UserSession } from '@/lib/auth.config';
import { decodeId, encodeId } from '@/lib/hashids';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CalendarDays, Mail, UserCircle, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { getUserDetailsById, getAuthenticatedUserSession } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const DEFAULT_AVATAR_URL = 'https://placehold.co/128x128.png';

/**
 * UserProfilePage component displays the profile information of a user.
 * It fetches user data based on the hashed ID from the URL parameters
 * and verifies if the logged-in user is authorized to view the profile.
 * @returns The UserProfilePage React element.
 */
export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const userTypeFromParams = params.userType as string;
  const hashUserIdFromParams = params.hashUserId as string;

  const [profileData, setProfileData] = React.useState<User | null>(null); 
  const [sessionUser, setSessionUser] = React.useState<UserSession | null>(null); 
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    /**
     * Fetches the authenticated user's session and the profile data to be displayed.
     * Verifies that the logged-in user is viewing their own profile.
     */
    async function fetchUserAndVerify() {
      setIsLoading(true);
      const session = await getAuthenticatedUserSession();
      setSessionUser(session);

      if (!session) {
        toast({ title: "Authentication Required", description: "Please log in.", variant: "destructive" });
        router.push('/');
        return;
      }

      const decodedParamsUserId = decodeId(hashUserIdFromParams);

      if (decodedParamsUserId === null) {
        toast({ title: "Invalid User Identifier", description: "The user ID in the URL is invalid.", variant: "destructive" });
        router.push(`/${session.role}/${encodeId(session.id)}/dashboard`); 
        return;
      }

      if (decodedParamsUserId !== session.id || userTypeFromParams !== session.role) {
         toast({ title: "Access Denied", description: "You can only view your own profile.", variant: "destructive" });
         router.push(`/${session.role}/${encodeId(session.id)}/profile`); 
         return;
      }

      try {
        // Fetch details for the profile to be displayed (which is the logged-in user)
        const userDetails = await getUserDetailsById(session.id); 
        if (userDetails) {
          setProfileData(userDetails);
        } else {
          setProfileData(null);
          toast({ title: "Profile Not Found", description: "Could not load your profile data.", variant: "destructive" });
           router.push(`/${session.role}/${encodeId(session.id)}/dashboard`);
        }
      } catch (error) {
        toast({ title: "Error Loading Profile", description: "Could not fetch profile details.", variant: "destructive" });
        setProfileData(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserAndVerify();
  }, [hashUserIdFromParams, userTypeFromParams, router, toast]);

  /**
   * Handles navigation back to the user's dashboard.
   */
  const handleBackToDashboard = () => {
    if (sessionUser?.id) {
      router.push(`/${sessionUser.role}/${encodeId(sessionUser.id)}/dashboard`);
    } else {
      router.push('/');
    }
  };

  if (isLoading || !sessionUser) {
    return (
      <main className="flex-1 container py-8 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    );
  }
  
  if (!profileData) {
    return (
      <main className="flex-1 container py-8 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="font-headline text-3xl font-bold mb-4">Profile Error</h1>
        <p className="text-muted-foreground mb-6">Could not load your profile data or access was denied.</p>
        <Button onClick={handleBackToDashboard}>
          <ArrowLeft className="mr-2 h-5 w-5" />
          Go Back to Your Dashboard
        </Button>
      </main>
    );
  }
  
  const formattedJoinDate = profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'N/A';

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <main className="flex-1 container py-8">
        <Button variant="outline" onClick={handleBackToDashboard} className="mb-8 text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-card p-8 text-center relative">
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary to-secondary opacity-80 z-0"></div>
            <Avatar className="relative w-32 h-32 mx-auto mb-4 border-4 border-background shadow-lg z-10">
              <AvatarImage src={profileData.avatarUrl || DEFAULT_AVATAR_URL} alt={profileData.username} data-ai-hint={!profileData.avatarUrl ? "profile avatar" : undefined} />
              <AvatarFallback className="text-4xl">
                {profileData.username ? profileData.username.charAt(0).toUpperCase() : '?'}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="font-headline text-3xl relative z-10 text-foreground">{profileData.username}</CardTitle>
             <CardDescription className="relative z-10 text-muted-foreground">
                <Badge variant={profileData.role === 'instructor' ? 'secondary' : 'default'} className="capitalize text-sm mt-1">
                  {profileData.role}
                </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="space-y-4">
              <InfoItem icon={<Mail className="text-primary" />} label="Email" value={profileData.email} />
              <InfoItem icon={<CalendarDays className="text-primary" />} label="Joined" value={formattedJoinDate} />
              <InfoItem icon={<UserCircle className="text-primary" />} label="User ID" value={encodeId(profileData.id)} type="code"/>
              {profileData.role === 'instructor' && (
                <InfoItem icon={<Shield className="text-secondary" />} label="Status" value="Verified Instructor" />
              )}
              {profileData.role === 'student' && (
                <InfoItem icon={<Shield className="text-primary" />} label="Status" value="Active Student" />
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

/**
 * Props for the InfoItem component.
 */
interface InfoItemProps {
  /** The icon to display next to the label. */
  icon: React.ReactNode;
  /** The label for the information item. */
  label: string;
  /** The value of the information item. */
  value: string;
  /** The type of value, for styling purposes (e.g., 'code' for monospaced text). */
  type?: 'text' | 'code';
}

/**
 * InfoItem component displays a piece of information with an icon, label, and value.
 * @param props - The props for the component.
 * @returns The InfoItem React element.
 */
function InfoItem({ icon, label, value, type = 'text' }: InfoItemProps) {
  return (
    <div className="flex items-start space-x-4 p-3 bg-background rounded-lg border">
      <div className="flex-shrink-0 text-muted-foreground pt-1">
        {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {type === 'code' ? (
          <code className="text-sm text-foreground bg-muted/50 px-1.5 py-0.5 rounded">{value}</code>
        ) : (
          <p className="text-base text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
