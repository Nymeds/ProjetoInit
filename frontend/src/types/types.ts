
export interface Todo {
  id: number; 
  title: string;
  description?: string;
  completed?: boolean;
  images?: Array<{
  id: string;
  path: string;
  filename: string;
}>
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