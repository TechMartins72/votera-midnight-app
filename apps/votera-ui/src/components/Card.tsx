import { votersData } from "../utils";
import Button from "./Button";

const Card = () => {
  return (
    <div className="flex justify-center items-center gap-16">
      {votersData.map((voter) => (
        <div
          key={voter.name}
          className="flex justify-center items-center flex-col gap-4"
        >
          <div className="border-2 border-gray-700 w-full h-full py-8 px-12 rounded-xl flex flex-col">
            <h2 className="font-bold">{voter.name}</h2>
          </div>
          <Button value="vote" />
          <span className="text-4xl text-gray-200">{voter.count}</span>
        </div>
      ))}
    </div>
  );
};

export default Card;
