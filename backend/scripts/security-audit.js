/**
 * Security Audit Script
 * 
 * Run this script periodically to check for security issues in the application.
 * 
 * Usage: node scripts/security-audit.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[FAIL]${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}\n`)
};

const auditResults = {
  passed: 0,
  warnings: 0,
  failed: 0,
  issues: []
};

function recordResult(type, message, details = null) {
  if (type === 'pass') {
    auditResults.passed++;
    log.success(message);
  } else if (type === 'warn') {
    auditResults.warnings++;
    log.warning(message);
    auditResults.issues.push({ severity: 'warning', message, details });
  } else if (type === 'fail') {
    auditResults.failed++;
    log.error(message);
    auditResults.issues.push({ severity: 'critical', message, details });
  }
}

// ============================================================
// Security Checks
// ============================================================

async function checkNpmAudit() {
  log.section('NPM Dependency Audit');
  
  try {
    const { stdout } = await execAsync('npm audit --json', { cwd: path.join(__dirname, '..') });
    const auditData = JSON.parse(stdout);
    
    if (auditData.metadata.vulnerabilities.total === 0) {
      recordResult('pass', 'No vulnerabilities found in npm dependencies');
    } else {
      const vulns = auditData.metadata.vulnerabilities;
      recordResult('fail', `Found ${vulns.total} vulnerabilities (${vulns.critical} critical, ${vulns.high} high, ${vulns.moderate} moderate, ${vulns.low} low)`);
    }
  } catch (error) {
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);
        const vulns = auditData.metadata?.vulnerabilities;
        if (vulns && vulns.total > 0) {
          recordResult('fail', `Found ${vulns.total} vulnerabilities`, auditData);
        }
      } catch {
        recordResult('warn', 'Could not parse npm audit output');
      }
    } else {
      recordResult('warn', 'npm audit command failed');
    }
  }
}

function checkEnvironmentVariables() {
  log.section('Environment Variables Security');
  
  const requiredSecrets = [
    'JWT_SECRET',
    'CLERK_SECRET_KEY',
    'MONGODB_URI'
  ];
  
  const optionalSecrets = [
    'CSRF_SECRET',
    'GEMINI_API_KEY',
    'SENDGRID_API_KEY'
  ];
  
  // Check for missing required secrets
  for (const secret of requiredSecrets) {
    if (process.env[secret]) {
      recordResult('pass', `${secret} is set`);
    } else {
      recordResult('fail', `${secret} is NOT set (required)`);
    }
  }
  
  // Check for optional secrets
  for (const secret of optionalSecrets) {
    if (process.env[secret]) {
      recordResult('pass', `${secret} is set`);
    } else {
      recordResult('warn', `${secret} is not set (optional)`);
    }
  }
  
  // Check for weak secrets
  const weakPatterns = ['development', 'secret', 'password', 'changeme', '123456', 'test'];
  const secretVars = Object.keys(process.env).filter(k => 
    k.includes('SECRET') || k.includes('KEY') || k.includes('PASSWORD')
  );
  
  for (const varName of secretVars) {
    const value = process.env[varName]?.toLowerCase() || '';
    if (weakPatterns.some(pattern => value.includes(pattern))) {
      recordResult('warn', `${varName} may contain a weak/default value`);
    }
    
    if (process.env[varName] && process.env[varName].length < 32 && 
        (varName.includes('JWT') || varName.includes('CSRF'))) {
      recordResult('warn', `${varName} should be at least 32 characters`);
    }
  }
}

function checkSecurityMiddleware() {
  log.section('Security Middleware Configuration');
  
  const middlewarePath = path.join(__dirname, '..', 'src', 'middleware', 'securityMiddleware.js');
  const serverPath = path.join(__dirname, '..', 'src', 'server.js');
  
  // Check if security middleware exists
  if (fs.existsSync(middlewarePath)) {
    recordResult('pass', 'Security middleware file exists');
    
    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    // Check for helmet
    if (content.includes('helmet')) {
      recordResult('pass', 'Helmet (HTTP security headers) is configured');
    } else {
      recordResult('fail', 'Helmet is not configured');
    }
    
    // Check for rate limiting
    if (content.includes('rateLimit')) {
      recordResult('pass', 'Rate limiting is configured');
    } else {
      recordResult('fail', 'Rate limiting is not configured');
    }
    
    // Check for CSRF
    if (content.includes('csrf') || content.includes('doubleCsrf')) {
      recordResult('pass', 'CSRF protection is configured');
    } else {
      recordResult('warn', 'CSRF protection may not be configured');
    }
    
    // Check for XSS sanitization
    if (content.includes('xss') || content.includes('sanitize')) {
      recordResult('pass', 'XSS sanitization is configured');
    } else {
      recordResult('fail', 'XSS sanitization is not configured');
    }
  } else {
    recordResult('fail', 'Security middleware file does not exist');
  }
  
  // Check if security middleware is imported in server
  if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    if (serverContent.includes('securityMiddleware')) {
      recordResult('pass', 'Security middleware is imported in server.js');
    } else {
      recordResult('fail', 'Security middleware is not imported in server.js');
    }
    
    if (serverContent.includes('helmetMiddleware')) {
      recordResult('pass', 'Helmet middleware is applied in server.js');
    } else {
      recordResult('warn', 'Helmet middleware may not be applied');
    }
  }
}

function checkSensitiveFileExposure() {
  log.section('Sensitive File Exposure Check');
  
  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'secrets.json',
    'credentials.json'
  ];
  
  const publicDirs = [
    path.join(__dirname, '..', '..', 'frontend', 'public'),
    path.join(__dirname, '..', 'public')
  ];
  
  for (const dir of publicDirs) {
    if (fs.existsSync(dir)) {
      for (const file of sensitiveFiles) {
        const filePath = path.join(dir, file);
        if (fs.existsSync(filePath)) {
          recordResult('fail', `Sensitive file exposed in public directory: ${filePath}`);
        }
      }
    }
  }
  
  // Check .gitignore
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    
    if (gitignore.includes('.env')) {
      recordResult('pass', '.env files are in .gitignore');
    } else {
      recordResult('fail', '.env files should be in .gitignore');
    }
    
    if (gitignore.includes('node_modules')) {
      recordResult('pass', 'node_modules is in .gitignore');
    } else {
      recordResult('warn', 'node_modules should be in .gitignore');
    }
  } else {
    recordResult('warn', '.gitignore file not found');
  }
}

function checkCORSConfiguration() {
  log.section('CORS Configuration Check');
  
  const serverPath = path.join(__dirname, '..', 'src', 'server.js');
  
  if (fs.existsSync(serverPath)) {
    const content = fs.readFileSync(serverPath, 'utf8');
    
    if (content.includes('cors(')) {
      recordResult('pass', 'CORS middleware is configured');
      
      // Check for wildcard origin
      if (content.includes("origin: '*'") || content.includes('origin: "*"')) {
        recordResult('fail', 'CORS is configured with wildcard origin (dangerous in production)');
      } else {
        recordResult('pass', 'CORS origin is not set to wildcard');
      }
      
      // Check for credentials
      if (content.includes('credentials: true')) {
        recordResult('pass', 'CORS credentials are enabled');
      }
    } else {
      recordResult('warn', 'CORS middleware may not be configured');
    }
  }
}

function checkErrorHandling() {
  log.section('Error Handling Security');
  
  const errorHandlerPath = path.join(__dirname, '..', 'src', 'middleware', 'errorHandler.js');
  
  if (fs.existsSync(errorHandlerPath)) {
    const content = fs.readFileSync(errorHandlerPath, 'utf8');
    
    // Check for stack trace exposure
    if (content.includes('NODE_ENV') && content.includes('development')) {
      recordResult('pass', 'Stack traces are conditionally exposed based on environment');
    } else if (content.includes('stack')) {
      recordResult('warn', 'Stack traces may be exposed in production');
    } else {
      recordResult('pass', 'Stack traces appear to be properly hidden');
    }
    
    // Check for proper error logging
    if (content.includes('logger') || content.includes('console.error')) {
      recordResult('pass', 'Errors are logged');
    } else {
      recordResult('warn', 'Errors may not be logged');
    }
  }
}

// ============================================================
// Main Execution
// ============================================================

async function runAudit() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           HotSho Security Audit Tool v1.0.0               ║
║           Running comprehensive security checks            ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  const startTime = Date.now();
  
  // Run all checks
  await checkNpmAudit();
  checkEnvironmentVariables();
  checkSecurityMiddleware();
  checkSensitiveFileExposure();
  checkCORSConfiguration();
  checkErrorHandling();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Summary
  log.section('Audit Summary');
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ${colors.green}Passed:${colors.reset}   ${String(auditResults.passed).padEnd(4)}                                      ║
║  ${colors.yellow}Warnings:${colors.reset} ${String(auditResults.warnings).padEnd(4)}                                      ║
║  ${colors.red}Failed:${colors.reset}   ${String(auditResults.failed).padEnd(4)}                                      ║
║  Duration: ${duration}s                                      ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  if (auditResults.failed > 0) {
    console.log(`\n${colors.red}Critical issues found that require immediate attention!${colors.reset}`);
    process.exit(1);
  } else if (auditResults.warnings > 0) {
    console.log(`\n${colors.yellow}Some warnings found. Please review and address if necessary.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.green}All security checks passed!${colors.reset}`);
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
