import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelFinancialTransaction,
  getFinanceData,
  removeFinancialAttachment,
  reverseFinancialSettlement,
  saveFinancialTransaction,
  settleFinancialTransaction,
  uploadFinancialAttachment,
  type FinanceFilters,
  type FinancialTransactionPayload,
} from "../api/finance";

const key = (championshipId: string) => ["finance", championshipId] as const;

export function useFinance(
  organizationId: string,
  championshipId: string,
  filters: FinanceFilters,
) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: key(championshipId) });
  const query = useQuery({
    queryKey: [...key(championshipId), filters],
    queryFn: () => getFinanceData(championshipId, filters),
  });

  return {
    ...query,
    save: useMutation({
      mutationFn: ({
        transactionId,
        payload,
      }: {
        transactionId: string | null;
        payload: FinancialTransactionPayload;
      }) => saveFinancialTransaction(championshipId, transactionId, payload),
      onSuccess: refresh,
    }),
    settle: useMutation({
      mutationFn: ({ transactionId, paidAt }: { transactionId: string; paidAt: string }) =>
        settleFinancialTransaction(championshipId, transactionId, paidAt),
      onSuccess: refresh,
    }),
    reverse: useMutation({
      mutationFn: ({ transactionId, reason }: { transactionId: string; reason: string }) =>
        reverseFinancialSettlement(championshipId, transactionId, reason),
      onSuccess: refresh,
    }),
    cancel: useMutation({
      mutationFn: ({ transactionId, reason }: { transactionId: string; reason: string }) =>
        cancelFinancialTransaction(championshipId, transactionId, reason),
      onSuccess: refresh,
    }),
    uploadAttachment: useMutation({
      mutationFn: ({ transactionId, file }: { transactionId: string; file: File }) =>
        uploadFinancialAttachment(organizationId, championshipId, transactionId, file),
      onSuccess: refresh,
    }),
    removeAttachment: useMutation({
      mutationFn: (attachmentId: string) => removeFinancialAttachment(championshipId, attachmentId),
      onSuccess: refresh,
    }),
  };
}
