// Project data on the original prototype shell. Base helpers are copied unchanged.
const presets = JSON.parse(document.getElementById('presets').textContent);
const address = new URLSearchParams(location.hash.slice(1));
const toolbarVariants = JSON.parse(document.getElementById('toolbar-variants').textContent);
const entryToolbarVariants = [{id:'v6',label:'Вариант 1 · Рука и рисование'},{id:'v6-toggle',label:'Вариант 2 · Карандаш вкл/выкл'}];
const entryMethods = [{id:'maximize',label:'Через максимайз'},{id:'maximize2',label:'Maximize 2'},{id:'button',label:'Через «Увеличить»'},{id:'preview',label:'Масштаб в меню'}];
let selectedEntry = entryMethods.find(v => v.id === address.get('entry'))?.id || 'maximize';
let selectedToolbar = (selectedEntry === 'button' ? entryToolbarVariants : toolbarVariants).find(v => v.id === address.get('toolbar'))?.id || 'v6';
let selected = presets.find(p => p.id === (address.get('preset') || location.hash.slice(1))) || presets[0];
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
  if (size.id === 'custom') {
    params.set('width',size.ширина);
    params.set('height',size.высота);
  }
  history.replaceState(null,'','#' + params);
}

function открыть(count = selected.count, shares = selected.shares) {
  selected = presets.find(p => p.count === count && p.shares === shares)
    || presets.find(p => p.count === count && p.shares === 0);
  подготовитьОкно('frame.html?preset=' + selected.id + '&toolbar=' + selectedToolbar + '&entry=' + selectedEntry);
  запомнить();
  нарисовать();
  вписать();
}

function нарисовать() {
  const active = document.activeElement;
  const focus = панель.contains(active) && active.name
    ? {name:active.name, value:active.value, start:active.selectionStart, end:active.selectionEnd} : null;
  const filters = эл('div','sh-filters');
  const counts = [2,5,16];
  filters.append(
    фильтр('Открытие зума','entry',entryMethods.map(v => v.label),entryMethods.findIndex(v => v.id === selectedEntry),i => {
      selectedEntry = entryMethods[i].id;
      if(!(selectedEntry === 'button' ? entryToolbarVariants : toolbarVariants).some(v => v.id === selectedToolbar)) selectedToolbar = 'v6';
      синхронизировать();запомнить();нарисовать();
    }),
    фильтр('Заполнение','fill',['1 на 1','Типовое представление','Максимальное представление'],counts.indexOf(selected.count),i => открыть(counts[i])),
    фильтр('Сценарии','share',['Без демонстрации','Одна демонстрация','Две демонстрации'].slice(0,selected.count === 2 ? 2 : 3),selected.shares,i => открыть(selected.count,i)),
  );
  const variants = selectedEntry === 'button' ? entryToolbarVariants : toolbarVariants;
  if(selectedEntry !== 'preview') filters.append(
    фильтр('Варианты','toolbar',variants.map(v => v.label),variants.findIndex(v => v.id === selectedToolbar),i => {
      selectedToolbar = variants[i].id;
      for (const frame of рамка.querySelectorAll('iframe')) frame.contentWindow?.postMessage({type:'participant-zoom-variant',variant:selectedToolbar},location.origin);
      запомнить();нарисовать();
    }),
  );
  панель.replaceChildren(шапкаУстройства(),filters);
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
