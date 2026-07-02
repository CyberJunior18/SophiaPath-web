import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { CustomThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import NavigationPage from './pages/NavigationPage';
import CodeEditorPage from './features/editor/CodeEditorPage';
import ScrollToTop from './components/ScrollToTop';
import logoImg from './assets/sp-logo.png';

function SplashWrapper() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFade, setSplashFade] = useState(false);
  const [logoStyle, setLogoStyle] = useState(() => localStorage.getItem('sophiapath_logo_style') || 'split');

  useEffect(() => {
    const handleStyleChange = () => {
      setLogoStyle(localStorage.getItem('sophiapath_logo_style') || 'split');
    };
    window.addEventListener('logo_style_changed', handleStyleChange);
    return () => window.removeEventListener('logo_style_changed', handleStyleChange);
  }, []);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setSplashFade(true);
    }, 2500);

    const removeTimer = setTimeout(() => {
      setSplashVisible(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {splashVisible && (
        <div className={`sp-splash-screen ${splashFade ? 'fade-out' : ''}`}>
          <div className="sp-splash-content-wrapper">
            <div 
              className={`sp-splash-logo-container ${logoStyle === 'gradient' ? 'sp-logo-gradient' : ''}`}
              style={{
                WebkitMaskImage: `url(${logoImg})`,
                maskImage: `url(${logoImg})`,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain'
              }}
            >
              <div className="sp-splash-logo-left" />
              <div className="sp-splash-logo-right" />
            </div>
            <div className="sp-splash-text">SophiaPath</div>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <CssBaseline />
        <SplashWrapper />
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