import React from 'react';
import { Fab, Box } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import useStore from './store';

function MobileScaleControls() {
  const { increaseScale, decreaseScale, selectedElement } = useStore();

  if (!selectedElement) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 2,
        zIndex: 1000,
        '@media (min-width: 769px)': {
          display: 'none'
        }
      }}
    >
      <Fab
        color="primary"
        size="large"
        onClick={decreaseScale}
        sx={{
          width: 64,
          height: 64,
          fontSize: '2rem',
          transition: 'transform 0.2s ease-in-out',
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        <Remove fontSize="large" />
      </Fab>
      <Fab
        color="primary"
        size="large"
        onClick={increaseScale}
        sx={{
          width: 64,
          height: 64,
          fontSize: '2rem',
          transition: 'transform 0.2s ease-in-out',
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        <Add fontSize="large" />
      </Fab>
    </Box>
  );
}

export default MobileScaleControls;
