// Fit page content independently from the navigation/header. Native pinch zoom
// remains available; visualViewport changes must not reset the user's zoom.
function installPageFit() {
  const content = document.querySelector('#content');
  if (!content) return;
  let pending = false;
  let previousPage;
  let signature = '';
  function fit() {
    pending = false;
    // PID tuning inserts #content-watermark before the actual tab. Fit the
    // tab itself, leaving decorative elements and loading indicators alone.
    const page = [...content.children].find(element =>
      [...element.classList].some(name => name.startsWith('tab-')));
    if (!page || !content.clientWidth || !content.clientHeight) return;
    page.classList.add('android-fit-page');
    // Maps and the text console already use the available viewport. Forms keep
    // a desktop layout so fields/tables are fitted together, without clipping.
    const fluid = page.matches('.tab-landing, .tab-cli, .tab-mission_control, .tab-mission-control');
    const available = content.clientWidth;
    let width = fluid ? available : Math.max(960, available);
    page.style.width = `${width}px`;
    let scale = Math.min(1, available / width);
    page.style.zoom = scale;
    if (!fluid) {
      const origin = page.getBoundingClientRect().left;
      for (const element of page.querySelectorAll('table, .gui_box')) {
        if (!element.checkVisibility()) continue;
        width = Math.max(width, Math.ceil((element.getBoundingClientRect().right - origin) / scale));
      }
      width = Math.max(width, page.scrollWidth);
      scale = Math.min(1, available / width);
      page.style.width = `${width}px`;
      page.style.zoom = scale;
    }
    const height = content.clientHeight / scale;
    page.style.height = `${height}px`;
    page.style.minHeight = `${height}px`;
    const next = `${width}:${height}:${scale}`;
    if (page !== previousPage || next !== signature) {
      previousPage = page; signature = next;
      window.dispatchEvent(new Event('resize'));
    }
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(fit); } }
  new ResizeObserver(schedule).observe(content);
  new MutationObserver(records => {
    if (records.some(r => [...r.addedNodes, ...r.removedNodes].some(n => n.nodeType === Node.ELEMENT_NODE))) schedule();
  }).observe(content, { childList: true, subtree: true });
  schedule();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPageFit, { once: true });
else installPageFit();
