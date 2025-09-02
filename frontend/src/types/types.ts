
export interface Todo {
  id: number; 
  title: string;
  description?: string;
  completed?: boolean;
  createdAt: string | number | Date;
  group?: {
    id: string;
    name: string;
  };
}

export interface Group {
  id: string;
  name: string;
}