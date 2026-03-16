import { useMemo, useState } from 'react';
import {
  createInitialBoard,
  getComputerMove,
  getWinner,
  isDraw,
  type Board,
  type PlayerMark,
} from './ticTacToeLogic';

const HUMAN_MARK: PlayerMark = 'X';
const COMPUTER_MARK: PlayerMark = 'O';

export function TicTacToeGame() {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [isComputerThinking, setIsComputerThinking] = useState(false);

  const winner = useMemo(() => getWinner(board), [board]);
  const draw = useMemo(() => isDraw(board), [board]);
  const gameOver = winner !== null || draw;
  const humanTurn = board.filter((cell) => cell !== null).length % 2 === 0;

  const statusText = useMemo(() => {
    if (winner === HUMAN_MARK) {
      return 'You win!';
    }
    if (winner === COMPUTER_MARK) {
      return 'Computer wins!';
    }
    if (draw) {
      return "It's a draw.";
    }
    if (isComputerThinking) {
      return 'Computer is thinking...';
    }
    return 'Your turn';
  }, [draw, isComputerThinking, winner]);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setIsComputerThinking(false);
  };

  const handleComputerTurn = (nextBoard: Board) => {
    const move = getComputerMove(nextBoard, COMPUTER_MARK);
    if (move === null) {
      setIsComputerThinking(false);
      return;
    }

    window.setTimeout(() => {
      setBoard((currentBoard) => {
        if (getWinner(currentBoard) || isDraw(currentBoard) || currentBoard[move] !== null) {
          return currentBoard;
        }
        const updated = [...currentBoard];
        updated[move] = COMPUTER_MARK;
        return updated;
      });
      setIsComputerThinking(false);
    }, 250);
  };

  const handleCellClick = (index: number) => {
    if (gameOver || isComputerThinking || !humanTurn || board[index] !== null) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = HUMAN_MARK;
    setBoard(nextBoard);

    if (getWinner(nextBoard) || isDraw(nextBoard)) {
      return;
    }

    setIsComputerThinking(true);
    handleComputerTurn(nextBoard);
  };

  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm max-w-md">
      <h2 className="text-lg font-semibold text-gray-900">Inbox cleared. Play Tic-Tac-Toe</h2>
      <p className="mt-1 text-sm text-gray-500">You are X, computer is O.</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {board.map((cell, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleCellClick(index)}
            className="h-20 rounded-md border border-gray-300 bg-gray-50 text-3xl font-semibold text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-80"
            disabled={gameOver || isComputerThinking || cell !== null || !humanTurn}
            aria-label={`Cell ${index + 1}${cell ? ` ${cell}` : ''}`}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{statusText}</span>
        <button
          type="button"
          onClick={resetGame}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          New game
        </button>
      </div>
    </div>
  );
}
