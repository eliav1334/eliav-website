function throttle(fn, delay) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= delay) { last = now; fn.apply(this, args); }
  };
}

// Header scroll effect
window.addEventListener('scroll', throttle(function() {
  const header = document.querySelector('header');
  if (header) header.classList.toggle('scrolled', window.scrollY > 50);
}, 100));

// Smooth scroll for hash links only
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileMenu();
    }
  });
});

// Toggle service details
function toggleService(card) {
  const details = card.querySelector('.service-details');
  if (details) details.classList.toggle('open');
}

// Toggle why card text
function toggleWhy(card) {
  const p = card.querySelector('p');
  if (p) p.classList.toggle('open');
}

// Toggle FAQ
function toggleFaq(question) {
  const item = question.parentElement;
  const answer = item.querySelector('.faq-answer');
  if (!answer) return;
  const isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item').forEach(i => {
    i.classList.remove('open');
    const a = i.querySelector('.faq-answer');
    if (a) a.style.maxHeight = '0';
  });
  // Open clicked if was closed
  if (!isOpen) {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
}

// ===== SCROLL ANIMATIONS WITH INTERSECTION OBSERVER =====
const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
      scrollObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.05,
  rootMargin: '0px 0px -50px 0px'
});

document.querySelectorAll('.service-card, .why-card, .faq-item, .service-summary-card, .service-detail-card, .testimonial-card, .gallery-item').forEach(el => {
  el.classList.add('scroll-animate');
  scrollObserver.observe(el);
});

document.querySelectorAll('.section-header').forEach(el => {
  el.classList.add('scroll-animate-fade');
  scrollObserver.observe(el);
});

document.querySelectorAll('.area-tag').forEach(el => {
  el.classList.add('scroll-animate-scale');
  scrollObserver.observe(el);
});

// Stat items - slide in from right (RTL)
document.querySelectorAll('.stat-item, .stat-card').forEach((el, i) => {
  el.classList.add('scroll-animate-slide');
  el.style.animationDelay = (i * 0.15) + 's';
  scrollObserver.observe(el);
});

// Hero section elements - subtle fade
document.querySelectorAll('.hero-text, .hero-visual').forEach(el => {
  el.classList.add('scroll-animate-hero');
  scrollObserver.observe(el);
});


// ===== COUNTER ANIMATION FOR STATISTICS =====
let statsAnimated = false;

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !statsAnimated) {
      statsAnimated = true;
      animateCounters();
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

function animateCounters() {
  const stats = document.querySelectorAll('.stat-number');
  stats.forEach((stat, index) => {
    const text = stat.textContent;
    const hasPlus = text.includes('+');
    const hasPercent = text.includes('%');
    const targetValue = parseInt(text.replace(/[^0-9]/g, ''));
    setTimeout(() => {
      let currentValue = 0;
      const increment = targetValue / 50;
      const duration = 2000;
      const stepTime = duration / (targetValue / increment);
      stat.classList.add('counting');
      const counter = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
          currentValue = targetValue;
          clearInterval(counter);
        }
        let displayValue = Math.floor(currentValue);
        if (hasPlus) displayValue += '+';
        if (hasPercent) displayValue += '%';
        stat.textContent = displayValue;
      }, stepTime);
    }, index * 200);
  });
}

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  statsObserver.observe(heroStats);
}

