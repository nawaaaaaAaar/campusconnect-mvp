#!/usr/bin/env node

/**
 * MCP Server Verification Script
 * Tests each MCP server individually to verify they're working
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class MCPServerVerifier {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {};
  }

  /**
   * Test individual MCP server
   */
  async testServer(serverName, command, args, env = {}) {
    return new Promise((resolve) => {
      console.log(`🔍 Testing ${serverName} server...`);
      
      const child = spawn(command, args, {
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';
      let hasStarted = false;

      child.stdout.on('data', (data) => {
        output += data.toString();
        if (data.toString().includes('MCP') || data.toString().includes('server') || data.toString().includes('listening')) {
          hasStarted = true;
        }
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        const success = hasStarted || code === 0 || output.includes('MCP') || output.includes('server');
        this.results[serverName] = {
          success,
          code,
          hasStarted,
          output: output.substring(0, 300),
          error: error.substring(0, 300)
        };
        
        if (success) {
          console.log(`✅ ${serverName}: Working`);
        } else {
          console.log(`❌ ${serverName}: Failed`);
          if (error) {
            console.log(`   Error: ${error.substring(0, 100)}...`);
          }
        }
        
        resolve(success);
      });

      // Kill the process after 3 seconds
      setTimeout(() => {
        if (!child.killed) {
          child.kill();
          resolve(hasStarted);
        }
      }, 3000);
    });
  }

  /**
   * Test all MCP servers
   */
  async testAllServers() {
    console.log('🚀 Verifying MCP Server Functionality...\n');

    const servers = [
      {
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: {
          ALLOWED_DIRECTORIES: this.projectRoot
        }
      },
      {
        name: 'terminal',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-terminal'],
        env: {
          ALLOWED_COMMANDS: 'npm,node,git,ls,cat,echo'
        }
      },
      {
        name: 'supabase',
        command: 'npx',
        args: ['-y', '@supabase/mcp-server-supabase'],
        env: {
          SUPABASE_URL: 'https://egdavxjkyxvawgguqmvx.supabase.co',
          SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZGF2eGpreXh2YXdnZ3VxbXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTMzNDQsImV4cCI6MjA3MTUyOTM0NH0.TeY_4HnYLDyC6DUNJfmCFrmkjjwIneNoctwFxocFfq4'
        }
      },
      {
        name: 'postgres',
        command: 'npx',
        args: ['-y', 'enhanced-postgres-mcp-server'],
        env: {
          POSTGRES_URL: 'postgresql://postgres.egdavxjkyxvawgguqmvx:TeY_4HnYLDyC6DUNJfmCFrmkjjwIneNoctwFxocFfq4@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
          POSTGRES_DATABASE: 'postgres'
        }
      },
      {
        name: 'sentry',
        command: 'npx',
        args: ['-y', '@sentry/mcp-server'],
        env: {
          SENTRY_DSN: 'https://test@sentry.io/test'
        }
      },
      {
        name: 'sequential-thinking',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking']
      },
      {
        name: 'memory',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        env: {
          MEMORY_STORAGE_PATH: path.join(this.projectRoot, '.mcp', 'memory')
        }
      },
      {
        name: 'vercel',
        command: 'npx',
        args: ['-y', '@mistertk/vercel-mcp'],
        env: {
          VERCEL_TOKEN: '7PeH2zVcgyOCpj55uoGcpeKk',
          VERCEL_PROJECT_ID: 'prj_zvKJbTZEbiIR2Fp6hnEm4VYh4VLP'
        }
      },
      {
        name: 'playwright',
        command: 'npx',
        args: ['-y', '@playwright/mcp'],
        env: {
          PLAYWRIGHT_BASE_URL: 'http://localhost:5173',
          PLAYWRIGHT_TEST_PATH: path.join(this.projectRoot, 'tests')
        }
      }
    ];

    for (const server of servers) {
      await this.testServer(server.name, server.command, server.args, server.env);
    }

    return this.results;
  }

  /**
   * Generate verification report
   */
  generateReport() {
    console.log('\n📊 MCP Server Verification Report');
    console.log('==================================\n');

    const totalServers = Object.keys(this.results).length;
    const workingServers = Object.values(this.results).filter(r => r.success).length;

    console.log(`Total Servers: ${totalServers}`);
    console.log(`Working Servers: ${workingServers}`);
    console.log(`Success Rate: ${Math.round((workingServers / totalServers) * 100)}%\n`);

    console.log('📋 Detailed Results:');
    console.log('====================');
    
    Object.entries(this.results).forEach(([name, result]) => {
      const status = result.success ? '✅' : '❌';
      const statusText = result.success ? 'Working' : 'Failed';
      
      console.log(`${status} ${name}: ${statusText}`);
      
      if (!result.success) {
        if (result.error) {
          console.log(`   Error: ${result.error.substring(0, 150)}...`);
        }
        if (result.code !== 0) {
          console.log(`   Exit Code: ${result.code}`);
        }
      }
    });

    console.log('\n💡 Recommendations:');
    if (workingServers === totalServers) {
      console.log('🎉 All MCP servers are working perfectly!');
      console.log('   - Restart Cursor to see all tools available');
      console.log('   - You can now use all MCP functionality');
    } else {
      console.log('⚠️  Some servers need attention:');
      Object.entries(this.results).forEach(([name, result]) => {
        if (!result.success) {
          console.log(`   - ${name}: Check configuration and dependencies`);
        }
      });
    }

    return {
      total: totalServers,
      working: workingServers,
      success: workingServers === totalServers,
      results: this.results
    };
  }

  /**
   * Run complete verification
   */
  async run() {
    console.log('🔧 MCP Server Verification Tool\n');
    
    await this.testAllServers();
    const report = this.generateReport();
    
    return report;
  }
}

// Main execution
async function main() {
  const verifier = new MCPServerVerifier();
  const report = await verifier.run();
  
  process.exit(report.success ? 0 : 1);
}

// Run main function
main().catch(console.error);

export default MCPServerVerifier;

