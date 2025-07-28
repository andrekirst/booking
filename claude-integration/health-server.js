#!/usr/bin/env node

/**
 * Claude Sub-Agent Health Check Server
 * Provides health endpoint for Docker container monitoring
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const AGENT_ROLE = process.env.CLAUDE_AGENT_ROLE || 'unknown';
const SUB_AGENT_ID = process.env.CLAUDE_SUB_AGENT_ID || 'unknown';

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        sub_agent: {
            id: SUB_AGENT_ID,
            role: AGENT_ROLE,
            workspace: process.env.CLAUDE_WORKSPACE || '/workspace'
        },
        services: {
            frontend_url: process.env.FRONTEND_URL,
            backend_url: process.env.BACKEND_URL,
            database_url: process.env.DATABASE_URL ? 'configured' : 'not configured'
        },
        uptime: process.uptime()
    };

    res.json(health);
});

// Agent status endpoint
app.get('/agent/status', (req, res) => {
    const status = {
        agent_id: SUB_AGENT_ID,
        role: AGENT_ROLE,
        specializations: getAgentSpecializations(AGENT_ROLE),
        workspace_info: {
            current_branch: getCurrentBranch(),
            workspace_files: getWorkspaceStats()
        },
        container_info: {
            hostname: require('os').hostname(),
            platform: require('os').platform(),
            memory: process.memoryUsage(),
            pid: process.pid
        }
    };

    res.json(status);
});

// Agent capabilities endpoint
app.get('/agent/capabilities', (req, res) => {
    const capabilities = getAgentCapabilities(AGENT_ROLE);
    res.json(capabilities);
});

// Workspace info endpoint
app.get('/workspace/info', (req, res) => {
    const workspace = process.env.CLAUDE_WORKSPACE || '/workspace';
    
    try {
        const info = {
            path: workspace,
            exists: fs.existsSync(workspace),
            git_repository: fs.existsSync(path.join(workspace, '.git')),
            package_json: fs.existsSync(path.join(workspace, 'package.json')),
            claude_md: fs.existsSync(path.join(workspace, 'CLAUDE.md')),
            current_branch: getCurrentBranch(workspace)
        };
        
        res.json(info);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
function getCurrentBranch(workspace = '/workspace') {
    try {
        const headPath = path.join(workspace, '.git', 'HEAD');
        if (fs.existsSync(headPath)) {
            const head = fs.readFileSync(headPath, 'utf8').trim();
            if (head.startsWith('ref: refs/heads/')) {
                return head.replace('ref: refs/heads/', '');
            }
        }
    } catch (error) {
        console.warn('Could not determine git branch:', error.message);
    }
    return 'unknown';
}

function getWorkspaceStats() {
    const workspace = process.env.CLAUDE_WORKSPACE || '/workspace';
    try {
        const files = fs.readdirSync(workspace, { withFileTypes: true });
        return {
            total_items: files.length,
            directories: files.filter(f => f.isDirectory()).length,
            files: files.filter(f => f.isFile()).length
        };
    } catch (error) {
        return { error: error.message };
    }
}

function getAgentSpecializations(role) {
    const specializations = {
        'senior-developer': ['architecture', 'performance', 'code-review', 'mentoring'],
        'ui-developer': ['react', 'tailwind', 'responsive-design', 'components'],
        'ux-expert': ['usability', 'accessibility', 'user-journey', 'interaction-design'],
        'test-expert': ['unit-testing', 'integration-testing', 'e2e-testing', 'automation'],
        'architecture-expert': ['system-design', 'database-design', 'scalability', 'patterns'],
        'devops-expert': ['ci-cd', 'docker', 'infrastructure', 'monitoring']
    };
    
    return specializations[role] || ['general-development'];
}

function getAgentCapabilities(role) {
    const capabilities = {
        'senior-developer': {
            primary_skills: ['Code Architecture', 'Performance Optimization', 'Complex Problem Solving'],
            tools: ['Design Patterns', 'Refactoring', 'Code Review'],
            focus_areas: ['System Design', 'Technical Leadership', 'Best Practices']
        },
        'ui-developer': {
            primary_skills: ['React/Next.js', 'Tailwind CSS', 'Component Development'],
            tools: ['Storybook', 'Design Systems', 'Responsive Design'],
            focus_areas: ['User Interface', 'Frontend Performance', 'Component Libraries']
        },
        'ux-expert': {
            primary_skills: ['User Experience Design', 'Accessibility', 'Usability Testing'],
            tools: ['WCAG Guidelines', 'User Journey Mapping', 'Interaction Patterns'],
            focus_areas: ['User Research', 'Information Architecture', 'Inclusive Design']
        },
        'test-expert': {
            primary_skills: ['Test Strategy', 'Automation', 'Quality Assurance'],
            tools: ['Jest', 'Playwright', 'xUnit', 'Test Frameworks'],
            focus_areas: ['Test Coverage', 'CI/CD Integration', 'Quality Metrics']
        },
        'architecture-expert': {
            primary_skills: ['System Architecture', 'Database Design', 'Scalability'],
            tools: ['Event Sourcing', 'CQRS', 'Microservices', 'Performance Profiling'],
            focus_areas: ['Distributed Systems', 'Data Architecture', 'Performance']
        },
        'devops-expert': {
            primary_skills: ['CI/CD', 'Infrastructure', 'Deployment'],
            tools: ['Docker', 'GitHub Actions', 'Monitoring', 'IaC'],
            focus_areas: ['Automation', 'Observability', 'Release Management']
        }
    };
    
    return capabilities[role] || {
        primary_skills: ['General Development'],
        tools: ['Standard Development Tools'],
        focus_areas: ['Feature Implementation']
    };
}

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 Claude Sub-Agent ${SUB_AGENT_ID} (${AGENT_ROLE}) Health Server running on port ${PORT}`);
    console.log(`📊 Health endpoint: http://localhost:${PORT}/health`);
    console.log(`🔍 Status endpoint: http://localhost:${PORT}/agent/status`);
    console.log(`⚡ Capabilities endpoint: http://localhost:${PORT}/agent/capabilities`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    process.exit(0);
});