// Floating scroll to top button
const scrollTopBtn = document.querySelector('.floating-scroll-top');
if (scrollTopBtn) {
  window.addEventListener('scroll', throttle(function() {
    scrollTopBtn.classList.toggle('show', window.scrollY > 300);
  }, 100));
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mobile menu toggle
function toggleMobileMenu() {
  const mobileNav = document.getElementById('mobileNav');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileMenuBtn = document.querySelector('.mobile-menu');
  if (!mobileNav) return;
  mobileNav.classList.toggle('active');
  if (mobileOverlay) mobileOverlay.classList.toggle('active');
  if (mobileMenuBtn) mobileMenuBtn.classList.toggle('active');
  document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
}

function closeMobileMenu() {
  const mobileNav = document.getElementById('mobileNav');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileMenuBtn = document.querySelector('.mobile-menu');
  if (!mobileNav) return;
  mobileNav.classList.remove('active');
  mobileOverlay.classList.remove('active');
  if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
  document.body.style.overflow = '';
}

// Mobile dropdown toggle for services submenu
function toggleMobileDropdown(el) {
  el.classList.toggle('open');
  const content = el.nextElementSibling;
  if (content) content.classList.toggle('open');
}

// Lightbox functionality
let currentLightboxIndex = 0;
const galleryImages = [];

function initGallery() {
  const images = document.querySelectorAll('.service-gallery-grid img, .gallery-grid img');
  images.forEach((img, index) => {
    galleryImages.push(img.src);
    img.addEventListener('click', () => openLightbox(index));
  });
}

function openLightbox(index) {
  currentLightboxIndex = index;
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if (lightbox && galleryImages[index]) {
    lightboxImg.src = galleryImages[index];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox(event) {
  if (event) event.stopPropagation();
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function navigateLightbox(direction, event) {
  if (event) event.stopPropagation();
  currentLightboxIndex += direction;
  if (currentLightboxIndex < 0) currentLightboxIndex = galleryImages.length - 1;
  else if (currentLightboxIndex >= galleryImages.length) currentLightboxIndex = 0;
  const img = document.getElementById('lightbox-img');
  if (img) img.src = galleryImages[currentLightboxIndex];
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  const lightbox = document.getElementById('lightbox');
  if (lightbox && lightbox.classList.contains('active')) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(1);
    if (e.key === 'ArrowRight') navigateLightbox(-1);
  }
});

// Fix select dropdown on dark backgrounds
// Browsers ignore CSS color on <option> elements, so we toggle via JS
document.querySelectorAll('.mini-contact-fields select').forEach(select => {
  function updateColor() {
    select.style.color = select.value ? 'white' : 'rgba(255,255,255,0.5)';
  }
  updateColor();
  select.addEventListener('mousedown', () => { select.style.color = '#333333'; });
  select.addEventListener('blur', updateColor);
  select.addEventListener('change', updateColor);
});

// ===== BREVO INTEGRATION =====
function sendToBrevo(name, email, phone, source) {
  const data = { source };
  if (name) data.name = name;
  if (email) data.email = email;
  if (phone) data.phone = phone;
  return fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(() => {}); // Silent fail - don't block main form
}

// AJAX form submission - bypass FormSubmit redirect
document.querySelectorAll('form[action*="formsubmit.co"]').forEach(form => {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'שולח...';
    btn.disabled = true;
    // GA4: track form submission
    if (typeof gtag !== 'undefined') {
      gtag('event', 'generate_lead', {
        event_category: 'contact',
        event_label: 'form_submit',
        page_path: window.location.pathname
      });
    }
    // Send to Brevo (parallel, non-blocking)
    const fd = new FormData(form);
    sendToBrevo(fd.get('name'), fd.get('email'), fd.get('phone'), window.location.pathname);
    // Send to FormSubmit
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(() => {
      window.location.href = '/thanks';
    }).catch(() => {
      window.location.href = '/thanks';
    });
  });
});

// ===== LEAD CAPTURE POPUP =====
(function() {
  var POPUP_KEY = 'aa_popup_shown';
  var POPUP_DELAY = 45000; // 45 seconds

  // Don't show on thanks page or contact page
  if (location.pathname === '/thanks' || location.pathname === '/contact') return;
  // Don't show if already shown in last 7 days
  var lastShown = localStorage.getItem(POPUP_KEY);
  if (lastShown && Date.now() - parseInt(lastShown) < 7 * 24 * 60 * 60 * 1000) return;

  setTimeout(function() {
    var overlay = document.createElement('div');
    overlay.id = 'lead-popup-overlay';
    overlay.innerHTML = '\
      <div id="lead-popup">\
        <button id="lead-popup-close" aria-label="סגור">&times;</button>\
        <h3>רוצים הצעת מחיר?</h3>\
        <p>השאירו פרטים ונחזור אליכם תוך שעות</p>\
        <form id="lead-popup-form">\
          <input type="text" name="name" placeholder="שם מלא" required>\
          <input type="tel" name="phone" placeholder="טלפון *" required>\
          <input type="email" name="email" placeholder="אימייל (לא חובה)">\
          <button type="submit">שלחו לי הצעה</button>\
        </form>\
        <div id="lead-popup-success" style="display:none">\
          <p>תודה! נחזור אליכם בהקדם</p>\
        </div>\
      </div>';

    document.body.appendChild(overlay);
    localStorage.setItem(POPUP_KEY, Date.now().toString());

    // Close popup
    document.getElementById('lead-popup-close').onclick = function() {
      overlay.remove();
    };
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });

    // Submit popup form
    document.getElementById('lead-popup-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var f = e.target;
      var btn = f.querySelector('button');
      btn.textContent = 'שולח...';
      btn.disabled = true;

      sendToBrevo(f.name.value, f.email.value, f.phone.value, 'popup-' + location.pathname)
        .then(function() {
          f.style.display = 'none';
          document.getElementById('lead-popup-success').style.display = 'block';
          setTimeout(function() { overlay.remove(); }, 3000);
        });

      // GA4 tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', 'generate_lead', {
          event_category: 'popup',
          event_label: 'lead_capture',
          page_path: location.pathname
        });
      }
    });
  }, POPUP_DELAY);
})();

// ===== GA4 CLICK TRACKING =====
document.addEventListener('DOMContentLoaded', () => {

  // Track phone clicks (tel: links)
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'phone_call', {
          event_category: 'contact',
          event_label: 'tel_click',
          page_path: window.location.pathname
        });
      }
    });
  });

  // Track WhatsApp clicks
  document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    link.addEventListener('click', () => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'whatsapp_click', {
          event_category: 'contact',
          event_label: 'whatsapp_click',
          page_path: window.location.pathname
        });
      }
    });
  });

});

// LazyLoading for images
document.addEventListener('DOMContentLoaded', () => {
  // Init gallery
  initGallery();

  // Lazy load images
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '50px 0px', threshold: 0.01 });
    lazyImages.forEach(img => imageObserver.observe(img));
  }
});

