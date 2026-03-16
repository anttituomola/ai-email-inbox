export type PlayerMark = 'X' | 'O';
export type BoardCell = PlayerMark | null;
export type Board = BoardCell[];

const WINNING_LINES: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createInitialBoard(): Board {
  return Array.from({ length: 9 }, () => null);
}

export function getWinner(board: Board): PlayerMark | null {
  for (const [a, b, c] of WINNING_LINES) {
    const cell = board[a];
    if (cell && cell === board[b] && cell === board[c]) {
      return cell;
    }
  }
  return null;
}

export function isDraw(board: Board): boolean {
  return board.every((cell) => cell !== null) && getWinner(board) === null;
}

export function getAvailableMoves(board: Board): number[] {
  return board.reduce<number[]>((moves, cell, index) => {
    if (cell === null) {
      moves.push(index);
    }
    return moves;
  }, []);
}

export function getComputerMove(board: Board, computerMark: PlayerMark): number | null {
  const humanMark: PlayerMark = computerMark === 'X' ? 'O' : 'X';
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) {
    return null;
  }

  // 1) Win if possible.
  for (const move of availableMoves) {
    const nextBoard = [...board];
    nextBoard[move] = computerMark;
    if (getWinner(nextBoard) === computerMark) {
      return move;
    }
  }

  // 2) Block immediate human win.
  for (const move of availableMoves) {
    const nextBoard = [...board];
    nextBoard[move] = humanMark;
    if (getWinner(nextBoard) === humanMark) {
      return move;
    }
  }

  // 3) Take center.
  if (board[4] === null) {
    return 4;
  }

  // 4) Take a random corner, then any remaining cell.
  const corners = [0, 2, 6, 8].filter((index) => board[index] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}
