// Translate touch/pen drags into the existing OSD drag/drop handlers. The
// upstream handler remains responsible for grid bounds, MSP writes and redraws.
const gridSelector = '.tab-osd .display-layout .preview';
let drag;
const pointers = new Set();

function dragEvent(target, type, transfer) {
  target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }));
}
function clearDrag() {
  const previous = drag;
  drag = undefined;
  if (!previous) return;
  previous.source.classList.remove('android-osd-drag-source');
  previous.target?.classList.remove('android-osd-drop-target');
  if (previous.grid.hasPointerCapture(previous.id)) previous.grid.releasePointerCapture(previous.id);
}
function targetAt(event) {
  const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest('.char');
  if (!cell || !drag.grid.contains(cell)) return;
  const index = drag.cells.indexOf(cell) - drag.offset;
  return drag.cells[Math.max(0, Math.min(drag.cells.length - 1, index))];
}

document.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
  pointers.add(event.pointerId);
  // A second finger belongs to browser pinch zoom, never to an OSD write.
  if (pointers.size !== 1) { clearDrag(); return; }
  const source = event.target.closest('.char[draggable="true"]');
  const grid = source?.closest(gridSelector);
  const $ = window.jQuery;
  if (!grid || !$) return;
  const item = $(source).data('item');
  if (!item || item.positionable === false) return;
  const cells = [...grid.querySelectorAll('.char')];
  const input = [...document.querySelectorAll('.tab-osd input.position')]
    .find(element => element.classList.contains(String(item.id)));
  // Preserve the grabbed character's offset from the element's anchor.
  const anchor = input ? Number(input.value) : cells.findIndex(cell => $(cell).data('item')?.id === item.id);
  drag = { id: event.pointerId, grid, source, cells, offset: cells.indexOf(source) - anchor,
    x: event.clientX, y: event.clientY, moved: false };
  grid.setPointerCapture(event.pointerId);
  event.preventDefault();
}, { capture: true, passive: false });

document.addEventListener('pointermove', event => {
  if (!drag || drag.id !== event.pointerId) return;
  if (!drag.source.isConnected || !drag.grid.isConnected) { clearDrag(); return; }
  event.preventDefault();
  if (!drag.moved) {
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4) return;
    drag.moved = true;
    drag.transfer = new DataTransfer();
    dragEvent(drag.source, 'dragstart', drag.transfer);
    drag.source.classList.add('android-osd-drag-source');
  }
  const target = targetAt(event);
  drag.target?.classList.remove('android-osd-drop-target');
  drag.target = target;
  target?.classList.add('android-osd-drop-target');
}, { capture: true, passive: false });

document.addEventListener('pointerup', event => {
  pointers.delete(event.pointerId);
  if (!drag || drag.id !== event.pointerId) return;
  event.preventDefault();
  const previous = drag;
  const target = previous.moved && previous.source.isConnected ? targetAt(event) : undefined;
  clearDrag();
  if (target && previous.transfer.getData('text/plain')) dragEvent(target, 'drop', previous.transfer);
}, { capture: true, passive: false });

document.addEventListener('pointercancel', event => {
  pointers.delete(event.pointerId);
  if (drag?.id === event.pointerId) clearDrag();
}, true);
document.addEventListener('lostpointercapture', event => {
  if (drag?.id === event.pointerId) clearDrag();
}, true);
window.addEventListener('blur', () => { pointers.clear(); clearDrag(); });

function installHint() {
  const title = document.querySelector('.tab-osd .gui_box.preview > .gui_box_titlebar');
  if (!title || title.querySelector('.android-osd-touch-hint')) return;
  const hint = document.createElement('span'); hint.className = 'android-osd-touch-hint';
  hint.textContent = navigator.language.startsWith('ru')
    ? 'Перетащите элемент пальцем. Для точной настройки увеличьте масштаб.'
    : 'Drag an element with one finger. Zoom in for precise positioning.';
  title.append(hint);
}
function install() {
  const content = document.querySelector('#content');
  if (!content) return;
  let pending = false;
  new MutationObserver(() => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(() => { pending = false; installHint(); });
    }
  }).observe(content, { childList: true, subtree: true });
  installHint();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
