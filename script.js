document.addEventListener('DOMContentLoaded', async () => {
  const tithiContainer = document.getElementById('tithi-checkboxes');
  const form = document.getElementById('subscription-form');
  const submitButton = document.getElementById('submit-button');
  const messageArea = document.getElementById('message-area');

  // New selectors for tabs and calendar
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const calendarContainer30 = document.getElementById('special-days-30');
  const calendarContainer60 = document.getElementById('special-days-60');
  const calendarContainer90 = document.getElementById('special-days-90');
  let calendarDataLoaded = false; // Flag to avoid reloading data unnecessarily

  // Status check form elements
  const statusForm = document.getElementById('status-check-form');
  const statusButton = document.getElementById('check-status-button');
  const statusMessageArea = document.getElementById('status-message-area');
  const subscriptionDetails = document.getElementById('subscription-details');
  const subscriptionInfo = document.getElementById('subscription-info');

  // --- START: Tab Switching Logic ---
  function switchTab(targetTabId) {
    tabPanes.forEach(pane => {
      pane.classList.remove('active');
      if (pane.id === `${targetTabId}-tab`) {
        pane.classList.add('active');
      }
    });
    tabButtons.forEach(button => {
      button.classList.remove('active');
      if (button.dataset.tab === targetTabId) {
        button.classList.add('active');
      }
    });

    // Load calendar data if switching to calendar tab and not already loaded
    if (targetTabId === 'calendar' && !calendarDataLoaded) {
      loadAndDisplayCalendar();
    }
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      switchTab(button.dataset.tab);
    });
  });
  // --- END: Tab Switching Logic ---

  // --- START: 90-Day Calendar Logic ---
  function renderFestivalSection(element, festivals) {
    if (!element) return; // Safety check
    element.innerHTML = ''; // Clear previous content

    if (!festivals || festivals.length === 0) {
      element.innerHTML = '<p>No special days in this period.</p>';
      return;
    }

    festivals.forEach(festival => {
      const card = document.createElement('div');
      card.className = 'tithi-card has-festival'; // Use existing styles
      
      const dateEl = document.createElement('div');
      dateEl.className = 'tithi-date';
      dateEl.textContent = festival.date; // Format: YYYY-MM-DD
      
      const nameEl = document.createElement('div');
      nameEl.className = 'festival-name'; // Specific style for festival name
      nameEl.textContent = festival.full_name;
      
      card.appendChild(dateEl);
      card.appendChild(nameEl);
      element.appendChild(card);
    });
  }

  async function loadAndDisplayCalendar() {
    console.log("Loading calendar data...");
    calendarDataLoaded = true; // Mark as loading/loaded
    
    // Clear existing sections and show loading indicators
    if(calendarContainer30) calendarContainer30.innerHTML = '<p class="loading-text">Loading...</p>';
    if(calendarContainer60) calendarContainer60.innerHTML = '<p class="loading-text">Loading...</p>';
    if(calendarContainer90) calendarContainer90.innerHTML = '<p class="loading-text">Loading...</p>';

    try {
      const response = await fetch('upcoming_special_days_data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const allSpecialDays = await response.json();

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      
      const ninetyDaysLater = new Date(today);
      ninetyDaysLater.setDate(today.getDate() + 90);

      const upcomingFestivals = allSpecialDays.filter(day => {
        const festivalDate = new Date(day.date + 'T00:00:00'); // Treat date as local timezone
        return festivalDate >= today && festivalDate < ninetyDaysLater;
      });

      // Calculate days from now and group
      const groupedFestivals = {
        days30: [],
        days60: [],
        days90: []
      };

      const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day

      upcomingFestivals.forEach(festival => {
        const festivalDate = new Date(festival.date + 'T00:00:00');
        const daysFromNow = Math.round((festivalDate - today) / oneDay);

        if (daysFromNow <= 30) {
          groupedFestivals.days30.push(festival);
        } else if (daysFromNow <= 60) {
          groupedFestivals.days60.push(festival);
        } else {
          groupedFestivals.days90.push(festival);
        }
      });
      
      // Sort within each group by date (already sorted by file generation, but good practice)
      Object.values(groupedFestivals).forEach(group => group.sort((a, b) => new Date(a.date) - new Date(b.date)));

      // Render sections
      renderFestivalSection(calendarContainer30, groupedFestivals.days30);
      renderFestivalSection(calendarContainer60, groupedFestivals.days60);
      renderFestivalSection(calendarContainer90, groupedFestivals.days90);

    } catch (error) {
      console.error('Error loading or processing calendar data:', error);
      if(calendarContainer30) calendarContainer30.innerHTML = '<p class="error-text">Could not load special days.</p>';
      if(calendarContainer60) calendarContainer60.innerHTML = ''; // Clear other sections on error
      if(calendarContainer90) calendarContainer90.innerHTML = '';
      calendarDataLoaded = false; // Allow retry on next tab click
    }
  }
  // --- END: 90-Day Calendar Logic ---

  // Check if user already submitted
  if (localStorage.getItem('tithi_submitted') === 'true') {
    // Disable form, but keep tab functionality available
    const subscriptionTab = document.getElementById('subscription-tab');
    if(subscriptionTab) {
      subscriptionTab.innerHTML = '<div class="card"><p style="color:#ff3b3b; text-align:center;">You have already subscribed in this session.</p></div>';
    }
    // Don't return, allow tab switching
  } else {
    // Load all tithis
    loadAllTithis();
    // Handle form submission
    form.addEventListener('submit', handleFormSubmit);
  }

  async function loadAllTithis() {
    tithiContainer.innerHTML = '<p>Loading Tithis...</p>';
    try {
      const response = await fetch('tithis_2024_2030_basic.json');
      const data = await response.json();

      // Get unique tithis across all years
      const allTithis = new Set();
      Object.values(data).forEach(yearData => {
        Object.keys(yearData).forEach(tithi => {
          allTithis.add(tithi);
        });
      });

      const tithiList = Array.from(allTithis).sort();
      tithiContainer.innerHTML = '';

      tithiList.forEach(tithi => {
        const label = document.createElement('label');
        label.style.display = 'block';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'tithi';
        checkbox.value = tithi;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + tithi));
        tithiContainer.appendChild(label);
      });
    } catch (error) {
      console.error('Error loading Tithis:', error);
      tithiContainer.innerHTML = '<p>Failed to load Tithis.</p>';
    }
  }

  // Existing form submission handler (refactored into a function)
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Clear previous messages
    messageArea.innerHTML = '';
    messageArea.className = 'message-area';
    
    // Disable the submit button to prevent multiple submissions
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';

    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();

    const selectedTithis = Array.from(
      form.querySelectorAll('input[name="tithi"]:checked')
    ).map(cb => cb.value);

    const honeypot = document.getElementById('website').value;
    
    // Execute reCAPTCHA v3
    try {
      grecaptcha.ready(function() {
        grecaptcha.execute('6LdohQsrAAAAAKUe4KxI-3Jf2hxYREvgqeD9ZZUo', {action: 'submit'})
          .then(async function(token) {
            // Add token to form
            document.getElementById('g-recaptcha-response').value = token;
            
            // Prepare payload with the reCAPTCHA token
            const payload = {
              email,
              selectedTithis,
              website: honeypot,
              'g-recaptcha-response': token
            };
            
            try {
              const response = await fetch('/.netlify/functions/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              const data = await response.json();

              if (response.ok) {
                messageArea.textContent = data.message;
                messageArea.className = 'message-area success';
                
                localStorage.setItem('tithi_submitted', 'true');
                
                // Replace form with success message
                const subscriptionTab = document.getElementById('subscription-tab');
                if(subscriptionTab) {
                  subscriptionTab.innerHTML = `
                    <div style="text-align: center;">
                      <i class="fas fa-check-circle" style="font-size: 3rem; color: #4caf50; margin-bottom: 1rem;"></i>
                      <h3>Subscription Successful!</h3>
                      <p>Thank you for subscribing to Tithi Reminders.</p>
                      <p>A confirmation email has been sent to <strong>${email}</strong>.</p>
                      <p>Please check your inbox (and spam folder) for details.</p>
                      <p>You will receive notifications for your selected Tithis until 2030.</p>
                      <p class="github-link">This project is open source. <a href="https://github.com/yourusername/ProjectNexon" target="_blank">View on GitHub</a></p>
                    </div>
                  `;
                }
              } else {
                // Show error message
                messageArea.textContent = data.message || 'Subscription failed. Please try again.';
                messageArea.className = 'message-area error';
                
                // Re-enable the submit button
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Subscribe';
              }
            } catch (error) {
              console.error('Error submitting form:', error);
              
              messageArea.textContent = 'An unexpected error occurred. Please try again later.';
              messageArea.className = 'message-area error';
              
              // Re-enable the submit button
              submitButton.disabled = false;
              submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Subscribe';
            }
          });
      });
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      
      messageArea.textContent = 'Error with verification system. Please try again later.';
      messageArea.className = 'message-area error';
      
      // Re-enable the submit button
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Subscribe';
    }
  }

  // Handle status check form submission
  if (statusForm) {
    statusForm.addEventListener('submit', handleStatusCheckForm);
  }

  // Status check form submission handler
  async function handleStatusCheckForm(e) {
    e.preventDefault();
    
    // Clear previous messages and reset display
    statusMessageArea.innerHTML = '';
    statusMessageArea.className = 'message-area';
    subscriptionDetails.classList.add('hidden');
    subscriptionInfo.innerHTML = '';
    
    // Disable the submit button to prevent multiple submissions
    statusButton.disabled = true;
    statusButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Checking...';

    const emailInput = document.getElementById('status-email');
    const email = emailInput.value.trim();
    
    // Execute reCAPTCHA v3
    try {
      grecaptcha.ready(function() {
        grecaptcha.execute('6LdohQsrAAAAAKUe4KxI-3Jf2hxYREvgqeD9ZZUo', {action: 'check_status'})
          .then(async function(token) {
            // Add token to form
            document.getElementById('status-recaptcha-response').value = token;
            
            // Prepare payload with the reCAPTCHA token
            const payload = {
              email,
              'g-recaptcha-response': token
            };
            
            try {
              const response = await fetch('/.netlify/functions/checkStatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              const data = await response.json();

              if (response.ok) {
                // Success - show subscription details
                statusMessageArea.textContent = data.message;
                statusMessageArea.className = 'message-area success';
                
                // Display subscription details
                if (data.active && data.subscribedTithis && data.subscribedTithis.length > 0) {
                  // Show the subscription details section
                  subscriptionDetails.classList.remove('hidden');
                  
                  // Create HTML for the subscribed tithis
                  const tithiListHTML = data.subscribedTithis
                    .map(tithi => `<li>${tithi}</li>`)
                    .join('');
                  
                  // Format subscription date (we don't have this from the API currently)
                  subscriptionInfo.innerHTML = `
                    <div class="subscription-info-box">
                      <p><strong>Email:</strong> ${data.email}</p>
                      <p><strong>Status:</strong> <span class="active-status">Active</span></p>
                      <p><strong>Subscribed Tithis:</strong></p>
                      <ul class="subscribed-tithis-list">
                        ${tithiListHTML}
                      </ul>
                      <div class="subscription-actions">
                        <a href="/.netlify/functions/unsubscribe?email=${encodeURIComponent(data.email)}" 
                           class="unsubscribe-link"
                           onclick="return confirm('Are you sure you want to unsubscribe? This will cancel all your Tithi reminders.');">
                          <i class="fas fa-times-circle"></i> Unsubscribe
                        </a>
                      </div>
                    </div>
                  `;
                }
              } else {
                // Error response
                statusMessageArea.textContent = data.message || 'Failed to check subscription status. Please try again.';
                statusMessageArea.className = 'message-area error';
              }
            } catch (error) {
              console.error('Error checking status:', error);
              statusMessageArea.textContent = 'An unexpected error occurred. Please try again later.';
              statusMessageArea.className = 'message-area error';
            } finally {
              // Re-enable the submit button
              statusButton.disabled = false;
              statusButton.innerHTML = '<i class="fas fa-search"></i> Check Status';
            }
          });
      });
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      statusMessageArea.textContent = 'Error with verification system. Please try again later.';
      statusMessageArea.className = 'message-area error';
      
      // Re-enable the submit button
      statusButton.disabled = false;
      statusButton.innerHTML = '<i class="fas fa-search"></i> Check Status';
    }
  }
});