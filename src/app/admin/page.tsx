
export default function AdminPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <section className="mb-12 text-center animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight font-headline lg:text-5xl">
          Admin-Dashboard
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Hier können Sie Gruppen, Mitglieder und andere Bereiche der App verwalten.
        </p>
      </section>
      <div className="text-center text-muted-foreground">
        <p>Wählen Sie eine Option aus dem Verwaltungsmenü oben aus.</p>
      </div>
    </div>
  );
}
