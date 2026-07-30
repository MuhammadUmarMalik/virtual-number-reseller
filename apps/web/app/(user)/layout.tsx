import { AuthGuard } from "@/components/auth/auth-guard";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
