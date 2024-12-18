import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink
} from '@react-pdf/renderer';
import { Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  section: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    marginBottom: 10,
    color: '#1976d2',
  },
  subHeading: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  codeBlock: {
    fontSize: 10,
    fontFamily: 'Courier',
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginBottom: 10,
  },
  summaryBox: {
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  priority: {
    fontSize: 12,
    marginBottom: 5,
    color: '#d32f2f',
  },
});

// PDF Document component
const AnalysisPDFDocument = ({ results }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Code Analysis Report</Text>
        
        {/* Summary Section */}
        <View style={styles.summaryBox}>
          <Text style={styles.heading}>Analysis Summary</Text>
          <Text style={styles.text}>Total Issues: {results.summary.total_issues}</Text>
          <Text style={styles.text}>Critical Errors: {results.summary.critical_count}</Text>
          <Text style={styles.text}>Warnings: {results.summary.warning_count}</Text>
          <Text style={styles.text}>Optimization Suggestions: {results.summary.optimization_count}</Text>
          <Text style={styles.text}>Security Issues: {results.summary.security_count}</Text>
          <Text style={styles.text}>Overall Code Quality: {results.summary.overall_code_quality}</Text>
        </View>

        {/* Critical Errors Section */}
        {results.criticalErrors?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Critical Errors</Text>
            {results.criticalErrors.map((error, index) => (
              <View key={index} style={styles.section}>
                <Text style={styles.subHeading}>{error.type}</Text>
                <Text style={styles.priority}>Priority: {error.priority}</Text>
                {error.line && <Text style={styles.text}>Line: {error.line}</Text>}
                <Text style={styles.text}>Description: {error.description}</Text>
                <Text style={styles.text}>Impact: {error.impact}</Text>
                <Text style={styles.text}>Fix Recommendation: {error.fixRecommendation}</Text>
                {error.codeExample && (
                  <Text style={styles.codeBlock}>{error.codeExample}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Warnings Section */}
        {results.warnings?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Warnings</Text>
            {results.warnings.map((warning, index) => (
              <View key={index} style={styles.section}>
                <Text style={styles.subHeading}>{warning.type}</Text>
                <Text style={styles.priority}>Priority: {warning.priority}</Text>
                {warning.line && <Text style={styles.text}>Line: {warning.line}</Text>}
                <Text style={styles.text}>Description: {warning.description}</Text>
                <Text style={styles.text}>Best Practice: {warning.bestPractice}</Text>
                {warning.codeExample && (
                  <Text style={styles.codeBlock}>{warning.codeExample}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Optimizations Section */}
        {results.optimizations?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Optimizations</Text>
            {results.optimizations.map((opt, index) => (
              <View key={index} style={styles.section}>
                <Text style={styles.subHeading}>{opt.type}</Text>
                <Text style={styles.priority}>Priority: {opt.priority}</Text>
                <Text style={styles.text}>Description: {opt.description}</Text>
                <Text style={styles.text}>Performance Impact: {opt.performance_impact}</Text>
                {opt.codeExample && (
                  <Text style={styles.codeBlock}>{opt.codeExample}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Security Issues Section */}
        {results.security?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Security Issues</Text>
            {results.security.map((issue, index) => (
              <View key={index} style={styles.section}>
                <Text style={styles.subHeading}>{issue.vulnerability}</Text>
                <Text style={styles.priority}>Risk Level: {issue.risk_level}</Text>
                <Text style={styles.text}>Description: {issue.description}</Text>
                <Text style={styles.text}>Impact: {issue.impact}</Text>
                <Text style={styles.text}>Mitigation: {issue.mitigation}</Text>
                {issue.secure_code_example && (
                  <Text style={styles.codeBlock}>{issue.secure_code_example}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </Page>
  </Document>
);

// PDF Download Button component
const PDFDownloadButton = ({ results }) => (
  <PDFDownloadLink
    document={<AnalysisPDFDocument results={results} />}
    fileName="code-analysis-report.pdf"
  >
    {({ blob, url, loading, error }) => (
      <Button
        variant="contained"
        color="primary"
        startIcon={<PictureAsPdfIcon />}
        disabled={loading}
        sx={{ mt: 2, mb: 2 }}
      >
        {loading ? 'Generating PDF...' : 'Download PDF Report'}
      </Button>
    )}
  </PDFDownloadLink>
);

export default PDFDownloadButton;