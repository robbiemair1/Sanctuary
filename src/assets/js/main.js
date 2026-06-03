// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// Reveal on scroll
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => observer.observe(el));

const contactForm = document.getElementById('contact-form');
const contactStatus = document.getElementById('contact-form-status');
const contactSubmit = document.getElementById('contact-form-submit');

if (contactForm && contactStatus && contactSubmit) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactStatus.className = 'form-status error';
      contactStatus.textContent = 'Please complete all required fields.';
      contactForm.reportValidity();
      return;
    }

    contactSubmit.disabled = true;
    contactStatus.className = 'form-status';
    contactStatus.textContent = 'Sending your enquiry...';

    const payload = {
      fullName: contactForm.fullName.value.trim(),
      organisation: contactForm.organisation.value.trim(),
      email: contactForm.email.value.trim(),
      operationalHomes: contactForm.operationalHomes.value,
      ofstedOutcome: contactForm.ofstedOutcome.value,
      propertyInterest: contactForm.propertyInterest.value,
      message: contactForm.message.value.trim()
    };

    try {
      const response = await fetch('/api/send-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseError) {
        data = {};
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API route not found. Run npm run dev (Vercel) instead of npm run start (Eleventy-only).');
        }
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      contactStatus.className = 'form-status success';
      contactStatus.textContent = 'Thank you. We will be in touch within 24 hours.';
      contactForm.reset();
    } catch (error) {
      contactStatus.className = 'form-status error';
      contactStatus.textContent = `Could not send enquiry: ${error.message}`;
    } finally {
      contactSubmit.disabled = false;
    }
  });
}
