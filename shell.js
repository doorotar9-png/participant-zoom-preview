// Project data on the original prototype shell. Base helpers are copied unchanged.
const presets = JSON.parse(document.getElementById('presets').textContent);
const address = new URLSearchParams(location.hash.slice(1));
const touchPreview = address.get('input') === 'touch';
const toolbarVariants = JSON.parse(document.getElementById('toolbar-variants').textContent);
const entryToolbarVariants = [{id:'v6',label:'Вариант 1 · Рука и рисование'},{id:'v6-toggle',label:'Вариант 2 · Карандаш вкл/выкл'}];
const entryMethods = [{id:'final',label:'Финальная'},{id:'maximize',label:'Через максимайз'},{id:'maximize2',label:'Maximize 2'},{id:'button',label:'Через «Увеличить»'},{id:'preview',label:'Масштаб в меню'}];
// The chosen version is fixed; legacy catalogues and implementations stay available in source.
let selectedEntry = 'final';
let selectedToolbar = 'v6';
const initialPreset = globalThis.performance?.getEntriesByType?.('navigation')?.[0]?.type === 'reload'
  ? 'solo-camera' : address.get('preset') || location.hash.slice(1);
let selected = presets.find(p => p.id === initialPreset) || presets[0];
let pendingCount = null, peopleRequest = 0, peopleTimer = 0;
размерОкна = Math.max(0, РАЗМЕРЫ.findIndex(s => s.id === address.get('size')));
if (РАЗМЕРЫ[размерОкна].id === 'custom') {
  for (const [axis, key] of [['ширина','width'],['высота','height']]) {
    const value = address.get(key);
    if (value && корректныйРазмер(value)) {
      свойРазмер[axis] = value;
      РАЗМЕРЫ[размерОкна][axis] = Number(value);
      размерДоВвода[axis] = Number(value);
    }
  }
}

function запомнить() {
  const size = РАЗМЕРЫ[размерОкна];
  const params = new URLSearchParams({preset:selected.id, size:size.id, toolbar:selectedToolbar,entry:selectedEntry});
  if(touchPreview)params.set('input','touch');
  if (size.id === 'custom') {
    params.set('width',size.ширина);
    params.set('height',size.высота);
  }
  history.replaceState(null,'','#' + params);
}

function открыть(count = selected.count, shares = selected.shares) {
  pendingCount = null;
  clearTimeout(peopleTimer);
  peopleRequest++;
  selected = presets.find(p => p.count === count && p.shares === shares)
    || presets.find(p => p.count === count && p.shares === 0);
  подготовитьОкно('frame.html?v=8185bcac5b8a1d03&preset=' + selected.id + '&toolbar=' + selectedToolbar + '&entry=' + selectedEntry + (touchPreview?'&input=touch':''));
  запомнить();
  нарисовать();
  вписать();
}

function отправитьЗаполнение() {
  if (pendingCount === null || подготовка || окно.contentDocument?.documentElement.dataset.prototypeReady !== 'true') return;
  const request = ++peopleRequest;
  clearTimeout(peopleTimer);
  окно.contentWindow.postMessage({type:'participant-zoom-people', count:pendingCount, shares:selected.shares, request}, location.origin);
  peopleTimer = setTimeout(() => {
    if (request !== peopleRequest || pendingCount === null) return;
    const status = эл('div','sh-transition-error','Не удалось изменить состав. ');
    status.setAttribute('role','status');
    const retry = эл('button','','Повторить');
    retry.type = 'button';
    retry.onclick = () => {status.remove(); отправитьЗаполнение();};
    status.append(retry);
    ошибкаПерехода?.remove(); ошибкаПерехода = status; рамка.append(status);
  }, 5000);
}

function изменитьЗаполнение(count, shares = selected.shares) {
  selected = presets.find(p => p.count === count && p.shares === Math.min(shares, count - 1));
  pendingCount = count;
  ошибкаПерехода?.remove(); ошибкаПерехода = null;
  запомнить(); нарисовать(); вписать();
  отправитьЗаполнение();
}

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== окно.contentWindow) return;
  if (event.data?.type === 'prototype-frame-ready') отправитьЗаполнение();
  if (event.data?.type === 'participant-zoom-people-applied' && event.data.request === peopleRequest) {
    if (event.data.applied) {
      clearTimeout(peopleTimer); pendingCount = null;
      ошибкаПерехода?.remove(); ошибкаПерехода = null;
    }
  }
});

function стикерПроекта() {
  const sticker = эл('footer','sh-sticker');
  sticker.setAttribute('aria-label','О проекте');
  const status = эл('div','sh-sticker-status');
  const check = эл('span','sh-sticker-status-icon','\ue616');
  check.setAttribute('aria-hidden','true');
  status.append(check,эл('span','','Устный Ok'),эл('span','','21.10.26'));
  const comment = эл('div','sh-sticker-card sh-sticker-comment','Рисование на демонстрации со стороны зрителя');
  const design = эл('div','sh-sticker-card sh-sticker-row');
  const info = эл('div','sh-sticker-info');
  const links = эл('div','sh-sticker-links');
  for (const [title, href] of [
    ['Согласование макета','https://online.sbis.ru/opendoc.html?guid=01a133d2-c66e-7eda-b0eb-8b583e6febe1&client=3'],
    ['Описание БП','https://online.sbis.ru/page/kbase_entity/67f767c5-8825-4f94-a32d-f74b4c2e3b52?folderId=408f3210-fd45-498a-880f-b461416d3090'],
  ]) {
    const link = эл('a','sh-sticker-link',title);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    links.append(link);
  }
  info.append(эл('div','','Тютин Денис'),links);
  design.append(эл('span','sh-sticker-label','Design:'),info);
  const develop = эл('div','sh-sticker-card sh-sticker-develop');
  const web = эл('div','sh-sticker-row');
  web.append(эл('span','sh-sticker-label','web'),эл('span','sh-sticker-info','Егоров Максим'));
  develop.append(эл('div','sh-sticker-label','Develop:'),web);
  sticker.append(status,comment,design,develop);
  return sticker;
}

function нарисовать() {
  const active = document.activeElement;
  const focus = панель.contains(active) && active.name
    ? {name:active.name, value:active.value, start:active.selectionStart, end:active.selectionEnd} : null;
  const filters = эл('div','sh-filters');
  const counts = [2,5,16];
  filters.append(
    фильтр('Заполнение','fill',['1 на 1','Типовое представление','Максимальное представление'],counts.indexOf(selected.count),i => изменитьЗаполнение(counts[i])),
    фильтр('Сценарии','share',['Без демонстрации','Одна демонстрация','Две демонстрации'].slice(0,selected.count === 2 ? 2 : 3),selected.shares,i => изменитьЗаполнение(selected.count,i)),
  );
  панель.replaceChildren(шапкаУстройства(),filters,стикерПроекта());
  if (focus) {
    const control = [...панель.querySelectorAll('input,select,button')].find(e => e.name === focus.name && e.value === focus.value);
    control?.focus({preventScroll:true});
    if (control && typeof focus.start === 'number') control.setSelectionRange(focus.start,focus.end);
  }
}

function синхронизировать() {
  for(const frame of рамка.querySelectorAll('iframe')) {
    frame.contentWindow?.postMessage({type:'participant-zoom-entry',method:selectedEntry},location.origin);
    frame.contentWindow?.postMessage({type:'participant-zoom-variant',variant:selectedToolbar},location.origin);
  }
}
рамка.addEventListener('load',event => {if(event.target instanceof HTMLIFrameElement) синхронизировать();},true);

нарисовать();
вписать();
открыть();
