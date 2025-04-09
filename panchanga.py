#!/usr/bin/env python

# panchanga.py -- simplified version for tithi calculations
# Based on the algorithms from drik-panchanga but with fewer dependencies

import math
import datetime
from collections import namedtuple as struct

# Define basic structures
Date = struct('Date', ['year', 'month', 'day'])
Place = struct('Location', ['latitude', 'longitude', 'timezone'])

# Try to import ephem, but provide fallback if not available
try:
    import ephem
    EPHEM_AVAILABLE = True
except ImportError:
    EPHEM_AVAILABLE = False
    print("Warning: ephem library not found. Using simplified astronomical calculations.")

# Constants
LUNAR_MONTH = 29.530588853  # Length of synodic month (new moon to new moon) in days
SOLAR_DAY = 24.0 * 60.0 * 60.0  # Solar day in seconds

# Basic utility functions
def from_dms(degs, mins, secs):
    """Convert degrees, minutes, seconds to decimal degrees"""
    return degs + mins/60 + secs/3600

def to_dms(deg):
    """Convert decimal degrees to [degrees, minutes, seconds]"""
    d = int(deg)
    mins = (deg - d) * 60
    m = int(mins)
    s = int(round((mins - m) * 60))
    return [d, m, s]

def gregorian_to_jd(date):
    """Convert Gregorian date to Julian day number"""
    year, month, day = date.year, date.month, date.day
    
    if month <= 2:
        year -= 1
        month += 12
    
    A = math.floor(year / 100)
    B = math.floor(A / 4)
    C = 2 - A + B
    E = math.floor(365.25 * (year + 4716))
    F = math.floor(30.6001 * (month + 1))
    
    return C + day + E + F - 1524.5

def jd_to_gregorian(jd):
    """Convert Julian day number to Gregorian date"""
    jd = jd + 0.5
    Z = int(jd)
    F = jd - Z
    
    if Z < 2299161:
        A = Z
    else:
        alpha = int((Z - 1867216.25) / 36524.25)
        A = Z + 1 + alpha - int(alpha / 4)
    
    B = A + 1524
    C = int((B - 122.1) / 365.25)
    D = int(365.25 * C)
    E = int((B - D) / 30.6001)
    
    day = B - D - int(30.6001 * E) + F
    if E < 14:
        month = E - 1
    else:
        month = E - 13
    
    if month > 2:
        year = C - 4716
    else:
        year = C - 4715
    
    return (year, month, int(day))

def simplified_lunar_phase(jd):
    """Simplified calculation of lunar phase based on mean lunar cycle"""
    # Reference new moon: January 6, 2000 at 18:14 UTC
    reference_new_moon_jd = 2451550.26
    lunar_cycles = (jd - reference_new_moon_jd) / LUNAR_MONTH
    
    # Get fractional part of lunar cycle
    phase = (lunar_cycles % 1.0) * 360
    
    return phase

def simplified_tithi(jd):
    """Simplified tithi calculation based on mean lunar cycle"""
    phase = simplified_lunar_phase(jd)
    tithi_num = math.ceil(phase / 12)
    if tithi_num == 0:
        tithi_num = 30  # Amavasya
        
    return tithi_num

# Functions that use ephem if available
def solar_longitude(jd):
    """Solar longitude at given instant (julian day) jd"""
    if EPHEM_AVAILABLE:
        sun = ephem.Sun()
        date = ephem.Date(jd - 2415020.0) # Convert JD to Dublin JD used by ephem
        sun.compute(date)
        # Convert to degrees and normalize
        return (sun.lon * 180 / ephem.pi) % 360
    else:
        # Simplified calculation - less accurate
        # Using a tropical year of 365.24219 days
        year_fraction = (jd % 365.24219) / 365.24219
        return year_fraction * 360

def lunar_longitude(jd):
    """Lunar longitude at given instant (julian day) jd"""
    if EPHEM_AVAILABLE:
        moon = ephem.Moon()
        date = ephem.Date(jd - 2415020.0) # Convert JD to Dublin JD used by ephem
        moon.compute(date)
        # Convert to degrees and normalize
        return (moon.lon * 180 / ephem.pi) % 360
    else:
        # Simplified calculation - less accurate
        # Mean lunar motion per day: about 13.176358 degrees
        # Starting from reference_new_moon_jd, when Sun and Moon were aligned
        reference_new_moon_jd = 2451550.26
        days_since_ref = jd - reference_new_moon_jd
        
        # Sun moves about 1 degree per day
        sun_position = (days_since_ref % 365.24219) * (360 / 365.24219)
        
        # Moon's mean position
        moon_position = (sun_position + (days_since_ref * 13.176358)) % 360
        
        return moon_position

