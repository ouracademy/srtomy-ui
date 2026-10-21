// Returns a copy of the column with sorting disabled (DataGrid column defs).
export const withOutSorting = <T extends object>(column: T): T => ({
  ...column,
  sortable: false,
});
