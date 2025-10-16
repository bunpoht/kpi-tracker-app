'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, TextField, Button, Typography, Select, MenuItem, 
  FormControl, InputLabel, CircularProgress, Alert,
  Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  SelectChangeEvent
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { Goal } from '../dashboard/goals/page';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';

// Interface for data passed to the form
export interface WorkLogFormData {
  id?: string;
  description: string;
  quantity: number | string;
  completedAt: string | Dayjs | null;
  goalId: string;
  images?: { id: string; url: string }[];
}

interface WorkLogFormProps {
  onSave: () => void;
  open?: boolean;
  onClose?: () => void;
  initialData?: WorkLogFormData | null;
}

export default function WorkLogForm({ onSave, open = true, onClose, initialData }: WorkLogFormProps) {
  const { user } = useAuth();

  // States for form fields
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [completedAt, setCompletedAt] = useState<Dayjs | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  
  // States for image management
  const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // States for API handling
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!initialData?.id;

  // Set initial data for the form
  useEffect(() => {
    if (isEditing && initialData) {
      setDescription(initialData.description || '');
      setQuantity(initialData.quantity?.toString() || '');
      setCompletedAt(initialData.completedAt ? dayjs(initialData.completedAt) : null);
      setSelectedGoalId(initialData.goalId || '');
      setExistingImages(initialData.images || []);
      setNewFiles([]);
      setImagesToDelete([]);
    } else {
      setDescription('');
      setQuantity('');
      setCompletedAt(dayjs());
      setSelectedGoalId('');
      setExistingImages([]);
      setNewFiles([]);
      setImagesToDelete([]);
    }
  }, [initialData, isEditing]);

  // Fetch goals for the dropdown
  useEffect(() => {
    const fetchGoals = async () => {
      setLoadingGoals(true);
      try {
        const response = await fetch('/api/goals');
        if (!response.ok) throw new Error('Could not fetch goals.');
        const data = await response.json();
        setGoals(data);
      } catch (err: any) {
        // Log error but don't show it in the form's main error alert
        console.error("Failed to fetch goals:", err.message);
      } finally {
        setLoadingGoals(false);
      }
    };
    fetchGoals();
  }, []);

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setNewFiles(prev => [...prev, ...acceptedFiles.map(file => Object.assign(file, { preview: URL.createObjectURL(file) }))]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': ['.jpeg', '.png', '.jpg'] } });
  
  const removeNewFile = (fileToRemove: File) => setNewFiles(prev => prev.filter(f => f !== fileToRemove));
  const removeExistingImage = (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setImagesToDelete(prev => [...prev, imageId]);
  };
  
  // Clean up preview URLs
  useEffect(() => {
    return () => newFiles.forEach(file => URL.revokeObjectURL((file as any).preview));
  }, [newFiles]);

  // Handler for Select component
  const handleSelectChange = (event: SelectChangeEvent) => {
    setSelectedGoalId(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) { setError("You must be logged in."); return; }
    setSubmitting(true);
    setError('');

    try {
      // Step 1: Upload only NEW files to Cloudinary
      const newImageUrls: string[] = [];
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
          const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
              method: 'POST',
              body: formData,
          });
          if (!uploadResponse.ok) throw new Error('Image upload failed.');
          const uploadData = await uploadResponse.json();
          newImageUrls.push(uploadData.secure_url);
        }
      }

      // Step 2: Prepare payload for our backend API
      const url = isEditing ? `/api/worklogs/${initialData?.id}` : '/api/worklogs';
      const method = isEditing ? 'PUT' : 'POST';
      const bodyPayload = {
        description,
        quantity,
        completedAt: completedAt?.toISOString(),
        goalId: selectedGoalId,
        authorId: user.id,
        imagesToAdd: newImageUrls,
        imagesToDelete: imagesToDelete,
        images: isEditing ? undefined : newImageUrls, // 'images' is for create mode only
      };

      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyPayload) });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'submit'} log.`);
      }

      onSave();
      if (onClose) onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: isEditing ? 0 : 3, border: isEditing ? 0 : '1px solid', borderColor: 'divider', borderRadius: 2 }}
    >
      <Typography variant="h6">{isEditing ? 'Edit Work Log' : 'Log Your Work'}</Typography>
      
      <TextField label="Work Description" variant="outlined" fullWidth required value={description} onChange={(e) => setDescription(e.target.value)} />

      <FormControl fullWidth required>
        <InputLabel id="goal-select-label">Related Goal / KPI</InputLabel>
        <Select 
            labelId="goal-select-label" 
            value={selectedGoalId} 
            label="Related Goal / KPI" 
            onChange={handleSelectChange}
            disabled={loadingGoals}
        >
          {loadingGoals ? <MenuItem disabled>Loading goals...</MenuItem> : 
            goals.map(goal => (<MenuItem key={goal.id} value={goal.id}>{goal.title}</MenuItem>))}
        </Select>
      </FormControl>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField label="Quantity" type="number" required value={quantity} onChange={(e) => setQuantity(e.target.value)} sx={{ flex: 1 }} />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker label="Date Completed" value={completedAt} onChange={setCompletedAt} sx={{ flex: 2 }} />
        </LocalizationProvider>
      </Box>
      
      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: isEditing ? 1 : 0 }}>Images</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {existingImages.map(image => (
          <Box key={image.id} sx={{ position: 'relative' }}>
            <Image src={image.url} alt="existing image" width={80} height={80} style={{ borderRadius: '4px', objectFit: 'cover' }} />
            <IconButton size="small" onClick={() => removeExistingImage(image.id)} sx={{ position: 'absolute', top: -5, right: -5, bgcolor: 'rgba(0,0,0,0.6)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)'} }}>
              <CloseIcon fontSize="small" sx={{ color: 'white' }} />
            </IconButton>
          </Box>
        ))}
        {newFiles.map((file, index) => (
          <Box key={index} sx={{ position: 'relative' }}>
            <Image src={(file as any).preview} alt={file.name} width={80} height={80} style={{ borderRadius: '4px', objectFit: 'cover' }} />
            <IconButton size="small" onClick={() => removeNewFile(file)} sx={{ position: 'absolute', top: -5, right: -5, bgcolor: 'rgba(0,0,0,0.6)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)'} }}>
              <CloseIcon fontSize="small" sx={{ color: 'white' }} />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Paper {...getRootProps()} sx={{ p: 2, mt: 1, border: '2px dashed', borderColor: isDragActive ? 'primary.main' : 'divider', textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'text.primary' } }}>
        <input {...getInputProps()} />
        <Typography color="text.secondary">{isEditing ? "Add more images..." : "Drag 'n' drop image files here, or click to select"}</Typography>
      </Paper>

      {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
      
      {!isEditing && (
        <Button type="submit" variant="contained" disabled={submitting} sx={{ mt: 1 }}>
          {submitting ? <CircularProgress size={24} /> : 'Submit Log'}
        </Button>
      )}
    </Box>
  );

  if (!isEditing) {
    return formContent;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Work Log</DialogTitle>
      <DialogContent sx={{pt: '20px !important'}}>{formContent}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}