import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Viewer from './Viewer';
import ControlPanel from './ControlPanel';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        display: 'flex',
        height: '100vh',
        '@media (max-width: 768px)': {
          flexDirection: 'column',
          height: '100vh'
        }
      }}>
        <Box sx={{
          flex: 1,
          '@media (max-width: 768px)': {
            height: '60vh',
            minHeight: '350px'
          }
        }}>
          <Viewer />
        </Box>
        <Box sx={{
          width: 320,
          '@media (max-width: 768px)': {
            width: '100%',
            height: '40vh',
            overflowY: 'auto',
            minHeight: '250px'
          }
        }}>
          <ControlPanel />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
