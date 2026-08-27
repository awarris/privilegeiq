import Link from "next/link";

export default function NotFound() {
  return (
    <main className="standalone-message">
      <div className="brand__mark">PIQ</div>
      <h1>Page not found</h1>
      <p>The resource you requested does not exist.</p>
      <Link className="button button--primary" href="/dashboard">Return to PrivilegeIQ</Link>
    </main>
  );
}
