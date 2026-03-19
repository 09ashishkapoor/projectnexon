# Hindu Festival & 90-Day Tithi Calendar Feature

This document outlines the implementation and technical details for adding a 90-day tithi calendar view with Hindu festivals to the Project Nexon Tithi Reminder Service.

## Feature Overview

The feature adds a tab-based navigation system to the existing website, allowing users to toggle between:
1. The subscription form (existing functionality)
2. A 90-day tithi calendar view with Hindu festivals (new feature)

The 90-day calendar will display upcoming tithis in three distinct groups (1-30 days, 31-60 days, 61-90 days) and highlight special Hindu festivals associated with particular tithis.

## Implementation Details

### Data Source

This feature uses two separate data sources:
1. **Existing Tithi Data**: `tithis_2024_2030_basic.json` - Contains the basic tithi information that's already used for subscriptions
2. **New Festival Data**: `hindu_festivals.json` (to be created) - Will contain Hindu festival information mapped to tithi dates

### Creating the Festival Data File

The `hindu_festivals.json` file will follow this structure:

```json
{
  "festivals": [
    {
      "name": "Deepavali/Diwali",
      "tithi": "Amavasya",
      "month": "Kartika",
      "description": "Festival of Lights",
      "importance": "major"
    },
    {
      "name": "Janmashtami",
      "tithi": "Ashtami",
      "month": "Bhadrapada",
      "paksha": "Krishna",
      "description": "Birth of Lord Krishna",
      "importance": "major"
    },
    // Additional festivals...
  ]
}
```

Key festivals to include:
- Diwali/Deepavali (Kartika Amavasya)
- Janmashtami (Krishna Paksha Ashtami in Bhadrapada)
- Ganesh Chaturthi (Shukla Paksha Chaturthi in Bhadrapada)
- Durga Puja (Shukla Paksha Shashthi to Dashami in Ashwin)
- Navaratri (Ashwin Shukla Paksha Pratipada to Navami)
- Ram Navami (Chaitra Shukla Paksha Navami)
- Holi (Phalguna Purnima)
- Maha Shivaratri (Phalguna Krishna Paksha Chaturdashi)
- Raksha Bandhan (Shravana Purnima)

### Technical Implementation

#### 1. Frontend Structure

Add a tab navigation system to `index.html`:

```html
<div class="tab-navigation">
  <button class="tab-button active" data-tab="subscription">Subscribe</button>
  <button class="tab-button" data-tab="calendar">90-Day Calendar</button>
</div>

<div class="tab-content">
  <div id="subscription-tab" class="tab-pane active">
    <!-- Existing subscription form content -->
  </div>
  <div id="calendar-tab" class="tab-pane">
    <div class="calendar-container">
      <h2>Upcoming Tithis & Festivals</h2>
      
      <!-- Next 30 days section -->
      <div class="calendar-section">
        <h3>Next 30 Days</h3>
        <div id="calendar-30" class="tithi-calendar"></div>
      </div>
      
      <!-- 31-60 days section -->
      <div class="calendar-section">
        <h3>31-60 Days</h3>
        <div id="calendar-60" class="tithi-calendar"></div>
      </div>
      
      <!-- 61-90 days section -->
      <div class="calendar-section">
        <h3>61-90 Days</h3>
        <div id="calendar-90" class="tithi-calendar"></div>
      </div>
    </div>
  </div>
</div>
```

#### 2. JavaScript Logic

Add the following logic to `script.js`:

1. Tab switching functionality
2. Loading tithis for the next 90 days from the existing data file
3. Loading festival information from the new data file
4. Matching festivals to tithis and displaying them
5. Organizing tithis into the three time period groups

```javascript
// Example pseudocode
async function loadCalendarData() {
  // Load tithi data
  const tithiData = await loadTithiData();
  
  // Load festival data
  const festivalData = await loadFestivalData();
  
  // Get current date
  const today = new Date();
  
  // Calculate next 90 days of tithis
  const next90DaysTithis = calculateNext90DaysTithis(tithiData, today);
  
  // Match festivals to tithis
  const tithisWithFestivals = matchFestivalsToTithis(next90DaysTithis, festivalData);
  
  // Group tithis by time periods
  const groupedTithis = {
    first30Days: tithisWithFestivals.filter(t => t.daysFromNow <= 30),
    mid30Days: tithisWithFestivals.filter(t => t.daysFromNow > 30 && t.daysFromNow <= 60),
    last30Days: tithisWithFestivals.filter(t => t.daysFromNow > 60 && t.daysFromNow <= 90)
  };
  
  // Render calendar sections
  renderCalendarSection('calendar-30', groupedTithis.first30Days);
  renderCalendarSection('calendar-60', groupedTithis.mid30Days);
  renderCalendarSection('calendar-90', groupedTithis.last30Days);
}
```

