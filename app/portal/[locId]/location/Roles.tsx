import type { AccountabilityTypeDto } from "@/app/(api)/generated/aPISrTommy.schemas";

export const getFixedOptions = (roles: AccountabilityTypeDto[]): string[] => {
  return roles
    .filter((x) => x.isPredefined === true)
    .map((x) => toSpanish(x.name ?? ""));
};

export const toSpanish = (x: string) => {
  if (x === "PASTOR") {
    return "Pastor";
  } else if (x === "WORSHIP_LEADER") {
    return "Líder de alabanza";
  } else {
    return "Ujier";
  }
};
