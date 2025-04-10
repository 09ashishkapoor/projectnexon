#!/usr/bin/env python

"""
Generate accurate Hindu tithi data for years 2024-2030 using simplified panchanga
Compatible with Python 3.13 and higher
"""

import json
import datetime
import os
from panchanga import Date, Place, tithi, gregorian_to_jd

# Define a location (using Bangalore as a reference point)
BANGALORE = Place(latitude=12.972, longitude=77.594, timezone=+5.5)

# All tithis with their names
TITHI_NAMES = {
    1: "Pratipada",
    2: "Dwitiya",
    3: "Tritiya",
    4: "Chaturthi",
    5: "Panchami",
    6: "Shashthi",
    7: "Saptami",
    8: "Ashtami",
    9: "Navami",
    10: "Dashami",
    11: "Ekadashi",
    12: "Dwadashi",
    13: "Trayodashi",
    14: "Chaturdashi",
    15: "Purnima",   # Only for Shukla Paksha
    30: "Amavasya"   # Only for Krishna Paksha
}

# Hindu month names
HINDU_MONTHS = [
    "Chaitra",
    "Vaishakha",
    "Jyeshtha",
    "Ashada",
    "Shravana",
    "Bhadrapada",
    "Ashwin",
    "Kartika",
    "Margashirsha", 
    "Pausha",
    "Magha",
    "Phalguna"
]

def get_paksha_name(tithi_num):
    """Return 'Shukla' for tithi 1-15, 'Krishna' for tithi 16-30"""
    if 1 <= tithi_num <= 15:
        return "Shukla"
    else:
        return "Krishna"

def normalize_tithi(tithi_num):
    """Convert tithi number 1-30 to 1-15 range for naming"""
    if 1 <= tithi_num <= 15:
        return tithi_num
    else:
        return tithi_num - 15

def get_hindu_month(date_obj):
    """Approximate Hindu month based on Gregorian date"""
    # This is a simplified approach - just mapping Gregorian months to Hindu months
    # Adjusted offset from +9 to +8 to correct observed shift
    month_index = (date_obj.month + 8) % 12
    return HINDU_MONTHS[month_index]

def format_date(year, month, day):
    """Format date as YYYY-MM-DD"""
    return f"{year}-{month:02d}-{day:02d}"

def get_tithi_for_date(date_obj, place):
    """Get tithi for a specific date"""
    year, month, day = date_obj.year, date_obj.month, date_obj.day
    jd = gregorian_to_jd(Date(year, month, day))
    
    try:
        tithi_data = tithi(jd, place)
        tithi_num = tithi_data[0]
        return tithi_num
    except Exception as e:
        print(f"Error calculating tithi for {year}-{month:02d}-{day:02d}: {e}")
        return None

