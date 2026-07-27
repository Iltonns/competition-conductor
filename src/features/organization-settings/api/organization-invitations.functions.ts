import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  inviteOrganizationUserSchema,
  resendOrganizationInvitationSchema,
} from "../schemas/organization-settings.schema";

interface PreparedInvitation {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  status?: "pending" | "provisioned";
  requires_email?: boolean;
}

function invitationError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const known = [
    "organization:forbidden",
    "organization:privilege_escalation",
    "organization:already_member",
    "organization:invalid_email",
    "organization:invitation_not_found",
    "organization:invitation_not_pending",
    "organization:resend_rate_limited",
  ];
  return new Error(
    known.find((code) => message.includes(code)) ?? "organization:invitation_failed",
  );
}

async function deliverInvitation(
  context: {
    supabase: {
      rpc: (
        name: never,
        args: never,
      ) => PromiseLike<{
        data: unknown;
        error: { message: string } | null;
      }>;
    };
  },
  invitation: PreparedInvitation,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error: deliveryError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    invitation.email,
    {
      data: {
        organization_invitation_id: invitation.id,
        organization_role: invitation.role,
      },
    },
  );
  if (deliveryError) throw new Error("organization:email_delivery_failed");

  const { error: markError } = await context.supabase.rpc(
    "mark_organization_invitation_sent" as never,
    { p_invitation_id: invitation.id } as never,
  );
  if (markError) throw new Error(markError.message);
}

export const inviteOrganizationUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(inviteOrganizationUserSchema)
  .handler(async ({ data, context }) => {
    try {
      const { data: prepared, error } = await context.supabase.rpc(
        "create_organization_invitation" as never,
        {
          p_organization_id: data.organizationId,
          p_email: data.email,
          p_role: data.role,
        } as never,
      );
      if (error) throw new Error(error.message);
      const invitation = prepared as unknown as PreparedInvitation;
      if (invitation.requires_email) await deliverInvitation(context, invitation);
      return { status: invitation.status ?? "pending" };
    } catch (error) {
      throw invitationError(error);
    }
  });

export const resendOrganizationInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(resendOrganizationInvitationSchema)
  .handler(async ({ data, context }) => {
    try {
      const { data: prepared, error } = await context.supabase.rpc(
        "prepare_organization_invitation_resend" as never,
        { p_invitation_id: data.invitationId } as never,
      );
      if (error) throw new Error(error.message);
      await deliverInvitation(context, prepared as unknown as PreparedInvitation);
    } catch (error) {
      throw invitationError(error);
    }
  });
