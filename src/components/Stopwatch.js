import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box, Badge } from '@mui/material';

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
            interval = setInterval(() => {
                setLocalTime(prevTime => {
                    const newTime = prevTime + 10;
                    onTimeUpdate(id, newTime);
                    return newTime;
                });
            }, 10);
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
                minWidth: 275, 
                m: 1, 
                backgroundColor: isActiveTimer ? '#212121' : '#2d2d2d', 
                color: 'white', 
                border: isActiveTimer ? '2px solid #1976d2' : '1px solid #444',
                boxShadow: isActiveTimer ? '0 0 15px rgba(25, 118, 210, 0.5)' : 'none'
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Badge 
                        color="primary" 
                        variant="dot" 
                        invisible={!isActiveTimer}
                        sx={{ mr: 1 }}
                    >
                        <Typography variant="h6" gutterBottom>
                            {title}
                        </Typography>
                    </Badge>
                    {isActiveTimer && (
                        <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                            АКТИВЕН
                        </Typography>
                    )}
                </Box>
                
                <Typography variant="h4" component="div" sx={{ fontFamily: 'monospace', mb: 2 }}>
                    {formatTime(localTime)}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                        variant="contained" 
                        onClick={onToggle}
                        sx={{ 
                            flex: 1,
                            backgroundColor: isRunning ? '#f44336' : '#4caf50',
                            '&:hover': {
                                backgroundColor: isRunning ? '#d32f2f' : '#388e3c'
                            }
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
                            }
                        }}
                    >
                        Сброс
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default Stopwatch;