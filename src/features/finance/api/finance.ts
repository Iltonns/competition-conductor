import { supabase } from "@/integrations/supabase/client";

export type FinancialTransactionType = "income" | "expense";
export type FinancialTransactionStatus = "pending" | "paid" | "cancelled";

export interface FinancialAttachment {
  id: string;
  transaction_id: string;
  object_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  signed_url?: string;
}

export interface FinancialTransaction {
  id: string;
  organization_id: string;
  championship_id: string;
  transaction_type: FinancialTransactionType;
  category: string;
  description: string;
  competence_date: string;
  due_date: string | null;
  paid_at: string | null;
  amount: number;
  status: FinancialTransactionStatus;
  counterparty: string | null;
  notes: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  attachments: FinancialAttachment[];
}

export interface FinanceSummary {
  realized_income: number;
  realized_expense: number;
  realized_balance: number;
  projected_income: number;
  projected_expense: number;
  projected_balance: number;
  overdue_count: number;
}

export interface FinanceData {
  summary: FinanceSummary;
  transactions: FinancialTransaction[];
  categories: string[];
}

export interface FinanceFilters {
  dateFrom: string;
  dateTo: string;
  status: "" | FinancialTransactionStatus | "overdue";
  transactionType: "" | FinancialTransactionType;
  category: string;
}

export interface FinancialTransactionPayload {
  transaction_type: FinancialTransactionType;
  category: string;
  description: string;
  competence_date: string;
  due_date: string;
  amount: number;
  counterparty: string;
  notes: string;
}

const allowedAttachmentTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const attachmentLimit = 10 * 1024 * 1024;

async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}

export async function getFinanceData(
  championshipId: string,
  filters: FinanceFilters,
): Promise<FinanceData> {
  const data = await callRpc<FinanceData>("get_championship_finance", {
    p_championship_id: championshipId,
    p_date_from: filters.dateFrom || null,
    p_date_to: filters.dateTo || null,
    p_status: filters.status || null,
    p_transaction_type: filters.transactionType || null,
    p_category: filters.category || null,
  });

  const transactions = await Promise.all(
    (data.transactions ?? []).map(async (transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
      attachments: await Promise.all(
        (transaction.attachments ?? []).map(async (attachment) => {
          const { data: signed, error } = await supabase.storage
            .from("financial-attachments")
            .createSignedUrl(attachment.object_path, 900);
          return error ? attachment : { ...attachment, signed_url: signed.signedUrl };
        }),
      ),
    })),
  );

  return {
    ...data,
    summary: Object.fromEntries(
      Object.entries(data.summary).map(([key, value]) => [key, Number(value)]),
    ) as unknown as FinanceSummary,
    transactions,
  };
}

export function saveFinancialTransaction(
  championshipId: string,
  transactionId: string | null,
  payload: FinancialTransactionPayload,
) {
  return callRpc<FinancialTransaction>("save_financial_transaction", {
    p_championship_id: championshipId,
    p_transaction_id: transactionId,
    p_payload: payload,
  });
}

export function settleFinancialTransaction(
  championshipId: string,
  transactionId: string,
  paidAt: string,
) {
  return callRpc<FinancialTransaction>("settle_financial_transaction", {
    p_championship_id: championshipId,
    p_transaction_id: transactionId,
    p_paid_at: paidAt,
  });
}

export function reverseFinancialSettlement(
  championshipId: string,
  transactionId: string,
  reason: string,
) {
  return callRpc<FinancialTransaction>("reverse_financial_settlement", {
    p_championship_id: championshipId,
    p_transaction_id: transactionId,
    p_reason: reason,
  });
}

export function cancelFinancialTransaction(
  championshipId: string,
  transactionId: string,
  reason: string,
) {
  return callRpc<FinancialTransaction>("cancel_financial_transaction", {
    p_championship_id: championshipId,
    p_transaction_id: transactionId,
    p_reason: reason,
  });
}

export async function uploadFinancialAttachment(
  organizationId: string,
  championshipId: string,
  transactionId: string,
  file: File,
) {
  if (
    !allowedAttachmentTypes.includes(file.type) ||
    file.size <= 0 ||
    file.size > attachmentLimit
  ) {
    throw new Error("Use PDF, JPG, PNG ou WebP com até 10 MB.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const objectPath = `${organizationId}/${championshipId}/${transactionId}/${crypto.randomUUID()}-${safeName}`;
  const bucket = supabase.storage.from("financial-attachments");
  const { error: uploadError } = await bucket.upload(objectPath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  try {
    return await callRpc<FinancialAttachment>("register_financial_attachment", {
      p_championship_id: championshipId,
      p_transaction_id: transactionId,
      p_object_path: objectPath,
      p_file_name: file.name,
      p_mime_type: file.type,
      p_size_bytes: file.size,
    });
  } catch (error) {
    await bucket.remove([objectPath]);
    throw error;
  }
}

export function removeFinancialAttachment(championshipId: string, attachmentId: string) {
  return callRpc<void>("remove_financial_attachment", {
    p_championship_id: championshipId,
    p_attachment_id: attachmentId,
  });
}
