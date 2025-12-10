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
  Delete
} from '@mui/icons-material';

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Обновленный массив таймеров: только 2 таймера
  const [timers, setTimers] = useState([
    { id: 1, time: 0, isRunning: false, title: 'Упражнение', isActive: true }, // Первый таймер - упражнение, активен по умолчанию
    { id: 2, time: 0, isRunning: false, title: 'Отдых', isActive: false }  // Второй таймер - отдых
  ]);
  
  const [workoutSettings, setWorkoutSettings] = useState({
    rounds: 3,
    exerciseTime: 1, // минут
    currentRound: 1,
    totalCompletedRounds: 0,
    isWorkoutActive: false, // Тренировка активна, если хотя бы один таймер запущен
    isPaused: false // Не используется напрямую, но может быть полезно для отслеживания
  });
  
  const [calories, setCalories] = useState(0);
  const [showRestAlert, setShowRestAlert] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState(() => {
    const savedHistory = localStorage.getItem('workoutHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [showHistory, setShowHistory] = useState(false);

  // Эффект для сохранения истории в localStorage
  useEffect(() => {
    localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  // Функция для обновления времени таймера
  const handleTimeUpdate = useCallback((timerId, newTime) => {
    setTimers(prevTimers => 
      prevTimers.map(timer => 
        timer.id === timerId ? { ...timer, time: newTime } : timer
      )
    );
  }, []);

  // Функция для запуска/паузы таймера упражнения (id=1)
  const toggleExerciseTimer = useCallback(() => {
    setTimers(prevTimers => {
      const exerciseTimer = prevTimers.find(t => t.id === 1);
      const newExerciseRunningState = !exerciseTimer.isRunning;

      // Обновляем состояние таймера упражнения
      const updatedTimers = prevTimers.map(timer => 
        timer.id === 1 ? { ...timer, isRunning: newExerciseRunningState } : timer
      );

      // Если запускаем упражнение и отдых активен, останавливаем отдых
      if (newExerciseRunningState && prevTimers.find(t => t.id === 2).isRunning) {
        return updatedTimers.map(timer => 
          timer.id === 2 ? { ...timer, isRunning: false } : timer
        );
      }
      // Если останавливаем упражнение, не делаем ничего с отдыхом, он может быть запущен
      return updatedTimers;
    });

    // Обновляем состояние тренировки
    setWorkoutSettings(prev => {
      const anyRunning = timers.some(t => t.isRunning);
      const newActiveState = timers.some(t => t.id === 1 && t.isRunning);
      return {
        ...prev,
        isWorkoutActive: newActiveState || prev.isWorkoutActive, // Если упражнение запускается
        isPaused: !newActiveState && !timers.some(t => t.id === 2 && t.isRunning) // Пауза, если оба остановлены
      };
    });
  }, [timers]);

  // Функция для запуска/паузы таймера отдыха (id=2) - с логикой паузы упражнения
  const toggleRestTimer = useCallback(() => {
    setTimers(prevTimers => {
      const restTimer = prevTimers.find(t => t.id === 2);
      const newRestRunningState = !restTimer.isRunning;

      // Обновляем состояние таймера отдыха
      const updatedTimers = prevTimers.map(timer => 
        timer.id === 2 ? { ...timer, isRunning: newRestRunningState } : timer
      );

      // Если запускаем отдых, останавливаем упражнение
      if (newRestRunningState) {
        return updatedTimers.map(timer => 
          timer.id === 1 ? { ...timer, isRunning: false } : timer
        );
      }
      // Если останавливаем отдых, не делаем ничего с упражнением, оно может быть запущено
      return updatedTimers;
    });

    // Обновляем состояние тренировки
    setWorkoutSettings(prev => {
      const anyRunning = timers.some(t => t.isRunning);
      const newActiveState = timers.some(t => t.id === 2 && t.isRunning);
      return {
        ...prev,
        isWorkoutActive: newActiveState || prev.isWorkoutActive, // Если отдых запускается
        isPaused: !anyRunning // Пауза, если оба остановлены
      };
    });
  }, [timers]);

  // Функция для сброса таймера упражнения (id=1)
  const resetExerciseTimer = useCallback(() => {
    setTimers(prevTimers => 
      prevTimers.map(timer => 
        timer.id === 1 ? { ...timer, time: 0, isRunning: false } : timer
      )
    );
  }, []);

  // Функция для сброса таймера отдыха (id=2)
  const resetRestTimer = useCallback(() => {
    setTimers(prevTimers => 
      prevTimers.map(timer => 
        timer.id === 2 ? { ...timer, time: 0, isRunning: false } : timer
      )
    );
  }, []);

  // Функция для остановки тренировки и сохранения результата
  const stopWorkout = useCallback(() => {
    setWorkoutSettings(prev => ({ ...prev, isWorkoutActive: false, isPaused: true }));
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

  // Функция для удаления тренировки из истории
  const deleteWorkout = useCallback((id) => {
    setWorkoutHistory(prev => prev.filter(workout => workout.id !== id));
  }, []);

  // Расчет калорий (упрощенная формула)
  useEffect(() => {
    if (workoutSettings.isWorkoutActive) {
      const totalSeconds = timers.reduce((sum, timer) => sum + Math.floor(timer.time / 1000), 0);
      const calculatedCalories = Math.floor((totalSeconds / 60) * 8);
      setCalories(calculatedCalories);
    }
  }, [timers, workoutSettings.isWorkoutActive]);

  // Обработка завершения упражнения
  useEffect(() => {
    if (workoutSettings.isWorkoutActive) { // Проверяем, активна ли тренировка
      const maxTime = workoutSettings.exerciseTime * 60 * 1000; // в миллисекундах (минуты * 60 * 1000)
      const exerciseTimer = timers.find(timer => timer.id === 1);
      
      if (exerciseTimer && exerciseTimer.isRunning && exerciseTimer.time >= maxTime) { // Проверяем, запущен ли и достиг ли лимита
        // Показываем уведомление о переходе к отдыху
        setShowRestAlert(true);
        setTimeout(() => setShowRestAlert(false), 3000); // Скрываем через 3 секунды
        
        // Автоматически запускаем таймер отдыха и останавливаем упражнение
        setTimers(prevTimers => 
          prevTimers.map(timer => 
            timer.id === 2 ? { ...timer, isRunning: true } : 
            timer.id === 1 ? { ...timer, isRunning: false } : timer
          )
        );
      }
    }
  }, [timers, workoutSettings, workoutSettings.isWorkoutActive]);

  const Stopwatch = ({ 
    id, 
    title, 
    time, 
    isRunning, 
    isActive 
  }) => {
    const [localTime, setLocalTime] = useState(time);

    useEffect(() => {
      setLocalTime(time);
    }, [time]);

    useEffect(() => {
      let interval = null;
      if (isRunning) {
        // Исправление: 1 секунда приложения = 2 секундам реального времени
        // Увеличиваем интервал с 10 мс до 20 мс
        // Увеличиваем прирост времени с 10 мс до 20 мс
        interval = setInterval(() => {
          setLocalTime(prevTime => {
            const newTime = prevTime + 20; // Увеличиваем на 20 мс
            handleTimeUpdate(id, newTime);
            return newTime;
          });
        }, 20); // Интервал 20 мс
      } else {
        clearInterval(interval);
      }
      return () => clearInterval(interval);
    }, [isRunning, id, handleTimeUpdate]);

    const formatTime = (time) => {
      const getMilliseconds = `00${Math.floor((time % 1000) / 10)}`.slice(-2);
      const getSeconds = `00${Math.floor((time / 1000) % 60)}`.slice(-2);
      const getMinutes = `00${Math.floor((time / (1000 * 60)) % 60)}`.slice(-2);
      const getHours = `00${Math.floor((time / (1000 * 60 * 60)) % 24)}`.slice(-2);
      return `${getHours}:${getMinutes}:${getSeconds}.${getMilliseconds}`;
    };

    // Определяем, является ли таймер активным (бегущим)
    const isActiveTimer = isRunning;

    return (
      <Card 
        sx={{ 
          minWidth: '100%', 
          m: 0.5, 
          backgroundColor: isActiveTimer ? '#212121' : '#2d2d2d', 
          color: 'white', 
          border: isActiveTimer ? '2px solid #1976d2' : '1px solid #444',
          boxShadow: isActiveTimer ? '0 0 15px rgba(25, 118, 210, 0.5)' : 'none',
          height: '100%',
          borderRadius: 2 
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
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2rem' } 
            }}
          >
            {formatTime(localTime)}
          </Typography>
          
          {/* Условный рендеринг кнопок в зависимости от ID таймера */}
          {id === 1 && (
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button 
                variant="contained" 
                onClick={toggleExerciseTimer}
                sx={{ 
                  flex: 1,
                  backgroundColor: isRunning ? '#f44336' : '#4caf50',
                  '&:hover': {
                    backgroundColor: isRunning ? '#d32f2f' : '#388e3c'
                  },
                  py: { xs: 1.5, sm: 0.5 } 
                }}
              >
                {isRunning ? 'Пауза' : 'Старт'}
              </Button>
              <Button 
                variant="outlined" 
                onClick={resetExerciseTimer}
                sx={{ 
                  flex: 1,
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': {
                    backgroundColor: '#444'
                  },
                  py: { xs: 1.5, sm: 0.5 } 
                }}
              >
                Сброс
              </Button>
            </Box>
          )}
          {/* Кнопки для таймера отдыха */}
          {id === 2 && (
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button 
                variant="contained" 
                onClick={toggleRestTimer}
                sx={{ 
                  flex: 1,
                  backgroundColor: isRunning ? '#f44336' : '#4caf50',
                  '&:hover': {
                    backgroundColor: isRunning ? '#d32f2f' : '#388e3c'
                  },
                  py: { xs: 1.5, sm: 0.5 } 
                }}
              >
                {isRunning ? 'Стоп Отдых' : 'Старт Отдых'}
              </Button>
              <Button 
                variant="outlined" 
                onClick={resetRestTimer}
                sx={{ 
                  flex: 1,
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': {
                    backgroundColor: '#444'
                  },
                  py: { xs: 1.5, sm: 0.5 } 
                }}
              >
                Сброс Отдыха
              </Button>
            </Box>
          )}
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

  // Компонент для отображения графика статистики
  const StatsChart = () => {
    const recentWorkouts = workoutHistory.slice(0, 7).reverse(); 
    
    if (recentWorkouts.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center', color: 'white' }}>
          <Typography>Нет данных для отображения графика</Typography>
        </Box>
      );
    }
    
    const maxCalories = Math.max(...recentWorkouts.map(w => w.calories), 100);

    return (
      <Box sx={{ p: 2, color: 'white' }}>
        <Typography variant="h6" align="center" gutterBottom>
          Статистика за последние 7 тренировок
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 150, mt: 2 }}>
          {recentWorkouts.map((workout, index) => (
            <Box key={workout.id} sx={{ textAlign: 'center', flex: 1, px: 0.5 }}>
              <Box sx={{ 
                height: `${(workout.calories / maxCalories) * 100}%`, 
                backgroundColor: '#1976d2', 
                borderRadius: '4px 4px 0 0',
                mb: 1,
                minHeight: '4px'
              }} />
              <Typography variant="caption" sx={{ color: '#ffffff' }}>
                {workout.calories}
              </Typography>
            </Box>
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          {recentWorkouts.map((workout, index) => (
            <Typography key={workout.id} variant="caption" sx={{ color: '#ffffff', fontSize: '0.7rem' }}>
              {workout.date.split('.')[0]}
            </Typography>
          ))}
        </Box>
      </Box>
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
            <>
              <StatsChart />
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
            </>
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

  // Вычисляем общее время тренировки
  const totalWorkoutTime = timers.reduce((sum, timer) => sum + timer.time, 0) / 1000; // в секундах

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
              borderRadius: 3, 
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
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
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
                  <Typography gutterBottom>Упражнение (мин): {workoutSettings.exerciseTime}</Typography>
                  <Slider
                    value={workoutSettings.exerciseTime}
                    onChange={(e, value) => setWorkoutSettings(prev => ({ ...prev, exerciseTime: value }))}
                    valueLabelDisplay="auto"
                    step={1}
                    min={1}
                    max={10}
                    color="secondary"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography gutterBottom>Общее время тренировки (сек): {totalWorkoutTime.toFixed(1)}</Typography>
                  <Slider
                    value={totalWorkoutTime}
                    valueLabelDisplay="auto"
                    step={0.1}
                    min={0}
                    max={workoutSettings.rounds * workoutSettings.exerciseTime * 60}
                    color="info"
                    disabled
                  />
                </Grid>
              </Grid>
              
              {/* Управление теперь через таймеры */}
              <Box sx={{ 
                mt: 2, 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 1, 
                flexWrap: 'wrap' 
              }}>
                {/* Кнопка "Стоп" для завершения всей тренировки */}
                <Button 
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
                  Стоп Тренировка
                </Button>
              </Box>
              
              {/* Прогресс тренировки */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1">
                    Раунд {workoutSettings.currentRound} из {workoutSettings.rounds}
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
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                  Время упражнения истекло! Начался отдых.
                </Alert>
              )}
            </Box>
            
            {/* Индикатор активного таймера */}
            <Box sx={{ 
              mb: 2, 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 2,
              flexWrap: 'wrap'
            }}>
              {timers.map((timer, index) => (
                <Chip
                  key={timer.id}
                  label={timer.title}
                  icon={<Timer />}
                  color={timer.isRunning ? "primary" : "default"} // Изменено: теперь отражает запущен ли таймер
                  variant={timer.isRunning ? "filled" : "outlined"} // Изменено: теперь отражает запущен ли таймер
                  sx={{ 
                    fontSize: '1rem',
                    fontWeight: timer.isRunning ? 'bold' : 'normal', // Изменено: теперь отражает запущен ли таймер
                    backgroundColor: timer.isRunning ? '#1976d2' : '#444', // Изменено: теперь отражает запущен ли таймер
                    borderColor: timer.isRunning ? '#1976d2' : '#666', // Изменено: теперь отражает запущен ли таймер
                    borderRadius: 16 
                  }}
                />
              ))}
            </Box>
            
            {/* Только 2 таймера */}
            <Grid container spacing={1} justifyContent="center">
              {timers.map((timer) => (
                <Grid item xs={12} md={6} key={timer.id}> 
                  <Stopwatch 
                    id={timer.id}
                    title={timer.title}
                    time={timer.time}
                    isRunning={timer.isRunning}
                    isActive={timer.isActive}
                    onTimeUpdate={handleTimeUpdate}
                  />
                </Grid>
              ))}
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