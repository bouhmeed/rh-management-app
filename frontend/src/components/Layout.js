// frontend/src/components/Layout.js
import React, { useState } from 'react';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
    Badge
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard,
    People,
    EventNote,
    Assessment,
    Settings,
    ExitToApp,
    Notifications,
    Business,
    AttachMoney
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const Layout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const { user, logout, isAdmin, isManagerRH, isManager } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Check if a menu item is active
    const isActive = (path) => {
        if (path === location.pathname) return true;
        // Handle sub-routes (e.g., /contrats/:id should highlight /contrats)
        if (location.pathname.startsWith(path + '/')) return true;
        return false;
    };

    // Menu items for employees only
    const employeeMenuItems = [
        { text: 'Tableau de bord', icon: <Dashboard />, path: '/dashboard' },
        { text: 'Congés', icon: <EventNote />, path: '/conges' },
        { text: 'Présences', icon: <EventNote />, path: '/presences' },
        { text: 'Contrats', icon: <Business />, path: '/contrats' },
        { text: 'Paie', icon: <AttachMoney />, path: '/paies' }
    ];

    // Menu items for admin/manager (full access)
    const adminMenuItems = [
        { text: 'Tableau de bord', icon: <Dashboard />, path: '/dashboard' },
        { text: 'Employés', icon: <People />, path: '/employes' },
        { text: 'Départements', icon: <Business />, path: '/departements' },
        { text: 'Congés', icon: <EventNote />, path: '/conges' },
        { text: 'Présences', icon: <EventNote />, path: '/presences' },
        { text: 'Contrats', icon: <Business />, path: '/contrats' },
        { text: 'Paie', icon: <AttachMoney />, path: '/paies' }
    ];

    // Determine which menu items to show based on user role
    const menuItems = isAdmin || isManagerRH || isManager ? adminMenuItems : employeeMenuItems;

    const drawer = (
        <Box>
            <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                    RH Management
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => {
                            navigate(item.path);
                            setMobileOpen(false);
                        }}
                        sx={{
                            borderRadius: 1,
                            mx: 1,
                            mb: 0.5,
                            backgroundColor: isActive(item.path) ? 'primary.main' : 'transparent',
                            color: isActive(item.path) ? 'white' : 'inherit',
                            '&:hover': {
                                backgroundColor: isActive(item.path) ? 'primary.dark' : 'primary.light',
                                color: isActive(item.path) ? 'white' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: isActive(item.path) ? 'white' : 'primary.main'
                                }
                            },
                            '& .MuiListItemIcon-root': {
                                color: isActive(item.path) ? 'white' : 'inherit'
                            },
                            '& .MuiTypography-root': {
                                fontWeight: isActive(item.path) ? 600 : 400
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
            
            {/* Footer with user info */}
            <Box sx={{ mt: 'auto', p: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Connecté en tant que:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {user?.email}
                    </Typography>
                    <Typography variant="body2" color="primary">
                        {user?.role?.nomRole || 'Employé'}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: 1
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    
                    <Box sx={{ flexGrow: 1 }} />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton color="inherit" sx={{ mr: 1 }}>
                            <Badge badgeContent={3} color="error">
                                <Notifications />
                            </Badge>
                        </IconButton>
                        
                        <IconButton
                            onClick={handleProfileMenuOpen}
                            size="small"
                            sx={{ ml: 2 }}
                        >
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {user?.email?.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                        
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={() => {
                                handleMenuClose();
                                navigate('/profil');
                            }}>
                                Mon profil
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>
                                Déconnexion
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth
                        }
                    }}
                >
                    {drawer}
                </Drawer>
                
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            borderRight: '1px solid',
                            borderColor: 'divider'
                        }
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    bgcolor: 'background.default',
                    minHeight: '100vh'
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
};

export default Layout;