#### 3. CSS Styling

Add styles for the new calendar display in `style.css`:

```css
/* Tab Navigation */
.tab-navigation {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 2px solid #ff3b3b;
}

.tab-button {
  padding: 10px 20px;
  background-color: #f5f5f5;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.tab-button.active {
  background-color: #ff3b3b;
  color: white;
}

/* Tab Content */
.tab-pane {
  display: none;
}

.tab-pane.active {
  display: block;
}

/* Calendar Styling */
.calendar-section {
  margin-bottom: 30px;
}

.calendar-section h3 {
  color: #ff3b3b;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.tithi-calendar {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.tithi-card {
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  background-color: #f9f9f9;
}

.tithi-card.has-festival {
  border-left: 4px solid #ff3b3b;
  background-color: #fff3f3;
}

.festival-name {
  color: #ff3b3b;
  font-weight: bold;
}

.tithi-date {
  color: #666;
  font-size: 0.9rem;
}

.tithi-name {
  font-weight: bold;
  margin: 5px 0;
}
```

## Data Integration Algorithm

The following algorithm will be used to integrate tithi data with festival data:

1. For each day in the next 90 days:
   - Find the corresponding tithi from `tithis_2024_2030_basic.json`
   - Check if any festivals in `hindu_festivals.json` match this tithi
   - If matching festival(s) exist, associate them with the tithi

2. The matching logic will use:
   - Tithi name (e.g., "Ashtami", "Purnima")
   - Paksha (Krishna/Shukla) if specified
   - Month if specified
   - Additional custom logic for special cases

## Future Enhancements

Potential future enhancements for this feature:

1. **Festival Reminders**: Allow users to subscribe to specific festival reminders
2. **Calendar Export**: Enable exporting the calendar to standard formats (iCal, Google Calendar)
3. **Regional Variations**: Add support for regional variations of festivals
4. **Interactive Filtering**: Allow users to filter the calendar by tithi type or festival importance
5. **Festival Details**: Expandable information about each festival's significance and customs

## Timeline

1. Create the `hindu_festivals.json` file - 1 day
2. Implement the tab navigation system - 1 day
3. Develop the calendar display logic - 2 days
4. Integrate the festival data with tithi data - 1 day
5. Add styling and responsive design - 1 day
6. Testing and refinements - 1 day

Total estimated development time: 7 days

## Sample Festival Data

Below is a more comprehensive sample of the `hindu_festivals.json` file with major Hindu festivals:

```json
{
  "festivals": [
    {
      "name": "Deepavali/Diwali",
      "tithi": "Amavasya",
      "month": "Kartika",
      "description": "Festival of Lights celebrating the victory of light over darkness",
      "importance": "major"
    },
    {
      "name": "Janmashtami",
      "tithi": "Ashtami",
      "month": "Bhadrapada",
      "paksha": "Krishna",
      "description": "Celebrates the birth of Lord Krishna",
      "importance": "major"
    },
    {
      "name": "Maha Shivaratri",
      "tithi": "Chaturdashi",
      "month": "Phalguna",
      "paksha": "Krishna",
      "description": "Night dedicated to the worship of Lord Shiva",
      "importance": "major"
    },
    {
      "name": "Ganesh Chaturthi",
      "tithi": "Chaturthi",
      "month": "Bhadrapada",
      "paksha": "Shukla",
      "description": "Festival honoring Lord Ganesha",
      "importance": "major"
    },
    {
      "name": "Ram Navami",
      "tithi": "Navami",
      "month": "Chaitra",
      "paksha": "Shukla",
      "description": "Celebrates the birth of Lord Rama",
      "importance": "major"
    },
    {
      "name": "Holi",
      "tithi": "Purnima",
      "month": "Phalguna",
      "description": "Festival of colors celebrating the arrival of spring",
      "importance": "major"
    },
    {
      "name": "Raksha Bandhan",
      "tithi": "Purnima",
      "month": "Shravana",
      "description": "Celebrates the bond between brothers and sisters",
      "importance": "major"
    },
    {
      "name": "Guru Purnima",
      "tithi": "Purnima",
      "month": "Ashadha",
      "description": "Day to honor spiritual and academic teachers",
      "importance": "medium"
    },
    {
      "name": "Durga Puja (Start)",
      "tithi": "Shashthi",
      "month": "Ashwin",
      "paksha": "Shukla",
      "description": "Beginning of Durga Puja festivities",
      "importance": "major"
    },
    {
      "name": "Vijayadashami/Dussehra",
      "tithi": "Dashami",
      "month": "Ashwin",
      "paksha": "Shukla",
      "description": "Celebrates the victory of Lord Rama over Ravana",
      "importance": "major"
    },
    {
      "name": "Navaratri (Start)",
      "tithi": "Pratipada",
      "month": "Ashwin",
      "paksha": "Shukla",
      "description": "Beginning of nine nights dedicated to Goddess Durga",
      "importance": "major"
    },
    {
      "name": "Akshaya Tritiya",
      "tithi": "Tritiya",
      "month": "Vaishakha",
      "paksha": "Shukla",
      "description": "Auspicious day for new beginnings and investments",
      "importance": "medium"
    },
    {
      "name": "Karthika Purnima",
      "tithi": "Purnima",
      "month": "Kartika",
      "description": "Sacred day dedicated to Lord Shiva and Vishnu",
      "importance": "medium"
    },
    {
      "name": "Gita Jayanti",
      "tithi": "Ekadashi",
      "month": "Margashirsha",
      "paksha": "Shukla",
      "description": "Celebrates the day Bhagavad Gita was revealed",
      "importance": "medium"
    },
    {
      "name": "Vasant Panchami",
      "tithi": "Panchami",
      "month": "Magha",
      "paksha": "Shukla",
      "description": "Festival honoring Saraswati, goddess of knowledge",
      "importance": "medium"
    }
  ]
}
```

