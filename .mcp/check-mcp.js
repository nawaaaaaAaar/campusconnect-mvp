#!/usr/bin/env node

/**
 * MCP Server Checker
 * Verifies that MCP servers are properly configured and accessible
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class MCPChecker {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {};
  }

  /**
   * Test MCP server availability
   */
  async testMCPServer(serverName, command, args, env = {}) {
    return new Promise((resolve) => {
      console.log(`🔍 Testing ${serverName}...`);
      
      const child = spawn(command, args, {
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        const success = code === 0 || output.includes('MCP') || output.includes('Model Context Protocol');
        this.results[serverName] = {
          success,
          code,
          output: output.substring(0, 200),
          error: error.substring(0, 200)
        };
        
        if (success) {
          console.log(`✅ ${serverName}: Available`);
        } else {
          console.log(`❌ ${serverName}: Failed (${code})`);
          if (error) {
            console.log(`   Error: ${error.substring(0, 100)}...`);
          }
        }
        
        resolve(success);
      });

      // Kill the process after 5 seconds
      setTimeout(() => {
        child.kill();
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Check all MCP servers
   */
  async checkAllServers() {
    console.log('🚀 Checking MCP Server Availability...\n');

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
        name: 'postgres',
        command: 'npx',
        args: ['-y', 'enhanced-postgres-mcp-server'],
        env: {
          POSTGRES_URL: 'postgresql://test:test@localhost:5432/test',
          POSTGRES_DATABASE: 'test'
        }
      }
    ];

    for (const server of servers) {
      await this.testMCPServer(server.name, server.command, server.args, server.env);
    }

    return this.results;
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n📊 MCP Server Status Report');
    console.log('============================\n');

    const totalServers = Object.keys(this.results).length;
    const workingServers = Object.values(this.results).filter(r => r.success).length;

    console.log(`Total Servers: ${totalServers}`);
    console.log(`Working Servers: ${workingServers}`);
    console.log(`Success Rate: ${Math.round((workingServers / totalServers) * 100)}%\n`);

    Object.entries(this.results).forEach(([name, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${name}: ${result.success ? 'Working' : 'Failed'}`);
      
      if (!result.success && result.error) {
        console.log(`   Issue: ${result.error.substring(0, 150)}...`);
      }
    });

    console.log('\n💡 Next Steps:');
    if (workingServers === totalServers) {
      console.log('✅ All MCP servers are working! Restart Cursor to see the tools.');
    } else {
      console.log('⚠️  Some servers failed. Check the errors above and fix the configuration.');
      console.log('   - Ensure all required packages are installed');
      console.log('   - Check environment variables and paths');
      console.log('   - Verify network connectivity for external services');
    }

    return {
      total: totalServers,
      working: workingServers,
      success: workingServers === totalServers
    };
  }

  /**
   * Run the complete check
   */
  async run() {
    console.log('🔧 MCP Server Configuration Checker\n');
    
    await this.checkAllServers();
    const report = this.generateReport();
    
    return report;
  }
}

// Main execution
async function main() {
  const checker = new MCPChecker();
  const report = await checker.run();
  
  process.exit(report.success ? 0 : 1);
}

// Run main function
main().catch(console.error);

export default MCPChecker;
