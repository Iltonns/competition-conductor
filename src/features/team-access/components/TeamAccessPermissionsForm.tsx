import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  TEAM_ACCESS_PERMISSION_KEYS,
  TEAM_ACCESS_PERMISSION_LABELS,
  type TeamAccessPermissions,
} from "../types/team-access.types";

export function TeamAccessPermissionsForm({
  value,
  onChange,
  disabled = false,
}: {
  value: TeamAccessPermissions;
  onChange: (value: TeamAccessPermissions) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {TEAM_ACCESS_PERMISSION_KEYS.map((key) => (
        <div
          key={key}
          className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/15 px-3 py-2"
        >
          <Label htmlFor={`permission-${key}`} className="text-xs leading-snug">
            {TEAM_ACCESS_PERMISSION_LABELS[key]}
          </Label>
          <Switch
            id={`permission-${key}`}
            checked={value[key]}
            disabled={disabled}
            onCheckedChange={(checked) => onChange({ ...value, [key]: checked })}
          />
        </div>
      ))}
    </div>
  );
}
