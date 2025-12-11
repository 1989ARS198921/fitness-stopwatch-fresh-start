// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Slider, 
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  Replay, 
  Stop,
  SkipNext,
  LocalFireDepartment,
  Timer,
  History,
  Close,
  Save,
  Delete
} from '@mui/icons-material';

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Обновляем массив таймеров: теперь только 1 таймер - упражнение
  const [timers, setTimers] = useState([
    { id: 1, time: 0, isRunning: false, title: 'Упражнение', isActive: true }
    // Удалили таймер отдыха (id: 2)
  ]);
  
  const [workoutSettings, setWorkoutSettings] = useState({
    rounds: 3,
    exerciseTime: 45, // секунды
    restTime: 15, // секунды
    currentRound: 1,
    currentPhase: 'exercise', // 'exercise' или 'rest'
    totalCompletedRounds: 0,
    isWorkoutActive: false,
    isPaused: false // Добавляем состояние паузы
  });
  
  const [calories, setCalories] = useState(0);
  const [showRestAlert, setShowRestAlert] = useState(false);
  
  // Состояние для истории тренировок
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Функция для обновления времени таймера
  const handleTimeUpdate = useCallback((timerId, newTime) => {
    setTimers(prevTimers => 
      prevTimers.map(timer => 
        timer.id === timerId ? { ...timer, time: newTime } : timer
      )
    );
  }, []);

  // Функция для запуска/паузы таймера упражнения
  const toggleExerciseTimer = useCallback(() => {
    setTimers(prevTimers => 
      prevTimers.map(timer => 
        timer.id === 1 ? { ...timer, isRunning: !timer.isRunning } : timer // Только таймер упражнения
      )
    );
    
    // Обновляем состояние паузы тренировки
    setWorkoutSettings(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  }, []);

  // Функция для сброса таймера упражнения
  const resetExerciseTimer = useCallback(() => {
    setTimers(prevTimers => 
      prevTimers.map(timer => 
        timer.id === 1 ? { ...timer, time: 0, isRunning: false, isActive: false } : timer
      )
    );
  }, []);

  // Функция для сброса всех таймеров
  const resetAllTimers = useCallback(() => {
    setTimers(prevTimers => 
      prevTimers.map(timer => ({ ...timer, time: 0, isRunning: false, isActive: false }))
    );
    setWorkoutSettings(prev => ({ 
      ...prev, 
      currentRound: 1, 
      currentPhase: 'exercise',
      totalCompletedRounds: 0,
      isWorkoutActive: false,
      isPaused: false
    }));
    setCalories(0);
    setShowRestAlert(false);
  }, []);

  // Функция для запуска тренировки
  const startWorkout = useCallback(() => {
    setWorkoutSettings(prev => ({ ...prev, isWorkoutActive: true, isPaused: false }));
    setTimers(prevTimers => 
      prevTimers.map((timer, index) => ({ 
        ...timer, 
        isRunning: true,
        isActive: index === 0  // Активный таймер - первый (упражнение)
      }))
    );
  }, []);

  // Функция для остановки тренировки
  const stopWorkout = useCallback(() => {
    setWorkoutSettings(prev => ({ ...prev, isWorkoutActive: false, isPaused: false }));
    setTimers(prevTimers => 
      prevTimers.map(timer => ({ ...timer, isRunning: false }))
    );
    
    // Сохраняем результат тренировки в историю
    const workoutResult = {
      id: Date.now(),
      date: new Date().toLocaleDateString('ru-RU'),
      time: new Date().toLocaleTimeString('ru-RU'),
      rounds: workoutSettings.totalCompletedRounds,
      calories: calories,
      totalWorkoutTime: timers.reduce((sum, timer) => sum + timer.time, 0) / 1000, // в секундах
      timers: [...timers]
    };
    
    setWorkoutHistory(prev => [workoutResult, ...prev]);
  }, [calories, timers, workoutSettings.totalCompletedRounds]);

  // Переключение активного таймера (теперь только один таймер, но оставим на будущее)
  const switchToNextTimer = useCallback(() => {
    setTimers(prevTimers => {
      const activeIndex = prevTimers.findIndex(t => t.isActive);
      const nextIndex = (activeIndex + 1) % prevTimers.length;
      
      return prevTimers.map((timer, index) => ({
        ...timer,
        isActive: index === nextIndex
      }));
    });
    
    // Увеличиваем количество выполненных кругов
    setWorkoutSettings(prev => ({
      ...prev,
      totalCompletedRounds: prev.totalCompletedRounds + 1
    }));
  }, []);

  // Функция для перехода к следующему раунду
  const nextRound = useCallback(() => {
    setWorkoutSettings(prev => {
      let newRound = prev.currentRound;
      let newPhase = prev.currentPhase;
      
      if (prev.currentPhase === 'exercise') {
        newPhase = 'rest';
      } else {
        newRound = Math.min(prev.currentRound + 1, prev.rounds);
        newPhase = 'exercise';
      }
      
      return {
        ...prev,
        currentRound: newRound,
        currentPhase: newPhase
      };
    });
    
    // Сбрасываем таймеры при переходе к отдыху
    if (workoutSettings.currentPhase === 'exercise') {
      setTimers(prevTimers => 
        prevTimers.map(timer => ({ ...timer, time: 0 }))
      );
    }
  }, [workoutSettings.currentPhase]);

  // Расчет калорий (упрощенная формула)
  useEffect(() => {
    if (workoutSettings.isWorkoutActive) {
      const totalSeconds = timers.reduce((sum, timer) => sum + Math.floor(timer.time / 1000), 0);
      // Примерная формула: 8 калорий в минуту для умеренной активности
      const calculatedCalories = Math.floor((totalSeconds / 60) * 8);
      setCalories(calculatedCalories);
    }
  }, [timers, workoutSettings.isWorkoutActive]);

  // Обработка завершения упражнения
  useEffect(() => {
    if (workoutSettings.isWorkoutActive && !workoutSettings.isPaused && workoutSettings.currentPhase === 'exercise') {
      const maxTime = workoutSettings.exerciseTime * 1000; // в миллисекундах
      const activeTimer = timers.find(timer => timer.isActive);
      
      if (activeTimer && activeTimer.time >= maxTime) {
        switchToNextTimer();
      }
    }
  }, [timers, workoutSettings, switchToNextTimer]);

  // Компонент секундомера
  const Stopwatch = ({ 
    id, 
    title, 
    time, 
    isRunning, 
    onTimeUpdate, 
    onToggle, 
    onReset, 
    isActive, 
    isActiveTimer 
  }) => {
    const [localTime, setLocalTime] = useState(time);

    useEffect(() => {
      setLocalTime(time);
    }, [time]);

    useEffect(() => {
      let interval = null;
      if (isRunning && isActive) {
        // Ускоряем таймер на 30%
        // Было: интервал 10мс, прирост 10мс (1 реальная секунда = 1 приложенная секунда)
        // Стало: интервал ~7.7мс, прирост ~13мс (1 реальная секунда = 1.3 приложенной секунды)
        interval = setInterval(() => {
          setLocalTime(prevTime => {
            // Увеличиваем на ~13 мс (10 * 1.3)
            const newTime = prevTime + 13;
            onTimeUpdate(id, newTime);
            return newTime;
          });
        }, 7.7); // Интервал ~7.7 мс (10 / 1.3)
      } else {
        clearInterval(interval);
      }
      return () => clearInterval(interval);
    }, [isRunning, isActive, id, onTimeUpdate]);

    const formatTime = (time) => {
      const getMilliseconds = `00${Math.floor((time % 1000) / 10)}`.slice(-2);
      const getSeconds = `00${Math.floor((time / 1000) % 60)}`.slice(-2);
      const getMinutes = `00${Math.floor((time / (1000 * 60)) % 60)}`.slice(-2);
      const getHours = `00${Math.floor((time / (1000 * 60 * 60)) % 24)}`.slice(-2);
      return `${getHours}:${getMinutes}:${getSeconds}.${getMilliseconds}`;
    };

    return (
      <Card 
        sx={{ 
          minWidth: '100%', // На всю ширину
          m: 1, 
          backgroundColor: isActiveTimer ? '#212121' : '#2d2d2d', 
          color: 'white', 
          border: isActiveTimer ? '2px solid #1976d2' : '1px solid #444',
          boxShadow: isActiveTimer ? '0 0 15px rgba(25, 118, 210, 0.5)' : 'none',
          height: '100%',
          borderRadius: 2 // Закругленные углы для секундомеров
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Timer sx={{ mr: 1, color: isActiveTimer ? '#1976d2' : 'inherit' }} />
              <Typography variant="h6" gutterBottom>
                {title}
              </Typography>
            </Box>
            {isActiveTimer && (
              <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                АКТИВЕН
              </Typography>
            )}
          </Box>
          
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ 
              fontFamily: 'monospace', 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '2rem' } // Адаптивный размер шрифта
            }}
          >
            {formatTime(localTime)}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button 
              variant="contained" 
              onClick={onToggle}
              sx={{ 
                flex: 1,
                backgroundColor: isRunning ? '#f44336' : '#4caf50',
                '&:hover': {
                  backgroundColor: isRunning ? '#d32f2f' : '#388e3c'
                },
                py: { xs: 1.5, sm: 0.5 } // Больше вертикальный паддинг на мобильных
              }}
            >
              {isRunning ? 'Пауза' : 'Старт'}
            </Button>
            <Button 
              variant="outlined" 
              onClick={onReset}
              sx={{ 
                flex: 1,
                color: 'white', 
                borderColor: 'white',
                '&:hover': {
                  backgroundColor: '#444'
                },
                py: { xs: 1.5, sm: 0.5 } // Больше вертикальный паддинг на мобильных
              }}
            >
              Сброс
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const CalorieCalculator = () => {
    const [formData, setFormData] = useState({
      weight: 70, // кг
      duration: 30, // минут
      intensity: 50 // %
    });
    
    const [calories, setCalories] = useState(0);

    const calculateCalories = () => {
      // Упрощенная формула расчета калорий: (вес * длительность * интенсивность) / 100
      const calculated = Math.round((formData.weight * formData.duration * (formData.intensity / 100)) * 0.8);
      setCalories(calculated);
    };

    const handleInputChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    return (
      <Card sx={{ backgroundColor: '#2d2d2d', color: 'white', mt: 2, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Калькулятор калорий
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Вес (кг): {formData.weight}</Typography>
            <Slider
              value={formData.weight}
              onChange={(e, value) => handleInputChange('weight', value)}
              valueLabelDisplay="auto"
              step={1}
              min={40}
              max={150}
              color="primary"
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Длительность (мин): {formData.duration}</Typography>
            <Slider
              value={formData.duration}
              onChange={(e, value) => handleInputChange('duration', value)}
              valueLabelDisplay="auto"
              step={5}
              min={5}
              max={180}
              color="secondary"
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Интенсивность (%): {formData.intensity}</Typography>
            <Slider
              value={formData.intensity}
              onChange={(e, value) => handleInputChange('intensity', value)}
              valueLabelDisplay="auto"
              step={5}
              min={10}
              max={100}
              color="success"
            />
          </Box>
          
          <Button 
            variant="contained" 
            onClick={calculateCalories}
            sx={{ mb: 2, backgroundColor: '#2196f3', '&:hover': { backgroundColor: '#0b7dda' } }}
          >
            Рассчитать калории
          </Button>
          
          <Box sx={{ p: 2, backgroundColor: '#333', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="h6">
              Сожжено калорий: {calories}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Компонент для отображения истории тренировок
  const HistoryDialog = () => {
    return (
      <Dialog 
        open={showHistory} 
        onClose={() => setShowHistory(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#1e1e1e', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">История тренировок</Typography>
          <IconButton onClick={() => setShowHistory(false)}>
            <Close sx={{ color: 'white' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#1e1e1e', color: 'white', p: 2 }}>
          {workoutHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography sx={{ color: 'white' }}>
                Нет данных о тренировках
              </Typography>
            </Box>
          ) : (
            <List>
              {workoutHistory.map((workout, index) => (
                <React.Fragment key={workout.id}>
                  <ListItem 
                    alignItems="flex-start" 
                    sx={{ 
                      backgroundColor: index % 2 === 0 ? '#2d2d2d' : '#333', 
                      borderRadius: 1, 
                      mb: 1,
                      color: 'white'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ color: 'white' }}>
                          Тренировка от {workout.date} {workout.time}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" sx={{ color: 'text.primary' }}>
                            Выполнено кругов: {workout.rounds}, Калорий: {workout.calories}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" sx={{ color: 'text.primary' }}>
                            Общее время: {(workout.totalWorkoutTime / 60).toFixed(1)} мин
                          </Typography>
                        </>
                      }
                    />
                    <IconButton 
                      edge="end" 
                      aria-label="удалить" 
                      onClick={() => deleteWorkout(workout.id)}
                      sx={{ color: 'white' }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#1e1e1e' }}>
          <Button onClick={() => setWorkoutHistory([])} sx={{ color: 'white' }}>
            Очистить историю
          </Button>
          <Button onClick={() => setShowHistory(false)} sx={{ color: 'white' }}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Тройной Секундомер для Фитнеса</h1>
      </header>
      <main>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', pb: 8 }}>
          <Paper 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              backgroundColor: '#1e1e1e', 
              color: 'white', 
              borderRadius: 3, // Закругленные углы для основной рамки
              width: '100%',
              maxWidth: 1200
            }}
          >
            <Typography 
              variant="h4" 
              align="center" 
              gutterBottom
              sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
            >
              Тройной Секундомер для Фитнеса
            </Typography>
            
            <Box sx={{ mb: 3, p: { xs: 1, sm: 2 }, backgroundColor: '#2d2d2d', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Настройки тренировки
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography gutterBottom>Кругов: {workoutSettings.rounds}</Typography>
                  <Slider
                    value={workoutSettings.rounds}
                    onChange={(e, value) => setWorkoutSettings(prev => ({ ...prev, rounds: value }))}
                    valueLabelDisplay="auto"
                    step={1}
                    min={1}
                    max={10}
                    color="primary"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography gutterBottom>Упражнение (сек): {workoutSettings.exerciseTime}</Typography>
                  <Slider
                    value={workoutSettings.exerciseTime}
                    onChange={(e, value) => setWorkoutSettings(prev => ({ ...prev, exerciseTime: value }))}
                    valueLabelDisplay="auto"
                    step={5}
                    min={10}
                    max={120}
                    color="secondary"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography gutterBottom>Отдых (сек): {workoutSettings.restTime}</Typography>
                  <Slider
                    value={workoutSettings.restTime}
                    onChange={(e, value) => setWorkoutSettings(prev => ({ ...prev, restTime: value }))}
                    valueLabelDisplay="auto"
                    step={5}
                    min={5}
                    max={60}
                    color="info"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ 
                mt: 2, 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 1, 
                flexWrap: 'wrap' 
              }}>
                {!workoutSettings.isWorkoutActive ? (
                  <Button 
                    variant="contained" 
                    startIcon={<PlayArrow />}
                    onClick={startWorkout}
                    sx={{ 
                      backgroundColor: '#4caf50', 
                      '&:hover': { backgroundColor: '#388e3c' },
                      m: 0.5,
                      minWidth: { xs: 120, sm: 'auto' }
                    }}
                  >
                    Начать
                  </Button>
                ) : (
                  <>
                    {workoutSettings.isPaused ? (
                      <Button 
                        variant="contained" 
                        startIcon={<PlayArrow />}
                        onClick={toggleExerciseTimer}
                        sx={{ 
                          backgroundColor: '#2196f3', 
                          '&:hover': { backgroundColor: '#0b7dda' },
                          m: 0.5,
                          minWidth: { xs: 120, sm: 'auto' }
                        }}
                      >
                        Продолжить
                      </Button>
                    ) : (
                      <Button 
                        variant="contained" 
                        startIcon={<Pause />}
                        onClick={toggleExerciseTimer}
                        sx={{ 
                          backgroundColor: '#ff9800', 
                          '&:hover': { backgroundColor: '#f57c00' },
                          m: 0.5,
                          minWidth: { xs: 120, sm: 'auto' }
                        }}
                      >
                        Пауза
                      </Button>
                    )}
                    
                    <Button 
                      variant="contained" 
                      startIcon={<SkipNext />}
                      onClick={nextRound}
                      sx={{ 
                        backgroundColor: '#9c27b0', 
                        '&:hover': { backgroundColor: '#7b1fa2' },
                        m: 0.5,
                        minWidth: { xs: 120, sm: 'auto' }
                      }}
                    >
                      След. этап
                    </Button>
                    
                    {/* Убираем кнопку "Стоп" */}
                    {/* <Button 
                      variant="contained" 
                      startIcon={<Stop />}
                      onClick={stopWorkout}
                      sx={{ 
                        backgroundColor: '#f44336', 
                        '&:hover': { backgroundColor: '#d32f2f' },
                        m: 0.5,
                        minWidth: { xs: 120, sm: 'auto' }
                      }}
                    >
                      Стоп
                    </Button> */}
                  </>
                )}
                
                <Button 
                  variant="outlined" 
                  startIcon={<Replay />}
                  onClick={resetAllTimers}
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white', 
                    '&:hover': { backgroundColor: '#444' },
                    m: 0.5,
                    minWidth: { xs: 120, sm: 'auto' }
                  }}
                >
                  Сброс
                </Button>
                
                {/* Добавляем кнопку "Сохранить тренировку" */}
                <Button 
                  variant="contained" 
                  startIcon={<Save />}
                  onClick={stopWorkout} // Используем stopWorkout для сохранения
                  sx={{ 
                    backgroundColor: '#2196f3', 
                    '&:hover': { backgroundColor: '#0b7dda' },
                    m: 0.5,
                    minWidth: { xs: 120, sm: 'auto' }
                  }}
                >
                  Сохранить
                </Button>
              </Box>
              
              {/* Прогресс тренировки */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1">
                    Раунд {workoutSettings.currentRound} из {workoutSettings.rounds}
                  </Typography>
                  <Typography variant="subtitle1">
                    {workoutSettings.currentPhase === 'exercise' ? 'Упражнение' : 'Отдых'}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(workoutSettings.currentRound / workoutSettings.rounds) * 100} 
                  sx={{ height: 10, borderRadius: 5, backgroundColor: '#444' }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption">Выполнено: {workoutSettings.totalCompletedRounds} кругов</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalFireDepartment sx={{ fontSize: 16, color: '#ff9800' }} />
                    <Typography variant="caption">Калории: {calories}</Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Уведомление о переходе к отдыху */}
              {showRestAlert && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Переход к отдыху! Все таймеры сброшены.
                </Alert>
              )}
            </Box>
            
            {/* Индикатор активного таймера */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              {timers.map((timer) => (
                <Chip
                  key={timer.id}
                  label={timer.title}
                  icon={<Timer />}
                  color={timer.isActive ? "primary" : "default"}
                  variant={timer.isActive ? "filled" : "outlined"}
                  sx={{ 
                    fontSize: '1rem',
                    fontWeight: timer.isActive ? 'bold' : 'normal',
                    backgroundColor: timer.isActive ? '#1976d2' : '#444',
                    borderColor: timer.isActive ? '#1976d2' : '#666',
                    borderRadius: 16 // Закругленные углы для чипов
                  }}
                />
              ))}
            </Box>
            
            {/* Отображаем только один таймер - упражнение, на всю ширину */}
            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={12}> {/* xs={12} означает на всю ширину */}
                <Stopwatch 
                  id={timers[0].id} // Берем первый (и единственный) таймер
                  title={timers[0].title}
                  time={timers[0].time}
                  isRunning={timers[0].isRunning}
                  onTimeUpdate={handleTimeUpdate}
                  onToggle={toggleExerciseTimer}
                  onReset={resetExerciseTimer}
                  isActive={workoutSettings.isWorkoutActive && !workoutSettings.isPaused}
                  isActiveTimer={timers[0].isActive}
                />
              </Grid>
            </Grid>
            
            {/* Калькулятор калорий */}
            <CalorieCalculator />
          </Paper>
        </Container>
        
        {/* Плавающая кнопка для просмотра истории */}
        <Fab
          color="primary"
          aria-label="История тренировок"
          onClick={() => setShowHistory(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0'
            }
          }}
        >
          <History />
        </Fab>
        
        {/* Диалог истории тренировок */}
        <HistoryDialog />
      </main>
    </div>
  );
}

export default App;