import { SSContext } from "../context/Context";

export function CurrentRoundNames() {
  const context = new SSContext();
  const roundNames = context.roundNames;
  return roundNames.map((roundName) => [roundName]);
}
