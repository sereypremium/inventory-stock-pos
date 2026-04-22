import { CssBaseline, ThemeProvider } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import { router } from './router';
import { appTheme } from './theme';

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthProvider>
        <InventoryProvider>
          <RouterProvider router={router} />
        </InventoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
