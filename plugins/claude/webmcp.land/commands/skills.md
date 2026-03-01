---
description: Search and discover Agent Skills from webmcp.land
argument-hint: <query> [--category CATEGORY] [--tag TAG]
---

# /webmcp.land:skills

Search for Agent Skills on webmcp.land to extend Claude's capabilities.

## Usage

```
/webmcp.land:skills <query>
/webmcp.land:skills <query> --category coding
/webmcp.land:skills <query> --tag automation
```

- **query**: Keywords to search for (required)
- **--category**: Filter by category slug
- **--tag**: Filter by tag slug

## Examples

```
/webmcp.land:skills code review
/webmcp.land:skills documentation --category coding
/webmcp.land:skills testing --tag automation
/webmcp.land:skills api integration
/webmcp.land:skills data analysis
```

## How It Works

1. Calls `search_skills` with your query and optional filters
2. Returns matching skills with title, description, author, files, and tags
3. Each result includes a link to view the skill on webmcp.land

## Getting a Specific Skill

After finding a skill you want, use its ID to get all files:

```
/webmcp.land:skills get <skill-id>
```

This retrieves the skill with all its files (SKILL.md, reference docs, scripts, etc.)

## Installing a Skill

To download and install a skill to your workspace:

```
/webmcp.land:skills install <skill-id>
```

This saves the skill files to `.claude/webmcp.land:skills/{slug}/` structure.

## Creating a Skill

To create a new skill on webmcp.land (requires API key):

```
/webmcp.land:skills create "My Skill Title" --description "What this skill does"
```

You'll be prompted to provide the SKILL.md content and any additional files.

## Skill Structure

Skills can contain multiple files:
- **SKILL.md** (required) - Main instructions with frontmatter
- **Reference docs** - Additional documentation
- **Scripts** - Helper scripts (Python, shell, etc.)
- **Config files** - JSON, YAML configurations
