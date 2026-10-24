import styled from "@emotion/styled";
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { Draggable } from "@hello-pangea/dnd";
import { borderRadius, grid } from "./constants";
import PersonList from "./person-list";
import Title from "./title";
import type { Author } from "./types";
import { getLabel } from "./data";

const Container = styled.div`
  margin: ${grid}px;
  display: flex;
  flex-direction: column;
`;

interface HeaderProps {
  isDragging: boolean;
}

const Header = styled.div<HeaderProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-left-radius: ${borderRadius}px;
  border-top-right-radius: ${borderRadius}px;
  background-color: ${({ isDragging }) => (isDragging ? "#091E42" : "#EBECF0")};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e3fcef;
  }
`;

interface Props {
  title: string;
  authors: Author[];
  index: number;
  isScrollable?: boolean;
  isCombineEnabled?: boolean;
  useClone?: boolean;
}

export default function Column({
  title,
  authors,
  index,
  isScrollable,
  isCombineEnabled,
  useClone,
}: Props) {
  return (
    <Draggable draggableId={title} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <Container ref={provided.innerRef} {...provided.draggableProps}>
          <Header isDragging={snapshot.isDragging}>
            <Title
              {...provided.dragHandleProps}
              aria-label={`${title} person list`}
            >
              {getLabel(title)}
            </Title>
          </Header>
          <PersonList
            listId={title}
            style={{
              backgroundColor: snapshot.isDragging ? "#E3FCEF" : undefined,
            }}
            authors={authors}
            internalScroll={isScrollable}
            isCombineEnabled={Boolean(isCombineEnabled)}
            useClone={Boolean(useClone)}
          />
        </Container>
      )}
    </Draggable>
  );
}
