import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>Welcome back</h1>
        <p className="sub">Log in to continue your HSC Science preparation.</p>
        <AuthForm mode="login" />
        <p className="auth-switch">
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
