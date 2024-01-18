async function scrape_wh(url) {
  url = url || document?.location?.href;
  if (!url) throw `invalid url ${url}`;

  const zoneMatch = url.match(/zone=(\d+)/);
  const zid = zoneMatch && zoneMatch[1] || 0;
  !zid ? console.warn('no zone id found') : console.debug(`zone id: ${zid}`);
  
  const dropMapper = (d) => {
    const { id, name, quality, sourcemore } = d;
    const source = sourcemore
      .filter(sm => !zid || (sm.z == zid))
      .map(sm => {
        return {
          dropsFromZone: sm.z,
          isZoneDrop: !sm.ti && !!sm.z,
          dropsFromName: sm.n,
          dropsFromId: sm.ti
        }
      })[0] || { sourceUnknown: true };

    return { id, name, quality, ...source, _originalData: d };
  };
  
  const unsafeParse = (s) => eval(`v = ${s};`);
  const listViewStart = 'new Listview(';

  const res = await fetch(window.location.href);
  const rbody = await res.text();
  const doc = new DOMParser().parseFromString(rbody, 'text/html');
  
  let el = doc.getElementsByClassName('listview')[0];
  let i = 10; // don't loop forever
  // get the next script tag after the listview div. it should be pretty close:
  while (el && el.tagName !== 'SCRIPT' && i-- > 0) el = el.nextSibling;

  // parse all the json data from new Listview args
  const allListJson = (el && el.innerHTML || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('//'))
    .filter(l => l && l.trim().startsWith(listViewStart))
    .map(l => l.substring(l.indexOf('{'), l.lastIndexOf('}') + 1))
    .map(unsafeParse);

  console.debug('ALL LIST JSON', allListJson);

  const drops = allListJson
    .filter(j => j.id === 'drops')
    .map(j => j.data)[0];

  return (drops || []).map(dropMapper); 
}

await scrape_wh();
