import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const ModernHeader = ({
    title,
    subtitle,
    icon,
    color = '#4f58a5',
    gradient = 'linear-gradient(135deg, #4f58a5 0%, #49a2da 100%)',
    sx = {}
}) => {
    return (
        <Box sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: gradient,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            ...sx
        }}>
            {icon && (
                <Avatar sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 48,
                    height: 48
                }}>
                    {icon}
                </Avatar>
            )}
            <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '1.8rem' }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default ModernHeader;
