/* =====================================================================
   CARTA DESDE GOOGLE SHEETS
   El dueño edita una hoja de Google y la carta se actualiza sola.

   Pega aquí el enlace CSV de la hoja publicada (Archivo > Compartir >
   Publicar en la Web > pestaña de la carta > formato CSV).
   Mientras esté vacío, se usa la carta de ejemplo que hay en carta.html.
   ===================================================================== */
var SHEET_CSV_URL='https://docs.google.com/spreadsheets/d/1j95VYi6wmIEYJ1HAUu96MOBv_wDKIOze5eoJGfa4j44/gviz/tq?tqx=out:csv&headers=1&sheet=Carta';

(function(){
  var CACHE_KEY='tr-carta-v1';

  function norm(t){return String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim()}
  /* clave para reconocer «el mismo nombre»: sin tildes, mayúsculas ni espacios de más */
  function clave(t){return norm(t).replace(/\s+/g,' ')}
  function slug(t){return norm(t).replace(/&/g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}

  /* CSV -> filas (admite comillas, comas y saltos de línea dentro de una celda) */
  function parseCSV(t){
    var rows=[],row=[],f='',q=false,i,c;
    t=t.replace(/^﻿/,'');
    for(i=0;i<t.length;i++){
      c=t[i];
      if(q){
        if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}
        else f+=c;
      }else if(c==='"')q=true;
      else if(c===','){row.push(f);f=''}
      else if(c==='\n'||c==='\r'){
        if(c==='\r'&&t[i+1]==='\n')i++;
        row.push(f);f='';rows.push(row);row=[];
      }else f+=c;
    }
    if(f!==''||row.length){row.push(f);rows.push(row)}
    return rows;
  }

  /* "2,5" / "2.5" / "2,50 €" -> "2,50 €"; otro texto se deja tal cual */
  function price(v){
    v=String(v||'').trim();if(!v)return '';
    var m=v.replace(/\s|€/g,'').match(/^(\d+)(?:[.,](\d{1,2}))?$/);
    if(!m)return v;
    return m[1]+','+((m[2]||'')+'00').slice(0,2)+' €';
  }

  /* Si el dueño cambia el nombre de una categoría conocida («Tapas & Picoteo» -> «Tapas y raciones»),
     se le siguen poniendo su foto y sus textos, reconociéndola por palabras clave */
  var PALABRAS={cafes:/caf[eé]|desayun/,tapas:/tapa|racion|pincho/,bocadillos:/bocad|bocat|sandwich|hamburg/,cervezas:/cerve/,cocteles:/cocte|copa|licor/};

  /* Filas de la hoja -> estructura MENU (la misma que usa carta.html).
     Devuelve {menu:[...]} o {error:'motivo'} */
  function build(rows,base){
    if(rows.length<2)return {error:'vacia'};
    var h=rows[0].map(norm),col={};
    ['categoria','apartado','producto','precio','descripcion','estrella','disponible'].forEach(function(k){col[k]=h.indexOf(k)});
    if(col.categoria<0||col.producto<0||col.precio<0)return {error:'columnas'};
    function g(r,k){return col[k]<0?'':String(r[col[k]]||'').trim()}

    /* 1) categorías, apartados y productos, en el orden de la hoja */
    var cats=[],byCat={};
    rows.slice(1).forEach(function(r){
      var cat=g(r,'categoria'),name=g(r,'producto');
      if(!cat||!name)return;
      if(['no','n','0','agotado'].indexOf(norm(g(r,'disponible')))>=0)return;
      var ck=clave(cat),c=byCat[ck];
      if(!c){c={title:cat,groups:[],_g:{}};byCat[ck]=c;cats.push(c)}
      var gn=g(r,'apartado')||cat,gk=clave(gn),grp=c._g[gk];
      if(!grp){grp={name:gn,items:[]};c._g[gk]=grp;c.groups.push(grp)}
      var it=[name,price(g(r,'precio')),g(r,'descripcion')];
      if(['si','s','x','1','yes'].indexOf(norm(g(r,'estrella')))>=0)it.push(true);
      grp.items.push(it);
    });
    if(!cats.length)return {error:'vacia'};

    /* 2) foto y textos de las categorías conocidas: primero por nombre exacto, luego por palabras clave */
    var porId={},usadas={};base.forEach(function(k){porId[k.id]=k});
    cats.forEach(function(c){
      base.forEach(function(k){if(!c._k&&slug(k.title)===slug(c.title)&&!usadas[k.id]){c._k=k;usadas[k.id]=1}});
    });
    cats.forEach(function(c){
      if(c._k)return;
      var t=norm(c.title);
      Object.keys(PALABRAS).forEach(function(id){if(!c._k&&porId[id]&&!usadas[id]&&PALABRAS[id].test(t)){c._k=porId[id];usadas[id]=1}});
    });
    /* 3) identificadores únicos (sirven para el enlace #cervezas) */
    var ids={};
    var menu=cats.map(function(c,i){
      var k=c._k||{},id=k.id||slug(c.title)||('cat'+(i+1));
      while(ids[id])id=id+'-'+(i+1);
      ids[id]=1;
      return {id:id,title:c.title,when:k.when||'',photo:k.photo,lead:k.lead||'',groups:c.groups};
    });
    return {menu:menu};
  }

  function fetchTimeout(url,ms){
    return new Promise(function(ok,ko){
      var t=setTimeout(function(){ko(new Error('timeout'))},ms);
      fetch(url,{cache:'no-store'}).then(function(r){clearTimeout(t);if(!r.ok)throw new Error(r.status);return r.text()})
        .then(ok,function(e){clearTimeout(t);ko(e)});
    });
  }

  /* Arranque rápido: se pinta enseguida con la última carta guardada (o la de ejemplo) y, cuando
     llega la hoja de Google, se vuelve a pintar solo si ha cambiado algo. Así nunca hay pantalla en blanco.
     window.TR_FUENTE dice de dónde salen los datos: 'hoja', 'cache' (guardada), 'ejemplo' o 'vacia' (la hoja no tiene productos) */
  var pintado=null;
  function pintar(){var k=JSON.stringify(MENU);if(k===pintado)return;pintado=k;bootCarta()}
  function fuente(f){window.TR_FUENTE=f;try{window.dispatchEvent(new Event('tr-fuente'))}catch(e){}}

  var MUESTRA=MENU;   /* la carta de ejemplo del propio archivo: de ahí salen siempre las fotos y textos de las categorías conocidas */
  var cache=null;
  try{cache=JSON.parse(localStorage.getItem(CACHE_KEY)||'null')}catch(e){}
  var hayCache=!!(cache&&cache.length&&cache[0]&&cache[0].groups);
  if(hayCache)MENU=cache;
  fuente(SHEET_CSV_URL?(hayCache?'cache':'ejemplo'):'hoja');
  pintar();

  if(!SHEET_CSV_URL||!window.fetch||!window.Promise)return;

  fetchTimeout(SHEET_CSV_URL+'&t='+Date.now(),8000).then(function(txt){
    var r=build(parseCSV(txt),MUESTRA);
    if(r.error){
      /* La hoja se ha leído pero no sirve (vacía, todo agotado o sin columnas): se mantiene lo que ya se ve y se avisa */
      fuente(r.error==='vacia'?'vacia':(hayCache?'cache':'ejemplo'));
      return;
    }
    MENU=r.menu;
    try{localStorage.setItem(CACHE_KEY,JSON.stringify(r.menu))}catch(e){}
    fuente('hoja');pintar();
  }).catch(function(){
    /* Sin conexión o hoja caída: se queda lo que ya se ve (última carta guardada o ejemplo) y se avisa */
    fuente(hayCache?'cache':'ejemplo');
  });
})();
