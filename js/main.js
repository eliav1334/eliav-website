// Header scroll effect
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (header) header.classList.toggle('scrolled', window.scrollY > 50);
});

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
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('show', window.scrollY > 300);
  });
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
  mobileOverlay.classList.toggle('active');
  mobileMenuBtn.classList.toggle('active');
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
