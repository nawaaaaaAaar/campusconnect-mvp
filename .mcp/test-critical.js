#!/usr/bin/env node

/**
 * Critical MCP Servers Test
 * Focus on Supabase and Vercel - the most important for the project
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class CriticalMCPTest {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {};
  }

  /**
   * Test Supabase MCP server
   */
  async testSupabase() {
    console.log('🔍 Testing Supabase MCP Server...');
    
    return new Promise((resolve) => {
      const child = spawn('npx.cmd', ['-y', '@supabase/mcp-server-supabase'], {
        shell: true,
        env: {
          ...process.env,
          SUPABASE_URL: 'https://egdavxjkyxvawgguqmvx.supabase.co',
          SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZGF2eGpreXh2YXdnZ3VxbXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTMzNDQsImV4cCI6MjA3MTUyOTM0NH0.TeY_4HnYLDyC6DUNJfmCFrmkjjwIneNoctwFxocFfq4'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';
      let hasStarted = false;

      child.stdout.on('data', (data) => {
        output += data.toString();
        if (data.toString().includes('MCP') || data.toString().includes('server') || data.toString().includes('Supabase')) {
          hasStarted = true;
        }
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        const success = hasStarted || code === 0;
        this.results.supabase = {
          success,
          code,
          hasStarted,
          output: output.substring(0, 200),
          error: error.substring(0, 200)
        };
        
        if (success) {
          console.log('✅ Supabase MCP: Working');
        } else {
          console.log('❌ Supabase MCP: Failed');
          if (error) {
            console.log(`   Error: ${error.substring(0, 100)}...`);
          }
        }
        
        resolve(success);
      });

      // Kill after 5 seconds
      setTimeout(() => {
        if (!child.killed) {
          child.kill();
          resolve(hasStarted);
        }
      }, 5000);
    });
  }

  /**
   * Test Vercel MCP server
   */
  async testVercel() {
    console.log('🔍 Testing Vercel MCP Server...');
    
    return new Promise((resolve) => {
      const child = spawn('npx.cmd', ['-y', '@mistertk/vercel-mcp'], {
        shell: true,
        env: {
          ...process.env,
          VERCEL_TOKEN: '7PeH2zVcgyOCpj55uoGcpeKk',
          VERCEL_PROJECT_ID: 'prj_zvKJbTZEbiIR2Fp6hnEm4VYh4VLP'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';
      let hasStarted = false;

      child.stdout.on('data', (data) => {
        output += data.toString();
        if (data.toString().includes('MCP') || data.toString().includes('server') || data.toString().includes('Vercel')) {
          hasStarted = true;
        }
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        const success = hasStarted || code === 0;
        this.results.vercel = {
          success,
          code,
          hasStarted,
          output: output.substring(0, 200),
          error: error.substring(0, 200)
        };
        
        if (success) {
          console.log('✅ Vercel MCP: Working');
        } else {
          console.log('❌ Vercel MCP: Failed');
          if (error) {
            console.log(`   Error: ${error.substring(0, 100)}...`);
          }
        }
        
        resolve(success);
      });

      // Kill after 5 seconds
      setTimeout(() => {
        if (!child.killed) {
          child.kill();
          resolve(hasStarted);
        }
      }, 5000);
    });
  }

  /**
   * Test basic MCP servers
   */
  async testBasicServers() {
    console.log('🔍 Testing Basic MCP Servers...');
    
    const basicServers = [
      {
        name: 'filesystem',
        command: 'npx.cmd',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: { ALLOWED_DIRECTORIES: this.projectRoot }
      },
      {
        name: 'terminal',
        command: 'npx.cmd',
        args: ['-y', '@modelcontextprotocol/server-terminal'],
        env: { ALLOWED_COMMANDS: 'npm,node,git,ls,cat,echo' }
      }
    ];

    for (const server of basicServers) {
      await this.testServer(server.name, server.command, server.args, server.env);
    }
  }

  /**
   * Test individual server
   */
  async testServer(name, command, args, env = {}) {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';
      let hasStarted = false;

      child.stdout.on('data', (data) => {
        output += data.toString();
        if (data.toString().includes('MCP') || data.toString().includes('server')) {
          hasStarted = true;
        }
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        const success = hasStarted || code === 0;
        this.results[name] = {
          success,
          code,
          hasStarted,
          output: output.substring(0, 200),
          error: error.substring(0, 200)
        };
        
        if (success) {
          console.log(`✅ ${name}: Working`);
        } else {
          console.log(`❌ ${name}: Failed`);
        }
        
        resolve(success);
      });

      setTimeout(() => {
        if (!child.killed) {
          child.kill();
          resolve(hasStarted);
        }
      }, 3000);
    });
  }

  /**
   * Generate critical test report
   */
  generateReport() {
    console.log('\n📊 Critical MCP Servers Test Report');
    console.log('====================================\n');

    const criticalServers = ['supabase', 'vercel'];
    const basicServers = ['filesystem', 'terminal'];
    
    const criticalWorking = criticalServers.filter(name => this.results[name]?.success).length;
    const basicWorking = basicServers.filter(name => this.results[name]?.success).length;

    console.log('🎯 Critical Servers (Supabase & Vercel):');
    console.log(`   Working: ${criticalWorking}/${criticalServers.length}`);
    
    criticalServers.forEach(name => {
      const result = this.results[name];
      const status = result?.success ? '✅' : '❌';
      console.log(`   ${status} ${name}: ${result?.success ? 'Working' : 'Failed'}`);
    });

    console.log('\n🔧 Basic Servers:');
    console.log(`   Working: ${basicWorking}/${basicServers.length}`);
    
    basicServers.forEach(name => {
      const result = this.results[name];
      const status = result?.success ? '✅' : '❌';
      console.log(`   ${status} ${name}: ${result?.success ? 'Working' : 'Failed'}`);
    });

    console.log('\n💡 Status:');
    if (criticalWorking === criticalServers.length) {
      console.log('🎉 Critical MCP servers are working!');
      console.log('   - Supabase: Ready for database operations');
      console.log('   - Vercel: Ready for deployment management');
      console.log('\n📋 Next Steps:');
      console.log('1. Restart Cursor completely');
      console.log('2. Check MCP panel for Supabase and Vercel tools');
      console.log('3. Test database operations and deployment features');
    } else {
      console.log('⚠️  Critical servers need attention:');
      criticalServers.forEach(name => {
        if (!this.results[name]?.success) {
          console.log(`   - ${name}: Check configuration and credentials`);
        }
      });
    }

    return {
      criticalWorking,
      basicWorking,
      totalCritical: criticalServers.length,
      totalBasic: basicServers.length,
      success: criticalWorking === criticalServers.length
    };
  }

  /**
   * Run critical tests
   */
  async run() {
    console.log('🚀 Testing Critical MCP Servers\n');
    
    // Test critical servers first
    await this.testSupabase();
    await this.testVercel();
    
    // Test basic servers
    await this.testBasicServers();
    
    const report = this.generateReport();
    return report;
  }
}

// Main execution
async function main() {
  const tester = new CriticalMCPTest();
  const report = await tester.run();
  
  process.exit(report.success ? 0 : 1);
}

// Run main function
main().catch(console.error);

export default CriticalMCPTest;
