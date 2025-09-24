export type TabImage = {
  author: string;
  id: number;
  mini: string;
  url: string;
};

export type TabSection = {
  title: string;
  text: string;
};

export type Tab =
  {
  title: string;
  type: string;
  icon: string;
  images?: TabImage[];
  sections?: TabSection[];
  url?: string;
};
