import React, { CSSProperties, ReactElement } from "react";
import styled from "@emotion/styled";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import type {
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import PersonItem from "./person-item";
import { grid } from "./constants";
import Title from "./title";
import { Author } from "./types";

export const getBackgroundColor = (
  isDraggingOver: boolean,
  isDraggingFrom: boolean,
): string => {
  if (isDraggingOver) {
    return "#FFEBE6";
  }
  if (isDraggingFrom) {
    return "#E6FCFF";
  }
  return "#EBECF0";
};

interface WrapperProps {
  isDraggingOver: boolean;
  isDraggingFrom: boolean;
  isDropDisabled: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  background-color: ${(props) =>
    getBackgroundColor(props.isDraggingOver, props.isDraggingFrom)};
  display: flex;
  flex-direction: column;
  opacity: ${({ isDropDisabled }) => (isDropDisabled ? 0.5 : "inherit")};
  padding: ${grid}px;
  border: ${grid}px;
  padding-bottom: 0;
  transition:
    background-color 0.2s ease,
    opacity 0.1s ease;
  user-select: none;
  width: 250px;
`;

const scrollContainerHeight = 250;

const DropZone = styled.div`
  /* stop the list collapsing when empty */
  min-height: ${scrollContainerHeight}px;

  /*
    not relying on the items for a margin-bottom
    as it will collapse when the list is empty
  */
  padding-bottom: ${grid}px;
`;

const ScrollContainer = styled.div`
  overflow-x: hidden;
  overflow-y: auto;
  max-height: ${scrollContainerHeight}px;
`;

const Container = styled.div``;

interface Props {
  listId?: string;
  authors: Author[];
  title?: string;
  internalScroll?: boolean;
  scrollContainerStyle?: CSSProperties;
  isDropDisabled?: boolean;
  isCombineEnabled?: boolean;
  style?: CSSProperties;
  // may not be provided - and might be null
  ignoreContainerClipping?: boolean;
  useClone?: boolean;
}

interface PersonListProps {
  authors: Author[];
}

function InnerPersonList(props: PersonListProps): ReactElement {
  return (
    <>
      {props.authors.map((author: Author, index: number) => (
        <Draggable key={author.id} draggableId={author.id} index={index}>
          {(
            dragProvided: DraggableProvided,
            dragSnapshot: DraggableStateSnapshot,
          ) => (
            <PersonItem
              key={author.id}
              author={author}
              isDragging={dragSnapshot.isDragging}
              isGroupedOver={Boolean(dragSnapshot.combineTargetFor)}
              provided={dragProvided}
            />
          )}
        </Draggable>
      ))}
    </>
  );
}

const InnerPersonListMemo = React.memo<PersonListProps>(InnerPersonList);

interface InnerListProps {
  dropProvided: DroppableProvided;
  authors: Author[];
  title: string | undefined | null;
}

function InnerList(props: InnerListProps) {
  const { authors, dropProvided } = props;
  const title = props.title ? <Title>{props.title}</Title> : null;

  return (
    <Container>
      {title}
      <DropZone ref={dropProvided.innerRef}>
        <InnerPersonListMemo authors={authors} />
        {dropProvided.placeholder}
      </DropZone>
    </Container>
  );
}

export default function PersonList(props: Props): ReactElement {
  const {
    ignoreContainerClipping,
    internalScroll,
    scrollContainerStyle,
    isDropDisabled,
    isCombineEnabled,
    listId = "LIST",
    style,
    authors,
    title,
    useClone,
  } = props;

  return (
    <Droppable
      droppableId={listId}
      type="PERSON"
      ignoreContainerClipping={ignoreContainerClipping}
      isDropDisabled={isDropDisabled}
      isCombineEnabled={isCombineEnabled}
      renderClone={
        useClone
          ? (provided, snapshot, descriptor) => {
              const author = authors[descriptor.source.index];
              return author ? (
                <PersonItem
                  author={author}
                  provided={provided}
                  isDragging={snapshot.isDragging}
                  isClone
                />
              ) : (
                <div ref={provided.innerRef} />
              );
            }
          : undefined
      }
    >
      {(
        dropProvided: DroppableProvided,
        dropSnapshot: DroppableStateSnapshot,
      ) => (
        <Wrapper
          style={style}
          isDraggingOver={dropSnapshot.isDraggingOver}
          isDropDisabled={Boolean(isDropDisabled)}
          isDraggingFrom={Boolean(dropSnapshot.draggingFromThisWith)}
          {...dropProvided.droppableProps}
        >
          {internalScroll ? (
            <ScrollContainer style={scrollContainerStyle}>
              <InnerList
                authors={authors}
                title={title}
                dropProvided={dropProvided}
              />
            </ScrollContainer>
          ) : (
            <InnerList
              authors={authors}
              title={title}
              dropProvided={dropProvided}
            />
          )}
        </Wrapper>
      )}
    </Droppable>
  );
}
