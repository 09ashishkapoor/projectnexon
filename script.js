document.addEventListener('DOMContentLoaded', async () => {
  const yearSelect = document.getElementById('year-select');
  const tithiContainer = document.getElementById('tithi-checkboxes');
  const form = document.getElementById('subscription-form');
  const submitButton = document.getElementById('submit-button');
  const messageArea = document.getElementById('message-area');

  // Check if user already submitted
  if (localStorage.getItem('tithi_submitted') === 'true') {
    form.innerHTML = '<p style="color:#ff3b3b; text-align:center;">You have already subscribed in this session.</p>';
    return;
  }

  // Populate year dropdown with current year and next year
  const currentYear = new Date().getFullYear();
  [currentYear, currentYear + 1].forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });

  async function loadTithisForYear(year) {
    tithiContainer.innerHTML = '<p>Loading Tithis...</p>';
    try {
      const response = await fetch('tithis_2024_2030_basic.json');
      const data = await response.json();

      const yearData = data[year];
      if (!yearData) {
        tithiContainer.innerHTML = '<p>No Tithi data for selected year.</p>';
        return;
      }

      const tithiList = Object.keys(yearData).sort();

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

  // Initial load for current year
  loadTithisForYear(currentYear);

  // Reload Tithis when year changes
  yearSelect.addEventListener('change', () => {
    loadTithisForYear(yearSelect.value);
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
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
                form.innerHTML = `
                  <div style="text-align: center;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #4caf50; margin-bottom: 1rem;"></i>
                    <h3>Subscription Successful!</h3>
                    <p>Thank you for subscribing to Tithi Reminders.</p>
                    <p>A confirmation email has been sent to <strong>${email}</strong>.</p>
                    <p>Please check your inbox (and spam folder) for details.</p>
                  </div>
                `;
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
  });
});