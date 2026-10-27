import type {
  CreateInvitationRequest,
  CreateInvitationResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";

export type Leader = { id: string; label: string; email?: string };

// Only leaders that have an email can be invited to use the app.
export const leadersToInvite = (leaders: Leader[]): Leader[] =>
  leaders.filter((leader) => leader.email?.trim());

export type LeaderInvitationResult = {
  invited: number;
  // The invitation was saved but the email could not be sent.
  notDelivered: number;
  failed: { label: string; reason: string }[];
};

type Invite = (
  groupId: string,
  request: CreateInvitationRequest,
) => Promise<CreateInvitationResponse>;

// Invites each leader (by their existing person) to use the app, in the group
// they lead. One failure (for example a leader who already has an account)
// does not stop the others.
export const inviteLeaders = async (
  groupId: string,
  leaders: Leader[],
  invite: Invite,
): Promise<LeaderInvitationResult> => {
  const result: LeaderInvitationResult = {
    invited: 0,
    notDelivered: 0,
    failed: [],
  };
  for (const leader of leadersToInvite(leaders)) {
    try {
      const created = await invite(groupId, {
        email: (leader.email ?? "").trim(),
        personId: leader.id,
      });
      result.invited += 1;
      if (created.invitation?.emailStatus === "FAILED")
        result.notDelivered += 1;
    } catch (failure) {
      result.failed.push({
        label: leader.label,
        reason: apiErrorMessage(failure, "No se pudo invitar"),
      });
    }
  }
  return result;
};

// One line for the snackbar after saving the group.
export const invitationSummary = (result: LeaderInvitationResult): string => {
  const parts: string[] = [];
  if (result.invited > 0) {
    parts.push(
      result.invited === 1
        ? "1 líder invitado"
        : `${result.invited} líderes invitados`,
    );
  }
  if (result.notDelivered > 0) {
    parts.push(`no se pudo enviar el correo a ${result.notDelivered}`);
  }
  for (const failure of result.failed) {
    parts.push(`${failure.label}: ${failure.reason}`);
  }
  return parts.length === 0
    ? "Guardado exitosamente"
    : `Guardado exitosamente. ${parts.join("; ")}`;
};
