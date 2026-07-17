import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Button,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ReceiptLong as TransactionsIcon,
  AccountBalanceWallet as BudgetsIcon,
  Assessment as ReportsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { logout } from '../services/api';

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Transactions', path: '/transactions', icon: <TransactionsIcon /> },
  { label: 'Budgets', path: '/budgets', icon: <BudgetsIcon /> },
  { label: 'Reports', path: '/reports', icon: <ReportsIcon /> },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const username = localStorage.getItem('username') || 'User';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ width: 250, bgcolor: 'background.default', height: '100%', pt: 2 }}>
      <Typography variant="h6" sx={{ px: 2, pb: 2, fontWeight: 800, color: 'primary.main', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        Apex Wealth
      </Typography>
      <List sx={{ mt: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(99, 102, 241, 0.15)',
                  color: 'primary.light',
                  '& .MuiListItemIcon-root': { color: 'primary.light' },
                },
              }}
            >
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Mobile Menu Icon */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Desktop Brand Logo */}
            <Typography
              variant="h5"
              noWrap
              onClick={() => navigate('/')}
              sx={{
                mr: 4,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 800,
                letterSpacing: '-0.03em',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Apex Wealth
            </Typography>

            {/* Mobile Brand Logo */}
            <Typography
              variant="h6"
              noWrap
              onClick={() => navigate('/')}
              sx={{
                flexGrow: 1,
                display: { xs: 'flex', md: 'none' },
                fontWeight: 800,
                letterSpacing: '-0.02em',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Apex Wealth
            </Typography>

            {/* Desktop Navigation Links */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    sx={{
                      color: isActive ? 'primary.light' : 'text.secondary',
                      fontWeight: 600,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      '&:hover': {
                        color: 'primary.light',
                        bgcolor: 'rgba(99, 102, 241, 0.04)',
                        transform: 'none',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>

            {/* User Menu */}
            <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600, color: 'text.secondary' }}>
                Hi, {username}
              </Typography>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 14,
                      width: 36,
                      height: 36,
                      border: '2px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {username.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                PaperProps={{
                  sx: {
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 3,
                    mt: 1,
                    minWidth: 150,
                  },
                }}
              >
                <MenuItem onClick={handleLogout} sx={{ gap: 1, py: 1.5 }}>
                  <LogoutIcon sx={{ fontSize: 18, color: 'error.main' }} />
                  <Typography textAlign="center" fontWeight={600} color="error.main">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer for Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250, border: 'none' },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default Navbar;
