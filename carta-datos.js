/* =====================================================================
   CARTA DESDE GOOGLE SHEETS
   El dueño edita una hoja de Google y la carta se actualiza sola.

   Pega aquí el enlace CSV de la hoja publicada (Archivo > Compartir >
   Publicar en la Web > pestaña de la carta > formato CSV).
   Mientras esté vacío, se usa la carta de ejemplo que hay en carta.html.
   ===================================================================== */
var SHEET_CSV_URL='https://docs.google.com/spreadsheets/d/1j95VYi6wmIEYJ1HAUu96MOBv_wDKIOze5eoJGfa4j44/gviz/tq?tqx=out:csv&sheet=Carta';

(function(){
  var CACHE_KEY='tr-carta-v1';

  function norm(t){return String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim()}
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

  /* Filas de la hoja -> estructura MENU (la misma que usa carta.html) */
  function build(rows,base){
    if(rows.length<2)return null;
    var h=rows[0].map(norm),col={};
    ['categoria','apartado','producto','precio','descripcion','estrella','disponible'].forEach(function(k){col[k]=h.indexOf(k)});
    if(col.categoria<0||col.producto<0||col.precio<0)return null;
    function g(r,k){return col[k]<0?'':String(r[col[k]]||'').trim()}

    var known={};base.forEach(function(c){known[slug(c.title)]=c});
    var menu=[],byCat={};
    rows.slice(1).forEach(function(r){
      var cat=g(r,'categoria'),name=g(r,'producto');
      if(!cat||!name)return;
      if(['no','n','0','agotado'].indexOf(norm(g(r,'disponible')))>=0)return;
      var cs=slug(cat),c=byCat[cs];
      if(!c){
        var k=known[cs]||{};
        c={id:k.id||cs,title:cat,when:k.when||'',photo:k.photo,lead:k.lead||'',groups:[],_g:{}};
        byCat[cs]=c;menu.push(c);
      }
      var gn=g(r,'apartado')||cat,gs=slug(gn),grp=c._g[gs];
      if(!grp){grp={name:gn,items:[]};c._g[gs]=grp;c.groups.push(grp)}
      var it=[name,price(g(r,'precio')),g(r,'descripcion')];
      if(['si','s','x','1','yes'].indexOf(norm(g(r,'estrella')))>=0)it.push(true);
      grp.items.push(it);
    });
    return menu.length?menu:null;
  }

  function fetchTimeout(url,ms){
    return new Promise(function(ok,ko){
      var t=setTimeout(function(){ko(new Error('timeout'))},ms);
      fetch(url,{cache:'no-store'}).then(function(r){clearTimeout(t);if(!r.ok)throw new Error(r.status);return r.text()})
        .then(ok,function(e){clearTimeout(t);ko(e)});
    });
  }

  function start(){bootCarta()}

  if(!SHEET_CSV_URL||!window.fetch||!window.Promise){start();return}

  fetchTimeout(SHEET_CSV_URL+('&')+'t='+Date.now(),5000).then(function(txt){
    var m=build(parseCSV(txt),MENU);
    if(!m)throw new Error('hoja vacía o con columnas incorrectas');
    MENU=m;
    try{localStorage.setItem(CACHE_KEY,JSON.stringify(m))}catch(e){}
  }).catch(function(){
    /* Sin conexión o hoja caída: última carta buena; si no hay, la de ejemplo */
    try{var c=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');if(c&&c.length)MENU=c}catch(e){}
  }).then(start);
})();
