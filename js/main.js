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
