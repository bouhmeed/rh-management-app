import React from 'react';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

const ModernCard = ({
    title,
    value,
    icon,
    color = '#4f58a5',
    trend,
    children,
    elevation = 3,
    sx = {}
}) => {
    return (
        <Card elevation={elevation} sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid',
            borderColor: 'grey.200',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
            },
            ...sx
        }}>
            <CardContent sx={{ p: 2.5 }}>
                {title && value && icon ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography color="textSecondary" variant="body2" gutterBottom sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                                {title}
                            </Typography>
                            <Typography variant="h4" component="div" fontWeight="bold" sx={{ fontSize: '1.8rem', mb: 0.5 }}>
                                {value}
                            </Typography>
                            {trend && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                                        {trend}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        <Avatar sx={{
                            bgcolor: color,
                            width: 56,
                            height: 56,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}>
                            {icon}
                        </Avatar>
                    </Box>
                ) : (
                    children
                )}
            </CardContent>
        </Card>
    );
};

export default ModernCard;
