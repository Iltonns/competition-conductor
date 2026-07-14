import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Entrar · IS Arena" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    setBusy(false);
    if (error) {
      if (error.code === "email_not_confirmed") setAwaitingEmailConfirmation(true);
      return toast.error(getSignInErrorMessage(error));
    }
    setAwaitingEmailConfirmation(false);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { display_name: displayName.trim() },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);

    if (data.session) {
      toast.success("Conta criada com sucesso!");
      navigate({ to: "/dashboard", replace: true });
      return;
    }

    setAwaitingEmailConfirmation(true);
    setTab("signin");
    setPassword("");

    if (data.user?.identities?.length === 0) {
      toast.info(
        "Se este e-mail já estiver cadastrado, confirme a conta ou redefina a senha antes de entrar.",
      );
      return;
    }

    toast.success("Cadastro recebido. Confirme seu e-mail antes de entrar.");
  }

  async function handleResendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return toast.error("Informe seu e-mail primeiro");

    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);

    if (error) return toast.error(error.message);
    toast.success("E-mail de confirmação reenviado.");
  }

  async function handleGoogle() {
    setBusy(true);

    const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);

    if (isLocalDevelopment) {
      setBusy(false);
      toast.info(
        "No ambiente local, entre com e-mail e senha. O Google OAuth está disponível na versão publicada.",
      );
      return;
    }

    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) {
      setBusy(false);
      toast.error("Erro ao entrar com Google");
      return;
    }
    if (res.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleForgot() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return toast.error("Informe seu e-mail primeiro");
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link para redefinir sua senha.");
  }

  return (
    <div className="bg-arena flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/">
            <IsArenaLogo size={40} />
          </Link>
        </div>
        <div className="card-arena p-6 md:p-8">
          <h1 className="font-display text-2xl font-black">Acesse sua arena</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre para organizar seus campeonatos.
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={busy}
            className="mt-6 w-full border-border bg-card/60"
          >
            <GoogleIcon /> Continuar com Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            OU
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 bg-secondary/60">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              {awaitingEmailConfirmation && (
                <Alert className="mt-4 border-neon/30 bg-neon/5">
                  <AlertTitle>Confirme seu e-mail</AlertTitle>
                  <AlertDescription className="mt-1 text-muted-foreground">
                    Abra o link enviado para {email.trim().toLowerCase()} antes de entrar.
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={busy}
                      className="mt-2 block font-medium text-neon hover:underline disabled:opacity-50"
                    >
                      Reenviar confirmação
                    </button>
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSignIn} className="mt-4 space-y-4">
                <Field label="E-mail">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </Field>
                <Field label="Senha">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </Field>
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-xs text-muted-foreground hover:text-neon"
                >
                  Esqueci minha senha
                </button>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-neon text-neon-foreground hover:bg-neon/90"
                >
                  {busy ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-4 space-y-4">
                <Field label="Nome do organizador">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </Field>
                <Field label="E-mail">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </Field>
                <Field label="Senha">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </Field>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-neon text-neon-foreground hover:bg-neon/90"
                >
                  {busy ? "Criando..." : "Criar minha conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com os Termos e a Política de Privacidade do IS Arena.
        </p>
      </div>
    </div>
  );
}

function getSignInErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "email_not_confirmed") {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (error.code === "invalid_credentials") {
    return "E-mail ou senha inválidos. Se acabou de se cadastrar, confirme seu e-mail ou redefina a senha.";
  }

  return error.message;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4-5.5 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

