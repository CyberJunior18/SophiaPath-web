import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { CustomThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import NavigationPage from './pages/NavigationPage';
import CodeEditorPage from './features/editor/CodeEditorPage';


import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <CssBaseline />
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Editor opens in a full window without nav */}
            <Route path="/editor" element={<CodeEditorPage />} />
            {/* All other routes go through the Navigation layout */}
            <Route path="*" element={<NavigationPage />} />
          </Routes>
        </Router>

      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;