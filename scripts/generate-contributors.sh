#!/bin/bash

# Script to generate contributor commits from resources.csv
# Fetches latest resources from webmcp.land/resources.csv
# Compares with existing resources.csv and creates commits only for new resources

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CSV_FILE="$PROJECT_DIR/resources.csv"
REMOTE_CSV="$PROJECT_DIR/resources.csv.remote"
REMOTE_CSV_URL="https://webmcp.land/resources.csv"

# Fetch latest resources.csv from webmcp.land
echo "Fetching latest resources.csv from $REMOTE_CSV_URL..."
if ! curl -fsSL "$REMOTE_CSV_URL" -o "$REMOTE_CSV"; then
    echo "Error: Failed to fetch resources.csv from $REMOTE_CSV_URL"
    echo "Make sure webmcp.land is running and the endpoint is available."
    exit 1
fi
echo "Successfully fetched remote resources.csv"

# Initialize local CSV if it doesn't exist
if [ ! -f "$CSV_FILE" ]; then
    echo "Local resources.csv not found, initializing with header..."
    head -1 "$REMOTE_CSV" > "$CSV_FILE"
    git add "$CSV_FILE"
    git commit -m "Initialize resources.csv with header" --allow-empty 2>/dev/null || true
fi

echo ""
echo "Comparing local and remote resources.csv..."

# Process diffs and create commits for new resources
export PROJECT_DIR
set +e  # Temporarily allow non-zero exit
python3 << 'PYTHON_SCRIPT'
import csv
import subprocess
import os
import io
import sys
import re

csv.field_size_limit(sys.maxsize)

project_dir = os.environ.get('PROJECT_DIR', '.')
csv_file = os.path.join(project_dir, 'resources.csv')
remote_csv = os.path.join(project_dir, 'resources.csv.remote')

# Read existing local resources (by title as key)
local_resources = {}
fieldnames = None
skipped_local = 0
with open(csv_file, 'r', newline='', encoding='utf-8') as f:
    content = f.read().replace('\r\n', '\n').replace('\r', '\n')
    reader = csv.DictReader(io.StringIO(content))
    fieldnames = reader.fieldnames
    for row in reader:
        try:
            title = row.get('title', '').strip()
            if title:
                local_resources[title] = row
        except csv.Error as e:
            skipped_local += 1
            print(f"Skipping local row due to CSV error: {e}")

print(f"Found {len(local_resources)} existing local resources" + (f" (skipped {skipped_local})" if skipped_local else ""))

# Read remote resources (normalize CRLF to LF)
remote_resources = []
skipped_remote = 0
with open(remote_csv, 'r', newline='', encoding='utf-8') as f:
    content = f.read().replace('\r\n', '\n').replace('\r', '\n')
    reader = csv.DictReader(io.StringIO(content))
    remote_fieldnames = reader.fieldnames
    while True:
        try:
            row = next(reader)
            remote_resources.append(row)
        except csv.Error as e:
            skipped_remote += 1
            print(f"Skipping remote row due to CSV error: {e}")
        except StopIteration:
            break

print(f"Found {len(remote_resources)} remote resources" + (f" (skipped {skipped_remote})" if skipped_remote else ""))

# Use remote fieldnames if local is empty
if not fieldnames:
    fieldnames = remote_fieldnames

# Build set of remote titles for quick lookup
remote_titles = set()
for row in remote_resources:
    title = row.get('title', '').strip()
    if title:
        remote_titles.add(title)

# Find new, updated, and deleted resources
new_resources = []
updated_resources = []
deleted_resources = []

for row in remote_resources:
    title = row.get('title', '').strip()
    if not title:
        continue

    if title not in local_resources:
        new_resources.append(row)
    else:
        local_row = local_resources[title]
        # Check if any field changed
        changed = any(
            row.get(f, '').strip() != local_row.get(f, '').strip()
            for f in ['description', 'endpoint_url', 'server_type', 'status', 'category', 'author']
        )
        if changed:
            updated_resources.append((row, local_row))

