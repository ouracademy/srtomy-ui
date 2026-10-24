export type Id = string;

export type Author = {
  id: Id;
  name: string;
};

export type PersonMap = {
  [key: string]: Author[];
};
