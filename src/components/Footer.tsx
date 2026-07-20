export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 py-4 text-center text-xs text-muted-foreground">
        Copyright Gorazer 2026 ·{" "}
        <a
          href="https://gorazer.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          gorazer.vercel.app
        </a>
      </div>
    </footer>
  );
}
