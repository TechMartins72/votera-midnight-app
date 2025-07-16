import type { VoteraAPI } from "@repo/votera-api";
// import { votersData } from "../utils";
import Button from "./Button";
import { useEffect, useState } from "react";

interface CardProps {
  api: VoteraAPI | undefined;
}

const votersData = [
  {
    name: "Joseph Martins",
    candidate: "joseph",
    count: 0,
  },
  {
    name: "Samir Samir",
    candidate: "samir",
    count: 0,
  },
  {
    name: "Elliot Lucky",
    candidate: "elliot",
    count: 0,
  },
];

type voteState = "is-voting" | "has-voted" | "has-not-voted";

const Card: React.FC<CardProps> = ({ api }) => {
  const [candidateStates, setCandidateStates] =
    useState<typeof votersData>(votersData);
  const [voterState, setVoterState] = useState<voteState>("has-not-voted");
  // const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      candidateStates.forEach((candidateState) => {
        const candidate = candidateState.candidate;
        api?.state$.subscribe((states) => {
          setCandidateStates((prev) =>
            prev.map((item) =>
              item.candidate === candidate
                ? {
                    ...item,
                    count: Number(states.candidates.lookup(candidate).read()),
                  }
                : item
            )
          );
        });
      });
    } catch (error) {
      console.log(error);
    }
  }, [api?.state$]);

  const handleVote = async (candidate: string) => {
    if (!api) {
      return;
    }
    try {
      if (voterState === "has-voted" || voterState === "is-voting") {
        return;
      }
      setVoterState("is-voting");
      await api.deployedContract.callTx.vote(candidate);
      setVoterState("has-voted");
    } catch (error) {
      setVoterState("has-not-voted");
      console.log("Failed to call vote circuit:" + error);
    }
  };

  const btnValue = () => {
    if (voterState === "is-voting") {
      return "Voting...";
    } else if (voterState === "has-not-voted") {
      return "Vote";
    } else {
      return "Voted";
    }
  };

  return (
    <div className="flex justify-center items-center gap-16">
      {candidateStates.map((candidateState) => (
        <div
          key={candidateState.candidate}
          className="flex justify-center items-center flex-col gap-4"
        >
          <div className="border-2 border-gray-700 w-full h-full py-8 px-12 rounded-xl flex flex-col">
            <h2 className="font-bold">{candidateState.name}</h2>
          </div>
          <div>
            <Button
              onClick={() => handleVote(candidateState.candidate)}
              value={btnValue()}
              disabled={
                voterState === "has-voted" || voterState === "is-voting"
              }
            />
          </div>
          <span className="text-4xl text-gray-200">{candidateState.count}</span>
        </div>
      ))}
    </div>
  );
};

export default Card;
