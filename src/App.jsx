import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Chip,
  Button
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
  Speed,
  AccountTree,
  ViewModule,
  RocketLaunch
} from '@mui/icons-material';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const workerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Initialize Web Worker
    workerRef.current = new Worker(new URL('./jsonWorker.js', import.meta.url), {
      type: 'module'
    });

    // Listen for messages from the worker
    workerRef.current.onmessage = (event) => {
      const { status, data, message, fileDetails } = event.data;

      if (status === 'preview') {
        setFileInfo(fileDetails);
        setLoading(false);
      } else if (status === 'success') {
        // Create Blob and Download
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted_data_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setSuccess(true);
        setLoading(false);
        setFileInfo(null);
      } else {
        setError(message);
        setLoading(false);
      }
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setFileInfo(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      // Send raw text to worker for pre-processing
      workerRef.current.postMessage({ command: 'preview', fileData: e.target.result });
    };

    reader.onerror = () => {
      setError("Failed to read file");
      setLoading(false);
    };

    reader.readAsText(file);
  };

  const handleConvert = () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    workerRef.current.postMessage({ command: 'convert' });
  };

  const handleCancel = () => {
    setFileInfo(null);
    setError(null);
    setSuccess(false);
  };


  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      py: 8
    }}>
      <Container maxWidth="md">
        <Fade in={true} timeout={800}>
          <Paper
            elevation={4}
            sx={{
              p: 5,
              borderRadius: 4,
              background: '#ffffff',
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <RocketLaunch sx={{ fontSize: 60, color: '#4a4a4a', mb: 2 }} />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: '#2a2a2a',
                  mb: 1
                }}
              >
                JSON to Excel Converter
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Securely convert your data directly in your browser.
              </Typography>
            </Box>

            {/* Upload Area */}
            {!fileInfo && (
              <Paper
                elevation={0}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleClick}
                sx={{
                  border: `2px dashed ${isDragActive ? '#6c63ff' : '#e0e0e0'}`,
                  borderRadius: 3,
                  p: 6,
                  cursor: 'pointer',
                  backgroundColor: isDragActive ? '#f3f4ff' : '#fafafa',
                  transition: 'all 0.2s ease-in-out',
                  textAlign: 'center',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />

                {loading ? (
                  <Box>
                    <CircularProgress size={60} thickness={4} sx={{ color: '#6c63ff', mb: 2 }} />
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                      Analyzing...
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <CloudUpload sx={{ fontSize: 80, color: '#6c63ff', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      Drop your JSON file here
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      or click to browse
                    </Typography>
                    <Chip
                      label=".json files only"
                      size="small"
                      sx={{ mt: 2, bgcolor: '#e8eaf6', color: '#3f51b5' }}
                    />
                  </Box>
                )}
              </Paper>
            )}

            {/* File Preview */}
            {fileInfo && (
              <Fade in={true}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">File Ready for Conversion</Typography>
                  <Typography variant="body1" color="text.secondary">
                    `{fileInfo.fileName}`
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Detected Records" secondary={fileInfo.recordCount} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="File Size" secondary={`${(fileInfo.fileSize / 1024).toFixed(2)} KB`} />
                    </ListItem>
                  </List>
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleConvert} sx={{ mr: 2 }}>
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Convert to Excel'}
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </Fade>
            )}


            {/* Status Messages */}
            {error && (
              <Fade in={true}>
                <Alert
                  severity="error"
                  icon={<ErrorIcon />}
                  sx={{ mt: 3, borderRadius: 2 }}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {success && (
              <Fade in={true}>
                <Alert
                  severity="success"
                  icon={<CheckCircle />}
                  sx={{ mt: 3, borderRadius: 2 }}
                >
                  Conversion successful! Your download has started.
                </Alert>
              </Fade>
            )}

            {/* Features List */}
            <Box sx={{ mt: 5 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  color: '#4a4a4a'
                }}
              >
                Features
              </Typography>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Speed sx={{ color: '#6c63ff' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Efficient Large File Handling"
                    secondary="Web Worker integration ensures your browser remains responsive."
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <AccountTree sx={{ color: '#6c63ff' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Smart JSON Flattening"
                    secondary="Automatically unnests complex JSON for a clean spreadsheet layout."
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ViewModule sx={{ color: '#6c63ff' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Multi-Sheet Support"
                    secondary="Data exceeding Excel's row limit is automatically split into multiple sheets."
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
              </List>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default App;