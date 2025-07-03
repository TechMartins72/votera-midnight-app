import { StaticImageData } from "next/image";

export type voters = {
  name: string;
  count: number;
  src: StaticImageData;
  alt: string;
};
