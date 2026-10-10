import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "../components/Logo";

export default function NotFound() {
  return (
    <main className="notfound">
      <div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <LogoMark size={36} />
        </div>
        <p className="notfound-code">404</p>
        <p>This page doesn&apos;t exist or has moved. Let&apos;s get you back to your workspace.</p>
        <Link to="/dashboard" className="btn btn-primary" viewTransition>
          <ArrowLeft aria-hidden="true" /> Back to EduTrack
        </Link>
      </div>
    </main>
  );
}
