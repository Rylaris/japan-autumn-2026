/* An additive guide-card layer. Existing photo, itinerary and city views stay intact. */
(() => {
  'use strict';
  const root = new URL('.', document.currentScript.src);
  const version = new URL(document.currentScript.src).search;
  const resource = name => new URL(name + version, root);
  const lightbox = document.getElementById('lightbox');
  const photo = document.getElementById('lbImg');
  if (!lightbox || !photo || typeof DATA === 'undefined') return;
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = resource('guides.css').href;
  document.head.append(style);
  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'gc-launch';
  launcher.hidden = true;
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.innerHTML = '景点导游卡 <span aria-hidden="true">↗</span>';
  document.getElementById('lbOpen').before(launcher);

  const dialog = document.createElement('dialog');
  dialog.id = 'guideCard';
  dialog.className = 'guide-card';
  dialog.setAttribute('aria-labelledby', 'gcTitle');
  dialog.innerHTML = `<div class="gc-shell">
    <header class="gc-head"><div class="gc-brand">FIELD NOTES / 2026<b>秋の旅 · 景点导游卡</b></div>
      <div class="gc-controls"><select class="gc-select" id="gcSelect" aria-label="切换景点" disabled><option>正在展开导览</option></select>
      <button class="gc-close" type="button" aria-label="关闭导游卡，返回照片">×</button></div></header>
    <div class="gc-main" id="gcMain"><figure class="gc-visual"><img class="gc-image" id="gcImage" alt="" decoding="async">
      <div class="gc-photo-switch" id="gcPhotos" aria-label="切换参考照片" hidden></div>
      <figcaption class="gc-image-title"><span class="gc-region" id="gcRegion"></span><b id="gcJapanese"></b><small id="gcEnglish"></small></figcaption></figure>
      <article class="gc-reading" id="gcReading" tabindex="-1"></article></div>
    <footer class="gc-footer"><button class="gc-step" id="gcPrev" type="button" disabled>← 上一处</button><span class="gc-count" id="gcCount">随景而行</span><button class="gc-step" id="gcNext" type="button" disabled>下一处 →</button></footer>
  </div>`;
  document.body.append(dialog);
  const el = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const supported = index => Number.isInteger(index) && (index >= 0 && index <= 24 || index === 30);
  let dataPromise = null;
  let data = null;
  let currentIndex = null;
  let currentGuide = null;
  let request = 0;
  let opener = null;
  const fetchGuides = () => {
    if (!dataPromise) {
      dataPromise = fetch(resource('guide-data.json'), {signal:AbortSignal.timeout(15000)}).then(response => {
        if (!response.ok) throw new Error('Guide data unavailable');
        return response.json();
      }).then(value => {
        if (!Array.isArray(value.guides) || !value.sources) throw new Error('Invalid guide data');
        data = value;
        return value;
      }).catch(error => { dataPromise = null; throw error; });
    }
    return dataPromise;
  };
  const findPhotoIndex = () => DATA.assets.findIndex(asset => asset.src === photo.getAttribute('src'));
  const syncLauncher = () => {
    const index = findPhotoIndex();
    launcher.hidden = !supported(index);
    if (!launcher.hidden) {
      launcher.setAttribute('aria-label', `阅读${DATA.assets[index].title}的景点导游卡`);
      if (lightbox.open) fetchGuides().catch(() => {});
    }
  };
  new MutationObserver(syncLauncher).observe(photo, {attributes:true,attributeFilter:['src']});
  new MutationObserver(syncLauncher).observe(lightbox, {attributes:true,attributeFilter:['open']});
  syncLauncher();

  const showInitial = index => {
    const asset = DATA.assets[index];
    dialog.dataset.city = asset.group === '京都' ? 'kyoto' : asset.group === '奈良' ? 'nara' : 'tokyo';
    el('gcImage').src = asset.src;
    el('gcImage').alt = asset.title;
    el('gcRegion').textContent = asset.group;
    el('gcJapanese').textContent = asset.title.replace('（新增）','');
    el('gcEnglish').textContent = 'A closer look, a deeper journey.';
    el('gcPhotos').hidden = true;
    el('gcReading').setAttribute('aria-busy','true');
    el('gcReading').innerHTML = `<span class="gc-eyebrow">随景而行</span><h2 class="gc-title" id="gcTitle">${escape(asset.title.replace('（新增）',''))}</h2><p class="gc-status" role="status">正在展开这片风景的故事<span class="gc-loading-line" aria-hidden="true"></span></p>`;
    el('gcPrev').disabled = el('gcNext').disabled = true;
  };
  const setPhoto = position => {
    if (!currentGuide) return;
    const image = currentGuide.images[position];
    el('gcImage').src = image.url;
    el('gcImage').alt = image.alt;
    el('gcPhotos').querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === position)));
  };
  const resetScroll = () => {
    el('gcReading').scrollTop = 0;
    el('gcMain').scrollTop = 0;
  };
  const render = guide => {
    currentGuide = guide;
    dialog.dataset.city = guide.city;
    const guidePosition = data.guides.indexOf(guide);
    const sourceIds = [...new Set(guide.sections.flatMap(section => section.sources))];
    const note = ids => `<span class="gc-notes">${ids.map(id => `<a href="#gc-source-${escape(id)}" data-gc-source="${escape(id)}" aria-label="查看资料 ${sourceIds.indexOf(id)+1}">[${sourceIds.indexOf(id)+1}]</a>`).join('')}</span>`;
    el('gcRegion').textContent = `${guide.region} / ${String(guidePosition+1).padStart(2,'0')}`;
    el('gcJapanese').textContent = guide.jp;
    el('gcEnglish').textContent = guide.en;
    el('gcPhotos').hidden = guide.images.length < 2;
    el('gcPhotos').innerHTML = guide.images.length > 1 ? guide.images.map((image,i) => `<button type="button" data-gc-photo="${i}" aria-pressed="false">${escape(image.alt.replace('山中湖',''))}</button>`).join('') : '';
    setPhoto(Math.max(0, guide.images.findIndex(image => image.assetIndex === currentIndex)));
    const creditImage = guide.images.find(image => image.credit);
    const credit = creditImage ? `${escape(creditImage.credit)} · <a href="${escape(creditImage.source)}" target="_blank" rel="noreferrer">图片来源 ↗</a> · <a href="${escape(creditImage.license)}" target="_blank" rel="noreferrer">许可 ↗</a>` : '配图沿用原旅行文档，仅作景观参考。';
    el('gcReading').innerHTML = `<span class="gc-eyebrow">${escape(guide.kicker)}</span>
      <h2 class="gc-title" id="gcTitle">${escape(guide.title)}</h2><p class="gc-tagline">${escape(guide.tagline)}</p>
      <div class="gc-intro">${guide.intro.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}</div>
      ${guide.sections.map(section => `<section class="gc-section"><div class="gc-section-label">${escape(section.label)}</div><h3>${escape(section.title)}</h3><p>${escape(section.text)}${note(section.sources)}</p></section>`).join('')}
      <section class="gc-observe"><h3>到这里，慢看两眼</h3><ul>${guide.observe.map(text => `<li>${escape(text)}</li>`).join('')}</ul></section>
      <details class="gc-sources" id="gcSources"><summary>这些故事，从哪里读来 <span aria-hidden="true">↗</span></summary>
      <ol>${sourceIds.map(id => `<li id="gc-source-${escape(id)}" tabindex="-1"><a href="${escape(data.sources[id].url)}" target="_blank" rel="noreferrer">${escape(data.sources[id].title)} ↗</a></li>`).join('')}</ol>
      <p>资料查阅：${escape(data.researchedAt)}。现场观察提示为导览建议。</p></details><p class="gc-credit">${credit}</p>`;
    el('gcReading').removeAttribute('aria-busy');
    const groups = [...new Set(data.guides.map(item => item.region))];
    el('gcSelect').innerHTML = groups.map(group => `<optgroup label="${escape(group)}">${data.guides.filter(item => item.region === group).map(item => `<option value="${escape(item.id)}"${item === guide ? ' selected' : ''}>${escape(item.title)}</option>`).join('')}</optgroup>`).join('');
    el('gcSelect').disabled = false;
    el('gcPrev').disabled = el('gcNext').disabled = false;
    const previous = data.guides[(guidePosition-1+data.guides.length)%data.guides.length];
    const next = data.guides[(guidePosition+1)%data.guides.length];
    el('gcPrev').textContent = `← ${previous.title}`;
    el('gcNext').textContent = `${next.title} →`;
    el('gcCount').textContent = `${String(guidePosition+1).padStart(2,'0')} / ${data.guides.length}`;
    resetScroll();
  };
  const openGuide = async index => {
    if (!supported(index)) return;
    currentIndex = index;
    const token = ++request;
    if (!dialog.open) {
      opener = document.activeElement;
      showInitial(index);
      document.documentElement.classList.add('gc-open');
      dialog.showModal();
      dialog.querySelector('.gc-close').focus({preventScroll:true});
    }
    try {
      await fetchGuides();
      if (token !== request || !dialog.open) return;
      const guide = data.guides.find(item => item.assetIndices.includes(index));
      if (!guide) throw new Error('Guide not found');
      render(guide);
    } catch {
      if (token !== request || !dialog.open) return;
      el('gcReading').removeAttribute('aria-busy');
      el('gcReading').innerHTML = `<h2 class="gc-title" id="gcTitle">故事暂时未能展开</h2><p class="gc-status" role="status">连接有些慢，可以再试一次，或先返回照片。</p><button class="gc-retry" type="button" id="gcRetry">重新展开</button>`;
      el('gcRetry').onclick = () => { showInitial(currentIndex); openGuide(currentIndex); };
    }
  };
  launcher.onclick = () => openGuide(findPhotoIndex());
  dialog.querySelector('.gc-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => {
    if (event.target === dialog) { dialog.close(); return; }
    const photoButton = event.target.closest('[data-gc-photo]');
    if (photoButton) { setPhoto(Number(photoButton.dataset.gcPhoto)); return; }
    const sourceLink = event.target.closest('[data-gc-source]');
    if (sourceLink) {
      event.preventDefault();
      el('gcSources').open = true;
      const target = el(`gc-source-${sourceLink.dataset.gcSource}`);
      target?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      target?.focus({preventScroll:true});
    }
  });
  dialog.addEventListener('close', () => {
    ++request;
    document.documentElement.classList.remove('gc-open');
    opener?.focus?.({preventScroll:true});
  });
  // Keep the existing photo viewer's arrow-key handler inactive under this modal.
  dialog.addEventListener('keydown', event => event.stopPropagation());
  const stepGuide = direction => {
    if (!data || !currentGuide) return;
    const position = (data.guides.indexOf(currentGuide)+direction+data.guides.length)%data.guides.length;
    currentIndex = data.guides[position].assetIndices[0];
    render(data.guides[position]);
  };
  el('gcPrev').onclick = () => stepGuide(-1);
  el('gcNext').onclick = () => stepGuide(1);
  el('gcSelect').onchange = event => {
    const guide = data.guides.find(item => item.id === event.target.value);
    if (guide) { currentIndex = guide.assetIndices[0]; render(guide); }
  };
})();
