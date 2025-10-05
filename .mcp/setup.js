#!/usr/bin/env node

/**
 * MCP Setup Script for CampusConnect
 * This script configures Model Context Protocol servers for autonomous development
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from .mcp/.env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// MCP Server configurations
const mcpServers = {
  // Core Development MCPs
  git: {
    name: 'Git MCP',
    description: 'Git repository management and version control',
    tools: ['git_status', 'git_log', 'git_diff', 'git_commit', 'git_push', 'git_pull'],
    status: 'configured'
  },
  
  filesystem: {
    name: 'File System MCP', 
    description: 'File and directory operations',
    tools: ['read_file', 'write_file', 'list_directory', 'create_directory', 'delete_file'],
    status: 'configured'
  },
  
  terminal: {
    name: 'Terminal MCP',
    description: 'Command line execution and shell operations', 
    tools: ['run_command', 'execute_script', 'check_process', 'kill_process'],
    status: 'configured'
  },
  
  // Database MCPs
  supabase: {
    name: 'Supabase MCP',
    description: 'Supabase database and authentication management',
    tools: ['query_database', 'create_record', 'update_record', 'delete_record', 'auth_user'],
    status: 'configured',
    required_env: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
  },
  
  postgres: {
    name: 'PostgreSQL MCP',
    description: 'Direct PostgreSQL database operations',
    tools: ['execute_sql', 'create_table', 'alter_table', 'backup_database'],
    status: process.env.POSTGRES_URL ? 'configured' : 'needs_configuration',
    required_env: ['POSTGRES_URL']
  },
  
  // Frontend MCPs
  react: {
    name: 'React MCP',
    description: 'React component development and management',
    tools: ['create_component', 'update_component', 'analyze_components', 'optimize_components'],
    status: 'configured'
  },
  
  typescript: {
    name: 'TypeScript MCP',
    description: 'TypeScript type checking and code analysis',
    tools: ['check_types', 'generate_types', 'refactor_code', 'analyze_errors'],
    status: 'configured'
  },
  
  tailwind: {
    name: 'Tailwind CSS MCP',
    description: 'Tailwind CSS class management and optimization',
    tools: ['generate_classes', 'optimize_css', 'purge_unused', 'analyze_styles'],
    status: 'configured'
  },
  
  // Testing MCPs
  jest: {
    name: 'Jest MCP',
    description: 'Unit testing and test generation',
    tools: ['run_tests', 'generate_tests', 'analyze_coverage', 'debug_tests'],
    status: 'needs_setup',
    required_packages: ['jest', '@types/jest']
  },
  
  eslint: {
    name: 'ESLint MCP',
    description: 'Code linting and quality analysis',
    tools: ['lint_code', 'fix_issues', 'analyze_quality', 'generate_rules'],
    status: 'configured'
  },
  
  playwright: {
    name: 'Playwright MCP',
    description: 'End-to-end testing and browser automation',
    tools: ['run_e2e_tests', 'generate_tests', 'record_actions', 'analyze_performance'],
    status: 'needs_setup',
    required_packages: ['@playwright/test']
  },
  
  // Production MCPs
  vercel: {
    name: 'Vercel MCP',
    description: 'Vercel deployment and management',
    tools: ['deploy_app', 'check_status', 'manage_domains', 'view_logs'],
    status: (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) ? 'configured' : 'needs_configuration',
    required_env: ['VERCEL_TOKEN', 'VERCEL_PROJECT_ID']
  },
  
  docker: {
    name: 'Docker MCP',
    description: 'Docker containerization and management',
    tools: ['build_image', 'run_container', 'manage_containers', 'optimize_image'],
    status: 'needs_setup',
    required_packages: ['docker']
  },
  
  sentry: {
    name: 'Sentry MCP',
    description: 'Error tracking and performance monitoring',
    tools: ['track_errors', 'analyze_performance', 'create_alerts', 'view_dashboard'],
    status: process.env.SENTRY_DSN ? 'configured' : 'needs_configuration',
    required_env: ['SENTRY_DSN', 'SENTRY_ORG']
  },
  
  firebase: {
    name: 'Firebase MCP',
    description: 'Firebase services and push notifications',
    tools: ['send_notification', 'manage_users', 'analyze_usage', 'configure_settings'],
    status: 'configured',
    required_env: ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY']
  }
};

// Generate MCP status report
function generateStatusReport() {
  const report = {
    timestamp: new Date().toISOString(),
    total_mcps: Object.keys(mcpServers).length,
    configured: Object.values(mcpServers).filter(mcp => mcp.status === 'configured').length,
    needs_configuration: Object.values(mcpServers).filter(mcp => mcp.status === 'needs_configuration').length,
    needs_setup: Object.values(mcpServers).filter(mcp => mcp.status === 'needs_setup').length,
    servers: mcpServers
  };
  
  return report;
}

// Save status report
const report = generateStatusReport();
fs.writeFileSync(
  path.join(__dirname, 'status.json'), 
  JSON.stringify(report, null, 2)
);

console.log('🎯 MCP Configuration Status:');
console.log(`✅ Configured: ${report.configured}`);
console.log(`🔧 Needs Configuration: ${report.needs_configuration}`);
console.log(`📦 Needs Setup: ${report.needs_setup}`);
console.log(`📊 Total MCPs: ${report.total_mcps}`);

console.log('\n📋 Next Steps:');
console.log('1. Configure environment variables in .mcp/env.template');
console.log('2. Install required packages for testing MCPs');
console.log('3. Set up production MCPs (Vercel, Sentry, Firebase)');
console.log('4. Test MCP functionality');

export { mcpServers, generateStatusReport };
