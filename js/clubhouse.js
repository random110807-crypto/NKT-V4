const byId = id => document.getElementById(id);
const el = (tag, cls, value) => { const n=document.createElement(tag); if(cls)n.className=cls; if(value!==undefined)n.textContent=value; return n; };
const FALLBACK_AVATAR = 'https://www.chess.com/bundles/web/images/user-image.007dad08.svg';
const avatarUrl = value => typeof value === 'string' && /^https:\/\//i.test(value) ? value : FALLBACK_AVATAR;
function personLink(username, label=username) {
  const a=el('a','clubhouse-user',label || `@${username}`);
  if(username){a.href=`https://www.chess.com/member/${encodeURIComponent(username)}`;a.target='_blank';a.rel='noopener noreferrer';}
  return a;
}
function section(root,title,icon='♛',extra=''){
  const s=el('section','clubhouse-section');
  const head=el('div','clubhouse-section-head');head.append(el('h3','clubhouse-subtitle',`${icon}  ${title}`));
  if(extra)head.append(el('span','clubhouse-section-extra',extra));
  s.append(head);root.append(s);return s;
}
function avatar(username,src,cls='clubhouse-avatar'){
  const img=el('img',cls);img.alt=username?`${username} profile picture`:'';img.loading='lazy';img.decoding='async';img.src=avatarUrl(src);
  img.onerror=()=>{img.onerror=null;img.src=FALLBACK_AVATAR;};return img;
}
function fmt(n,d=0){return Number.isFinite(Number(n))?Number(n).toLocaleString(undefined,{maximumFractionDigits:d}):'—';}
function renderMemberOfMonth(root,manual,profiles={}){
  if(!manual||!String(manual.username||'').trim())return;
  const username=String(manual.username).trim();
  const profile=profiles[username.toLowerCase()]||{};
  const s=section(root,'MEMBER OF THE MONTH','★','NKT SPOTLIGHT');s.classList.add('motm-section');
  const card=el('div','motm-card');card.append(avatar(username,manual.avatar||profile.avatar,'motm-avatar'));
  const copy=el('div','motm-copy');copy.append(personLink(username,manual.name||username));
  const rating=manual.rating||profile.bestRating;
  if(rating)copy.append(el('span','motm-rating',`♛ ${fmt(rating)} ${manual.ratingType||'Rapid'}`));
  if(manual.achievement)copy.append(el('p','motm-note',manual.achievement));
  else copy.append(el('p','motm-note','Recognised by the NKT team.'));
  card.append(copy,el('span','motm-crown','♛'));s.append(card);
}
function renderPodium(root,rows,profiles={}){
  if(!Array.isArray(rows)||!rows.length)return;
  const s=section(root,'MONTHLY RATING RACE','🏆',rows[0]?.month||'THIS MONTH');
  const podium=el('div','clubhouse-podium');
  [1,0,2].forEach(i=>{const r=rows[i];if(!r)return;const item=el('article',`podium-card podium-${i+1}`);const profile=profiles[String(r.username).toLowerCase()]||{};
    item.append(avatar(r.username,r.avatar||profile.avatar,'podium-avatar'),el('span','podium-medal',i===0?'♛':i===1?'Ⅱ':'Ⅲ'),personLink(r.username),el('strong','podium-rating',`${r.ratingChange>0?'+':''}${fmt(r.ratingChange)} pts`),el('span','podium-games',`${fmt(r.games)} games`));podium.append(item);});
  s.append(podium);
  const rest=rows.slice(3,10);if(rest.length){const list=el('div','clubhouse-rank-list');rest.forEach((r,i)=>list.append(rankRow(r,i+4,profiles,'rating')));s.append(list);}
}
function rankRow(r,rank,profiles={},mode='overall'){
  const username=String(r.username||'');const profile=profiles[username.toLowerCase()]||{};
  const row=el('div','clubhouse-rank-row');row.append(el('span','rank-number',String(rank)),avatar(username,r.avatar||profile.avatar,'rank-avatar'));
  const info=el('div','rank-info');info.append(personLink(username));
  if(mode==='rating')info.append(el('small','rank-sub',`${fmt(r.games)} games played`));
  else info.append(el('small','rank-sub',`${fmt(r.games)} games · ${fmt(r.wins)} wins`));
  row.append(info,el('strong','rank-value',mode==='rating'?`${r.ratingChange>0?'+':''}${fmt(r.ratingChange)}`:`${fmt(r.score,1)} pts`));return row;
}
function renderOverall(root,rows,profiles={}){
  if(!Array.isArray(rows)||!rows.length)return;
  const s=section(root,'OVERALL CLUB RANKING','♜','MONTHLY');
  const list=el('div','clubhouse-rank-list');rows.slice(0,10).forEach((r,i)=>list.append(rankRow(r,i+1,profiles,'overall')));s.append(list);
  s.append(el('p','clubhouse-footnote','Based on tracked rating progress, game activity and win rate.'));
}
function renderManualMca(root, rows){
  if (!Array.isArray(rows)) return;
  const valid = rows.map(row => ({ ...row, points: Number(row?.points) }))
    .filter(row => String(row?.username||'').trim() && Number.isFinite(row.points) && row.points >= 0)
    .sort((a,b) => b.points-a.points);
  if (!valid.length) return;
  const s = section(root,'MCA TOP PERFORMERS','✦','MANUAL RANKING');
  const list=el('div','clubhouse-rank-list');
  valid.slice(0,20).forEach((row,index)=>{
    const line=el('div','clubhouse-rank-row');line.append(el('span','rank-number',String(index+1)),avatar(row.username,row.avatar,'rank-avatar'));
    const info=el('div','rank-info');info.append(personLink(row.username,row.name||row.username));info.append(el('small','rank-sub','MCA points'));line.append(info,el('strong','rank-value',`${fmt(row.points)} pts`));list.append(line);
  });s.append(list);
}
function makeSvgChart(points){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 320 116');svg.setAttribute('role','img');svg.setAttribute('aria-label','Club activity over the last 30 days');
  for(let y=20;y<=100;y+=40){const line=document.createElementNS(ns,'line');line.setAttribute('x1','4');line.setAttribute('x2','316');line.setAttribute('y1',y);line.setAttribute('y2',y);line.setAttribute('class','insight-gridline');svg.append(line);}
  const values=points.map(p=>Number(p.games)||0),max=Math.max(1,...values),min=Math.min(0,...values),range=Math.max(1,max-min);
  const coords=values.map((v,i)=>[8+(i*(304/Math.max(1,values.length-1))),104-((v-min)/range)*82]);
  if(coords.length){const path=document.createElementNS(ns,'path');path.setAttribute('d',coords.map((p,i)=>`${i?'L':'M'} ${p[0]} ${p[1]}`).join(' '));path.setAttribute('class','insight-line');svg.append(path);coords.forEach(([x,y])=>{const c=document.createElementNS(ns,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r','3');c.setAttribute('class','insight-dot');svg.append(c);});}
  return svg;
}
function renderInsights(root,insights){
  if(!insights||!Array.isArray(insights.series)||!insights.series.length)return;
  const s=section(root,'CLUB INSIGHTS','▥','LAST 30 DAYS');s.classList.add('insights-section');
  const chart=el('div','insights-chart');chart.append(makeSvgChart(insights.series));s.append(chart);
  const metrics=el('div','insights-metrics');
  const entries=[['↗',fmt(insights.gamesPlayed), 'Games played'],['♛',`${insights.avgRatingChange>=0?'+':''}${fmt(insights.avgRatingChange)}`,'Avg. rating change'],['♟',`${insights.memberGrowth>=0?'+':''}${fmt(insights.memberGrowth)}`,'Member growth']];
  entries.forEach(([icon,value,label])=>{const item=el('div','insight-metric');item.append(el('span','insight-icon',icon),el('strong','insight-value',value),el('small','insight-label',label));metrics.append(item);});s.append(metrics);
  s.append(el('p','clubhouse-footnote','Calculated from collected public club and member snapshots.')); 
}
export function initClubhouse(config){
  const button=byId('open-clubhouse'),root=byId('clubhouse-content');
  button.hidden=false;
  return dashboard=>{
    root.replaceChildren();
    const profiles=dashboard?.profiles||{};
    const heading=el('div','clubhouse-brand');heading.append(el('span','clubhouse-brand-crown','♛'),el('h2','clubhouse-brand-title','THE CLUB HOUSE'),el('p','clubhouse-brand-subtitle','NASHEDIYON KI TOLI · NKT'),el('p','clubhouse-brand-tagline','Play · Improve · Compete · Together'));root.append(heading);
    renderMemberOfMonth(root,config?.clubhouse?.memberOfTheMonth,profiles);
    renderPodium(root,dashboard?.monthlyRace?.rows,profiles);
    renderOverall(root,dashboard?.overallLeaderboard?.rows,profiles);
    renderManualMca(root,config?.clubhouse?.mcaLeaderboard);
    renderInsights(root,dashboard?.clubInsights);
    if(!root.querySelector('.clubhouse-section'))root.append(el('p','empty-state','Club statistics will appear after the first successful data collection.'));
  };
}