for title, local_row in local_resources.items():
    if title not in remote_titles:
        deleted_resources.append(local_row)

print(f"Found {len(new_resources)} new resources to add")
print(f"Found {len(updated_resources)} updated resources to modify")
print(f"Found {len(deleted_resources)} resources to remove (unlisted/deleted)")

# --- Helpers ---

def get_author(row):
    """Get author from row, returns username string"""
    return row.get('author', '').strip() or 'anonymous'

def build_commit_message(action, title):
    """Build commit message"""
    return f'{action} resource: {title}'

def generate_resource_block(row):
    """Generate a single resource's <details> block for RESOURCES.md"""
    title = row.get('title', 'Untitled')
    description = row.get('description', '')
    endpoint_url = row.get('endpoint_url', '')
    server_type = row.get('server_type', 'MCP')
    category = row.get('category', '')
    author = row.get('author', '')
    url = row.get('url', '')

    author_link = f'[@{author}](https://github.com/{author})' if author else '@anonymous'

    block = f'<details>\n'
    block += f'<summary><strong>{title}</strong> ({server_type})</summary>\n\n'
    block += f'## {title}\n\n'
    block += f'{description}\n\n' if description else ''
    block += f'- **Type:** {server_type}\n'
    block += f'- **Endpoint:** `{endpoint_url}`\n'
    if category:
        block += f'- **Category:** {category}\n'
    block += f'- **Author:** {author_link}\n'
    if url:
        block += f'- **Details:** [{url}]({url})\n'
    block += f'\n</details>\n\n'
    return block

def init_resources_md(resources_md_path):
    """Initialize RESOURCES.md with header if it doesn't exist"""
    if not os.path.exists(resources_md_path):
        with open(resources_md_path, 'w', encoding='utf-8') as f:
            f.write('# webmcp.land\n\n')
            f.write('> A curated registry of MCP/WebMCP resources, tools, and prompts.\n\n')
            f.write('For full details including tools, methods, and use cases, visit the resource page on [webmcp.land](https://webmcp.land).\n\n')
            f.write('---\n\n')

def append_resource_to_md(row, resources_md_path):
    """Append a new resource block to RESOURCES.md"""
    init_resources_md(resources_md_path)
    block = generate_resource_block(row)
    with open(resources_md_path, 'a', encoding='utf-8') as f:
        f.write(block)

