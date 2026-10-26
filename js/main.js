'use strict';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menuButton.hidden = false;
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
});
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

document.querySelector('#year').textContent = new Date().getFullYear();

document.querySelectorAll('.media-carousel').forEach(carousel => {
  const slides = [...carousel.querySelectorAll('.media-slide')];
  const controls = carousel.previousElementSibling.querySelector('.carousel-controls');
  const previous = controls.querySelector('.carousel-prev');
  const next = controls.querySelector('.carousel-next');
  const counter = controls.querySelector('.carousel-counter');
  const slideArea = carousel.querySelector('.carousel-slides');
  let current = 0;
  function showSlide(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, position) => {
      slide.hidden = position !== current;
      if (slide.hidden) slide.querySelector('video')?.pause();
    });
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    counter.textContent = `${current + 1} / ${slides.length}`;
  }
  controls.hidden = false;
  slides.forEach((slide, index) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'слайд');
    slide.setAttribute('aria-label', `${index + 1} из ${slides.length}`);
  });
  previous.addEventListener('click', () => showSlide(current - 1));
  next.addEventListener('click', () => showSlide(current + 1));
  function handleCarouselKey(event) {
    if (event.target.closest('video')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showSlide(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  }
  carousel.addEventListener('keydown', handleCarouselKey);
  controls.addEventListener('keydown', handleCarouselKey);
  let touchStart;
  slideArea.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 && !event.target.closest('video')
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  slideArea.addEventListener('touchend', event => {
    if (!touchStart) return;
    const deltaX = event.changedTouches[0].clientX - touchStart.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      showSlide(current + (deltaX < 0 ? 1 : -1));
    }
    touchStart = null;
  }, { passive: true });
  slideArea.addEventListener('touchcancel', () => { touchStart = null; });
  showSlide(0);
});

const imageDialog = document.createElement('dialog');
imageDialog.className = 'image-dialog';
imageDialog.setAttribute('aria-label', 'Просмотр экрана курса');
imageDialog.innerHTML = '<button class="image-close" type="button" autofocus>Закрыть ×</button><img alt="">';
document.body.append(imageDialog);
let imageTrigger;
document.querySelectorAll('.zoom-image').forEach(link => {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    imageTrigger = link;
    const largeImage = imageDialog.querySelector('img');
    largeImage.src = link.href;
    largeImage.alt = link.querySelector('img').alt;
    imageDialog.showModal();
    document.body.classList.add('image-view-open');
  });
});
imageDialog.querySelector('button').addEventListener('click', () => imageDialog.close());
imageDialog.addEventListener('click', event => { if (event.target === imageDialog) imageDialog.close(); });
imageDialog.addEventListener('close', () => {
  document.body.classList.remove('image-view-open');
  imageTrigger?.focus();
});
document.querySelectorAll('.full-case').forEach(caseDetails => caseDetails.addEventListener('toggle', event => {
  if (!event.currentTarget.open) event.currentTarget.querySelector('video')?.pause();
}));

// Animate once on entry; content remains visible without JavaScript or animation support.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const runningReveals = new Set();
if ('IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealObserver.unobserve(entry.target);
      if (reducedMotion.matches || entry.target.contains(document.activeElement)) return;
      const animation = entry.target.animate([
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 850, delay: entry.target.matches('.skill-row') ? [...entry.target.parentElement.querySelectorAll('.skill-row')].indexOf(entry.target) * 170 : 0, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      runningReveals.add(animation);
      animation.finished.catch(() => {}).finally(() => runningReveals.delete(animation));
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.about-topline, .about h2, .about-copy, .about-approach .skill-row, #projects-title, .course-banner, .carousel-header, .media-carousel, .contacts .wrap').forEach(element => revealObserver.observe(element));
  reducedMotion.addEventListener('change', event => {
    if (event.matches) runningReveals.forEach(animation => animation.cancel());
  });
}
// Preserve native details semantics, including keyboard activation and no-script fallback.
if (typeof Element.prototype.animate === 'function') {
  document.querySelectorAll('.full-case').forEach(details => {
    const summary = details.querySelector('summary');
    const content = details.querySelector('.case-content');
    let animation = null;
    let expanded = details.open;
    function settle() {
      animation?.cancel();
      animation = null;
      details.open = expanded;
      details.style.removeProperty('overflow');
    }
    summary.addEventListener('click', event => {
      if (reducedMotion.matches) return;
      event.preventDefault();
      const startHeight = details.getBoundingClientRect().height;
      animation?.cancel();
      expanded = !expanded;
      details.open = true;
      details.style.overflow = 'hidden';
      const endHeight = expanded
        ? details.getBoundingClientRect().height
        : summary.getBoundingClientRect().height + parseFloat(getComputedStyle(details).borderBottomWidth || '0');
      animation = details.animate([
        { height: `${startHeight}px` },
        { height: `${endHeight}px` }
      ], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' });
      animation.onfinish = settle;
    });
    details.addEventListener('toggle', () => {
      if (!animation) expanded = details.open;
    });
    reducedMotion.addEventListener('change', event => {
      if (event.matches && animation) settle();
    });
    window.addEventListener('resize', () => { if (animation) settle(); });
  });
}
// Show the hint on entering the viewport, without requiring hover.
if ('IntersectionObserver' in window) {
  const hintObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('hint-in-view', entry.isIntersecting);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.full-case>summary').forEach(summary => hintObserver.observe(summary));
} else {
  document.querySelectorAll('.full-case>summary').forEach(summary => summary.classList.add('hint-in-view'));
}
// First-screen sequence plays once when the hero enters view.
if ('IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
  const hero = document.querySelector('.hero');
  const heroObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    heroObserver.disconnect();
    if (reducedMotion.matches) return;
    hero.classList.add('hero-intro-play');
    function heroAnimate(element, frames, options) {
      const animation = element.animate(frames, { easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards', ...options });
      runningReveals.add(animation);
      animation.finished.catch(() => {}).finally(() => runningReveals.delete(animation));
    }
    hero.querySelectorAll('.hero-line').forEach((line, index) => {
      heroAnimate(line, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 1700, delay: index * 340 });
    });
    heroAnimate(hero.querySelector('.hero-portrait img'), [{ opacity: 0, transform: 'scale(1.025)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 2800, delay: 360 });
    heroAnimate(hero.querySelector('.asterisk'), [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 2000, delay: 900 });
  }, { threshold: 0.08 });
  heroObserver.observe(hero);
}