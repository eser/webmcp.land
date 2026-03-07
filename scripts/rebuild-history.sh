#!/bin/bash

# ONE-TIME SCRIPT: Rebuild resources.csv git history with contributor ownership
# This script will:
# 1. Remove resources.csv from git history
# 2. Recreate it with individual commits for each resource, attributed to their authors
#
# WARNING: This rewrites git history! Only run this once, then delete this script.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CSV_FILE="$PROJECT_DIR/resources.csv"
BACKUP_FILE="$PROJECT_DIR/resources.csv.backup"

echo "=== Rebuild resources.csv History ==="
echo ""
echo "WARNING: This will rewrite git history for resources.csv!"
echo "Make sure you have a backup and coordinate with your team."
echo ""
read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Backup current resources.csv
cp "$CSV_FILE" "$BACKUP_FILE"
echo "Backed up resources.csv to resources.csv.backup"

# Store current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

cd "$PROJECT_DIR"

# Run the Python script to rebuild history
export PROJECT_DIR
python3 << 'PYTHON_SCRIPT'
import csv
import subprocess
import os
import io
import sys

csv.field_size_limit(sys.maxsize)

project_dir = os.environ.get('PROJECT_DIR', '.')
csv_file = os.path.join(project_dir, 'resources.csv')
backup_file = os.path.join(project_dir, 'resources.csv.backup')

# Read all resources from backup (normalize CRLF to LF)
all_resources = []
fieldnames = None
skipped = 0
with open(backup_file, 'r', newline='', encoding='utf-8') as f:
    content = f.read().replace('\r\n', '\n').replace('\r', '\n')
    reader = csv.DictReader(io.StringIO(content))
    fieldnames = reader.fieldnames
    while True:
        try:
            row = next(reader)
            all_resources.append(row)
        except csv.Error as e:
            skipped += 1
            print(f"Skipping row due to CSV error: {e}")
        except StopIteration:
            break

print(f"Found {len(all_resources)} resources to process" + (f" (skipped {skipped})" if skipped else ""))

def get_author(row):
    """Get author from row"""
    return row.get('author', '').strip() or 'anonymous'

# Remove resources.csv from git (but keep the file)
print("\nRemoving resources.csv from git tracking...")
subprocess.run(['git', 'rm', '--cached', csv_file], check=False)

# Create empty CSV with header
print("Creating empty resources.csv with header...")
with open(csv_file, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()

# Commit header
subprocess.run(['git', 'add', csv_file], check=True)
subprocess.run([
    'git', 'commit',
    '-m', 'Initialize resources.csv',
    '--author=f <f@users.noreply.github.com>'
], check=True)

print(f"\nCreating {len(all_resources)} commits with author ownership...")

# Add each resource with proper attribution
for i, row in enumerate(all_resources, 1):
    title = row.get('title', 'Unknown')
    author = get_author(row)
    email = f"{author}@users.noreply.github.com"

    # Append this row to the CSV (only include known fieldnames)
    with open(csv_file, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writerow(row)

    # Stage and commit
    subprocess.run(['git', 'add', csv_file], check=True)

    env = os.environ.copy()
    env['GIT_AUTHOR_NAME'] = author
    env['GIT_AUTHOR_EMAIL'] = email
    env['GIT_COMMITTER_NAME'] = author
    env['GIT_COMMITTER_EMAIL'] = email

    subprocess.run([
        'git', 'commit',
        '-m', f'Add resource: {title}',
        f'--author={author} <{email}>'
    ], env=env, check=True)

    print(f"[{i}/{len(all_resources)}] {author}: {title}")

print(f"\nDone! Created {len(all_resources)} commits with proper author attribution.")
print("\nTo push (force required since history changed):")
print("  git push origin main --force")

PYTHON_SCRIPT

# Clean up backup
rm -f "$BACKUP_FILE"

echo ""
echo "=== History Rebuilt ==="
echo ""
echo "Review with: git log --oneline resources.csv | head -20"
echo ""
echo "To push (FORCE REQUIRED):"
echo "  git push origin main --force"
echo ""
echo "DELETE THIS SCRIPT after use: rm scripts/rebuild-history.sh"
