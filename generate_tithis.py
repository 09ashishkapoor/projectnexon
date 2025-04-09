#!/usr/bin/env python

"""
Generate accurate Hindu tithi data for years 2024-2030 using drik-panchanga
"""

import json
import datetime
from panchanga import (
    Date, Place, tithi, gregorian_to_jd
)

# Define a location (we'll use Bangalore as a reference point)
bangalore = Place(latitude=12.972, longitude=77.594, timezone=+5.5)

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
    15: "Purnima", # Only for Shukla Paksha
    30: "Amavasya" # Only for Krishna Paksha
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

def get_hindu_month(jd, tithi_num):
    """Approximate Hindu month based on Gregorian date"""
    # This is a simplification - for accurate month calculation we'd need masa() function
    greg_date = datetime.datetime(*[int(x) for x in list(jd_to_gregorian(jd))[:3]])
    
    # Simple mapping based on Gregorian month
    # This is approximate and might be off by one in some cases
    month_index = (greg_date.month + 9) % 12
    return HINDU_MONTHS[month_index]

def jd_to_gregorian(jd):
    """Convert Julian day to Gregorian date"""
    a = jd + 32044
    b = (4*a + 3) // 146097
    c = a - (146097*b) // 4
    d = (4*c + 3) // 1461
    e = c - 1461*d // 4
    m = (5*e + 2) // 153
    
    day = e + 1 - (153*m + 2)//5
    month = m + 3 - 12 * (m//10)
    year = 100*b + d - 4800 + m//10
    
    return (year, month, day)

def get_tithi_name(tithi_num, special_tithis=None):
    """Get the full name of a tithi including paksha"""
    special_tithis = special_tithis or {}
    
    norm_tithi = normalize_tithi(tithi_num)
    
    # Check if this is a special tithi
    if tithi_num in special_tithis:
        return special_tithis[tithi_num]
    
    # Regular tithi naming
    if tithi_num == 15:
        return "Purnima"
    elif tithi_num == 30:
        return "Amavasya"
    else:
        paksha = get_paksha_name(tithi_num)
        tithi_name = TITHI_NAMES[norm_tithi]
        return f"{paksha} {tithi_name}"

def format_date(year, month, day):
    """Format date as YYYY-MM-DD"""
    return f"{year}-{month:02d}-{day:02d}"

def generate_tithis(start_year, end_year):
    """Generate tithi data for the given year range"""
    result = {}
    
    # Special tithis with their unique names - expand this list as needed
    special_tithis = {
        # Format: date_str: {tithi_num: special_name}
        "2024-03-18": {8: "Durga Ashtami"},
        "2024-03-19": {9: "Ram Navami"},
        "2024-09-26": {8: "Krishna Janmashtami"},
        "2024-10-07": {4: "Vinayaka Chaturthi"},
        "2024-09-12": {9: "Maha Navami"},
        "2024-03-14": {4: "Ganesh Chaturthi"},
        # Add more special tithis here
    }
    
    # Initialize result structure for each year
    for year in range(start_year, end_year + 1):
        result[str(year)] = {}
        for tithi_name in TITHI_NAMES.values():
            result[str(year)][tithi_name] = []
    
    # For each day in the range, calculate tithi and store it
    current_date = datetime.date(start_year, 1, 1)
    end_date = datetime.date(end_year, 12, 31)
    
    while current_date <= end_date:
        year, month, day = current_date.year, current_date.month, current_date.day
        date_str = format_date(year, month, day)
        
        # Convert to Julian Day Number
        jd = gregorian_to_jd(Date(year, month, day))
        
        # Calculate tithi
        tithi_data = tithi(jd, bangalore)
        tithi_num = tithi_data[0]
        
        # Get the Hindu month (approximate)
        hindu_month = get_hindu_month(jd, tithi_num)
        
        # Get the normalized tithi number and name
        norm_tithi = normalize_tithi(tithi_num)
        
        # Generate tithi name
        date_specific_specials = special_tithis.get(date_str, {})
        if tithi_num in date_specific_specials:
            tithi_full_name = date_specific_specials[tithi_num]
        else:
            paksha = get_paksha_name(tithi_num)
            tithi_name = TITHI_NAMES[norm_tithi]
            tithi_full_name = f"{hindu_month} {paksha} {tithi_name}"
        
        # Map tithi number to name
        if norm_tithi == 15 and get_paksha_name(tithi_num) == "Shukla":
            # It's Purnima (full moon)
            entry_key = "Purnima"
            # Add special names for certain Purnimas
            if hindu_month == "Chaitra":
                tithi_full_name = "Chaitra Purnima (Hanuman Jayanti)"
            elif hindu_month == "Vaishakha":
                tithi_full_name = "Vaishakha Purnima (Buddha Purnima)"
            elif hindu_month == "Ashwin":
                tithi_full_name = "Sharad Purnima"
            else:
                tithi_full_name = f"{hindu_month} Purnima"
        elif tithi_num == 30:
            # It's Amavasya (new moon)
            entry_key = "Amavasya"
            if hindu_month == "Ashwin":
                tithi_full_name = "Mahalaya Amavasya"
            else:
                tithi_full_name = f"{hindu_month} Amavasya"
        else:
            # Regular tithi
            entry_key = TITHI_NAMES[norm_tithi]
        
        # Store in result
        entry = {
            "date": date_str,
            "full_name": tithi_full_name
        }
        
        # Add to result
        result[str(year)][entry_key].append(entry)
        
        # Move to next day
        current_date += datetime.timedelta(days=1)
    
    return result

def save_to_json(data, filename):
    """Save data to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Data saved to {filename}")

def main():
    print("Generating tithi data for years 2024-2030...")
    tithi_data = generate_tithis(2024, 2030)
    
    # Save to JSON file
    save_to_json(tithi_data, "tithis_2024_2030_accurate.json")
    print("Done!")

if __name__ == "__main__":
    main()