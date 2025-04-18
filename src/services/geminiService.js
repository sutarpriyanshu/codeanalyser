import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

const cleanResponse = (text) => {
  return text.replace(/```json\n?|\n?```/g, '').trim();
};

const validateBasicSyntax = (code) => {
  const issues = {
    criticalErrors: [],
    summary: {
      total_issues: 0,
      critical_count: 0,
      warning_count: 0,
      optimization_count: 0,
      security_count: 0,
      overall_code_quality: "NEEDS_IMPROVEMENT"
    }
  };

  // Count braces
  const lines = code.split('\n');
  let openBraces = 0;
  let closeBraces = 0;
  let lastOpenBraceLine = -1;

  lines.forEach((line, index) => {
    const openCount = (line.match(/{/g) || []).length;
    const closeCount = (line.match(/}/g) || []).length;
    openBraces += openCount;
    closeBraces += closeCount;
    if (openCount > 0) lastOpenBraceLine = index + 1;
  });

  if (openBraces > closeBraces) {
    const missingCount = openBraces - closeBraces;
    issues.criticalErrors.push({
      type: "Syntax Error",
      line: lastOpenBraceLine,
      description: `Missing ${missingCount} closing brace(s) '}'.`,
      impact: "Code will not compile. Incomplete code block structure.",
      fixRecommendation: "Add the missing closing brace(s) to properly close all code blocks.",
      codeExample: "Your code with fix:\n" + code + "\n" + "}\n".repeat(missingCount),
      priority: "HIGH"
    });
    issues.summary.critical_count++;
    issues.summary.total_issues++;
  }

  return issues;
}

const mergeAnalysis = (syntaxIssues, geminiAnalysis) => {
  // If Gemini didn't find any issues, use our syntax analysis
  if (!geminiAnalysis.criticalErrors) {
    geminiAnalysis.criticalErrors = [];
  }
  
  // Add our syntax issues to Gemini's analysis
  geminiAnalysis.criticalErrors = [
    ...syntaxIssues.criticalErrors,
    ...geminiAnalysis.criticalErrors
  ];

  // Update summary
  geminiAnalysis.summary.critical_count += syntaxIssues.summary.critical_count;
  geminiAnalysis.summary.total_issues += syntaxIssues.summary.total_issues;
  
  // Update overall code quality if we found critical issues
  if (syntaxIssues.summary.critical_count > 0) {
    geminiAnalysis.summary.overall_code_quality = "NEEDS_IMPROVEMENT";
  }

  return geminiAnalysis;
};

export const analyzeCode = async (javaCode) => {
  try {
    if (!process.env.REACT_APP_GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    // First perform our own syntax validation
    const syntaxIssues = validateBasicSyntax(javaCode);

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro" // Try this updated model name
    });
    
    const prompt = `As a Java code analysis expert, perform a comprehensive analysis of the following code. Provide detailed, actionable feedback in the following categories:

1. Critical Errors:
   - Syntax errors
   - Runtime risks
   - Logic flaws
   - Compilation issues

2. Warnings:
   - Code style deviations
   - Unused variables/imports
   - Naming conventions
   - Code organization

3. Optimizations:
   - Performance improvements
   - Resource utilization
   - Code readability
   - Maintainability suggestions

4. Security:
   - Vulnerabilities
   - Best practices
   - Security patterns
   - Input validation

Return ONLY a JSON object with this structure:
{
  "criticalErrors": [{
    "type": "string",
    "line": number,
    "description": "string",
    "impact": "string",
    "fixRecommendation": "string",
    "codeExample": "string",
    "priority": "HIGH|MEDIUM|LOW"
  }],
  "warnings": [{
    "type": "string",
    "line": number,
    "description": "string",
    "bestPractice": "string",
    "fixRecommendation": "string",
    "codeExample": "string",
    "priority": "HIGH|MEDIUM|LOW"
  }],
  "optimizations": [{
    "type": "string",
    "description": "string",
    "performance_impact": "string",
    "suggestion": "string",
    "codeExample": "string",
    "priority": "HIGH|MEDIUM|LOW"
  }],
  "security": [{
    "vulnerability": "string",
    "risk_level": "HIGH|MEDIUM|LOW",
    "description": "string",
    "impact": "string",
    "mitigation": "string",
    "secure_code_example": "string"
  }],
  "summary": {
    "total_issues": number,
    "critical_count": number,
    "warning_count": number,
    "optimization_count": number,
    "security_count": number,
    "overall_code_quality": "string"
  }
}

Java code to analyze:
${javaCode}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    if (!response || !response.text()) {
      throw new Error("Empty response from Gemini API");
    }

    const cleanedResponse = cleanResponse(response.text());

    try {
      const parsedResponse = JSON.parse(cleanedResponse);
      
      if (!parsedResponse || typeof parsedResponse !== 'object') {
        throw new Error("Invalid response format");
      }

      // Merge our syntax analysis with Gemini's analysis
      return mergeAnalysis(syntaxIssues, parsedResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", response.text());
      // If parsing fails, return at least our syntax analysis
      return syntaxIssues;
    }
  } catch (error) {
    console.error("Detailed error in analyzeCode:", error);
    throw error;
  }
};