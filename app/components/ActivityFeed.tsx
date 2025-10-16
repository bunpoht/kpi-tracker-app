'use client';
    
import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    List, 
    ListItem, 
    ListItemText, 
    Divider, 
    Paper,
    Menu,
    MenuItem,
    IconButton
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuth } from '../context/AuthContext';

dayjs.extend(relativeTime);

// Interface สำหรับ WorkLog (เพิ่ม goalId และ images)
interface WorkLog {
    id: string;
    description: string;
    quantity: number;
    completedAt: string;
    goalId: string;
    author: {
        id: string;
        name: string;
    };
    goal: {
        id: string;
        title: string;
        unit: string;
    };
    images: {
        id: string;
        url: string;
    }[];
}

// Interface สำหรับ Props ที่ Component นี้ต้องการ
interface ActivityFeedProps {
    workLogs: WorkLog[];
    onEdit: (log: WorkLog) => void;
    onDelete: (logId: string) => void;
}

export default function ActivityFeed({ workLogs, onEdit, onDelete }: ActivityFeedProps) {
    const { user } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, log: WorkLog) => {
        setAnchorEl(event.currentTarget);
        setSelectedLog(log);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedLog(null);
    };

    const handleEditClick = () => {
        if (selectedLog) {
            onEdit(selectedLog);
        }
        handleMenuClose();
    };
    
    const handleDeleteClick = () => {
        if (selectedLog) {
            onDelete(selectedLog.id);
        }
        handleMenuClose();
    };

    // ถ้าไม่มีข้อมูล ให้แสดงข้อความ
    if (!workLogs || workLogs.length === 0) {
        return (
            <Paper sx={{p: 3, mt: 4, textAlign: 'center'}}>
                <Typography variant="subtitle1">No recent activity.</Typography>
                <Typography color="text.secondary">Log some work to get started!</Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>Recent Activity</Typography>
            <Paper>
                <List>
                    {workLogs.map((log, index) => {
                        // ตรวจสอบสิทธิ์: แสดงเมนูเฉพาะเมื่อเป็นเจ้าของ Log หรือเป็น Admin
                        const canModify = user?.id === log.author.id || user?.role === 'ADMIN';
                        
                        return (
                            <React.Fragment key={log.id}>
                                <ListItem 
                                    alignItems="flex-start"
                                    secondaryAction={
                                        canModify ? (
                                            <IconButton edge="end" aria-label="options" onClick={(e) => handleMenuClick(e, log)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        ) : null
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Typography component="span" variant="body1">
                                                <strong>{log.author.name}</strong> logged <strong>{log.quantity} {log.goal.unit}</strong>
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography component="span" color="text.primary" sx={{ display: 'block' }}>
                                                    for "{log.goal.title}" - "{log.description}"
                                                </Typography>
                                                {dayjs(log.completedAt).fromNow()}
                                            </>
                                        }
                                    />
                                </ListItem>
                                {index < workLogs.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        );
                    })}
                </List>
                {/* Menu สำหรับ Edit/Delete */}
                <Menu
                    id="activity-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={handleEditClick}>Edit</MenuItem>
                    <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>Delete</MenuItem>
                </Menu>
            </Paper>
        </Box>
    );
}