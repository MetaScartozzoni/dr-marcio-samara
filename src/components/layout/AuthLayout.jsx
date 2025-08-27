// src/components/layout/AuthLayout.jsx
import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
} from '@mui/material';
import { MedicalServices as MedicalIcon } from '@mui/icons-material';

const AuthLayout = ({ children, title }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Avatar
            sx={{
              m: 1,
              bgcolor: 'primary.main',
              width: 56,
              height: 56,
            }}
          >
            <MedicalIcon fontSize="large" />
          </Avatar>
          <Typography
            component="h1"
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 'bold', color: 'primary.main' }}
          >
            Portal Dr. Márcio
          </Typography>
          {title && (
            <Typography
              component="h2"
              variant="h5"
              align="center"
              sx={{ mb: 3, color: 'text.secondary' }}
            >
              {title}
            </Typography>
          )}
          {children}
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
