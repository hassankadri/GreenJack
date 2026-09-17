import { randomInt } from "node:crypto";

const MIN_NUMBER = 1;
const MAX_NUMBER = 45;
const TICKET_SIZE = 5;

function sortNumbers(numbers: number[]) {
  return [...numbers].sort((a, b) => a - b);
}

export function generateRandomNumbers(
  count = TICKET_SIZE,
): number[] {
  const numbers = new Set<number>();

  while (numbers.size < count) {
    numbers.add(randomInt(MIN_NUMBER, MAX_NUMBER + 1));
  }

  return sortNumbers([...numbers]);
}

export function buildTicketFromScores(scores: number[]): number[] {
  const ticket: number[] = [];
  const used = new Set<number>();

  for (const rawScore of scores.slice(0, TICKET_SIZE)) {
    let number = Math.min(
      Math.max(Math.round(rawScore), MIN_NUMBER),
      MAX_NUMBER,
    );

    while (used.has(number)) {
      number =
        number === MAX_NUMBER ? MIN_NUMBER : number + 1;
    }

    used.add(number);
    ticket.push(number);
  }

  return sortNumbers(ticket);
}

export function generateWeightedNumbers(
  scores: number[],
  count = TICKET_SIZE,
): number[] {
  const frequency = new Map<number, number>();

  for (let number = MIN_NUMBER; number <= MAX_NUMBER; number++) {
    frequency.set(number, 0);
  }

  for (const score of scores) {
    if (score >= MIN_NUMBER && score <= MAX_NUMBER) {
      frequency.set(score, (frequency.get(score) ?? 0) + 1);
    }
  }

  const selected: number[] = [];

  while (selected.length < count) {
    const candidates = Array.from(frequency.entries()).filter(
      ([number]) => !selected.includes(number),
    );

    const totalWeight = candidates.reduce(
      (total, [, occurrences]) => total + occurrences + 1,
      0,
    );

    let pick = randomInt(1, totalWeight + 1);

    for (const [number, occurrences] of candidates) {
      pick -= occurrences + 1;

      if (pick <= 0) {
        selected.push(number);
        break;
      }
    }
  }

  return sortNumbers(selected);
}

export function countMatches(
  ticket: number[],
  winningNumbers: number[],
): number {
  const winningSet = new Set(winningNumbers);

  return ticket.filter((number) => winningSet.has(number)).length;
}