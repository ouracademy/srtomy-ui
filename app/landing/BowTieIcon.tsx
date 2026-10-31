import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";

// The bow tie of the brand, drawn as an icon so it follows the text color.
export function BowTieIcon(props: Readonly<SvgIconProps>) {
  return (
    <SvgIcon viewBox="0 0 48 24" {...props}>
      <path d="M2 4Q14 8 19 10V14Q14 16 2 20Q0 12 2 4Z" />
      <rect x="19.5" y="9" width="9" height="6" rx="1.5" />
      <path d="M46 4Q34 8 29 10V14Q34 16 46 20Q48 12 46 4Z" />
    </SvgIcon>
  );
}
