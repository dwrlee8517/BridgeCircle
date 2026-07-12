const qs=(selector,root=document)=>root.querySelector(selector);
const qsa=(selector,root=document)=>[...root.querySelectorAll(selector)];

function setOpen(element,open){
  if(!element)return;
  element.classList.toggle('open',open);
  element.setAttribute('aria-hidden',String(!open));
}

const noticeButton=qs('[data-notifications]');
const noticePopover=qs('#notification-popover');
if(noticeButton&&noticePopover){
  noticeButton.addEventListener('click',()=>setOpen(noticePopover,!noticePopover.classList.contains('open')));
}

const backdrop=qs('#drawer-backdrop');
const connectDrawer=qs('#connect-drawer');
const askDrawer=qs('#ask-drawer');
const profileDrawer=qs('#profile-drawer');
function closeDrawers(){
  setOpen(backdrop,false);
  setOpen(connectDrawer,false);
  setOpen(askDrawer,false);
  setOpen(profileDrawer,false);
}
function closeTransientDrawers(){
  setOpen(connectDrawer,false);
  setOpen(askDrawer,false);
  setOpen(backdrop,Boolean(profileDrawer?.classList.contains('open')));
}
function openDrawer(drawer){
  setOpen(backdrop,true);
  setOpen(drawer,true);
}
qsa('[data-close-drawer]').forEach((button)=>button.addEventListener('click',closeDrawers));
qsa('[data-close-transient]').forEach((button)=>button.addEventListener('click',closeTransientDrawers));
if(backdrop)backdrop.addEventListener('click',closeDrawers);
qsa('[data-open-connect]').forEach((button)=>button.addEventListener('click',(event)=>{event.stopPropagation();openDrawer(connectDrawer)}));
document.addEventListener('click',(event)=>{
  const button=event.target.closest('[data-open-ask]');
  if(!button)return;
  event.stopPropagation();
  const topic=button.dataset.askTopic;
  const topicElement=qs('#ask-topic');
  if(topic&&topicElement)topicElement.textContent=topic;
  openDrawer(askDrawer);
});
qsa('[data-open-profile]').forEach((button)=>button.addEventListener('click',(event)=>{event.stopPropagation();if(profileDrawer)openDrawer(profileDrawer);else location.href='people-profile-overlay.html'}));

qsa('[data-send-ask]').forEach((button)=>button.addEventListener('click',()=>{
  qs('.ask-compose')?.classList.add('sent');
  qs('.ask-success')?.classList.add('open');
}));

qsa('[data-mode]').forEach((button)=>{
  button.addEventListener('click',()=>{
    qsa('[data-mode]').forEach((item)=>item.classList.toggle('active',item===button));
    qsa('[data-mode-panel]').forEach((panel)=>panel.classList.toggle('active',panel.dataset.modePanel===button.dataset.mode));
  });
});

const profileData={
  maya:{initials:'MC',avatar:'av-1',name:'Maya Chen',role:'Design Lead · Figma · San Francisco',why:'Made the agency → in-house move in 2018 and reviews portfolios for members making the same transition.',evidence:['In-house since 2018','Reviews portfolios'],career:'Design Lead, Figma',years:'2021 — now',shared:"Prof. Whitman's studio",distance:'8 years apart',action:'Message',openToHelp:true,profileUrl:'people-profile-overlay.html?person=maya'},
  jordan:{initials:'JB',avatar:'av-5',name:'Jordan Blake',role:'Design Manager · Airbnb · New York',why:'Built design teams at two high-growth companies and regularly helps members prepare for first-time manager interviews.',evidence:['Hired 18 designers','First-time manager coach'],career:'Design Manager, Airbnb',years:'2022 — now',shared:'Chadwick design club',distance:'5 years apart',action:'Connect',openToHelp:true,profileUrl:'people-profile-overlay.html?person=jordan'},
  priya:{initials:'PN',avatar:'av-3',name:'Priya Nair',role:'Product Manager · Notion · Remote',why:'Moved from design into product and has made the same portfolio-to-product transition named in your search.',evidence:['Design → product','Remote since 2020'],career:'Product Manager, Notion',years:'2023 — now',shared:'New York alumni circle',distance:'3 mutual connections',action:'Pending',openToHelp:false,profileUrl:'people-profile-overlay.html?person=priya'},
  david:{initials:'DO',avatar:'av-2',name:'David Okafor',role:'Creative Director · Instrument · Portland',why:'Led agency and in-house teams across the West Coast and has helped alumni evaluate design leadership roles.',evidence:['Agency leadership','West Coast'],career:'Creative Director, Instrument',years:'2019 — now',shared:'Arts advisory board',distance:'2 shared groups',action:'Connect',openToHelp:true,profileUrl:'people-profile-overlay.html?person=david'}
};

