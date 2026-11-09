// Runs before the player: startup failures must not leave an endless spinner.
(() => {
  const later = window.setTimeout.bind(window), cancel = window.clearTimeout.bind(window);
  let timer, errorText = '';
  const ready = () => document.documentElement.dataset.prototypeReady === 'true';
  const loader = document.getElementById('prototype-loader');
  const original = loader.innerHTML;
  const element = (tag, text) => {const node=document.createElement(tag);node.textContent=text;return node;};
  const show = () => {
    if (ready() || !loader.isConnected) return;
    loader.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;box-sizing:border-box;text-align:center;font:15px/1.4 Arial,sans-serif;color:#333;background:#fff';
    const title=element('p','Не удалось открыть макет');
    const hint=element('p','Попробуйте продолжить загрузку или обновить страницу.');
    const resume=element('button','Продолжить загрузку');
    resume.type='button';
    resume.onclick=() => {
      const videos=Array.from(document.querySelectorAll('video'));
      if (!videos.length) {location.reload();return;}
      for (const video of videos) {
        try {video.play().catch(() => {});} catch {}
        const stream=video.srcObject;
        if (stream && typeof stream.getVideoTracks==='function') for(const track of stream.getVideoTracks()) {
          try {if(typeof track.requestFrame==='function') track.requestFrame();} catch {}
        }
      }
      loader.innerHTML=original;
      loader.style.cssText='display:flex';
      cancel(timer);timer=later(show,10000);
    };
    const reload=element('button','Обновить страницу');
    reload.type='button';reload.onclick=() => location.reload();
    resume.style.cssText=reload.style.cssText='cursor:pointer;padding:8px 16px;border:1px solid ButtonBorder;border-radius:6px;background:ButtonFace;color:ButtonText;font:inherit';
    const details=element('details','');
    const summary=element('summary','Сведения об ошибке');
    const data=element('pre',errorText || Array.from(document.querySelectorAll('video')).map((video,i) => 'Видео '+(i+1)+': '+video.readyState).join('\n') || 'Загрузка проигрывателя не завершилась.');
    data.style.cssText='max-width:560px;max-height:160px;overflow:auto;text-align:left;white-space:pre-wrap;font-size:12px';
    details.append(summary,data);loader.replaceChildren(title,hint,resume,reload,details);
  };
  const failed = event => {
    if(ready())return;
    errorText=String(event.message || (event.reason && event.reason.message) || event.reason || 'Не удалось загрузить ресурс проигрывателя.');
    show();
  };
  const observer=new MutationObserver(() => {
    if(!ready())return;
    cancel(timer);observer.disconnect();
    window.removeEventListener('error',failed);window.removeEventListener('unhandledrejection',failed);
  });
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-prototype-ready']});
  window.addEventListener('error',failed);window.addEventListener('unhandledrejection',failed);
  timer=later(show,15000);
})();
