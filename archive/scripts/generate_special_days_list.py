import json
import os
import re
from datetime import datetime

INPUT_TITHI_FILE = "tithis_2024_2030_basic.json"
OUTPUT_SPECIAL_DAYS_FILE = "upcoming_special_days_data.json"

# Regex to identify generic "Paksha TithiName" entries (adjust if needed)
# Matches things like "Shukla Pratipada", "Krishna Ashtami", etc.
# It assumes Tithi names are standard sanskrit words (\w+)
GENERIC_TITHI_PATTERN = re.compile(r"^(Shukla|Krishna)\s+\w+$")

def is_special_day(full_name):
    """
    Determines if a tithi entry represents a special day/festival.
    Returns True if the name does NOT match the generic pattern.
    """
    if not full_name:
        return False
    return not bool(GENERIC_TITHI_PATTERN.match(full_name))

def generate_special_days_list():
    """
    Reads the main Tithi data file, filters for special days,
    and saves them to a new JSON file.
    """
    if not os.path.exists(INPUT_TITHI_FILE):
        print(f"Error: Input file '{INPUT_TITHI_FILE}' not found.")
        return

    try:
        with open(INPUT_TITHI_FILE, 'r', encoding='utf-8') as f:
            all_tithi_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from '{INPUT_TITHI_FILE}': {e}")
        return
    except Exception as e:
        print(f"Error reading '{INPUT_TITHI_FILE}': {e}")
        return

    special_days_list = []
    processed_dates = set() # To avoid duplicates if a festival spans multiple tithi categories

    print(f"Filtering special days from {INPUT_TITHI_FILE}...")

    # Iterate through years (e.g., "2025", "2026", ...)
    for year, year_data in all_tithi_data.items():
        # Iterate through tithi types (e.g., "Pratipada", "Purnima", ...)
        for tithi_type, entries in year_data.items():
            # Iterate through individual entries for that tithi type
            for entry in entries:
                date_str = entry.get("date")
                full_name = entry.get("full_name")

                if not date_str or not full_name:
                    continue # Skip incomplete entries

                # Check if it's a special day and we haven't added this date yet
                if is_special_day(full_name) and date_str not in processed_dates:
                    special_days_list.append({
                        "date": date_str,
                        "full_name": full_name
                    })
                    processed_dates.add(date_str)

    # Sort the list by date
    try:
        special_days_list.sort(key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d'))
    except ValueError as e:
        print(f"Error sorting dates (check date format): {e}")
        # Continue without sorting if there's a date format issue

    # Save the filtered list
    try:
        with open(OUTPUT_SPECIAL_DAYS_FILE, 'w', encoding='utf-8') as f:
            json.dump(special_days_list, f, indent=2)
        print(f"Successfully generated '{OUTPUT_SPECIAL_DAYS_FILE}' with {len(special_days_list)} special days.")
    except Exception as e:
        print(f"Error writing to '{OUTPUT_SPECIAL_DAYS_FILE}': {e}")

if __name__ == "__main__":
    generate_special_days_list()