const mockMemberNames=[
  'Elena Park','Marcus Liu','Sofia Ramirez','Theo Martin','Aisha Bello','Daniel Kim','Chloe Dubois','Omar Haddad','Grace Wong','Lucas Meyer','Nia Thompson','Samuel Ortiz','Hana Sato','Noah Williams','Isabella Rossi','Ethan Patel','Mei Lin','Gabriel Silva','Leila Mansour','Benjamin Clark','Zoe Anderson','Arjun Mehta','Camille Laurent','Julian Reyes','Amara Johnson','Felix Bauer','Yuna Lee','Mateo Garcia','Fatima Zahra','Henry Adams','Vivian Chen','Ibrahim Diallo','Lily Nguyen','Sebastian Muller','Audrey Brooks','Rohan Shah','Natalie Evans','Karim El-Sayed','Emma Wilson','Kenji Tanaka','Ana Costa','Michael Brown','Salma Khalil','Ryan Cooper','Ines Martin','Jacob Reed'
];
const mockRoles=['Product Designer','Design Director','Research Lead','Product Manager','Founder','Software Engineer','Strategy Director','Brand Lead'];
const mockCompanies=['Adobe','Google','IDEO','Canva','Linear','Stripe','Pinterest','Webflow'];
const mockCities=['Los Angeles','San Francisco','New York','London','Seoul','Singapore','Toronto','Remote'];
const mockTopics=[['Design systems','Team growth'],['Career transitions','Leadership'],['User research','Product strategy'],['Hiring','Portfolio reviews'],['Entrepreneurship','Early-stage teams'],['Engineering leadership','AI products'],['Brand strategy','Creative direction'],['International careers','Community building']];
const mockShared=['Chadwick design club','Bay Area alumni circle','New York alumni circle','Arts advisory board','Chadwick International','Entrepreneurship circle'];

mockMemberNames.forEach((name,index)=>{
  const key=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const initials=name.split(/\s+/).map((part)=>part[0]).join('').slice(0,2).toUpperCase();
  const role=mockRoles[index%mockRoles.length];
  const company=mockCompanies[(index*3)%mockCompanies.length];
  const city=mockCities[(index*5)%mockCities.length];
  const topics=mockTopics[index%mockTopics.length];
  const classYear=2000+(index%24);
  const action=index%11===0?'Pending':index%5===0?'Message':'Connect';
  profileData[key]={
    initials,avatar:`av-${index%5+1}`,name,role:`${role} · ${company} · ${city}`,
    why:`Works at the intersection of ${topics[0].toLowerCase()} and ${topics[1].toLowerCase()}, with experience relevant to this search.`,
    evidence:topics,career:`${role}, ${company}`,years:`${2020+index%5} — now`,
    shared:mockShared[index%mockShared.length],distance:index%4===0?'2 mutual connections':`${3+index%9} years apart`,
    action,openToHelp:index%4!==0,classYear,profileUrl:`people-profile-overlay.html?person=${key}`
  };
});

