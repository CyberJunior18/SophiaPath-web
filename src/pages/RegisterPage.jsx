import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  Avatar,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AutoAwesome as AutoAwesomeIcon,
  PhotoCamera as CameraIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const AVATAR_OPTIONS = [
  'https://cdn.wallpapersafari.com/95/19/uFaSYI.jpg',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'
];

const RegisterPage = () => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'Rather Not Say',
  });
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isCustomAvatar, setIsCustomAvatar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Profile picture must be smaller than 2MB.');
      return;
    }

    setAvatarError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedAvatar(e.target.result);
      setIsCustomAvatar(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar(AVATAR_OPTIONS[0]);
    setIsCustomAvatar(false);
    setAvatarError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    if (!formData.age || isNaN(formData.age) || Number(formData.age) <= 0) {
      return setError('Age must be a valid positive number');
    }

    const { confirmPassword, ...registerData } = formData;
    const result = await register({
      ...registerData,
      avatar: selectedAvatar
    });
    
    if (result.success) {
      localStorage.setItem('show_onboarding_tutorial', 'true');
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <Container maxWidth="sm" className="auth-container">
      <Paper className="auth-card glass-panel-strong" elevation={0}>
        <div className="auth-header">
          <div className="auth-logo">
            <AutoAwesomeIcon />
          </div>
          <Typography variant="h4" className="auth-title">
            Create Account
          </Typography>
          <Typography variant="body1" className="auth-subtitle">
            Join SophiaPath and start your learning adventure
          </Typography>
        </div>

        {error && (
          <Alert severity="error" className="auth-alert">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Custom Avatar Upload Zone */}
          <Box className="avatar-upload-section">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            <Box 
              className={`avatar-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <Avatar
                src={selectedAvatar}
                className="avatar-preview"
                sx={{
                  width: '100%',
                  height: '100%'
                }}
              />
              <Box className="avatar-hover-overlay">
                <CameraIcon sx={{ fontSize: 32 }} />
              </Box>
            </Box>

            {avatarError && (
              <Alert severity="warning" className="avatar-error-alert" sx={{ mt: 1, py: 0, px: 2, borderRadius: 2 }}>
                {avatarError}
              </Alert>
            )}
          </Box>

          <TextField
            fullWidth
            label="Full Name"
            name="name"
            variant="outlined"
            margin="normal"
            value={formData.name}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            variant="outlined"
            margin="normal"
            value={formData.email}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            margin="normal"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 1 }}>
            <TextField
              fullWidth
              label="Age"
              name="age"
              type="number"
              variant="outlined"
              value={formData.age}
              onChange={handleChange}
              required
              inputProps={{ min: 1 }}
            />

            <TextField
              fullWidth
              select
              label="Gender"
              name="gender"
              variant="outlined"
              value={formData.gender}
              onChange={handleChange}
              SelectProps={{
                native: true,
              }}
              required
            >
              <option value="Rather Not Say">Rather Not Say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </TextField>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            className="auth-submit-btn"
          >
            Create Account
          </Button>
        </form>

        <div className="auth-footer">
          <Typography variant="body2">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in instead
            </Link>
          </Typography>
        </div>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
