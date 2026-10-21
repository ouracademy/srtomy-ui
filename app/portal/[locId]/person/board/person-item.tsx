import React, { CSSProperties } from "react";
import styled from "@emotion/styled";
import type { DraggableProvided } from "@hello-pangea/dnd";
import { borderRadius, grid } from "./constants";
import type { Author } from "./types";
import { Avatar } from "@mui/material";

interface Props {
  author: Author;
  isDragging: boolean;
  provided: DraggableProvided;
  isClone?: boolean;
  isGroupedOver?: boolean;
  style?: CSSProperties;
  index?: number;
}

const getBackgroundColor = (isDragging: boolean, isGroupedOver: boolean) => {
  if (isDragging) {
    return "#DEEBFF";
  }

  if (isGroupedOver) {
    return "#EBECF0";
  }

  return "#FFFFFF";
};

const getBorderColor = (isDragging: boolean) =>
  isDragging ? "rgba(9, 30, 66, 0.71)" : "transparent";

const imageSize = 40;

const CloneBadge = styled.div`
  background: #79f2c0;
  bottom: ${grid / 2}px;
  border: 2px solid #57d9a3;
  border-radius: 50%;
  box-sizing: border-box;
  font-size: 10px;
  position: absolute;
  right: -${imageSize / 3}px;
  top: -${imageSize / 3}px;
  transform: rotate(40deg);
  height: ${imageSize}px;
  width: ${imageSize}px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

interface ContainerProps {
  isDragging: boolean;
  isGroupedOver: boolean;
}

const Container = styled.div<ContainerProps>`
  border-radius: ${borderRadius}px;
  border: 2px solid transparent;
  border-color: ${(props) => getBorderColor(props.isDragging)};
  background-color: ${(props) =>
    getBackgroundColor(props.isDragging, props.isGroupedOver)};
  box-shadow: ${({ isDragging }) =>
    isDragging ? `2px 2px 1px #57D9A3` : "none"};
  box-sizing: border-box;
  padding: ${grid}px;
  min-height: ${imageSize}px;
  margin-bottom: ${grid}px;
  user-select: none;
  cursor: pointer;

  /* anchor overrides */
  color: #091e42;

  &:hover,
  &:active {
    color: #091e42;
  }

  &:focus {
    outline: none;
    box-shadow: none;
  }

  /* flexbox */
  display: flex;
`;

const Content = styled.div`
  /* flex child */
  flex-grow: 1;

  /*
    Needed to wrap text in ie11
    https://stackoverflow.com/questions/35111090/why-ie11-doesnt-wrap-the-text-in-flexbox
  */
  flex-basis: 100%;

  /* flex parent */
  display: flex;
  flex-direction: column;
  padding-left: 0.5rem;
`;

function getStyle(provided: DraggableProvided, style?: CSSProperties | null) {
  if (!style) {
    return provided.draggableProps.style;
  }

  return {
    ...provided.draggableProps.style,
    ...style,
  };
}

// Previously this extended React.Component
// That was a good thing, because using React.PureComponent can hide
// issues with the selectors. However, moving it over does can considerable
// performance improvements when reordering big lists (400ms => 200ms)
// Need to be super sure we are not relying on PureComponent here for
// things we should be doing in the selector as we do not know if consumers
// will be using PureComponent
function PersonItem(props: Props) {
  const { author, isDragging, isGroupedOver, provided, style, isClone, index } =
    props;

  return (
    <Container
      isDragging={isDragging}
      isGroupedOver={Boolean(isGroupedOver)}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={getStyle(provided, style)}
      data-is-dragging={isDragging}
      data-testid={author.id}
      data-index={index}
      aria-label={`${author.name}`}
    >
      <Avatar {...stringAvatar(author.name)} />
      {isClone ? <CloneBadge>Clone</CloneBadge> : null}
      <Content>{author.name}</Content>
    </Container>
  );
}

function stringToColor(string: string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

function stringAvatar(name: string) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: name.split(" ")[0]?.[0] ?? "",
  };
}

export default React.memo<Props>(PersonItem);
