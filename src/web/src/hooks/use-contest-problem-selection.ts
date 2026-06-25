"use client";

import { useReducer } from "react";

type ProblemSelectionAction =
  | { type: "toggle"; problemId: number }
  | { type: "set"; problemIds: number[] }
  | { type: "clear" };

function problemSelectionReducer(
  state: number[],
  action: ProblemSelectionAction,
): number[] {
  switch (action.type) {
    case "toggle":
      return state.includes(action.problemId)
        ? state.filter((id) => id !== action.problemId)
        : [...state, action.problemId];
    case "set":
      return action.problemIds;
    case "clear":
      return [];
    default:
      return state;
  }
}

export function useContestProblemSelection(initial: number[] = []) {
  return useReducer(problemSelectionReducer, initial);
}
