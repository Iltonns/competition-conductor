import { Construction } from "lucide-react";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="card-arena flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-neon/10 text-neon">
        <Construction className="h-7 w-7" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-black">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description ??
          "Este módulo será entregue na próxima fase do IS Arena. A base visual, a autenticação e o dashboard já estão prontos."}
      </p>
    </div>
  );
}
