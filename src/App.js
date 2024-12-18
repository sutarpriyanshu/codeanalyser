import React, { useState } from 'react';
import { Container, Typography, Alert, Snackbar } from '@mui/material';
import CodeInput from './components/CodeInput';
import AnalysisResults from './components/AnalysisResults';
import { analyzeCode } from './services/geminiService';

function App() {
  const [code, setCode] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate input
      if (!code.trim()) {
        throw new Error('Please enter some Java code to analyze');
      }

      const analysisResults = await analyzeCode(code);
      setResults(analysisResults);
    } catch (err) {
      let errorMessage = 'Failed to analyze code. ';
      
      // Handle specific error cases
      if (err.message.includes('API key')) {
        errorMessage += 'API key is not configured properly. ';
      } else if (err.message.includes('parse')) {
        errorMessage += 'Received invalid response format. ';
      } else if (err.message.includes('network')) {
        errorMessage += 'Network error occurred. ';
      }
      
      errorMessage += 'Please check the console for more details.';
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Java Code Analyzer
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Paste your Java code below to analyze it for potential issues and improvements.
      </Typography>

      <CodeInput
        code={code}
        setCode={setCode}
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
      />

      {results && <AnalysisResults results={results} />}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;