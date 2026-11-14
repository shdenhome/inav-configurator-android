// One console for renderer messages, GUI events and native demo output.
const key = 'inav-android-console-v1';
const russian = navigator.language.startsWith('ru');
const label = russian ? {
  title: 'Журнал приложения', close: 'Закрыть', copy: 'Копировать', save: 'Сохранить', clear: 'Очистить',
  copied: 'Скопировано', failed: 'Не удалось сохранить', saved: 'Сохранено',
} : { title: 'Application log', close: 'Close', copy: 'Copy', save: 'Save', clear: 'Clear', copied: 'Copied', failed: 'Save failed', saved: 'Saved' };
let lines = [];
try { const saved = JSON.parse(localStorage.getItem(key)); if (Array.isArray(saved)) lines = saved.slice(-500).map(String); } catch { }
let timer;
let view;
let status;
export function appLog(level, ...values) {
  const text = values.map(value => {
    if (value instanceof Error) return value.stack || value.message;
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value); } catch { return String(value); }
  }).join(' ').slice(0, 2400);
  lines.push(`${new Date().toISOString()} [${level}] ${text}`);
  if (lines.length > 500) lines.splice(0, lines.length - 500);
  if (!timer) timer = setTimeout(() => {
    timer = null;
    try { localStorage.setItem(key, JSON.stringify(lines)); } catch { }
    if (view && !view.closest('section').hidden) render();
  }, 150);
}
for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
  const original = console[level].bind(console);
  console[level] = (...values) => { original(...values); appLog(level, ...values); };
}
window.addEventListener('error', e => appLog('ERROR', e.error || e.message));
window.addEventListener('unhandledrejection', e => appLog('REJECTION', e.reason));
appLog('APP', 'Android wrapper mobile.8', navigator.userAgent);
const previous = localStorage.getItem('inav-last-demo-error');
if (previous) appLog('PREVIOUS DEMO ERROR', previous);

function render() {
  const atEnd = view.scrollHeight - view.scrollTop - view.clientHeight < 40;
  view.textContent = lines.join('\n');
  if (atEnd) view.scrollTop = view.scrollHeight;
}
function install() {
  const navigation = document.querySelector('.tab_container');
  if (!navigation) return;
  const launch = document.createElement('button');
  launch.type = 'button'; launch.id = 'android-console-open'; launch.textContent = label.title;
  navigation.prepend(launch);
  const panel = document.createElement('section');
  panel.id = 'android-console'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'android-console-title');
  const header = document.createElement('header');
  const title = document.createElement('strong'); title.id = 'android-console-title'; title.textContent = label.title;
  header.append(title);
  const close = document.createElement('button'); close.type = 'button'; close.textContent = label.close; header.append(close);
  const actions = document.createElement('div'); actions.className = 'android-console-actions';
  status = document.createElement('span'); status.setAttribute('aria-live','polite');
  view = document.createElement('pre'); view.tabIndex = 0;
  const text = () => lines.join('\n');
  for (const [name, action] of [
    ['copy', async () => {
      try { await navigator.clipboard.writeText(text()); status.textContent = label.copied; }
      catch {
        const field = document.createElement('textarea'); field.value = text(); panel.append(field); field.select();
        const ok = document.execCommand('copy'); field.remove(); status.textContent = ok ? label.copied : label.failed;
      }
    }],
    ['save', async () => {
      const api = window.electronAPI;
      const result = await api.showSaveDialog({ defaultPath: 'inav-android-log.txt' });
      if (result.canceled) return;
      const error = await api.writeFile(result.filePath, text());
      status.textContent = error ? label.failed : label.saved;
    }],
    ['clear', () => { lines = []; localStorage.removeItem(key); localStorage.removeItem('inav-last-demo-error'); render(); status.textContent = ''; }],
  ]) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label[name];
    button.addEventListener('click', () => Promise.resolve().then(action).catch(e => { appLog('ERROR', e); status.textContent = label.failed; })); actions.append(button);
  }
  actions.append(status); panel.append(header, actions, view);
  document.querySelector('#main-wrapper').append(panel);
  const openConsole = () => {
    const menu = document.querySelector('#android-menu-toggle');
    if (menu?.getAttribute('aria-expanded') === 'true') menu.click();
    panel.hidden = false; render(); close.focus();
  };
  launch.addEventListener('click', openConsole);
  const hide = () => { panel.hidden = true; (document.querySelector('#android-menu-toggle')?.checkVisibility() ? document.querySelector('#android-menu-toggle') : launch).focus(); };
  close.addEventListener('click', hide);
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); hide(); } });
  const wrapper = document.querySelector('#log .wrapper');
  if (wrapper) {
    for (const item of wrapper.children) if (item.textContent.trim()) appLog('GUI', item.textContent.trim());
    new MutationObserver(records => {
      for (const r of records) for (const node of r.addedNodes) if (node.textContent.trim()) appLog('GUI', node.textContent.trim());
    }).observe(wrapper, { childList: true });
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