const fullProfileData={
  maya:{year:"'14",about:'I lead product design at Figma, after a decade moving between agencies and in-house teams. I’m especially happy to talk with members making that transition for the first time.',career:[['2021 — now','Design Lead · Figma','San Francisco'],['2018 — 2021','Associate Creative Director · Instrument','Portland'],['2014 — 2018','Senior Designer · Collins','New York']],education:[['2014 — 2018','Rhode Island School of Design','BFA, Graphic Design'],["Class of '14",'Chadwick School','The school root you share']],topics:[['Moving from an agency to an in-house team','What changed, how I evaluated options, and what I wish I knew earlier.'],['Building and scaling a design team','Hiring signal, team structure, and creating a culture of impact.'],['Transitioning into leadership','Making the shift from individual contributor to design leader.']],links:[['LinkedIn','Visible to any Chadwick member','#'],['maya.design','Portfolio · Public','#'],['maya@figma.com','Visible because you’re connected','mailto:maya@figma.com']],shared:[["Prof. Whitman’s studio",'8 years apart'],['Chadwick design club','Same school community']],ask:'I’m considering a move from agency work to an in-house design team. Would you be open to a short conversation about what changed most for you?',connect:'I’m considering the same agency-to-in-house move, and your experience felt especially relevant.'},
  jordan:{year:"'12",about:'I build design teams at high-growth product companies and enjoy helping first-time managers find a leadership style that still feels like them.',career:[['2022 — now','Design Manager · Airbnb','New York'],['2019 — 2022','Design Lead · Stripe','San Francisco'],['2016 — 2019','Product Designer · Dropbox','San Francisco']],education:[['2012 — 2016','Rhode Island School of Design','BFA, Industrial Design'],["Class of '12",'Chadwick School','The school root you share']],topics:[['Hiring a first design team','Defining the first roles and recognizing durable hiring signal.'],['Preparing for manager interviews','Turning leadership stories into clear evidence of judgment.'],['Scaling without losing craft','Creating leverage while staying close to the work.']],links:[['LinkedIn','Visible to any Chadwick member','#'],['jordan.design','Portfolio · Public','#'],['jordan@airbnb.com','Visible because you’re connected','mailto:jordan@airbnb.com']],shared:[['Chadwick design club','5 years apart'],['New York alumni circle','3 mutual connections']],ask:'I’m preparing for my first design-management interview. Would you be open to sharing what strong leadership stories sound like from the hiring side?',connect:'Your experience building design teams stood out, and I’d enjoy staying connected.'},
  priya:{year:"'17",about:'I moved from product design into product management and now work with distributed teams at Notion. I’m glad to compare the two paths with members considering the same shift.',career:[['2023 — now','Product Manager · Notion','Remote'],['2020 — 2023','Product Lead · Figma','San Francisco'],['2017 — 2020','Product Designer · Dropbox','New York']],education:[['2017 — 2021','Stanford University','BS, Symbolic Systems'],["Class of '17",'Chadwick School','The school root you share']],topics:[['Moving from design into product','How the decision changes and where design judgment still helps.'],['Building product sense','Practicing prioritization, trade-offs, and narrative clarity.'],['Working with distributed teams','Creating trust and momentum without sharing an office.']],links:[['LinkedIn','Visible to any Chadwick member','#'],['priyanair.work','Writing · Public','#'],['priya@makenotion.com','Visible after connection','mailto:priya@makenotion.com']],shared:[['New York alumni circle','3 mutual connections'],['Chadwick product group','Same school community']],ask:'I’m exploring a move from design into product management. Would you be open to sharing what changed most in how you make decisions?',connect:'Your design-to-product path felt especially relevant, and I’d be glad to stay connected.'},
  david:{year:"'98",about:'I’ve led creative teams on both the agency and in-house sides for more than two decades. I’m always glad to help members evaluate senior creative roles with clear eyes.',career:[['2019 — now','Creative Director · Instrument','Portland'],['2010 — 2019','Design Director · Collins','New York'],['2002 — 2010','Designer · Pentagram','London']],education:[['1998 — 2002','Rhode Island School of Design','BFA, Graphic Design'],["Class of '98",'Chadwick School','The school root you share']],topics:[['Evaluating creative leadership roles','Reading the mandate, authority, and team behind the title.'],['Moving between agency and in-house work','Comparing pace, influence, and creative ownership.'],['Developing senior creative talent','Giving feedback that grows judgment as well as craft.']],links:[['LinkedIn','Visible to any Chadwick member','#'],['davidokafor.studio','Selected work · Public','#'],['david@instrument.com','Visible because you’re connected','mailto:david@instrument.com']],shared:[['Arts advisory board','2 shared groups'],['West Coast alumni circle','Same school community']],ask:'I’m evaluating a creative leadership role and would value your perspective on how to read the real mandate behind the title.',connect:'Your agency and in-house leadership experience stood out, and I’d be glad to stay connected.'}
};

const careerDescriptions={
  maya:[
    ['Lead product design across Figma’s collaboration and enterprise experiences, partnering with product, engineering, research, and go-to-market teams.','Built a multi-year design strategy, introduced clearer quality reviews, and coached senior designers moving into broader leadership roles.'],
    ['Directed integrated brand and digital programs for technology and consumer clients from early positioning through launch.','Created a shared critique practice across strategy, writing, motion, and product design that reduced late-stage rework.'],
    ['Designed identity systems and digital products for global organizations while helping small teams turn early concepts into coherent systems.','Presented work directly to executive partners and translated research into practical creative direction for multidisciplinary teams.']
  ],
  jordan:[
    ['Manage a distributed product-design team focused on host and guest journeys across search, booking, and post-stay experiences.','Redesigned hiring and promotion practices around observable craft, collaboration, and leadership signals rather than presentation polish alone.'],
    ['Led the design system and growth-experience teams through a period of rapid product and organizational expansion.','Partnered with engineering leadership to make accessibility, localization, and component quality part of routine product planning.'],
    ['Designed collaboration tools used by cross-functional teams and facilitated customer research with administrators at large organizations.','Created onboarding and critique programs that helped new designers contribute to mature product areas more quickly.']
  ],
  priya:[
    ['Own product strategy for collaborative knowledge workflows used by distributed teams, from discovery through launch measurement.','Coordinate design, engineering, data, and customer-facing teams around a small set of measurable user and business outcomes.'],
    ['Led cross-product initiatives that connected design-system investments to activation, collaboration, and enterprise-readiness goals.','Built decision documents that made trade-offs visible and helped teams move from attractive concepts to testable product bets.'],
    ['Designed workflow and sharing experiences for creative teams while running regular customer interviews and prototype studies.','Developed the product judgment and technical fluency that later supported a transition from design into product management.']
  ],
  david:[
    ['Lead multidisciplinary teams across brand, digital products, campaigns, and physical experiences for organizations undergoing meaningful change.','Set creative direction while coaching senior talent, strengthening client relationships, and protecting the conditions needed for ambitious work.'],
    ['Directed identity and experience programs from research and positioning through global rollout across digital and physical touchpoints.','Built long-term client partnerships and developed creative leaders who could connect strategic intent with precise execution.'],
    ['Designed identity systems, publications, environments, and digital work for cultural and commercial organizations across Europe and North America.','Learned to present unfinished work clearly, incorporate criticism without losing the core idea, and collaborate across specialist disciplines.']
  ]
};

