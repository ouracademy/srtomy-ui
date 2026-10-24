import type { Author, PersonMap } from "./types";
import type { DraggableLocation } from "@hello-pangea/dnd";

// a little function to help us with reordering the result
const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  if (removed !== undefined) result.splice(endIndex, 0, removed);

  return result;
};

export default reorder;

type ReorderPersonMapArgs = {
  personMap: PersonMap;
  source: DraggableLocation;
  destination: DraggableLocation;
};

export type ReorderPersonMapResult = {
  personMap: PersonMap;
};

export const reorderMap = ({
  personMap,
  source,
  destination,
}: ReorderPersonMapArgs): ReorderPersonMapResult => {
  const current: Author[] = [...(personMap[source.droppableId] ?? [])];
  const next: Author[] = [...(personMap[destination.droppableId] ?? [])];
  const target = current[source.index];
  if (!target) return { personMap };

  // moving to same list
  if (source.droppableId === destination.droppableId) {
    const reordered: Author[] = reorder(
      current,
      source.index,
      destination.index,
    );
    const result: PersonMap = {
      ...personMap,
      [source.droppableId]: reordered,
    };
    return {
      personMap: result,
    };
  }

  // moving to different list

  // remove from original
  current.splice(source.index, 1);
  // insert into next
  next.splice(destination.index, 0, target);

  const result: PersonMap = {
    ...personMap,
    [source.droppableId]: current,
    [destination.droppableId]: next,
  };

  return {
    personMap: result,
  };
};

type List<T> = {
  id: string;
  values: T[];
};

type MoveBetweenArgs<T> = {
  list1: List<T>;
  list2: List<T>;
  source: DraggableLocation;
  destination: DraggableLocation;
};

type MoveBetweenResult<T> = {
  list1: List<T>;
  list2: List<T>;
};

export function moveBetween<T>({
  list1,
  list2,
  source,
  destination,
}: MoveBetweenArgs<T>): MoveBetweenResult<T> {
  const newFirst = Array.from(list1.values);
  const newSecond = Array.from(list2.values);

  const moveFrom = source.droppableId === list1.id ? newFirst : newSecond;
  const moveTo = moveFrom === newFirst ? newSecond : newFirst;

  const [moved] = moveFrom.splice(source.index, 1);
  if (moved !== undefined) moveTo.splice(destination.index, 0, moved);

  return {
    list1: {
      ...list1,
      values: newFirst,
    },
    list2: {
      ...list2,
      values: newSecond,
    },
  };
}
