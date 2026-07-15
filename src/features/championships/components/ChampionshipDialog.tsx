import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateChampionship } from "../hooks/useCreateChampionship";
import { useUpdateChampionship } from "../hooks/useUpdateChampionship";
import { championshipSchema, type ChampionshipFormValues } from "../schemas/championship.schema";
import type {
  Championship,
  CreateChampionshipDTO,
  UpdateChampionshipDTO,
} from "../types/championship.types";
import { getChampionshipErrorMessage } from "../utils/championship-display";

const EMPTY_FORM: ChampionshipFormValues = {
  name: "",
  season: "",
  description: "",
  starts_at: "",
  ends_at: "",
  is_public: false,
  status: "draft",
};

interface ChampionshipDialogProps {
  open: boolean;
  championship: Championship | null;
  organizationId?: string;
  onOpenChange: (open: boolean) => void;
}

export function ChampionshipDialog({
  open,
  championship,
  organizationId,
  onOpenChange,
}: ChampionshipDialogProps) {
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
      toast.error(getChampionshipErrorMessage(error));
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