const directoryList=qs('#people-layout .directory');
if(directoryList){
  const additionalKeys=Object.keys(profileData).slice(4);
  directoryList.insertAdjacentHTML('beforeend',additionalKeys.map((key)=>{
    const member=profileData[key];
    const relation=member.action==='Pending'
      ?'<span class="chip requested">Requested</span>'
      :member.action==='Message'
        ?'<span class="chip circle">In your circle</span>'
        :member.openToHelp?'<span class="chip open"><span class="chip-dot"></span>Open to help</span>':'';
    const disabled=member.action==='Pending'?' disabled':'';
    const year=String(member.classYear).slice(-2);
    return `<article class="person-row" data-person="${key}"><span class="avatar ${member.avatar}">${member.initials}</span><div class="person-body"><div class="person-line"><a class="person-name" data-profile-link href="${member.profileUrl}">${member.name}</a>${relation}</div><span class="person-subtitle">${member.role} · '${year}</span><div class="topic-list">${member.evidence.map((topic)=>`<span class="topic">${topic}</span>`).join('')}</div></div><button class="row-action" type="button"${disabled}>${member.action}</button></article>`;
  }).join(''));
}

const peopleLayout=qs('#people-layout');
const mobileResultsQuery=matchMedia('(max-width: 620px)');
mobileResultsQuery.addEventListener('change',(event)=>{
  if(!peopleLayout)return;
  if(event.matches)renderMobileResults(mobileVisibleCount);else setResultsPage(currentResultsPage);
});

function directoryProfileHref(key){
  const params=new URLSearchParams({person:key});
  const query=qs('.search-input')?.value.trim();
  const scope=qs('.segment-button.active')?.textContent.trim();
  if(query)params.set('query',query);
  if(scope&&scope!=='All')params.set('scope',scope);
  params.set('page',String(currentResultsPage));
  return `people-profile-overlay.html?${params}`;
}
function syncProfileLinks(){
  qsa('[data-profile-link]').forEach((link)=>{
    const key=link.closest('.person-row')?.dataset.person;
    if(key)link.href=directoryProfileHref(key);
  });
}
qsa('.person-row').forEach((row)=>row.addEventListener('click',(event)=>{
  if(event.target.closest('a,button,input,select,textarea,label'))return;
  const key=row.dataset.person;
  if(key)location.href=directoryProfileHref(key);
}));
qsa('[data-profile-link]').forEach((link)=>link.addEventListener('click',()=>{
  const key=link.closest('.person-row')?.dataset.person;
  if(key)link.href=directoryProfileHref(key);
}));
let directoryConnectKey='jordan';
function prepareDirectoryConnect(key){
  const member=profileData[key];if(!member)return;
  directoryConnectKey=key;
  connectDrawer?.classList.remove('sent');
  const firstName=member.name.split(' ')[0];
  const heading=qs('#directory-connect-heading');if(heading)heading.textContent=`Say hello to ${firstName}.`;
  const lead=qs('#directory-connect-lead');if(lead)lead.textContent=`A connection request is a small opening, not a commitment. ${firstName} can accept quietly when it feels right.`;
  const copy=qs('#directory-connect-success-copy');if(copy)copy.textContent=`${firstName} can accept quietly when it feels right.`;
  const avatar=qs('#directory-connect-success-avatar');if(avatar){avatar.className=`avatar large ${member.avatar}`;avatar.textContent=member.initials}
}
qsa('.row-action').forEach((button)=>button.addEventListener('click',(event)=>{
  event.stopPropagation();
  const key=button.closest('.person-row')?.dataset.person;
  if(button.textContent.trim()==='Connect'){prepareDirectoryConnect(key);if(!button.hasAttribute('data-open-connect'))openDrawer(connectDrawer)}
  if(button.textContent.trim()==='Message')location.hash=`messages-${key}`;
}));
qs('[data-send-directory-connect]')?.addEventListener('click',()=>{
  const member=profileData[directoryConnectKey];if(!member)return;
  member.action='Pending';
  const row=qs(`.person-row[data-person="${directoryConnectKey}"]`);
  const action=qs('.row-action',row);if(action){action.textContent='Pending';action.disabled=true;action.removeAttribute('data-open-connect')}
  const chip=qs('.chip',row);if(chip){chip.className='chip requested';chip.innerHTML='Requested'}
  connectDrawer?.classList.add('sent');
});

