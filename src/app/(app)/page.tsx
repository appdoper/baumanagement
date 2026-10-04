export default function HomePage() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-xl font-semibold">Willkommen im Hausmanagement</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Wähle links ein Projekt aus, um dessen Vorgänge zu sehen – oder lege über
        das Plus-Symbol ein neues Projekt an.
      </p>
    </div>
  );
}
