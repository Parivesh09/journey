export type ID = string;

export type Timestamp = Date | string;

export interface BaseEntity {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type ValueOf<T> = T[keyof T];

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export type Constructor<T = object> = new (...args: unknown[]) => T;

export type Class<T = object> = Constructor<T>;

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams<T> {
  field: keyof T;
  direction: "asc" | "desc";
}