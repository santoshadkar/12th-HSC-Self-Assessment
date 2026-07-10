import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default function Header({ user }: { user: SessionUser }) {
  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/dashboard" className="brand">
          HSC <span>Prep</span>
        </Link>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/subjects">Subjects</Link>
          <span className="user-chip">{user.name}</span>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
