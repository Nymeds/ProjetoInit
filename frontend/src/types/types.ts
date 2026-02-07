export interface Todo {
  id: number; 
  title: string;
  description?: string;
  completed?: boolean;
  createdAt: string | number | Date;
  images?: TodoImage[];
  group?: {
    id: string;
    name: string;
  };
}

export interface TodoImage {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  createdAt: string | number | Date;
  url: string;
}

export interface Group {
  id: string;
  name: string;
}
