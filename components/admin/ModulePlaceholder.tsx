type ModulePlaceholderProps = {
  title: string;
  description: string;
  phase: "P2" | "P3" | "P4";
};

export function ModulePlaceholder({
  title,
  description,
  phase,
}: ModulePlaceholderProps) {
  return (
    <section className="space-y-4">
      <h1 className="font-display text-4xl tracking-wide">{title}</h1>
      <p className="max-w-2xl text-sm text-neutral-300">{description}</p>
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 text-sm text-neutral-400">
        Este módulo queda preparado para {phase}. La estructura de rutas ya está activa
        y se completará en la siguiente fase.
      </div>
    </section>
  );
}