// ===== SCROLL-TRIGGERED QUOTE POPUP =====
(function() {
  var SCROLL_POPUP_KEY = 'aa_scroll_popup_shown';

  // Don't show on thanks or contact pages
  if (location.pathname === '/thanks' || location.pathname === '/contact' ||
      location.pathname === '/thanks.html' || location.pathname === '/contact.html') return;

  // Don't show if already shown this session
  if (sessionStorage.getItem(SCROLL_POPUP_KEY)) return;

  var scrollPopupTriggered = false;

  function getScrollPercent() {
    var docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    var winHeight = window.innerHeight;
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (docHeight <= winHeight) return 100;
    return (scrollTop / (docHeight - winHeight)) * 100;
  }

  function createScrollPopup() {
    if (scrollPopupTriggered) return;
    scrollPopupTriggered = true;
    sessionStorage.setItem(SCROLL_POPUP_KEY, '1');

    var overlay = document.createElement('div');
    overlay.id = 'scroll-popup-overlay';
    overlay.innerHTML =
      '<div id="scroll-popup">' +
        '<button id="scroll-popup-close" aria-label="סגור">&times;</button>' +
        '<span class="scroll-popup-icon">&#128221;</span>' +
        '<h3>\u05E8\u05D5\u05E6\u05D9\u05DD \u05D4\u05E6\u05E2\u05EA \u05DE\u05D7\u05D9\u05E8 \u05D7\u05D9\u05E0\u05DD?</h3>' +
        '<p class="scroll-popup-subtitle">\u05D4\u05E9\u05D0\u05D9\u05E8\u05D5 \u05E4\u05E8\u05D8\u05D9\u05DD \u05D5\u05E0\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05DB\u05DD \u05EA\u05D5\u05DA \u05E9\u05E2\u05D5\u05EA \u05E1\u05E4\u05D5\u05E8\u05D5\u05EA</p>' +
        '<form id="scroll-popup-form" action="https://formsubmit.co/eliav1334@gmail.com" method="POST">' +
          '<input type="hidden" name="_subject" value="\u05E4\u05E0\u05D9\u05D9\u05D4 \u05D7\u05D3\u05E9\u05D4 \u05DE\u05E4\u05D5\u05E4\u05D0\u05E4 - \u05D4\u05E6\u05E2\u05EA \u05DE\u05D7\u05D9\u05E8">' +
          '<input type="hidden" name="_captcha" value="false">' +
          '<input type="text" name="_honey" style="display:none">' +
          '<input type="hidden" name="_template" value="table">' +
          '<input type="hidden" name="_next" value="https://eliavafar.co.il/thanks.html">' +
          '<input type="text" name="name" placeholder="\u05E9\u05DD" required>' +
          '<input type="tel" name="phone" placeholder="\u05D8\u05DC\u05E4\u05D5\u05DF" required>' +
          '<button type="submit">\u05E7\u05D1\u05DC\u05D5 \u05D4\u05E6\u05E2\u05EA \u05DE\u05D7\u05D9\u05E8</button>' +
        '</form>' +
        '<p class="scroll-popup-privacy">\u05DC\u05D0 \u05E0\u05E9\u05DC\u05D7 \u05E1\u05E4\u05DD. \u05D4\u05E4\u05E8\u05D8\u05D9\u05DD \u05E9\u05DC\u05DA \u05DE\u05D5\u05D2\u05E0\u05D9\u05DD.</p>' +
      '</div>';

    document.body.appendChild(overlay);

    // Trigger animation on next frame
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        overlay.classList.add('active');
      });
    });

    // Close handlers
    function closeScrollPopup() {
      overlay.classList.remove('active');
      setTimeout(function() { overlay.remove(); }, 400);
    }

    document.getElementById('scroll-popup-close').addEventListener('click', closeScrollPopup);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeScrollPopup();
    });

    // Close on Escape key
    function handleEsc(e) {
      if (e.key === 'Escape') {
        closeScrollPopup();
        document.removeEventListener('keydown', handleEsc);
      }
    }
    document.addEventListener('keydown', handleEsc);

    // Form submission via AJAX (reuse existing pattern)
    document.getElementById('scroll-popup-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var form = e.target;
      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.textContent;
      btn.textContent = '\u05E9\u05D5\u05DC\u05D7...';
      btn.disabled = true;

      // GA4 tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', 'generate_lead', {
          event_category: 'scroll_popup',
          event_label: 'scroll_quote_popup',
          page_path: location.pathname
        });
      }

      // Send to Brevo (parallel, non-blocking)
      if (typeof sendToBrevo === 'function') {
        sendToBrevo(form.name.value, null, form.phone.value, 'scroll-popup-' + location.pathname);
      }

      // Send to FormSubmit via AJAX
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function() {
        window.location.href = '/thanks';
      }).catch(function() {
        window.location.href = '/thanks';
      });
    });
  }

  // Listen for scroll to trigger popup at 40%
  window.addEventListener('scroll', throttle(function() {
    if (!scrollPopupTriggered && getScrollPercent() >= 40) {
      createScrollPopup();
    }
  }, 200));
})();