def update_resource_in_md(row, resources_md_path):
    """Update an existing resource's block in RESOURCES.md"""
    title = row.get('title', '')
    if not os.path.exists(resources_md_path):
        append_resource_to_md(row, resources_md_path)
        return

    with open(resources_md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = rf'<details>\n<summary><strong>{re.escape(title)}</strong>.*?</details>\n\n'
    new_block = generate_resource_block(row)
    new_content, count = re.subn(pattern, new_block, content, flags=re.DOTALL)

    if count > 0:
        with open(resources_md_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
    else:
        append_resource_to_md(row, resources_md_path)

def remove_resource_from_md(title, resources_md_path):
    """Remove a resource's block from RESOURCES.md"""
    if not os.path.exists(resources_md_path):
        return

    with open(resources_md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = rf'<details>\n<summary><strong>{re.escape(title)}</strong>.*?</details>\n\n'
    new_content = re.sub(pattern, '', content, flags=re.DOTALL)

    with open(resources_md_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

# --- Main processing ---

resources_md_path = os.path.join(project_dir, 'RESOURCES.md')

if not new_resources and not updated_resources and not deleted_resources:
    print("\nNo CSV changes detected. Already up to date!")
else:
    if updated_resources:
        print("\nApplying updates to existing resources...")

        for i, (remote_row, local_row) in enumerate(updated_resources, 1):
            title = remote_row.get('title', '').strip()
            author = get_author(remote_row)

            local_resources[title] = remote_row

            with open(csv_file, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for row in remote_resources:
                    row_title = row.get('title', '').strip()
                    if row_title in local_resources:
                        writer.writerow(local_resources[row_title])

            update_resource_in_md(remote_row, resources_md_path)

            email = f"{author}@users.noreply.github.com"
            subprocess.run(['git', 'add', csv_file, resources_md_path], check=True)

            diff_result = subprocess.run(['git', 'diff', '--cached', '--quiet'], capture_output=True)
            if diff_result.returncode == 0:
                print(f"[UPDATE {i}/{len(updated_resources)}] {title} - no changes, skipping")
                continue

            env = os.environ.copy()
            env['GIT_AUTHOR_NAME'] = author
            env['GIT_AUTHOR_EMAIL'] = email
            env['GIT_COMMITTER_NAME'] = author
            env['GIT_COMMITTER_EMAIL'] = email

            subprocess.run([
                'git', 'commit',
                '-m', build_commit_message('Update', title),
                f'--author={author} <{email}>'
            ], env=env, check=True)

            print(f"[UPDATE {i}/{len(updated_resources)}] {author}: {title}")

    if new_resources:
        print("\nCreating commits for new resources...")

        for i, row in enumerate(new_resources, 1):
            title = row.get('title', 'Unknown')
            author = get_author(row)
            email = f"{author}@users.noreply.github.com"

            with open(csv_file, 'a', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writerow(row)

            local_resources[title] = row
            append_resource_to_md(row, resources_md_path)

            subprocess.run(['git', 'add', csv_file, resources_md_path], check=True)

            diff_result = subprocess.run(['git', 'diff', '--cached', '--quiet'], capture_output=True)
            if diff_result.returncode == 0:
                print(f"[NEW {i}/{len(new_resources)}] {title} - no changes, skipping")
                continue

            env = os.environ.copy()
            env['GIT_AUTHOR_NAME'] = author
            env['GIT_AUTHOR_EMAIL'] = email
            env['GIT_COMMITTER_NAME'] = author
            env['GIT_COMMITTER_EMAIL'] = email

            subprocess.run([
                'git', 'commit',
                '-m', build_commit_message('Add', title),
                f'--author={author} <{email}>'
            ], env=env, check=True)

            print(f"[NEW {i}/{len(new_resources)}] {author}: {title}")

    if deleted_resources:
        print("\nRemoving unlisted/deleted resources...")

        for i, row in enumerate(deleted_resources, 1):
            title = row.get('title', 'Unknown')
            author = get_author(row)
            email = f"{author}@users.noreply.github.com"

            if title in local_resources:
                del local_resources[title]

            with open(csv_file, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for remaining_title, remaining_row in local_resources.items():
                    writer.writerow(remaining_row)

            remove_resource_from_md(title, resources_md_path)

            subprocess.run(['git', 'add', csv_file, resources_md_path], check=True)

            diff_result = subprocess.run(['git', 'diff', '--cached', '--quiet'], capture_output=True)
            if diff_result.returncode == 0:
                print(f"[REMOVE {i}/{len(deleted_resources)}] {title} - no changes, skipping")
                continue

            env = os.environ.copy()
            env['GIT_AUTHOR_NAME'] = author
            env['GIT_AUTHOR_EMAIL'] = email
            env['GIT_COMMITTER_NAME'] = author
            env['GIT_COMMITTER_EMAIL'] = email

            subprocess.run([
                'git', 'commit',
                '-m', build_commit_message('Remove', title),
                f'--author={author} <{email}>'
            ], env=env, check=True)

            print(f"[REMOVE {i}/{len(deleted_resources)}] {author}: {title}")

    print(f"\nDone! Created {len(new_resources)} new, {len(updated_resources)} update, {len(deleted_resources)} remove commits.")

PYTHON_SCRIPT
PYTHON_EXIT=$?
set -e  # Re-enable exit on error

# Clean up
rm -f "$REMOTE_CSV"

# Check for actual Python errors
if [ $PYTHON_EXIT -ne 0 ]; then
    echo "Error: Script failed with exit code $PYTHON_EXIT"
    exit 1
fi

echo ""
echo "Review with: git log --oneline resources.csv RESOURCES.md"
echo ""
echo "To push: git push origin main"
