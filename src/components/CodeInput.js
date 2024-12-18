import React from 'react';
import { Paper, TextField, Button, Box } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const CodeInput = ({ code, setCode, onAnalyze, isLoading }) => {
  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <TextField
        fullWidth
        multiline
        rows={10}
        variant="outlined"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your Java code here..."
        sx={{ mb: 2 }}
        InputProps={{
          sx: { fontFamily: 'monospace' }
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={onAnalyze}
          disabled={!code.trim() || isLoading}
          endIcon={<SendIcon />}
        >
          Analyze Code
        </Button>
      </Box>
    </Paper>
  );
};

export default CodeInput;