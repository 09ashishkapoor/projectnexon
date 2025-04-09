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
    # with an offset of about 2 weeks
    month_index = (date_obj.month + 9) % 12
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
            tithi_full_name = special_days[date_key]
        elif norm_tithi == 15 and paksha == "Shukla":
            # Special names for Purnima
            if hindu_month == "Chaitra":
                tithi_full_name = "Chaitra Purnima (Hanuman Jayanti)"
            elif hindu_month == "Vaishakha":
                tithi_full_name = "Vaishakha Purnima (Buddha Purnima)"
            elif hindu_month == "Ashwin":
                tithi_full_name = "Sharad Purnima"
            else:
                tithi_full_name = f"{hindu_month} Purnima"
        elif tithi_num == 30:
            # Special names for Amavasya
            if hindu_month == "Ashwin":
                tithi_full_name = "Mahalaya Amavasya"
            else:
                tithi_full_name = f"{hindu_month} Amavasya"
        else:
            # Regular tithi naming
            tithi_full_name = f"{hindu_month} {paksha} {tithi_name}"
        
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
    """Load special Hindu festival days"""
    return {
        # 2024
        "2024-01-15": "Thai Pongal",
        "2024-01-26": "Vasant Panchami",
        "2024-03-25": "Holi",
        "2024-03-09": "Maha Shivaratri",
        "2024-04-09": "Ugadi/Gudi Padwa",
        "2024-04-17": "Ram Navami",
        "2024-08-19": "Krishna Janmashtami",
        "2024-09-07": "Ganesh Chaturthi",
        "2024-10-02": "Vijaya Dashami (Dussehra)",
        "2024-10-31": "Diwali (Deepavali)",
        "2024-11-12": "Chhath Puja",
        
        # 2025
        "2025-02-01": "Vasant Panchami",
        "2025-02-26": "Maha Shivaratri",
        "2025-03-30": "Holi",
        "2025-03-29": "Gudi Padwa/Ugadi",
        "2025-04-07": "Vaishakha Shukla Dwadashi",
        "2025-04-10": "Vaishakha Purnima (Buddha Purnima)",
        "2025-09-07": "Krishna Janmashtami",
        "2025-09-28": "Ganesh Chaturthi",
        "2025-10-20": "Dussehra",
        "2025-11-12": "Diwali (Deepavali)",
        
        # Add more special days as needed
    }

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
        # Check if we should do a full generation or just fix specific dates
        answer = input("Generate full tithi dataset for 2024-2030? (y/n, default=n): ")
        
        if answer.lower() == 'y':
            print("Starting full tithi dataset generation...")
            tithi_data = generate_tithis(2024, 2030)
            save_to_json(tithi_data, "tithis_2024_2030_accurate.json")
            
            # Compare with existing data
            print("Comparing with existing data...")
            compare_with_existing()
        else:
            # Just fix specific dates
            print("Fixing specific dates only...")
            april_07_2025 = datetime.date(2025, 4, 7)
            april_10_2025 = datetime.date(2025, 4, 10)
            
            # Calculate tithis for these specific dates
            tithi_apr07 = get_tithi_for_date(april_07_2025, BANGALORE)
            tithi_apr10 = get_tithi_for_date(april_10_2025, BANGALORE)
            
            print(f"2025-04-07: Tithi number {tithi_apr07} ({TITHI_NAMES[normalize_tithi(tithi_apr07)]})")
            print(f"2025-04-10: Tithi number {tithi_apr10} ({TITHI_NAMES[normalize_tithi(tithi_apr10)]})")
            
            # Load existing JSON file
            try:
                with open("tithis_2024_2030.json", 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
                
                # Make a backup of the original file
                backup_file = "tithis_2024_2030_backup.json"
                if not os.path.exists(backup_file):
                    with open(backup_file, 'w', encoding='utf-8') as f:
                        json.dump(existing_data, f, indent=2)
                    print(f"Backup created at {backup_file}")
                
                # Update the specific dates
                # Find and update April 10, 2025 (should be Purnima)
                found_apr10 = False
                for entry in existing_data["2025"]["Purnima"]:
                    if entry["date"] == "2025-04-10":
                        entry["full_name"] = "Vaishakha Purnima (Buddha Purnima)"
                        found_apr10 = True
                        break
                
                if not found_apr10:
                    print("Adding April 10, 2025 as Purnima")
                    existing_data["2025"]["Purnima"].append({
                        "date": "2025-04-10",
                        "full_name": "Vaishakha Purnima (Buddha Purnima)"
                    })
                
                # Remove incorrect April 13, 2025 Purnima entry if it exists
                existing_data["2025"]["Purnima"] = [
                    entry for entry in existing_data["2025"]["Purnima"] 
                    if entry["date"] != "2025-04-13"
                ]
                
                # Find and update April 7, 2025 (should be Dwadashi)
                found_apr07 = False
                for entry in existing_data["2025"]["Dwadashi"]:
                    if entry["date"] == "2025-04-07":
                        entry["full_name"] = "Vaishakha Shukla Dwadashi"
                        found_apr07 = True
                        break
                        
                if not found_apr07:
                    print("Adding April 7, 2025 as Dwadashi")
                    existing_data["2025"]["Dwadashi"].append({
                        "date": "2025-04-07",
                        "full_name": "Vaishakha Shukla Dwadashi"
                    })
                
                # Remove incorrect April 10, 2025 Dwadashi entry if it exists
                existing_data["2025"]["Dwadashi"] = [
                    entry for entry in existing_data["2025"]["Dwadashi"] 
                    if entry["date"] != "2025-04-10"
                ]
                
                # Save the updated data
                with open("tithis_2024_2030.json", 'w', encoding='utf-8') as f:
                    json.dump(existing_data, f, indent=2)
                    
                print("Successfully updated specific dates in tithis_2024_2030.json")
                
            except Exception as e:
                print(f"Error updating specific dates: {e}")
        
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()