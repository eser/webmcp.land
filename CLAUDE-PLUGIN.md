# Claude Code Plugin

Access webmcp.land directly in [Claude Code](https://code.claude.com) with our official plugin. Search MCP resources, discover skills, and manage your registry without leaving your IDE.

## Installation

Add the webmcp.land marketplace to Claude Code:

```
/plugin marketplace add eser/webmcp.land
```

Then install the plugin:

```
/plugin install webmcp.land@webmcp.land
```

## Features

| Feature | Description |
|---------|-------------|
| **MCP Server** | Connect to webmcp.land API for real-time resource access |
| **Commands** | `/webmcp.land:prompts` and `/webmcp.land:skills` slash commands |
| **Agents** | Resource Manager and Skill Manager agents for complex workflows |
| **Skills** | Auto-activating skills for resource and skill discovery |

## Commands

### Search Resources

```
/webmcp.land:prompts <query>
/webmcp.land:prompts <query> --category devtools
/webmcp.land:prompts <query> --tag automation
```

**Examples:**
```
/webmcp.land:prompts code review
/webmcp.land:prompts payment gateway --category finance
/webmcp.land:prompts docker management --tag devops
```

### Search Skills

```
/webmcp.land:skills <query>
/webmcp.land:skills <query> --category coding
/webmcp.land:skills <query> --tag automation
```

**Examples:**
```
/webmcp.land:skills testing automation
/webmcp.land:skills documentation --category coding
/webmcp.land:skills api integration
```

## MCP Tools

The plugin provides these tools via the webmcp.land MCP server:

### Resource Tools

| Tool | Description |
|------|-------------|
| `search_resources` | Search resources by keyword, category, or tag |
| `get_resource` | Retrieve a resource's details and capabilities |
| `save_resource` | Register a new resource (requires API key) |

### Skill Tools

| Tool | Description |
|------|-------------|
| `search_skills` | Search for Agent Skills |
| `get_skill` | Get a skill with all its files |
| `save_skill` | Create multi-file skills (requires API key) |
| `add_file_to_skill` | Add a file to an existing skill |
| `update_skill_file` | Update a file in a skill |
| `remove_file_from_skill` | Remove a file from a skill |

## Agents

### Resource Manager

The `prompt-manager` agent helps you:
- Search for MCP/WebMCP resources across webmcp.land
- Get resource details and capabilities
- Register new resources to your account

### Skill Manager

The `skill-manager` agent helps you:
- Search for Agent Skills
- Get and install skills to your workspace
- Create new skills with multiple files
- Manage skill file contents

## Skills (Auto-Activating)

### Resource Lookup

Automatically activates when you:
- Ask for MCP service templates
- Want to search for resources
- Need to discover MCP capabilities
- Mention webmcp.land

### Skill Lookup

Automatically activates when you:
- Ask for Agent Skills
- Want to extend Claude's capabilities
- Need to install a skill
- Mention skills for Claude

## Authentication

To register resources and skills, you need an API key from [webmcp.land/settings](https://webmcp.land/settings).

### Option 1: Environment Variable

Set the `WEBMCP_API_KEY` environment variable:

```bash
export WEBMCP_API_KEY=your_api_key_here
```

### Option 2: MCP Header

Add the header when connecting to the MCP server:

```
WEBMCP_API_KEY: your_api_key_here
```

## Plugin Structure

```
plugins/claude/webmcp.land/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── .mcp.json                 # MCP server configuration
├── commands/
│   ├── prompts.md           # /webmcp.land:prompts command
│   └── skills.md            # /webmcp.land:skills command
├── agents/
│   ├── prompt-manager.md    # Resource management agent
│   └── skill-manager.md     # Skill management agent
└── skills/
    ├── prompt-lookup/
    │   └── SKILL.md         # Resource discovery skill
    └── skill-lookup/
        └── SKILL.md         # Skill discovery skill
```

## Links

- **[webmcp.land](https://webmcp.land)** - Browse all resources and skills
- **[API Documentation](https://webmcp.land/docs/api)** - API and MCP server docs
- **[Settings](https://webmcp.land/settings)** - Get your API key
