import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Globe2, Lock, Pencil, Plus, Trophy, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useChampionships } from "@/features/championships/hooks/useChampionships";
import { useCreateChampionship } from "@/features/championships/hooks/useCreateChampionship";
import { useDeleteChampionship } from "@/features/championships/hooks/useDeleteChampionship";
import { useUpdateChampionship } from "@/features/championships/hooks/useUpdateChampionship";
import {
  championshipSchema,
  type ChampionshipFormValues,
} from "@/features/championships/schemas/championship.schema";
import type {
  Championship,
  CreateChampionshipDTO,
  UpdateChampionshipDTO,
} from "@/features/championships/types/championship.types";

export const Route = createFileRoute("/_authenticated/championships")({
  head: () => ({ meta: [{ title: "Campeonatos · IS Arena" }] }),
  component: ChampionshipsPage,
});

const STATUS_LABELS = {
  draft: "Rascunho",
  active: "Ativo",
  finished: "Finalizado",
  archived: "Arquivado",
} as const;

const EMPTY_FORM: ChampionshipFormValues = {
  name: "",
  season: "",
  description: "",
  starts_at: "",
  ends_at: "",
  is_public: false,
  status: "draft",
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

function formatDate(date: string | null): string {
  if (!date) return "Data não definida";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T00:00:00`));
}

function ChampionshipsPage() {
  const championships = useChampionships();
  const deleteMutation = useDeleteChampionship();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Championship | null>(null);
  const [deleting, setDeleting] = useState<Championship | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (championship: Championship) => {
    setEditing(championship);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting || !championships.organizationId) return;
    try {
      await deleteMutation.mutateAsync({
        organizationId: championships.organizationId,
        championshipId: deleting.id,
      });
      toast.success("Campeonato excluído.");
      setDeleting(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-[-0.03em]">
            Seus campeonatos
          </h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Gerencie temporadas, período e visibilidade das competições.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-neon text-neon-foreground hover:bg-neon/90">
          <Plus className="h-4 w-4" /> Novo campeonato
        </Button>
      </div>

      {championships.isLoading && <ChampionshipsSkeleton />}

      {championships.error && !championships.isLoading && (
        <div className="card-arena p-6 text-center">
          <p className="text-sm font-semibold">Não foi possível carregar os campeonatos.</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {errorMessage(championships.error)}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => championships.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!championships.isLoading && !championships.error && championships.data?.length === 0 && (
        <div className="card-arena flex min-h-56 flex-col items-center justify-center p-6 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-neon/10 text-neon">
            <Trophy className="h-6 w-6" />
          </span>
          <h3 className="mt-4 font-display text-sm font-bold">Nenhum campeonato cadastrado</h3>
          <p className="mt-1 max-w-sm text-[10px] text-muted-foreground">
            Crie a primeira competição para começar a configurar categorias e regulamento.
          </p>
          <Button className="mt-4" onClick={openCreate}>
            Criar campeonato
          </Button>
        </div>
      )}

      {championships.data && championships.data.length > 0 && (
        <section
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Lista de campeonatos"
        >
          {championships.data.map((championship) => (
            <ChampionshipCard
              key={championship.id}
              championship={championship}
              onEdit={() => openEdit(championship)}
              onDelete={() => setDeleting(championship)}
            />
          ))}
        </section>
      )}

      <ChampionshipDialog
        open={formOpen}
        championship={editing}
        organizationId={championships.organizationId}
        onOpenChange={setFormOpen}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campeonato?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} será excluído permanentemente. A exclusão será bloqueada se houver
              partidas, inscrições ou equipes vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Verificando..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChampionshipCard({
  championship,
  onEdit,
  onDelete,
}: {
  championship: Championship;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="card-arena overflow-hidden">
      <div className="relative h-28 bg-gradient-to-br from-neon/15 via-sky-400/5 to-violet-400/10">
        {championship.cover_url ? (
          <img
            src={championship.cover_url}
            alt={`Capa de ${championship.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <Trophy
            className="absolute bottom-4 right-4 h-14 w-14 text-white/10"
            aria-hidden="true"
          />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="secondary">{STATUS_LABELS[championship.status]}</Badge>
          <Badge variant="outline" className="gap-1 bg-black/30 backdrop-blur">
            {championship.is_public ? <Globe2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {championship.is_public ? "Público" : "Privado"}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neon">
          {championship.season || "Temporada não informada"}
        </p>
        <h3 className="mt-1 truncate font-display text-sm font-bold">{championship.name}</h3>
        <p className="mt-2 line-clamp-2 min-h-8 text-[10px] leading-4 text-muted-foreground">
          {championship.description || "Sem descrição."}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>
            {formatDate(championship.starts_at)} — {formatDate(championship.ends_at)}
          </span>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t border-white/[0.06] pt-3">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
        </div>
      </div>
    </article>
  );
}

function ChampionshipDialog({
  open,
  championship,
  organizationId,
  onOpenChange,
}: {
  open: boolean;
  championship: Championship | null;
  organizationId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useCreateChampionship();
  const updateMutation = useUpdateChampionship();
  const form = useForm<ChampionshipFormValues>({
    resolver: zodResolver(championshipSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    form.reset(
      championship
        ? {
            name: championship.name,
            season: championship.season ?? "",
            description: championship.description ?? "",
            starts_at: championship.starts_at ?? "",
            ends_at: championship.ends_at ?? "",
            is_public: championship.is_public,
            status: championship.status,
          }
        : EMPTY_FORM,
    );
  }, [championship, form, open]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const submit = async (values: ChampionshipFormValues) => {
    const common = {
      name: values.name.trim(),
      season: values.season.trim() || null,
      description: values.description.trim() || null,
      starts_at: values.starts_at || null,
      ends_at: values.ends_at || null,
      is_public: values.is_public,
    };
    try {
      if (championship) {
        if (!organizationId) throw new Error("Organização não identificada.");
        const changes: UpdateChampionshipDTO = { ...common, status: values.status };
        await updateMutation.mutateAsync({
          organizationId,
          championshipId: championship.id,
          changes,
        });
        toast.success("Campeonato atualizado.");
      } else {
        await createMutation.mutateAsync(common satisfies CreateChampionshipDTO);
        toast.success("Campeonato criado com configurações e categoria padrão.");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{championship ? "Editar campeonato" : "Novo campeonato"}</DialogTitle>
          <DialogDescription>Preencha os dados básicos da competição.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Copa da Baixada 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="season"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporada</FormLabel>
                    <FormControl>
                      <Input placeholder="2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {championship && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <option value="draft">Rascunho</option>
                          <option value="active">Ativo</option>
                          <option value="finished">Finalizado</option>
                          <option value="archived">Arquivado</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Informações gerais da competição" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="starts_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ends_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de término</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-white/[0.08] p-3">
                  <div>
                    <FormLabel>Publicação</FormLabel>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Permitir visualização pública do campeonato.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar campeonato"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ChampionshipsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Carregando campeonatos">
      {[0, 1, 2].map((item) => (
        <div key={item} className="card-arena overflow-hidden">
          <Skeleton className="h-28 rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
