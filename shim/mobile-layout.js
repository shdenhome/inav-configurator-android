import './mobile-layout.css';
import './fit-page.js';
import './osd-touch.js';

// Keep Android layout changes in the wrapper, leaving the upstream intact.
document.documentElement.classList.add('android-mobile');

function installNavigation() {
  const navigation = document.querySelector('.tab_container');
  const header = document.querySelector('.headerbar');
  if (!navigation || !header) return;
  const russian = navigator.language.toLowerCase().startsWith('ru');
  const labels = russian
    ? { menu: 'Меню', close: 'Закрыть меню', navigation: 'Вкладки конфигуратора' }
    : { menu: 'Menu', close: 'Close menu', navigation: 'Configurator tabs' };
  const narrow = matchMedia('(max-width: 759px)');
  const button = document.createElement('button');
  button.id = 'android-menu-toggle';
  button.type = 'button';
  button.textContent = `☰ ${labels.menu}`;
  button.setAttribute('aria-controls', 'android-navigation');
  navigation.id = 'android-navigation';
  navigation.setAttribute('aria-label', labels.navigation);
  navigation.setAttribute('role', 'navigation');
  const backdrop = document.createElement('button');
  backdrop.id = 'android-menu-backdrop';
  backdrop.type = 'button';
  backdrop.setAttribute('aria-label', labels.close);
  backdrop.tabIndex = -1;
  header.prepend(button);
  const controls = document.createElement('div'); controls.id = 'android-header-controls';
  for (const selector of ['#port-picker', '#profiles_wrapper_global', '#options']) {
    const element = header.querySelector(selector);
    if (element) controls.append(element);
  }
  header.append(controls);
  let fitPending = false;
  const fitControls = () => {
    fitPending = false;
    const style = getComputedStyle(header);
    const menuWidth = button.checkVisibility() ? button.getBoundingClientRect().width + parseFloat(style.columnGap) : 0;
    const available = header.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - menuWidth;
    if (controls.offsetWidth && available > 0) controls.style.zoom = Math.min(1, available / controls.offsetWidth);
  };
  const scheduleFit = () => {
    if (!fitPending) { fitPending = true; requestAnimationFrame(fitControls); }
  };
  const headerObserver = new ResizeObserver(scheduleFit);
  for (const element of [header, controls, button]) headerObserver.observe(element);
  scheduleFit();
  // The action must not be inside the log's scrolling viewport.
  const log = document.querySelector('#log');
  if (log) {
    const row = document.createElement('div'); row.id = 'android-log-row';
    log.before(row); row.append(log);
    const consoleButton = document.createElement('button');
    consoleButton.type = 'button'; consoleButton.id = 'android-top-console';
    consoleButton.textContent = russian ? 'Консоль' : 'Console';
    consoleButton.setAttribute('aria-controls', 'log');
    // Use INAV's original log toggle (including its saved open/closed state).
    // Keep the action outside the scrolling log instead of opening app-log.js.
    const originalToggle = log.querySelector('#showlog');
    originalToggle?.addEventListener('click', event => event.preventDefault());
    consoleButton.addEventListener('click', () => originalToggle?.click());
    const updateLogState = () => {
      const open = log.classList.contains('active');
      consoleButton.setAttribute('aria-expanded', String(open));
      consoleButton.textContent = open ? (russian ? 'Скрыть' : 'Hide') : (russian ? 'Консоль' : 'Console');
    };
    new MutationObserver(updateLogState).observe(log, { attributes: true, attributeFilter: ['class'] });
    updateLogState();
    row.append(consoleButton);
  }
  navigation.before(backdrop);

  function setOpen(open, returnFocus = false) {
    document.documentElement.classList.toggle('android-menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    navigation.inert = narrow.matches && !open;
    if (returnFocus) button.focus();
  }
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
    if (open) {
      const active = navigation.querySelector('li.active a') || navigation.querySelector('a');
      active?.scrollIntoView({ block: 'nearest' });
    }
  });
  backdrop.addEventListener('click', () => setOpen(false, true));
  navigation.addEventListener('click', event => {
    // Group headers stay open while browsing. Close only after choosing a tab.
    if (narrow.matches && event.target.closest('li:not(.nav-toggle-all) > a')) setOpen(false, true);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && narrow.matches) setOpen(false, true);
  });
  narrow.addEventListener('change', () => setOpen(false));
  setOpen(false);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installNavigation, { once: true });
else installNavigation();
