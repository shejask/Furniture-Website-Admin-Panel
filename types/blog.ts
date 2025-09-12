export interface Blog {
  id: string;
  title: string;
  description: string;
  image: string;
  date: Date;
  content: string;
}

export interface BlogFormValues {
  title: string;
  description: string;
  image: string;
  date: Date;
  content: string;
}
