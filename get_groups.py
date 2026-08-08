#!/usr/bin/env python3
"""
get_groups.py — Fetch all WhatsApp group names and IDs from Evolution API.
Usage: python get_groups.py [search_term]
Example: python get_groups.py "CP HUB"
"""

import sys
import urllib.request
import urllib.error
import json

API_KEY = "WP70guUzQ6mBt3k4qXN5niVrspeFAC1Z"
INSTANCE = "myinstance"
BASE_URL = f"http://localhost:8080/group/fetchAllGroups/{INSTANCE}?getParticipants=false"

def fetch_groups():
    req = urllib.request.Request(BASE_URL, headers={"apikey": API_KEY})
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            return json.loads(res.read().decode())
    except urllib.error.URLError as e:
        print(f"❌ Could not connect to Evolution API: {e}")
        print("   Make sure Docker is running: docker compose up -d")
        sys.exit(1)

def main():
    search = sys.argv[1].lower() if len(sys.argv) > 1 else ""
    print("Fetching groups...\n")
    groups = fetch_groups()

    if search:
        groups = [g for g in groups if search in g.get("subject", "").lower()]
        print(f"Results for '{sys.argv[1]}':\n")

    if not groups:
        print("No groups found.")
        return

    for g in sorted(groups, key=lambda x: x.get("subject", "")):
        print(f"  Name : {g.get('subject', '(no name)')}")
        print(f"  ID   : {g.get('id', '')}")
        print()

if __name__ == "__main__":
    main()