## Integration with Existing Subscription System

The new calendar feature will complement the existing subscription system by:

1. **Enhancing User Awareness**: Users can see upcoming tithis and festivals before subscribing
2. **Driving Subscription Growth**: Users may discover tithis/festivals they want to be reminded about
3. **Providing Immediate Value**: Even non-subscribed users get value from the calendar view

To maintain separation of concerns:
- The festival data will remain separate from the tithi data
- The subscription form will continue to use only the basic tithi data
- The calendar view will integrate both data sources

## Deployment Strategy

### Phase 1: Initial Implementation
- Develop the tab navigation infrastructure
- Create the hindu_festivals.json file with 15-20 major festivals
- Implement the basic calendar view with the three time segments
- Deploy to production with minimal styling

### Phase 2: Enhanced Features
- Add more festivals and improve the matching algorithm
- Enhance the UI with better styling and responsiveness
- Add festival details on hover/click
- Implement analytics to track which festivals users are most interested in

### Phase 3: Full Integration
- Allow users to subscribe to specific festival reminders
- Add filtering and search capabilities
- Integrate regional variations for different parts of India
- Provide calendar export functionality

## Performance Considerations

To ensure optimal performance of the calendar feature:

1. **Lazy Loading**: Load the festival data only when the calendar tab is selected
2. **Data Caching**: Cache the calculated calendar data in localStorage
3. **Pagination**: If the number of tithis/festivals becomes too large, implement pagination
4. **Image Optimization**: If festival images are added in the future, use lazy loading and proper optimization

## User Experience Guidelines

When implementing the calendar feature, follow these UX guidelines:

1. **Consistency**: Match the design language of the existing subscription form
2. **Clarity**: Clearly distinguish between regular tithis and festival days
3. **Hierarchy**: Use visual hierarchy to emphasize more important festivals
4. **Accessibility**: Ensure all calendar elements are accessible via keyboard and screen readers
5. **Performance**: Ensure smooth transitions between tabs and quick loading of calendar data

## Testing Plan

1. **Unit Tests**: Create tests for the festival matching algorithm
2. **Integration Tests**: Test the integration of tithi and festival data
3. **UI Tests**: Verify the tab navigation and calendar display works correctly
4. **Cross-browser Tests**: Test on multiple browsers and devices
5. **Performance Tests**: Ensure the calendar loads quickly even with many entries

## Monitoring and Analytics

To track the success of this feature:

1. **Usage Metrics**: Track how often users switch to the calendar tab
2. **Engagement**: Measure time spent on the calendar view
3. **Conversion**: Track if viewing the calendar leads to more subscriptions
4. **Popular Content**: Identify which festivals and time periods users are most interested in

## Conclusion

Adding a 90-day tithi calendar with Hindu festival information will significantly enhance the value proposition of the Tithi Reminder Service. By providing users with immediate access to upcoming tithis and associated festivals, the service becomes more useful even before users subscribe, potentially increasing engagement and subscription rates.

The separation of data sources ensures clean architecture while the tab-based interface maintains the simplicity of the current design. With a relatively modest development timeline of approximately 7 days, this feature presents an excellent opportunity to expand the service's functionality and appeal.