---
description: Search and discover AI prompts from webmcp.land
argument-hint: <query> [--type TYPE] [--category CATEGORY] [--tag TAG]
---

# /webmcp.land:prompts

Search for AI prompts on webmcp.land to find the perfect prompt for your task.

## Usage

```
/webmcp.land:prompts <query>
/webmcp.land:prompts <query> --type IMAGE
/webmcp.land:prompts <query> --category coding
/webmcp.land:prompts <query> --tag productivity
```

- **query**: Keywords to search for (required)
- **--type**: Filter by type (TEXT, STRUCTURED, IMAGE, VIDEO, AUDIO)
- **--category**: Filter by category slug
- **--tag**: Filter by tag slug

## Examples

```
/webmcp.land:prompts code review
/webmcp.land:prompts writing assistant --category writing
/webmcp.land:prompts midjourney --type IMAGE
/webmcp.land:prompts react developer --tag coding
/webmcp.land:prompts data analysis --category productivity
```

## How It Works

1. Calls `search_prompts` with your query and optional filters
2. Returns matching prompts with title, description, author, and tags
3. Each result includes a link to view/copy the full prompt on webmcp.land

## Getting a Specific Prompt

After finding a prompt you like, use its ID to get the full content:

```
/webmcp.land:prompts get <prompt-id>
```

This will retrieve the prompt and prompt you to fill in any variables.

## Saving Prompts

To save a prompt to your webmcp.land account (requires API key):

```
/webmcp.land:prompts save "My Prompt Title" --content "Your prompt content here..."
```

## Improving Prompts

To enhance a prompt using AI:

```
/webmcp.land:prompts improve "Write a story about..."
```

This transforms basic prompts into well-structured, comprehensive ones.
