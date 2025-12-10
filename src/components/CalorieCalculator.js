import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Slider, Button } from '@mui/material';

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
        <Card sx={{ backgroundColor: '#2d2d2d', color: 'white', mt: 2 }}>
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

export default CalorieCalculator;