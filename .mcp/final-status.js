#!/usr/bin/env node

/**
 * Final MCP Status Report
 * Comprehensive status of all MCP servers and configuration
 */

import fs from 'fs';
import path from 'path';

class FinalMCPStatus {
  constructor() {
    this.projectRoot = process.cwd();
    this.cursorMCPPath = path.join(process.env.USERPROFILE || process.env.HOME, '.cursor', 'mcp.json');
  }

  /**
   * Load environment variables
   */
  loadEnvironmentVariables() {
    const envPath = path.join(this.projectRoot, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
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
  }

  /**
   * Check Cursor MCP configuration
   */
  checkCursorMCP() {
    console.log('🔍 Checking Cursor MCP Configuration...');
    
    if (!fs.existsSync(this.cursorMCPPath)) {
      console.log('❌ Cursor MCP config not found');
      return false;
    }

    try {
      const config = JSON.parse(fs.readFileSync(this.cursorMCPPath, 'utf8'));
      const servers = Object.keys(config.mcpServers || {});
      
      console.log(`✅ Found ${servers.length} MCP servers configured:`);
      servers.forEach(server => {
        console.log(`   • ${server}`);
      });
      
      return true;
    } catch (error) {
      console.log(`❌ Error reading Cursor MCP config: ${error.message}`);
      return false;
    }
  }

  /**
   * Check project MCP setup
   */
  checkProjectMCP() {
    console.log('\n🔍 Checking Project MCP Setup...');
    
    const mcpDir = path.join(this.projectRoot, '.mcp');
    const files = [
      'setup.js',
      'config.json',
      'validate.js',
      'check-mcp.js',
      'README.md'
    ];

    let allFilesExist = true;
    files.forEach(file => {
      const filePath = path.join(mcpDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
      } else {
        console.log(`❌ ${file} - Missing`);
        allFilesExist = false;
      }
    });

    return allFilesExist;
  }

  /**
   * Check environment variables
   */
  checkEnvironment() {
    console.log('\n🔍 Checking Environment Variables...');
    
    this.loadEnvironmentVariables();
    
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_FIREBASE_PROJECT_ID'
    ];

    let allVarsSet = true;
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`✅ ${varName}`);
      } else {
        console.log(`❌ ${varName} - Not set`);
        allVarsSet = false;
      }
    });

    return allVarsSet;
  }

  /**
   * Check dependencies
   */
  checkDependencies() {
    console.log('\n🔍 Checking Dependencies...');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log('❌ package.json not found');
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const requiredDeps = [
      '@supabase/supabase-js',
      'firebase',
      '@sentry/react'
    ];

    let allDepsInstalled = true;
    requiredDeps.forEach(dep => {
      if (dependencies[dep]) {
        console.log(`✅ ${dep}`);
      } else {
        console.log(`❌ ${dep} - Not installed`);
        allDepsInstalled = false;
      }
    });

    return allDepsInstalled;
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.log('\n📊 Final MCP Status Report');
    console.log('===========================\n');

    const cursorMCP = this.checkCursorMCP();
    const projectMCP = this.checkProjectMCP();
    const environment = this.checkEnvironment();
    const dependencies = this.checkDependencies();

    console.log('\n🎯 Summary:');
    console.log('===========');
    
    const totalChecks = 4;
    const passedChecks = [cursorMCP, projectMCP, environment, dependencies].filter(Boolean).length;
    
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%\n`);

    if (passedChecks === totalChecks) {
      console.log('🎉 All MCP systems are ready!');
      console.log('\n📋 Next Steps:');
      console.log('1. Restart Cursor completely');
      console.log('2. Check the MCP panel for available tools');
      console.log('3. Test the tools by using them in your development');
      console.log('\n🛠️ Available MCP Servers:');
      console.log('• filesystem - File system access');
      console.log('• terminal - Terminal commands');
      console.log('• supabase - Database operations');
      console.log('• postgres - Advanced database queries');
      console.log('• sentry - Error tracking');
      console.log('• sequential-thinking - AI reasoning');
      console.log('• memory - Persistent memory');
      console.log('• vercel - Deployment management');
      console.log('• playwright - Browser testing');
    } else {
      console.log('⚠️  Some issues need to be resolved:');
      if (!cursorMCP) console.log('   - Fix Cursor MCP configuration');
      if (!projectMCP) console.log('   - Complete project MCP setup');
      if (!environment) console.log('   - Set up environment variables');
      if (!dependencies) console.log('   - Install missing dependencies');
    }

    return {
      total: totalChecks,
      passed: passedChecks,
      success: passedChecks === totalChecks,
      details: {
        cursorMCP,
        projectMCP,
        environment,
        dependencies
      }
    };
  }

  /**
   * Run the complete status check
   */
  async run() {
    console.log('🚀 Final MCP Status Check\n');
    
    const report = this.generateReport();
    
    return report;
  }
}

// Main execution
async function main() {
  const status = new FinalMCPStatus();
  const report = await status.run();
  
  process.exit(report.success ? 0 : 1);
}

// Run main function
main().catch(console.error);

export default FinalMCPStatus;


