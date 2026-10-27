"use client";

import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import type { PermissionGroupResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { permissionLabel, resourceLabel } from "./permissionLabels";
import { setGroup, togglePermission } from "./permissionSelection";

type PermissionPickerProps = Readonly<{
  catalog: PermissionGroupResponse[];
  value: string[];
  onChange: (value: string[]) => void;
  // Permissions that come from somewhere else (a role): shown checked, not editable.
  locked?: string[];
  disabled?: boolean;
}>;

// What a position allows, as checkboxes grouped by module. The same list the
// custom role editor used, so people see the permissions and not the roles.
export const PermissionPicker = ({
  catalog,
  value,
  onChange,
  locked = [],
  disabled = false,
}: PermissionPickerProps) => (
  <>
    {catalog.map((group) => {
      const values = group.permissions ?? [];
      const editable = values.filter((v) => !locked.includes(v));
      const all = values.every((v) => value.includes(v) || locked.includes(v));
      return (
        <FormGroup
          key={group.resource}
          role="group"
          aria-label={resourceLabel(group.resource ?? "")}
        >
          <FormControlLabel
            label={
              <Typography fontWeight={600}>
                {resourceLabel(group.resource ?? "")}
              </Typography>
            }
            control={
              <Checkbox
                checked={all}
                disabled={disabled || editable.length === 0}
                onChange={(event) =>
                  onChange(setGroup(value, editable, event.target.checked))
                }
              />
            }
          />
          {values.map((permission) => (
            <FormControlLabel
              key={permission}
              sx={{ ml: 3 }}
              label={permissionLabel(permission)}
              control={
                <Checkbox
                  checked={
                    value.includes(permission) || locked.includes(permission)
                  }
                  disabled={disabled || locked.includes(permission)}
                  onChange={() => onChange(togglePermission(value, permission))}
                />
              }
            />
          ))}
        </FormGroup>
      );
    })}
  </>
);
