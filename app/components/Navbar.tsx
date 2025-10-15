'use client';
import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

// Helper function to create a colored avatar from a name
function stringToColor(string: string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

function stringAvatar(name: string) {
  const nameParts = name.split(' ');
  const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase() : name[0].toUpperCase();
  return {
    sx: {
      bgcolor: stringToColor(name),
      width: 32,
      height: 32,
      fontSize: '0.8rem'
    },
    children: initials,
  };
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // State to ensure component only renders on the client side
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    router.push('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} href={isClient && user ? "/dashboard" : "/"} sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
          KPI Tracker
        </Typography>
        
        {/* Render buttons only on the client to avoid hydration mismatch */}
        {isClient && (
          <>
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button color="inherit" component={Link} href="/dashboard">Dashboard</Button>
                <Button color="inherit" component={Link} href="/dashboard/progress">Progress</Button>
                
                {user.role === 'ADMIN' && (
                  <>
                    <Button color="inherit" component={Link} href="/dashboard/goals">Goals</Button>
                    <Button color="inherit" component={Link} href="/dashboard/users">Users</Button>
                  </>
                )}

                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                  sx={{ ml: 1 }}
                >
                  <Avatar {...stringAvatar(user.name)} />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem disabled>
                    <Typography variant="body2" noWrap>
                      Signed in as <strong>{user.name}</strong>
                    </Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button color="inherit" component={Link} href="/login">Login</Button>
            )}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}