def sunrise(jd, place):
    """Calculate sunrise time, returning [jd_of_sunrise, [h,m,s]]"""
    lat, lon, tz = place.latitude, place.longitude, place.timezone
    
    if EPHEM_AVAILABLE:
        observer = ephem.Observer()
        observer.lat = str(lat)
        observer.lon = str(lon)
        observer.date = ephem.Date(jd - 2415020.0)
        
        sun = ephem.Sun()
        try:
            rising = observer.next_rising(sun).datetime()
            
            # Convert to Julian day number and local time
            rising_jd = (rising - ephem.Date(0).datetime()).total_seconds() / 86400.0 + 2415020.0
            
            # Return Julian day number and local time in hours
            hours_local = (rising_jd - jd) * 24 + tz
            return [rising_jd, to_dms(hours_local)]
        except Exception as e:
            print(f"Error calculating sunrise: {e}")
            # Fallback to approximate calculation
    
    # Simplified calculation for sunrise - rough approximation
    # This calculation assumes an average sunrise time of 6:00 AM local time
    date = datetime.date(*[int(x) for x in jd_to_gregorian(jd)])
    day_of_year = date.timetuple().tm_yday
    
    # Adjust for latitude and season - very simplified
    season_offset = 0
    if 80 <= day_of_year <= 172:  # Spring to Summer
        season_offset = -1.0  # Earlier sunrise
    elif 172 < day_of_year <= 264:  # Summer to Fall
        season_offset = 0
    elif 264 < day_of_year <= 355:  # Fall to Winter
        season_offset = 1.0  # Later sunrise
    else:  # Winter to Spring
        season_offset = 0.5
        
    latitude_factor = abs(lat) / 90.0
    sunrise_hour = 6.0 + season_offset * latitude_factor
    
    # Convert to JD and format
    rise_jd = jd + (sunrise_hour - tz) / 24.0
    hours_local = sunrise_hour
    
    return [rise_jd, to_dms(hours_local)]

def lunar_phase(jd):
    """Calculate lunar phase as angle between moon and sun"""
    if EPHEM_AVAILABLE:
        solar_long = solar_longitude(jd)
        lunar_long = lunar_longitude(jd)
        return (lunar_long - solar_long) % 360
    else:
        return simplified_lunar_phase(jd)

def tithi(jd, place):
    """Calculate tithi at sunrise and its end time"""
    try:
        tz = place.timezone
        
        # 1. Find time of sunrise
        rise = sunrise(jd, place)[0]
        
        # 2. Find tithi at this JDN
        moon_phase = lunar_phase(rise)
        today = math.ceil(moon_phase / 12)
        if today == 0:
            today = 30  # Amavasya
            
        # Return simplified answer if ephem is not available
        if not EPHEM_AVAILABLE:
            return [today, [24, 0, 0]]  # Assume tithi lasts a full day
        
        # 3. Calculate end time using multiple points
        offsets = [0.25, 0.5, 0.75, 1.0]
        phases = [lunar_phase(rise + t) for t in offsets]
        
        # Find when phase crosses the next tithi boundary
        next_tithi_boundary = today * 12
        end_offsets = []
        
        for i in range(len(offsets)):
            if phases[i] >= next_tithi_boundary:
                # Linear interpolation between points
                if i > 0:
                    fraction = (next_tithi_boundary - phases[i-1]) / (phases[i] - phases[i-1])
                    end_time = offsets[i-1] + fraction * (offsets[i] - offsets[i-1])
                    end_offsets.append(end_time)
        
        if end_offsets:
            end_time = min(end_offsets)
            ends = rise + end_time
            hours_local = (ends - jd) * 24 + tz
            return [int(today), to_dms(hours_local)]
        else:
            # Tithi likely continues into next day
            return [int(today), [24, 0, 0]]
            
    except Exception as e:
        print(f"Error in tithi calculation: {e}")
        # Fallback to very basic calculation
        simplified_tithi_num = simplified_tithi(jd)
        return [simplified_tithi_num, [24, 0, 0]]

# For testing
if __name__ == "__main__":
    bangalore = Place(12.972, 77.594, +5.5)
    date = gregorian_to_jd(Date(2025, 4, 10))
    print(f"Tithi on 2025-04-10: {tithi(date, bangalore)}")
    
    # Test for April 7, 2025 (should be Dwadashi)
    date2 = gregorian_to_jd(Date(2025, 4, 7))
    print(f"Tithi on 2025-04-07: {tithi(date2, bangalore)}")