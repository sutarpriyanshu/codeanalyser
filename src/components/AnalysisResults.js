import React from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Box,
    Paper,
    Chip,
    Stack,
    Alert,
    Card,
    CardContent,
  } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import PDFDownloadButton from './AnalysisPDF';
const PriorityChip = ({ priority }) => {
  const color = {
    HIGH: 'error',
    MEDIUM: 'warning',
    LOW: 'info'
  }[priority];

  return (
    <Chip
      label={priority}
      color={color}
      size="small"
      sx={{ ml: 1 }}
    />
  );
};

const CodeBlock = ({ code }) => (
  <Box
    sx={{
      backgroundColor: 'grey.100',
      p: 2,
      borderRadius: 1,
      my: 1,
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
      overflow: 'auto'
    }}
  >
    {code}
  </Box>
);

const IssueCard = ({ issue, type }) => (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" component="div">
          {issue.type || issue.vulnerability}
        </Typography>
        {issue.priority && <PriorityChip priority={issue.priority} />}
        {issue.risk_level && <PriorityChip priority={issue.risk_level} />}
      </Box>
      
      {issue.line && (
        <Typography color="text.secondary" variant="body2">
          Line: {issue.line}
        </Typography>
      )}
      
      <Typography variant="body1" sx={{ mt: 1 }}>
        {issue.description}
      </Typography>

      {issue.impact && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Impact:</strong> {issue.impact}
          </Typography>
        </Alert>
      )}

      {(issue.fixRecommendation || issue.mitigation) && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="primary">
            Recommendation:
          </Typography>
          <Typography variant="body2">
            {issue.fixRecommendation || issue.mitigation}
          </Typography>
        </Box>
      )}

      {(issue.codeExample || issue.secure_code_example) && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="primary">
            Example Solution:
          </Typography>
          <CodeBlock code={issue.codeExample || issue.secure_code_example} />
        </Box>
      )}
    </CardContent>
  </Card>
);

const CategorySection = ({ title, items, icon, color }) => {
  if (!items || items.length === 0) return null;

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="h6">{title}</Typography>
          <Chip
            label={items.length}
            size="small"
            color={color}
            sx={{ ml: 1 }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {items.map((item, index) => (
            <IssueCard key={index} issue={item} type={title} />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

const Summary = ({ summary }) => {
  if (!summary) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Alert severity="info">
        <Typography variant="h6" gutterBottom>
          Analysis Summary
        </Typography>
        <Typography variant="body2">
          Total Issues: {summary.total_issues}
        </Typography>
        <Typography variant="body2">
          Critical Errors: {summary.critical_count}
        </Typography>
        <Typography variant="body2">
          Warnings: {summary.warning_count}
        </Typography>
        <Typography variant="body2">
          Optimization Suggestions: {summary.optimization_count}
        </Typography>
        <Typography variant="body2">
          Security Issues: {summary.security_count}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Overall Code Quality: {summary.overall_code_quality}
        </Typography>
      </Alert>
    </Box>
  );
};
const AnalysisResults = ({ results }) => {
    if (!results) return null;
  
    return (
      <Paper elevation={3} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PDFDownloadButton results={results} />
        </Box>
        
        <Summary summary={results.summary} />
        
        <CategorySection
          title="Critical Errors"
          items={results.criticalErrors}
          icon={<ErrorIcon color="error" />}
          color="error"
        />
        <CategorySection
          title="Warnings"
          items={results.warnings}
          icon={<WarningIcon color="warning" />}
          color="warning"
        />
        <CategorySection
          title="Optimizations"
          items={results.optimizations}
          icon={<SpeedIcon color="info" />}
          color="info"
        />
        <CategorySection
          title="Security Issues"
          items={results.security}
          icon={<SecurityIcon color="error" />}
          color="error"
        />
      </Paper>
    );
  };
  
  export default AnalysisResults;