def generate_tithis(start_year, end_year):
    """Generate tithi data for the given year range"""
    print(f"Starting tithi generation for {start_year}-{end_year}...")
    
    result = {}
    special_days = load_special_days()
    
    # Initialize result structure
    for year in range(start_year, end_year + 1):
        result[str(year)] = {}
        for tithi_name in TITHI_NAMES.values():
            result[str(year)][tithi_name] = []
    
    # Process each day in the range
    total_days = (datetime.date(end_year, 12, 31) - datetime.date(start_year, 1, 1)).days + 1
    days_processed = 0
    
    current_date = datetime.date(start_year, 1, 1)
    end_date = datetime.date(end_year, 12, 31)
    
    while current_date <= end_date:
        # Show progress periodically
        days_processed += 1
        if days_processed % 30 == 0:
            percent = (days_processed / total_days) * 100
            print(f"Progress: {percent:.1f}% - Processing {current_date.isoformat()}")
        
        year, month, day = current_date.year, current_date.month, current_date.day
        date_str = format_date(year, month, day)
        
        # Get tithi for current date
        tithi_num = get_tithi_for_date(current_date, BANGALORE)
        if tithi_num is None:
            # Skip if calculation failed
            current_date += datetime.timedelta(days=1)
            continue
        
        # Get month and paksha
        hindu_month = get_hindu_month(current_date)
        paksha = get_paksha_name(tithi_num)
        
        # Normalize tithi number for indexing
        norm_tithi = normalize_tithi(tithi_num)
        tithi_name = TITHI_NAMES[norm_tithi]
        
        # Determine full name based on special cases
        date_key = current_date.strftime("%Y-%m-%d")
        if date_key in special_days:
            # Use the specific name if provided
            tithi_full_name = special_days[date_key]
        elif norm_tithi == 15 and paksha == "Shukla":
            # Generic Purnima name (removed month)
            tithi_full_name = "Shukla Purnima"
        elif tithi_num == 30:
            # Generic Amavasya name (removed month)
            tithi_full_name = "Krishna Amavasya"
        else:
            # Generic regular tithi naming (removed month)
            tithi_full_name = f"{paksha} {tithi_name}"
        
        # Determine which category this belongs to in the output JSON
        if norm_tithi == 15 and paksha == "Shukla":
            entry_key = "Purnima"
        elif tithi_num == 30:
            entry_key = "Amavasya"
        else:
            entry_key = tithi_name
        
        # Add the entry to our result
        entry = {
            "date": date_str,
            "full_name": tithi_full_name
        }
        
        # Add to appropriate category in result
        result[str(year)][entry_key].append(entry)
        
        # Move to next day
        current_date += datetime.timedelta(days=1)
    
    # Sort entries by date
    for year in result:
        for tithi_key in result[year]:
            result[year][tithi_key] = sorted(
                result[year][tithi_key], 
                key=lambda x: x["date"]
            )
    
    return result

def load_special_days():
    """Load special Hindu festival days from special_days.json"""
    filename = "special_days.json"
    if os.path.exists(filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"Loaded {len(data)} special days from {filename}")
                return data
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from {filename}: {e}")
            return {}
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            return {}
    else:
        print(f"Warning: {filename} not found. No special days loaded.")
        return {}

def save_to_json(data, filename):
    """Save data to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Data saved to {filename}")

def compare_with_existing():
    """Compare generated data with existing JSON file"""
    try:
        with open("tithis_2024_2030.json", 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            
        with open("tithis_2024_2030_accurate.json", 'r', encoding='utf-8') as f:
            new_data = json.load(f)
            
        differences = []
        
        # Check some key dates
        key_dates = ["2025-04-07", "2025-04-10"]
        
        for year in existing_data:
            if year in new_data:
                for tithi_type in existing_data[year]:
                    if tithi_type in new_data[year]:
                        existing_entries = {entry["date"]: entry for entry in existing_data[year][tithi_type]}
                        new_entries = {entry["date"]: entry for entry in new_data[year][tithi_type]}
                        
                        for date in key_dates:
                            if date in existing_entries and date in new_entries:
                                if existing_entries[date]["full_name"] != new_entries[date]["full_name"]:
                                    differences.append({
                                        "date": date,
                                        "old": existing_entries[date],
                                        "new": new_entries[date],
                                    })
                        
        if differences:
            print("Found differences in key dates:")
            for diff in differences:
                print(f"Date: {diff['date']}")
                print(f"  Old: {diff['old']['full_name']}")
                print(f"  New: {diff['new']['full_name']}")
        else:
            print("No differences found in key dates.")
            
    except Exception as e:
        print(f"Error comparing files: {e}")

def main():
    try:
        # Modified: Directly generate full dataset starting from 2025
        print("Starting full tithi dataset generation for 2025-2030...")
        tithi_data = generate_tithis(2025, 2030)
        # Modified: Save directly to the target file
        save_to_json(tithi_data, "tithis_2024_2030_basic.json")
        
        print("Successfully generated and saved data (2025-2030) to tithis_2024_2030_basic.json")

        # Optional: Keep comparison logic if needed, but remove prompt
        # print("Comparing with backup data (if exists)...")
        # compare_with_existing() # Note: This compares with a different file, adjust if needed

        # Removed the 'else' block for fixing specific dates and the input prompt
        
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()