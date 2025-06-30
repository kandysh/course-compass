import { getAuthenticatedUserSession } from "@/app/actions";
import { Header } from "@/components/layout/Header";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loggedInUser = await getAuthenticatedUserSession();
  return (
    <>
      <Header loggedInUser={loggedInUser} />
      {children}
    </>
  );
}
