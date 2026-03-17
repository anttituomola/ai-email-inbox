import { useState } from 'react';
import {
  createInitialBoard,
  getComputerMove,
  getWinner,
  isDraw,
  type Board,
  type PlayerMark,
} from './games/ticTacToeLogic';

const HUMAN_MARK: PlayerMark = 'X';
const COMPUTER_MARK: PlayerMark = 'O';

export function TicTacToe() {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [isComputerThinking, setIsComputerThinking] = useState(false);

  const winner = getWinner(board);
  const draw = isDraw(board);
  const gameOver = winner !== null || draw;
  const humanTurn = board.filter((cell) => cell !== null).length % 2 === 0;

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
    }, 400);
  };

  const handleClick = (i: number) => {
    if (board[i] || gameOver || isComputerThinking || !humanTurn) return;
    
    const newBoard = [...board];
    newBoard[i] = HUMAN_MARK;
    setBoard(newBoard);
    
    if (getWinner(newBoard) || isDraw(newBoard)) {
      return;
    }

    setIsComputerThinking(true);
    handleComputerTurn(newBoard);
  };

  const reset = () => {
    setBoard(createInitialBoard());
    setIsComputerThinking(false);
  };

  const statusText = winner === HUMAN_MARK 
    ? 'You win!' 
    : winner === COMPUTER_MARK 
      ? 'Computer wins!' 
      : draw 
        ? "It's a draw!" 
        : isComputerThinking 
          ? 'Computer is thinking...' 
          : 'Your turn';

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl shadow-sm border border-gray-300 animate-pop-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Inbox Zero!</h2>
        <p className="text-gray-500">You've cleared all your emails. Treat yourself to a quick game.</p>
      </div>

      <div className="mb-6 text-sm font-medium text-gray-700 h-5">
        {statusText}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-8">
        {board.map((square, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={gameOver || isComputerThinking || square !== null || !humanTurn}
            className="w-20 h-20 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg text-3xl font-bold flex items-center justify-center transition-colors text-blue-600 disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {square}
          </button>
        ))}
      </div>

      <button
        onClick={reset}
        className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
      >
        Restart Game
      </button>
    </div>
  );
}
