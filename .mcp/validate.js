#!/usr/bin/env node

/**
 * MCP Validation Script
 * Comprehensive validation of all MCP configurations and connections
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {
      cursor: { status: 'unknown', issues: [] },
      project: { status: 'unknown', issues: [] },
      environment: { status: 'unknown', issues: [] },
      dependencies: { status: 'unknown', issues: [] },
      connections: { status: 'unknown', issues: [] }
    };
  }

  /**
   * Validate Cursor MCP configuration
   */
  async validateCursorMCP() {
    console.log('🔍 Validating Cursor MCP configuration...');
    
    const cursorMCPPath = path.join(process.env.USERPROFILE || process.env.HOME, '.cursor', 'mcp.json');
    
    try {
      if (!fs.existsSync(cursorMCPPath)) {
        this.results.cursor.issues.push('Cursor MCP configuration file not found');
        this.results.cursor.status = 'error';
        return;
      }

      const config = JSON.parse(fs.readFileSync(cursorMCPPath, 'utf8'));
      
      // Check required servers
      const requiredServers = ['git', 'filesystem', 'terminal', 'supabase', 'react', 'typescript'];
      const missingServers = requiredServers.filter(server => !config.mcpServers[server]);
      
      if (missingServers.length > 0) {
        this.results.cursor.issues.push(`Missing servers: ${missingServers.join(', ')}`);
      }

      // Check paths are absolute
      const pathIssues = [];
      Object.entries(config.mcpServers).forEach(([name, server]) => {
        if (server.env) {
          Object.entries(server.env).forEach(([key, value]) => {
            if (typeof value === 'string' && value.includes('./') && !value.startsWith('C:\\')) {
              pathIssues.push(`${name}.${key}: relative path should be absolute`);
            }
          });
        }
      });

      if (pathIssues.length > 0) {
        this.results.cursor.issues.push(...pathIssues);
      }

      this.results.cursor.status = this.results.cursor.issues.length === 0 ? 'success' : 'warning';
      
    } catch (error) {
      this.results.cursor.issues.push(`Error reading config: ${error.message}`);
      this.results.cursor.status = 'error';
    }
  }

  /**
   * Validate project MCP setup
   */
  async validateProjectMCP() {
    console.log('🔍 Validating project MCP setup...');
    
    const mcpDir = path.join(this.projectRoot, '.mcp');
    const configPath = path.join(mcpDir, 'config.json');
    const setupPath = path.join(mcpDir, 'setup.js');

    if (!fs.existsSync(mcpDir)) {
      this.results.project.issues.push('.mcp directory not found');
    }

    if (!fs.existsSync(configPath)) {
      this.results.project.issues.push('.mcp/config.json not found');
    }

    if (!fs.existsSync(setupPath)) {
      this.results.project.issues.push('.mcp/setup.js not found');
    }

    // Check package.json scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const requiredScripts = ['mcp:setup', 'mcp:status', 'mcp:test'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        this.results.project.issues.push(`Missing scripts: ${missingScripts.join(', ')}`);
      }
    }

    this.results.project.status = this.results.project.issues.length === 0 ? 'success' : 'warning';
  }

  /**
   * Validate environment variables
   */
  async validateEnvironment() {
    console.log('🔍 Validating environment variables...');
    
    const envPath = path.join(this.projectRoot, '.env');
    const envExamplePath = path.join(this.projectRoot, 'env.example');

    if (!fs.existsSync(envPath)) {
      this.results.environment.issues.push('.env file not found');
      if (fs.existsSync(envExamplePath)) {
        this.results.environment.issues.push('Copy env.example to .env and update values');
      }
    } else {
      // Check if .env has placeholder values
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('your-') || envContent.includes('placeholder')) {
        this.results.environment.issues.push('.env file contains placeholder values');
      }
    }

    this.results.environment.status = this.results.environment.issues.length === 0 ? 'success' : 'warning';
  }

  /**
   * Validate dependencies
   */
  async validateDependencies() {
    console.log('🔍 Validating MCP dependencies...');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.results.dependencies.issues.push('package.json not found');
      this.results.dependencies.status = 'error';
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const requiredDeps = [
      '@supabase/supabase-js',
      'firebase',
      '@sentry/react'
    ];

    const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
    if (missingDeps.length > 0) {
      this.results.dependencies.issues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
    }

    this.results.dependencies.status = this.results.dependencies.issues.length === 0 ? 'success' : 'warning';
  }

  /**
   * Test MCP connections
   */
  async testConnections() {
    console.log('🔍 Testing MCP connections...');
    
    // Load environment variables from .env file
    const envPath = path.join(this.projectRoot, '.env');
    
    if (fs.existsSync(envPath)) {
      // Try different encodings
      let envContent;
      try {
        envContent = fs.readFileSync(envPath, 'utf8');
      } catch (e) {
        try {
          envContent = fs.readFileSync(envPath, 'utf16le');
        } catch (e2) {
          envContent = fs.readFileSync(envPath, 'latin1');
        }
      }
      
      const envLines = envContent.split(/\r?\n/);
      
      for (const line of envLines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            const value = trimmedLine.substring(equalIndex + 1).trim();
            if (key && value && !value.includes('your-')) {
              process.env[key] = value;
            }
          }
        }
      }
    }
    
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_FIREBASE_PROJECT_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      this.results.connections.issues.push(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    this.results.connections.status = this.results.connections.issues.length === 0 ? 'success' : 'warning';
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n📊 MCP Validation Report');
    console.log('========================\n');

    const categories = [
      { name: 'Cursor MCP Config', key: 'cursor', icon: '🖥️' },
      { name: 'Project MCP Setup', key: 'project', icon: '📁' },
      { name: 'Environment Variables', key: 'environment', icon: '🔧' },
      { name: 'Dependencies', key: 'dependencies', icon: '📦' },
      { name: 'Connections', key: 'connections', icon: '🔌' }
    ];

    categories.forEach(category => {
      const result = this.results[category.key];
      const statusIcon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${category.icon} ${category.name}: ${result.status.toUpperCase()}`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`   • ${issue}`);
        });
      }
      console.log();
    });

    // Overall status
    const hasErrors = Object.values(this.results).some(result => result.status === 'error');
    const hasWarnings = Object.values(this.results).some(result => result.status === 'warning');
    
    if (hasErrors) {
      console.log('❌ MCP validation failed with errors');
    } else if (hasWarnings) {
      console.log('⚠️  MCP validation completed with warnings');
    } else {
      console.log('✅ MCP validation passed successfully');
    }

    return {
      hasErrors,
      hasWarnings,
      results: this.results
    };
  }

  /**
   * Run all validations
   */
  async run() {
    console.log('🚀 Starting MCP validation...\n');
    
    await this.validateCursorMCP();
    await this.validateProjectMCP();
    await this.validateEnvironment();
    await this.validateDependencies();
    await this.testConnections();
    
    return this.generateReport();
  }
}

// Main execution
async function main() {
  const validator = new MCPValidator();
  const report = await validator.run();
  
  // Exit with appropriate code
  process.exit(report.hasErrors ? 1 : 0);
}

// Run main function
main().catch(console.error);

export default MCPValidator;
