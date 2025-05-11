import { GoogleGenerativeAI } from "@google/generative-ai";

// Create a browser-compatible rate limiter
const rateLimiter = {
  lastRequestTime: 0,
  minInterval: 20000, // 20 seconds between requests (as recommended by the error)
  
  async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const delayNeeded = this.minInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${delayNeeded}ms before next request`);
      
      // Use browser Promise-based setTimeout instead of Node.js timers/promises
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    
    this.lastRequestTime = Date.now();
  }
};

const cleanResponse = (text) => {
  return text.replace(/```json\n?|\n?```/g, '').trim();
};

const validateBasicSyntax = (code) => {
  const issues = {
    criticalErrors: [],
    warnings: [],
    optimizations: [],
    security: [],
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
    
    // Check for missing semicolons
    if (line.trim() && !line.trim().endsWith('{') && !line.trim().endsWith('}') && 
        !line.trim().endsWith(';') && !line.trim().startsWith('//') &&
        !line.trim().startsWith('/*') && !line.trim().endsWith('*/') && 
        !line.trim().startsWith('*') && !line.trim().startsWith('@')) {
      
      issues.warnings.push({
        type: "Syntax Warning",
        line: index + 1,
        description: "Possible missing semicolon at end of line.",
        bestPractice: "End statements with semicolons in Java.",
        fixRecommendation: "Add a semicolon at the end of this line if it's a statement.",
        codeExample: line.trim() + ";",
        priority: "MEDIUM"
      });
      
      issues.summary.warning_count++;
      issues.summary.total_issues++;
    }
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
  } else if (closeBraces > openBraces) {
    const extraCount = closeBraces - openBraces;
    issues.criticalErrors.push({
      type: "Syntax Error",
      line: null,
      description: `${extraCount} extra closing brace(s) '}' found.`,
      impact: "Code will not compile. Incorrect code block structure.",
      fixRecommendation: "Remove the extra closing brace(s) to balance all code blocks.",
      codeExample: "Review your code and remove extra closing braces",
      priority: "HIGH"
    });
    issues.summary.critical_count++;
    issues.summary.total_issues++;
  }
  
  // Check for common Java patterns that might indicate issues
  
  // Check for null checks after dereference
  lines.forEach((line, index) => {
    const lineContent = line.trim();
    if (lineContent.includes(".") && lineContent.includes(" != null") && 
        lineContent.indexOf(".") < lineContent.indexOf(" != null")) {
      issues.warnings.push({
        type: "Null Pointer Risk",
        line: index + 1,
        description: "Possible null pointer exception. Null check appears after method/property access.",
        bestPractice: "Always check for null before accessing object methods or properties.",
        fixRecommendation: "Rearrange code to check for null before accessing the object.",
        codeExample: "if (object != null) { object.method(); } // instead of: object.method() != null",
        priority: "HIGH"
      });
      issues.summary.warning_count++;
      issues.summary.total_issues++;
    }
  });

  // Set overall code quality based on issue counts
  if (issues.summary.critical_count > 0) {
    issues.summary.overall_code_quality = "CRITICAL_ISSUES";
  } else if (issues.summary.warning_count > 3) {
    issues.summary.overall_code_quality = "NEEDS_IMPROVEMENT";
  } else if (issues.summary.warning_count > 0) {
    issues.summary.overall_code_quality = "SATISFACTORY";
  } else {
    issues.summary.overall_code_quality = "GOOD";
  }

  return issues;
};

const mergeAnalysis = (syntaxIssues, geminiAnalysis) => {
  // Create a safety copy if geminiAnalysis is null or undefined
  const analysis = geminiAnalysis || {
    criticalErrors: [],
    warnings: [],
    optimizations: [],
    security: [],
    summary: {
      total_issues: 0,
      critical_count: 0,
      warning_count: 0,
      optimization_count: 0,
      security_count: 0,
      overall_code_quality: "UNKNOWN"
    }
  };
  
  // If Gemini didn't find any issues, use our syntax analysis
  if (!analysis.criticalErrors) {
    analysis.criticalErrors = [];
  }
  
  if (!analysis.warnings) {
    analysis.warnings = [];
  }
  
  // Add our syntax issues to Gemini's analysis
  analysis.criticalErrors = [
    ...syntaxIssues.criticalErrors,
    ...analysis.criticalErrors
  ];
  
  analysis.warnings = [
    ...syntaxIssues.warnings,
    ...analysis.warnings
  ];

  // Update summary
  analysis.summary.critical_count = (analysis.summary.critical_count || 0) + syntaxIssues.summary.critical_count;
  analysis.summary.warning_count = (analysis.summary.warning_count || 0) + syntaxIssues.summary.warning_count;
  analysis.summary.total_issues = (analysis.summary.total_issues || 0) + syntaxIssues.summary.total_issues;
  
  // Update overall code quality based on the combined analysis
  if (analysis.summary.critical_count > 0) {
    analysis.summary.overall_code_quality = "CRITICAL_ISSUES";
  } else if (analysis.summary.warning_count > 3) {
    analysis.summary.overall_code_quality = "NEEDS_IMPROVEMENT";
  } else if (analysis.summary.warning_count > 0) {
    analysis.summary.overall_code_quality = "SATISFACTORY";
  } else if (analysis.summary.total_issues === 0) {
    analysis.summary.overall_code_quality = "EXCELLENT";
  } else {
    analysis.summary.overall_code_quality = "GOOD";
  }

  return analysis;
};

export const analyzeCode = async (javaCode) => {
  // Start with local analysis
  const syntaxIssues = validateBasicSyntax(javaCode);
  
  try {
    if (!process.env.REACT_APP_GEMINI_API_KEY) {
      console.log("Gemini API key is not configured, using basic analysis only");
      return syntaxIssues;
    }

    // If we have critical syntax issues, maybe skip the API call to save quota
    if (syntaxIssues.summary.critical_count > 0) {
      console.log("Found critical syntax issues, skipping API call to save quota");
      return syntaxIssues;
    }

    try {
      // Apply rate limiting before making the API call
      await rateLimiter.throttle();

      const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
      // Use the updated model name for Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
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

      // Set a timeout for the API call
      const apiPromise = new Promise(async (resolve, reject) => {
        try {
          const result = await model.generateContent(prompt);
          const response = await result.response;
          
          if (!response || !response.text()) {
            reject(new Error("Empty response from Gemini API"));
            return;
          }
          
          const cleanedResponse = cleanResponse(response.text());
          resolve(cleanedResponse);
        } catch (err) {
          reject(err);
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API call timed out')), 10000);
      });
      
      // Race the API call against the timeout
      const cleanedResponse = await Promise.race([apiPromise, timeoutPromise]);

      try {
        const parsedResponse = JSON.parse(cleanedResponse);
        
        if (!parsedResponse || typeof parsedResponse !== 'object') {
          throw new Error("Invalid response format");
        }

        // Merge our syntax analysis with Gemini's analysis
        return mergeAnalysis(syntaxIssues, parsedResponse);
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", cleanedResponse);
        // If parsing fails, return at least our syntax analysis
        return syntaxIssues;
      }
    } catch (apiError) {
      console.error("API call failed:", apiError.message);
      
      // Check if this is a rate limit error
      if (apiError.message && (
          apiError.message.includes("429") || 
          apiError.message.includes("quota") ||
          apiError.message.includes("RESOURCE_EXHAUSTED")
      )) {
        console.log("Rate limit exceeded, returning local analysis only");
      }
      
      // Return our basic syntax analysis as a fallback
      return syntaxIssues;
    }
  } catch (error) {
    console.error("Detailed error in analyzeCode:", error);
    // Return the most basic analysis if everything else fails
    return {
      criticalErrors: [],
      warnings: [],
      optimizations: [],
      security: [], 
      summary: {
        total_issues: 0,
        critical_count: 0, 
        warning_count: 0,
        optimization_count: 0,
        security_count: 0,
        overall_code_quality: "UNKNOWN - Analysis Failed"
      }
    };
  }
};