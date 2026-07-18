import type { ReactNode } from "react";
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
import { cn } from "@/lib/utils";

/**
 * Confirmação para exclusões e ações irreversíveis (plano seção 5.5).
 *
 * Antes desta extração, o mesmo `AlertDialog` (título, descrição, cancelar,
 * ação com estado "pendente") estava reimplementado em cada tela que
 * precisava confirmar uma exclusão — ex.: excluir campeonato
 * (`_organizer/championships.tsx`) e remover vínculo de equipe
 * (`championships_.$id.teams.$teamId.index.tsx`) — cada um com um texto de
 * botão "pendente" e uma variação de classe ligeiramente diferente.
 *
 * `destructive` controla o estilo do botão de ação (vermelho para exclusão
 * definitiva; padrão para ações reversíveis como arquivar/remover vínculo).
 */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  pendingLabel,
  cancelLabel = "Cancelar",
  isPending = false,
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  /** Texto exibido no botão enquanto `isPending` é true. Padrão: `"${confirmLabel}..."`. */
  pendingLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              // AlertDialogAction fecha o modal por padrão ao clicar; para
              // ações assíncronas (mutation) queremos manter o modal até a
              // chamada terminar, então prevenimos o fechamento automático.
              event.preventDefault();
              void onConfirm();
            }}
            className={cn(
              destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {isPending ? (pendingLabel ?? `${confirmLabel}...`) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
