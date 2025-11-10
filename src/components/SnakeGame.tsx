import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 }
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 150;

const SnakeGame = () => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScores, setHighScores] = useState<number[]>([]);

  useEffect(() => {
    const savedScores = localStorage.getItem('snakeHighScores');
    if (savedScores) {
      setHighScores(JSON.parse(savedScores));
    }
  }, []);

  const generateFood = useCallback((): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood());
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  const saveHighScore = useCallback((currentScore: number) => {
    const newScores = [...highScores, currentScore]
      .sort((a, b) => b - a)
      .slice(0, 5);
    setHighScores(newScores);
    localStorage.setItem('snakeHighScores', JSON.stringify(newScores));
  }, [highScores]);

  const checkCollision = useCallback((head: Position): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
  }, [snake]);

  const moveSnake = useCallback(() => {
    if (!isPlaying || gameOver) return;

    const head = { ...snake[0] };

    switch (direction) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }

    if (checkCollision(head)) {
      setGameOver(true);
      setIsPlaying(false);
      saveHighScore(score);
      return;
    }

    const newSnake = [head, ...snake];

    if (head.x === food.x && head.y === food.y) {
      setScore(prev => prev + 10);
      setFood(generateFood());
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, direction, food, isPlaying, gameOver, checkCollision, generateFood, saveHighScore, score]);

  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [moveSnake, isPlaying]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, isPlaying]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-card">
      <div className="w-full max-w-6xl grid lg:grid-cols-[1fr_300px] gap-6">
        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold text-foreground">Змейка</h1>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Счёт</p>
                <p className="text-3xl font-bold text-primary">{score}</p>
              </div>
            </div>

            <div 
              className="relative mx-auto rounded-xl overflow-hidden shadow-2xl"
              style={{
                width: GRID_SIZE * CELL_SIZE,
                height: GRID_SIZE * CELL_SIZE,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
              }}
            >
              {snake.map((segment, index) => (
                <div
                  key={index}
                  className="absolute transition-all duration-75 rounded-sm"
                  style={{
                    left: segment.x * CELL_SIZE,
                    top: segment.y * CELL_SIZE,
                    width: CELL_SIZE - 2,
                    height: CELL_SIZE - 2,
                    background: index === 0 
                      ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                      : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    boxShadow: index === 0 ? '0 0 20px rgba(139, 92, 246, 0.5)' : 'none'
                  }}
                />
              ))}

              <div
                className="absolute rounded-full animate-pulse"
                style={{
                  left: food.x * CELL_SIZE + 2,
                  top: food.y * CELL_SIZE + 2,
                  width: CELL_SIZE - 4,
                  height: CELL_SIZE - 4,
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
                  boxShadow: '0 0 20px rgba(14, 165, 233, 0.8)'
                }}
              />

              {gameOver && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center space-y-4 animate-scale-in">
                    <Icon name="XCircle" size={64} className="text-destructive mx-auto" />
                    <h2 className="text-3xl font-bold text-foreground">Игра окончена</h2>
                    <p className="text-xl text-muted-foreground">Счёт: {score}</p>
                  </div>
                </div>
              )}

              {!isPlaying && !gameOver && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center space-y-4 animate-fade-in">
                    <Icon name="Play" size={64} className="text-primary mx-auto" />
                    <h2 className="text-2xl font-bold text-foreground">Нажмите Start</h2>
                    <p className="text-muted-foreground">Управление: ← → ↑ ↓</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              {!isPlaying ? (
                <Button 
                  onClick={resetGame}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                >
                  <Icon name="Play" className="mr-2" size={20} />
                  {gameOver ? 'Играть снова' : 'Start'}
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsPlaying(false)}
                  size="lg"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <Icon name="Pause" className="mr-2" size={20} />
                  Пауза
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 h-fit">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Icon name="Trophy" className="text-secondary" size={28} />
            Рекорды
          </h2>
          <div className="space-y-3">
            {highScores.length > 0 ? (
              highScores.map((highScore, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-secondary text-secondary-foreground' :
                      index === 1 ? 'bg-primary/70 text-primary-foreground' :
                      index === 2 ? 'bg-primary/40 text-primary-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <span className="text-xl font-semibold text-foreground">{highScore}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Пока нет рекордов
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SnakeGame;
