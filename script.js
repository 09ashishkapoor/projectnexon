document.addEventListener('DOMContentLoaded', async () => {
  const yearSelect = document.getElementById('year-select');
  const tithiContainer = document.getElementById('tithi-checkboxes');
  const form = document.getElementById('subscription-form');
  const submitButton = document.getElementById('submit-button');

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
      const response = await fetch('tithis_2024_2030.json');
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
    
    // Disable the submit button to prevent multiple submissions
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

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

              console.log('Subscribe response:', data);

              if (data && data.message) {
                alert(data.message);
              } else {
                alert('Subscription response received, but no message provided.');
              }

              if (response.ok) {
                localStorage.setItem('tithi_submitted', 'true');
                form.innerHTML = '<p style="color:#ff3b3b; text-align:center;">Thank you! You have successfully subscribed.</p>';
              } else {
                // Re-enable the submit button if there was an error
                submitButton.disabled = false;
                submitButton.textContent = 'Subscribe';
              }
            } catch (error) {
              console.error('Error submitting form:', error);
              alert('An error occurred. Please try again.');
              // Re-enable the submit button
              submitButton.disabled = false;
              submitButton.textContent = 'Subscribe';
            }
          });
      });
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      alert('Error with verification system. Please try again later.');
      submitButton.disabled = false;
      submitButton.textContent = 'Subscribe';
    }
  });
});