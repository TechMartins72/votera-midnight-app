import Image, { type ImageProps } from "next/image";
import styles from "./page.module.css";
import Card from "./Components/Card";

export default function Home() {
  return (
    <main className="w-full h-screen flex flex-col justify-center items-center">
      <div className="text-center flex justify-center items-center gap-12 flex-col ">
        <p className="absolute top-12 right-24 text-gray-300 cursor-pointer hover:text-white transition-all hover:-translate-x-1.5">
          Support
        </p>
        <span>
          <h1 className="text-4xl">Welcome to Votera</h1>
          <p className="text-gray-300 mt-4">Please select a vote</p>
        </span>
        <Card />
      </div>
    </main>
  );
}
