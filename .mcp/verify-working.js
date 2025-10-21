#!/usr/bin/env node

/**
 * MCP Working Verification
 * Verifies that MCP configuration is correct and ready to use
 */

import fs from 'fs';
import path from 'path';

class MCPWorkingVerifier {
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
   * Verify Cursor MCP configuration
   */
  verifyCursorMCP() {
    console.log('🔍 Verifying Cursor MCP Configuration...');
    
    if (!fs.existsSync(this.cursorMCPPath)) {
      console.log('❌ Cursor MCP config not found');
      return false;
    }

    try {
      const config = JSON.parse(fs.readFileSync(this.cursorMCPPath, 'utf8'));
      const servers = config.mcpServers || {};
      
      console.log(`✅ Found ${Object.keys(servers).length} MCP servers configured`);
      
      // Check critical servers
      const criticalServers = ['supabase', 'vercel'];
      const criticalStatus = criticalServers.map(server => {
        if (servers[server]) {
          console.log(`✅ ${server}: Configured`);
          return true;
        } else {
          console.log(`❌ ${server}: Missing`);
          return false;
        }
      });

      // Check all servers
      Object.keys(servers).forEach(server => {
        if (!criticalServers.includes(server)) {
          console.log(`✅ ${server}: Configured`);
        }
      });

      return criticalStatus.every(status => status);
    } catch (error) {
      console.log(`❌ Error reading Cursor MCP config: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify environment variables
   */
  verifyEnvironment() {
    console.log('\n🔍 Verifying Environment Variables...');
    
    this.loadEnvironmentVariables();
    
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_FIREBASE_PROJECT_ID'
    ];

    let allVarsSet = true;
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: Set`);
      } else {
        console.log(`❌ ${varName}: Not set`);
        allVarsSet = false;
      }
    });

    return allVarsSet;
  }

  /**
   * Verify project setup
   */
  verifyProjectSetup() {
    console.log('\n🔍 Verifying Project MCP Setup...');
    
    const mcpDir = path.join(this.projectRoot, '.mcp');
    const requiredFiles = [
      'setup.js',
      'config.json',
      'validate.js',
      'final-status.js',
      'README.md'
    ];

    let allFilesExist = true;
    requiredFiles.forEach(file => {
      const filePath = path.join(mcpDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}: Present`);
      } else {
        console.log(`❌ ${file}: Missing`);
        allFilesExist = false;
      }
    });

    return allFilesExist;
  }

  /**
   * Check package.json scripts
   */
  verifyScripts() {
    console.log('\n🔍 Verifying Package Scripts...');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log('❌ package.json not found');
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const requiredScripts = ['mcp:setup', 'mcp:status', 'mcp:test', 'mcp:final'];
    let allScriptsExist = true;
    
    requiredScripts.forEach(script => {
      if (scripts[script]) {
        console.log(`✅ ${script}: Available`);
      } else {
        console.log(`❌ ${script}: Missing`);
        allScriptsExist = false;
      }
    });

    return allScriptsExist;
  }

  /**
   * Generate verification report
   */
  generateReport() {
    console.log('\n📊 MCP Working Verification Report');
    console.log('===================================\n');

    const cursorMCP = this.verifyCursorMCP();
    const environment = this.verifyEnvironment();
    const projectSetup = this.verifyProjectSetup();
    const scripts = this.verifyScripts();

    console.log('\n🎯 Summary:');
    console.log('===========');
    
    const totalChecks = 4;
    const passedChecks = [cursorMCP, environment, projectSetup, scripts].filter(Boolean).length;
    
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%\n`);

    if (passedChecks === totalChecks) {
      console.log('🎉 MCP Configuration is Ready!');
      console.log('\n📋 Critical Servers Status:');
      console.log('• Supabase: ✅ Configured for database operations');
      console.log('• Vercel: ✅ Configured for deployment management');
      console.log('\n🚀 Next Steps:');
      console.log('1. Restart Cursor completely');
      console.log('2. Check MCP panel for available tools');
      console.log('3. Test Supabase database operations');
      console.log('4. Test Vercel deployment features');
      console.log('\n💡 Note: You may need to add a Supabase Personal Access Token');
      console.log('   for full Supabase MCP functionality. Get it from:');
      console.log('   https://supabase.com/dashboard/account/tokens');
    } else {
      console.log('⚠️  Some issues need to be resolved:');
      if (!cursorMCP) console.log('   - Fix Cursor MCP configuration');
      if (!environment) console.log('   - Set up environment variables');
      if (!projectSetup) console.log('   - Complete project MCP setup');
      if (!scripts) console.log('   - Add missing package scripts');
    }

    return {
      total: totalChecks,
      passed: passedChecks,
      success: passedChecks === totalChecks,
      details: {
        cursorMCP,
        environment,
        projectSetup,
        scripts
      }
    };
  }

  /**
   * Run verification
   */
  async run() {
    console.log('🚀 MCP Working Verification\n');
    
    const report = this.generateReport();
    return report;
  }
}

// Main execution
async function main() {
  const verifier = new MCPWorkingVerifier();
  const report = await verifier.run();
  
  process.exit(report.success ? 0 : 1);
}

// Run main function
main().catch(console.error);

export default MCPWorkingVerifier;

