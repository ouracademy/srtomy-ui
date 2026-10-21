import { DEBOUNCE_WAIT_MS } from "@/app/(components)/helpers/debouncing";
import React from "react";
import { AutocompleteElement } from "react-hook-form-mui";
import { usePeople } from "@/app/(api)/services/people";
import { useDebounce } from "use-debounce";

type GroupAutocompleteProps = {
  name: string;
  label: string;
  locId: string;
};

export const GroupAutocomplete = ({
  name,
  label,
  locId,
}: GroupAutocompleteProps) => {
  const [searchMember, setSearchMember] = React.useState("");
  const [searchTextDebounced] = useDebounce(searchMember, DEBOUNCE_WAIT_MS);

  const { data: people } = usePeople({
    organizationId: locId,
    searchText: searchTextDebounced,
  });

  return (
    <AutocompleteElement
      multiple
      autocompleteProps={{
        onInputChange: (_event, newInputValue) => {
          setSearchMember(newInputValue);
        },
      }}
      name={name}
      label={label}
      options={
        people?.content.map((x) => ({
          id: x.id,
          label: x.firstName + " " + x.lastName,
        })) || []
      }
    />
  );
};
