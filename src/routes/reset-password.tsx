import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Redefinir senha · IS Arena" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/dashboard", replace: true });
  }
  return (
    <div className="bg-arena flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/">
            <IsArenaLogo size={40} />
          </Link>
        </div>
        <form onSubmit={submit} className="card-arena space-y-4 p-6 md:p-8">
          <h1 className="font-display text-2xl font-black">Nova senha</h1>
          <p className="text-sm text-muted-foreground">Escolha uma senha forte para continuar.</p>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Nova senha
            </Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button disabled={busy} className="w-full bg-neon text-neon-foreground hover:bg-neon/90">
            {busy ? "Salvando..." : "Salvar senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
