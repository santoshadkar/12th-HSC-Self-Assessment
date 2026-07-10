import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>Create your account</h1>
        <p className="sub">
          Chapter quizzes, mock tests and progress tracking for MSBSHSE 12th Science.
        </p>
        <AuthForm mode="signup" />
        <p className="auth-switch">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