const searchForm=qs('#people-search');
const resultsFooter=qs('.results-footer');
const RESULTS_PER_PAGE=20;
const RESULTS_PAGE_COUNT=3;
let currentResultsPage=1;
let mobileVisibleCount=RESULTS_PER_PAGE;
function setResultsPage(page){
  const activePage=Math.max(1,Math.min(RESULTS_PAGE_COUNT,Number(page)||1));
  const start=(activePage-1)*RESULTS_PER_PAGE;
  const end=Math.min(start+RESULTS_PER_PAGE,Object.keys(profileData).length);
  currentResultsPage=activePage;
  qsa('.person-row').forEach((row,index)=>{row.hidden=index<start||index>=end});
  qsa('[data-page]').forEach((button)=>{
    const active=Number(button.dataset.page)===activePage;
    button.classList.toggle('active',active);
    if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  const previous=qs('[data-page-direction="previous"]');
  const next=qs('[data-page-direction="next"]');
  if(previous){previous.disabled=activePage===1;previous.dataset.targetPage=String(activePage-1)}
  if(next){next.disabled=activePage===RESULTS_PAGE_COUNT;next.dataset.targetPage=String(activePage+1)}
  const meta=qs('.results-meta');
  if(meta)meta.textContent=`50 strongest matches · Page ${activePage} of ${RESULTS_PAGE_COUNT} · showing ${start+1}–${end}`;
  syncProfileLinks();
}
function renderMobileResults(count){
  const total=Object.keys(profileData).length;
  mobileVisibleCount=Math.max(RESULTS_PER_PAGE,Math.min(total,count));
  qsa('.person-row').forEach((row,index)=>{row.hidden=index>=mobileVisibleCount});
  const meta=qs('.results-meta');
  if(meta)meta.textContent=`50 strongest matches · showing ${mobileVisibleCount} of ${total}`;
  const progress=qs('#mobile-results-progress');
  if(progress)progress.textContent=`${mobileVisibleCount} of ${total} people`;
  const loadMore=qs('[data-load-more]');
  if(loadMore){
    const remaining=total-mobileVisibleCount;
    loadMore.disabled=remaining===0;
    loadMore.textContent=remaining===0?'All 50 loaded':`Load ${Math.min(RESULTS_PER_PAGE,remaining)} more`;
  }
  syncProfileLinks();
}
qsa('[data-page]').forEach((button)=>button.addEventListener('click',()=>setResultsPage(button.dataset.page)));
qsa('[data-page-direction]').forEach((button)=>button.addEventListener('click',()=>setResultsPage(button.dataset.targetPage)));
qs('[data-load-more]')?.addEventListener('click',()=>renderMobileResults(mobileVisibleCount+RESULTS_PER_PAGE));
if(peopleLayout){
  const directoryParams=new URLSearchParams(location.search);
  const returningKey=directoryParams.get('person');
  const returningRow=returningKey?qs(`.person-row[data-person="${returningKey}"]`):null;
  const returningIndex=returningRow?qsa('.person-row').indexOf(returningRow):-1;
  const returningPage=returningIndex>=0?Math.floor(returningIndex/RESULTS_PER_PAGE)+1:1;
  const requestedPage=Math.max(1,Math.min(RESULTS_PAGE_COUNT,Number(directoryParams.get('page'))||returningPage));
  const restoredQuery=directoryParams.get('query');
  if(restoredQuery!==null){const input=qs('.search-input');if(input)input.value=restoredQuery}
  const restoredScope=directoryParams.get('scope');
  if(restoredScope)qsa('.segment-button').forEach((button)=>button.classList.toggle('active',button.textContent.trim()===restoredScope));
  if(mobileResultsQuery.matches){
    mobileVisibleCount=returningIndex>=0?Math.min(Object.keys(profileData).length,returningPage*RESULTS_PER_PAGE):RESULTS_PER_PAGE;
    renderMobileResults(mobileVisibleCount);
  }else setResultsPage(requestedPage);
  if(returningRow&&profileData[returningKey]){
    returningRow.classList.add('returned');
    requestAnimationFrame(()=>returningRow.scrollIntoView({block:'center'}));
    setTimeout(()=>returningRow.classList.remove('returned'),1800);
  }
}
if(searchForm){
  searchForm.addEventListener('submit',(event)=>{
    event.preventDefault();
    const query=qs('.search-input',searchForm)?.value.trim();
    const meta=qs('.results-meta');
    resultsFooter?.classList.toggle('hidden',!query);
    if(mobileResultsQuery.matches){mobileVisibleCount=RESULTS_PER_PAGE;renderMobileResults(mobileVisibleCount)}else setResultsPage(1);
    if(!query&&meta)meta.textContent='2,412 people · Directory order · showing 1–20';
  });
}
qsa('.segment-button').forEach((button)=>button.addEventListener('click',()=>{
  qsa('.segment-button').forEach((item)=>item.classList.toggle('active',item===button));
  syncProfileLinks();
}));

function showSystemState(name){
  qsa('[data-system-state]').forEach((panel)=>panel.classList.toggle('active',panel.dataset.systemState===name));
  qsa('[data-system-state-target]').forEach((button)=>button.classList.toggle('active',button.dataset.systemStateTarget===name));
}
qsa('[data-system-state-target]').forEach((button)=>button.addEventListener('click',()=>showSystemState(button.dataset.systemStateTarget)));
qsa('[data-retry-state]').forEach((button)=>button.addEventListener('click',()=>showSystemState('loading')));
const initialSystemState=new URLSearchParams(location.search).get('state');
if(initialSystemState&&qs(`[data-system-state="${initialSystemState}"]`))showSystemState(initialSystemState);

qsa('[data-edit-section]').forEach((button)=>button.addEventListener('click',()=>{
  const section=button.closest('.profile-section');
  const editable=qs('[data-editable]',section);
  if(!editable)return;
  const editing=editable.getAttribute('contenteditable')==='true';
  editable.setAttribute('contenteditable',String(!editing));
  editable.focus();
  button.setAttribute('aria-label',editing?'Edit section':'Finish editing');
  section.style.boxShadow=editing?'':'inset 0 0 0 2px rgb(49 130 246 / .28), var(--shadow-card)';
}));
qsa('[data-dismiss-proposal]').forEach((button)=>button.addEventListener('click',()=>button.closest('.proposal')?.remove()));
qsa('[data-approve-proposal]').forEach((button)=>button.addEventListener('click',()=>{
  const proposal=button.closest('.proposal');
  if(proposal){proposal.innerHTML='<strong>Approved</strong><small>This change will appear on your profile.</small>'}
}));

function renderFullTimeline(items,descriptions=[]){
  return items.map(([period,title,note],index)=>{
    const bullets=descriptions[index]||[];
    const detail=bullets.length?`<div class="experience-description"><div class="experience-details" id="experience-${index}"><ul>${bullets.map((bullet)=>`<li>${bullet}</li>`).join('')}</ul></div><button class="experience-toggle" type="button" data-toggle-experience aria-expanded="false" aria-controls="experience-${index}">Show more</button></div>`:'';
    return `<div class="profile-v2-timeline-row"><span class="timeline-dot${index===0?' current':''}"></span><span class="profile-v2-year">${period}</span><span class="profile-v2-timeline-copy"><strong>${title}</strong><span>${note}</span>${detail}</span></div>`;
  }).join('');
}
function renderFullTopics(items){
  return items.map(([title,note])=>`<div class="profile-v2-speak-row"><div><strong>${title}</strong><p>${note}</p></div><button class="weak-button small-button" data-open-ask data-ask-topic="${title}">Ask</button></div>`).join('');
}
function renderFullRailRows(items,links=false){
  return items.map(([title,note,href])=>links?`<a class="profile-v2-rail-row" href="${href}"><strong>${title}</strong><span>${note}</span></a>`:`<div class="profile-v2-rail-row"><strong>${title}</strong><span>${note}</span></div>`).join('');
}
function makeMockFullProfile(summary){
  const firstName=summary.name.split(' ')[0];
  const classYear=summary.classYear||2014;
  return {
    year:`'${String(classYear).slice(-2)}`,
    about:`I work in ${summary.career} and enjoy helping Chadwick members compare paths, prepare for transitions, and make thoughtful introductions in this field.`,
    career:[[summary.years,summary.career,summary.role.split(' · ').at(-1)]],
    education:[[ `Class of '${String(classYear).slice(-2)}`,'Chadwick School','The school root you share']],
    topics:summary.evidence.map((topic)=>[topic,`Practical perspective from ${summary.career} and recent work in the field.`]),
    links:[['LinkedIn','Visible to any Chadwick member','#']],
    shared:[[summary.shared,summary.distance]],
    ask:`I’d value your perspective on ${summary.evidence[0].toLowerCase()}. Would you be open to a short conversation?`,
    connect:`Your experience with ${summary.evidence[0].toLowerCase()} stood out, ${firstName}, and I’d be glad to stay connected.`
  };
}

const fullProfileRoot=qs('.profile-drawer-v2');
if(fullProfileRoot){
  const currentProfileParams=new URLSearchParams(location.search);
  const key=currentProfileParams.get('person')||'maya';
  const summary=profileData[key]||profileData.maya;
  const detail=fullProfileData[key]||makeMockFullProfile(summary);
  document.title=`${summary.name} · Profile · BridgeCircle`;
  fullProfileRoot.setAttribute('aria-label',`${summary.name} profile`);
  qsa('[data-full-profile-person]').forEach((row)=>row.classList.toggle('selected',row.dataset.fullProfilePerson===key));
  const avatar=qs('#full-profile-avatar');
  if(avatar){avatar.className=`avatar ${summary.avatar} profile-v2-avatar`;avatar.textContent=summary.initials}
  const successAvatar=qs('#full-success-avatar');
  if(successAvatar){successAvatar.className=`avatar large ${summary.avatar}`;successAvatar.textContent=summary.initials}
  const connectSuccessAvatar=qs('#connect-success-avatar');
  if(connectSuccessAvatar){connectSuccessAvatar.className=`avatar large ${summary.avatar}`;connectSuccessAvatar.textContent=summary.initials}
  const textValues={
    '#full-profile-name':summary.name,'#full-profile-year':detail.year,'#full-profile-role':summary.role,
    '#full-profile-about':detail.about,'#full-connect-heading':`Open a door to ${summary.name.split(' ')[0]}.`,
    '#full-connect-lead':`The profile stays visible while you write. ${summary.name.split(' ')[0]} can accept quietly when it feels right.`,
    '#full-ask-heading':`Ask ${summary.name.split(' ')[0]} directly.`,
    '#full-ask-lead':`A clear, personal note gives ${summary.name.split(' ')[0]} enough context to decide quickly.`,
    '#full-ask-context-note':`Based on what ${summary.name.split(' ')[0]} says they can help with`,
    '#full-success-copy':`${summary.name.split(' ')[0]} can respond in Messages when they have space.`,
    '#connect-success-copy':`${summary.name.split(' ')[0]} can accept quietly when it feels right.`
  };
  Object.entries(textValues).forEach(([selector,value])=>{const element=qs(selector);if(element)element.textContent=value});
  const career=qs('#full-profile-career');if(career)career.innerHTML=renderFullTimeline(detail.career,careerDescriptions[key]||[]);
  const education=qs('#full-profile-education');if(education)education.innerHTML=renderFullTimeline(detail.education);
  const topics=qs('#full-profile-topics');if(topics)topics.innerHTML=renderFullTopics(detail.topics);
  const links=qs('#full-profile-links');
  const shared=qs('#full-profile-shared');if(shared)shared.innerHTML=renderFullRailRows(detail.shared);
  const askNote=qs('#ask-note');if(askNote)askNote.value=detail.ask;
  const introNote=qs('#connect-intro');if(introNote)introNote.value=detail.connect;
  const closeLink=qs('#profile-close-link');
  if(closeLink){
    const returnParams=new URLSearchParams({person:key});
    ['page','query','scope'].forEach((name)=>{const value=currentProfileParams.get(name);if(value)returnParams.set(name,value)});
    closeLink.href=`people-directory.html?${returnParams}`;
    closeLink.setAttribute('aria-label',`Close profile and return to ${summary.name} in People`);
  }
  qsa('[data-safety-name]').forEach((element)=>element.textContent=summary.name.split(' ')[0]);

  function applyFullProfileState(){
    const connected=summary.action==='Message';
    const pending=summary.action==='Pending';
    const chips=qs('#full-profile-chips');
    if(chips)chips.innerHTML=`<span class="chip verified">Verified</span>${summary.openToHelp?'<span class="chip open"><span class="chip-dot"></span>Open to help</span>':''}${connected?'<span class="chip circle">In your circle</span>':pending?'<span class="chip requested">Requested</span>':''}`;
    const relationship=qs('#full-profile-relationship');
    if(relationship)relationship.textContent=connected?'You’re connected through the Chadwick community.':pending?'Your connection request is waiting quietly.':'You’re both verified members of the Chadwick community.';
    const relationshipAction=qs('#profile-relationship-action');
    if(relationshipAction){
      relationshipAction.textContent=connected?'Message':pending?'Pending':'Connect';
      relationshipAction.disabled=pending;
      relationshipAction.onclick=connected?()=>{location.hash='messages'}:pending?null:()=>openDrawer(connectDrawer);
    }
    const askAction=qs('#profile-ask-action');
    if(askAction){askAction.disabled=!summary.openToHelp;askAction.textContent=summary.openToHelp?'Ask for help':'Not taking asks'}
    const topicsSection=qs('#full-profile-topics-section');if(topicsSection)topicsSection.hidden=!summary.openToHelp;
    if(links){const visibleLinks=connected?detail.links:detail.links.filter((item)=>!item[1].toLowerCase().includes('connected'));links.innerHTML=renderFullRailRows(visibleLinks,true)}
    const privacy=qs('#full-profile-privacy');
    if(privacy)privacy.innerHTML=connected?'<strong>Contact info is visible because you’re connected.</strong><p>You’re also members of each other’s circles.</p><a href="#">Learn more</a>':'<strong>Only public contact information is shown.</strong><p>Circle-only details appear after you connect.</p><a href="#">Learn more</a>';
    const disconnectAction=qs('#disconnect-menu-action');if(disconnectAction)disconnectAction.hidden=!connected;
  }
  applyFullProfileState();

  qs('[data-send-connect]')?.addEventListener('click',()=>{
    summary.action='Pending';
    applyFullProfileState();
    connectDrawer?.classList.add('sent');
  });

  const safetyMenu=qs('#profile-safety-menu');
  const safetyToggle=qs('[data-toggle-safety-menu]');
  safetyToggle?.addEventListener('click',()=>{
    const open=!safetyMenu?.classList.contains('open');
    setOpen(safetyMenu,open);
    safetyToggle.setAttribute('aria-expanded',String(open));
  });
  qsa('[data-open-safety]').forEach((button)=>button.addEventListener('click',()=>{
    setOpen(safetyMenu,false);safetyToggle?.setAttribute('aria-expanded','false');
    const dialog=qs(`#${button.dataset.openSafety}-dialog`);setOpen(dialog,true);qs('[data-close-safety]',dialog)?.focus();
  }));
  qsa('[data-close-safety]').forEach((button)=>button.addEventListener('click',()=>setOpen(button.closest('.safety-dialog'),false)));
  qsa('[data-confirm-safety]').forEach((button)=>button.addEventListener('click',()=>{
    const kind=button.dataset.confirmSafety;
    const dialog=button.closest('.safety-dialog');
    if(kind==='disconnect'){summary.action='Connect';applyFullProfileState()}
    const copy=kind==='report'?['Report sent','Thanks — we’ll look into it.']:kind==='disconnect'?['Disconnected',`You and ${summary.name.split(' ')[0]} are no longer in each other’s circle.`]:['Member blocked',`You and ${summary.name.split(' ')[0]} can no longer see or contact each other.`];
    const body=qs('.safety-dialog-body',dialog);
    if(body)body.innerHTML=`<div class="safety-confirmation"><strong>${copy[0]}</strong><p>${copy[1]}</p><button class="primary-button" data-close-safety-confirmation>Done</button></div>`;
    qs('[data-close-safety-confirmation]',body)?.addEventListener('click',()=>setOpen(dialog,false));
  }));
}

document.addEventListener('click',(event)=>{
  const button=event.target.closest('[data-toggle-experience]');
  if(!button)return;
  const description=button.closest('.experience-description');
  const expanded=!description.classList.contains('expanded');
  description.classList.toggle('expanded',expanded);
  button.setAttribute('aria-expanded',String(expanded));
  button.textContent=expanded?'Show less':'Show more';
});

document.addEventListener('keydown',(event)=>{
  if(event.key!=='Escape')return;
  qsa('.safety-dialog.open').forEach((dialog)=>setOpen(dialog,false));
  setOpen(qs('#profile-safety-menu'),false);
  closeTransientDrawers();
});

const profileParams=new URLSearchParams(location.search);
const profileParamData=profileData[profileParams.get('person')||'maya'];
if(profileParams.get('connect')==='1'&&profileParamData?.action==='Connect')openDrawer(connectDrawer);
if(profileParams.get('ask')==='1'&&profileParamData?.openToHelp)openDrawer(askDrawer);
