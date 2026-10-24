import { DEBOUNCE_WAIT_MS } from "@/app/(components)/helpers/debouncing";
import React from "react";
import { AutocompleteElement } from "react-hook-form-mui";
import { useGetPeople } from "@/app/(api)/generated";
import { useDebounce } from "use-debounce";

type GroupAutocompleteProps = {
  name: string;
  label: string;
  nodeId: string;
};

export const GroupAutocomplete = ({
  name,
  label,
  nodeId,
}: GroupAutocompleteProps) => {
  const [searchMember, setSearchMember] = React.useState("");
  const [searchTextDebounced] = useDebounce(searchMember, DEBOUNCE_WAIT_MS);

  const { data: people } = useGetPeople({
    organizationId: nodeId,
    searchText: searchTextDebounced,
  });

  return (
    <AutocompleteElement
      multiple
      autocompleteProps={{
        isOptionEqualToValue: (option, value) => option.id === value.id,
        onInputChange: (_event, newInputValue) => {
          setSearchMember(newInputValue);
        },
      }}
      name={name}
      label={label}
      options={
        people?.content?.map((x) => ({
          id: x.id,
          label: `${x.firstName ?? ""} ${x.lastName ?? ""}`,
          email: x.email ?? undefined,
        })) || []
      }
    />
  );
};
