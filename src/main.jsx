import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { correctChoice, gradeTracks, interdisciplinary, quizLabels, themes, units } from './curriculum.js';
import ChemistryLearningLab from './ChemistryLearningLab.jsx';
import ChemistryScene3D from './ChemistryScene3D.jsx';
import GlossaryText from './GlossaryText.jsx';
import './app.css';
import './chemistry-dark.css';
import './readability.css';
import './simplified-ui.css';

const gradeNames = gradeTracks.map((item) => item.grade);
const Icon = ({ children }) => <span className="icon" aria-hidden="true">{children}</span>;

function App() {
  const [grade, setGrade] = useState('Secondaire I');
  const [track, setTrack] = useState('SVT');
  const [selectedId, setSelectedId] = useState('A2');
  const [section, setSection] = useState('explorer');
  const [choice, setChoice] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [completed, setCompleted] = useState([]);
  const lesson = units.find((item) => item.id === selectedId) || units[0];
  const family = themes[lesson.theme];
  const currentTrack = gradeTracks.find((item) => item.grade === grade);
  const byTrack = [...currentTrack.common, ...(track === 'SVT' ? currentTrack.svt || [] : [])];
  const visibleLessons = units.filter((item) => byTrack.includes(item.id));
  const searchResults = search.trim() ? units.filter((item) => `${item.title} ${item.id} ${item.explain}`.toLowerCase().includes(search.toLowerCase())) : [];
  const completionPercent = Math.round((completed.length / units.length) * 100);
  const selectLesson = (item) => {setSelectedId(item.id);setSection('lesson');setChoice(null);setMenuOpen(false);window.scrollTo({top:0,behavior:'smooth'});};
  const setYear = (year) => {setGrade(year);const yearTrack = gradeTracks.find((item) => item.grade === year);const next = units.find((item) => yearTrack.common.includes(item.id)) || units[0];setSelectedId(next.id);setSection('explorer');setChoice(null);};
  const answerQuiz = (index) => {setChoice(index);if(index===correctChoice[lesson.type]) setCompleted((items) => items.includes(lesson.id)?items:[...items,lesson.id]);};
  const navButton = (id,label,icon) => <button className={`nav-button ${section===id?'active':''}`} onClick={() => {setSection(id);setMenuOpen(false);}}><Icon>{icon}</Icon><span>{label}</span>{id==='explorer'&&<i>16</i>}</button>;

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen?'open':''}`}>
      <a className="brand" href="#accueil" onClick={(e)=>{e.preventDefault();setSection('explorer');setMenuOpen(false);}}><span className="brand-symbol">a.</span><span><b>atòm</b><small>laboratwa chimie</small></span></a>
      <div className="school-chip"><span className="chip-icon">✳</span><span><small>FUTUR HAÏTI</small><b>Chimie · Secondaire</b></span></div>
      <div className="nav-group">{navButton('explorer','Explorer','⌂')}{navButton('curriculum','Programme','▤')}</div>
      <div className="class-switcher">{gradeNames.map((item,index)=><button className={`class-button ${grade===item?'current':''}`} key={item} onClick={() => setYear(item)}><span className="grade-index">0{index+1}</span><span>{item}</span>{grade===item&&<i>•</i>}</button>)}</div>
    </aside>
    {menuOpen&&<button className="mobile-scrim" aria-label="Fermer le menu" onClick={()=>setMenuOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><button className="menu-toggle" aria-label="Ouvrir le menu" onClick={()=>setMenuOpen(!menuOpen)}>☰</button><div className="breadcrumbs"><span>Chimie</span><b>›</b><strong>{section==='curriculum'?'Programme':section==='lesson'?lesson.title:'Explorer'}</strong></div><label className="searchbox"><span>⌕</span><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Chercher une notion…"/><kbd>⌘ K</kbd>{searchResults.length>0&&<div className="search-results">{searchResults.slice(0,5).map((item)=><button onClick={()=>{selectLesson(item);setSearch('');}} key={item.id}><span className={`theme-dot ${themes[item.theme].color}`}>{themes[item.theme].icon}</span><span>{item.title}<small>{item.grade}</small></span><b>→</b></button>)}</div>}</label><div className="top-profile"><span className="online-dot"/><div className="profile-avatar">G</div></div></header>
      {section==='curriculum' ? <Curriculum grade={grade} track={track} setTrack={setTrack} setGrade={setGrade} selectLesson={selectLesson}/> : section==='lesson' ? <Lesson lesson={lesson} choice={choice} answerQuiz={answerQuiz} onBack={()=>setSection('explorer')} onPrevious={()=>{const index=units.findIndex((u)=>u.id===lesson.id);if(index>0)selectLesson(units[index-1]);else setSection('explorer');}} onNext={()=>{const index=units.findIndex((u)=>u.id===lesson.id);selectLesson(units[(index+1)%units.length]);}}/> : <Explorer grade={grade} track={track} setTrack={setTrack} currentTrack={currentTrack} lessons={visibleLessons} completed={completed} completionPercent={completionPercent} selectLesson={selectLesson} setSection={setSection}/ >}
      <footer className="page-footer"><a href="#sources" onClick={(e)=>{e.preventDefault();setSection('curriculum');}}>Programme scolaire & sources ↗</a></footer>
    </main>
  </div>;
}

function Explorer({grade,track,setTrack,currentTrack,lessons,completed,completionPercent,selectLesson,setSection}) {
  const recommended = lessons[0] || units[0];
  return <div className="page-content">
    <section className="hero-card"><div className="hero-grain"/><div className="hero-copy"><h1>Entre dans<br/><em>le monde des atomes.</em></h1><p>Fais tourner un modèle 3D, explore les 118 éléments et repère les particules qui composent la matière.</p><div className="hero-actions"><button className="primary-button" onClick={()=>selectLesson(units.find((item)=>item.id==='A2'))}>Explorer les 118 éléments <span>→</span></button><button className="quiet-button" onClick={()=>setSection('curriculum')}>Voir le programme</button></div></div><div className="hero-art"><ChemistryScene3D compact type="atom" element={{symbol:'C',name:'Carbone',number:6,massNumber:12,shells:[2,4]}} charge={0} formula="H2O" ph={7} carbonCount={2} phase="Liquide" mixture="Eau" strength="Fort" choice="Eau" reversed={false} coefficients={[1,1,1,1]} reacted={false} spinning={true}/></div><div className="hero-bottom"><span>118 éléments</span><span>Glisse pour tourner</span></div></section>
    <div className="section-head"><div><h2>Explorer les unités · {grade}</h2></div><button className="text-link" onClick={()=>setSection('curriculum')}>Programme complet <span>→</span></button></div>
    <div className="track-filter"><div><span className="filter-label">Série</span>{['SVT','MP'].map((item)=><button className={track===item?'selected':''} key={item} onClick={()=>setTrack(item)}>{item==='SVT'?'Sciences de la vie et de la Terre':'Mathématiques et physique'}</button>)}</div><span className="track-note">{currentTrack.note}</span></div>
    <div className="lesson-grid">{lessons.map((item,index)=><LessonCard key={item.id} item={item} index={index} completed={completed.includes(item.id)} onClick={()=>selectLesson(item)}/>)}</div>
    {['Secondaire III','Secondaire IV'].includes(grade)&&track==='MP'&&<div className="track-callout"><span>ⓘ</span><p><b>Un programme différent en MP.</b> Les unités spécialisées en acides-bases et chimie organique (grisées dans le tableau officiel) sont réservées à SVT. Ici, le parcours MP garde les unités communes C1–C2 ou C3–C4.</p><button onClick={()=>setSection('curriculum')}>Comprendre la progression →</button></div>}
    <section className="progress-card"><div><h3>Ta progression</h3><p>{completed.length} / {units.length} unités terminées</p></div><div className="progress-ring" style={{'--progress':`${completionPercent}%`}}><span><b>{completionPercent}%</b></span></div></section>
  </div>;
}

function LessonCard({item,index,completed,onClick}) {
  const family=themes[item.theme];
  return <button className={`lesson-card ${family.color}`} onClick={onClick}><div className="card-top"><span className="card-arrow">{completed?'✓':'→'}</span></div><span className="card-icon">{family.icon}</span><div className="card-copy"><h3>{item.title}</h3><p>{item.question}</p></div><div className="card-accent"/></button>;
}

function Lesson({lesson,choice,answerQuiz,onBack,onPrevious,onNext}) {
  const selectedAnswer = choice === correctChoice[lesson.type];
  return <div className="page-content lesson-page">
    <button className="back-link" onClick={onBack}>← Retour au parcours</button>
    <div className="lesson-heading"><h1>{lesson.title}</h1></div>
    <div className="lesson-columns"><div className="lesson-main-col">
      <section className="question-card"><h2>{lesson.question}</h2></section>
      <section className="explain-card"><div className="explain-heading"><h2>À retenir</h2></div><p><GlossaryText>{lesson.explain}</GlossaryText></p><details className="local-example"><summary>Exemple concret</summary><p><GlossaryText>{lesson.local}</GlossaryText></p></details></section>
      <ChemistryLearningLab key={lesson.id} unit={lesson}/>
      <section className="check-card"><div className="check-header"><h2>Vérifier ma compréhension</h2></div><div className="answer-list">{quizLabels[lesson.type].map((answer,index)=><button key={answer} className={`answer-option ${choice===index?(index===correctChoice[lesson.type]?'correct':'incorrect'):''}`} onClick={()=>answerQuiz(index)}><span className="answer-letter">{String.fromCharCode(65+index)}</span><span><GlossaryText>{answer}</GlossaryText></span>{choice===index&&<b>{index===correctChoice[lesson.type]?'✓':'↻'}</b>}</button>)}</div>{choice!==null&&<div className={`answer-feedback ${selectedAnswer?'correct':'incorrect'}`}><b>{selectedAnswer?'Exact.':'Réessaie.'}</b><p><GlossaryText>{selectedAnswer?'Bonne réponse.':lesson.reason}</GlossaryText></p></div>}</section>
      <div className="lesson-bottom-nav"><button onClick={onPrevious}>← Unité précédente</button><button onClick={onNext}>Unité suivante →</button></div>
    </div></div>
  </div>;
}

function Curriculum({grade,track,setTrack,setGrade,selectLesson}) {
  const [tab,setTab]=useState('SVT & MP');
  return <div className="page-content curriculum-page"><div className="curriculum-hero"><span className="eyebrow">PROGRAMME MENFP · 2024</span><h1>Programme de chimie</h1><p>Choisis une année. Les parcours SVT et MP diffèrent à partir du Secondaire III.</p><div className="curriculum-tabs"><button className={tab==='SVT & MP'?'active':''} onClick={()=>setTab('SVT & MP')}>SVT & MP</button><button className={tab==='SES & LLA'?'active':''} onClick={()=>setTab('SES & LLA')}>SES & LLA</button></div></div>
    {tab==='SVT & MP'?<><div className="curriculum-track-row"><div><div className="pill-control"><button className={track==='SVT'?'selected':''} onClick={()=>setTrack('SVT')}>SVT</button><button className={track==='MP'?'selected':''} onClick={()=>setTrack('MP')}>MP</button></div></div><p>SVT et MP : parcours distincts à partir du Secondaire III.</p></div><div className="year-grid">{gradeTracks.map((item,index)=>{const ids=[...item.common,...(track==='SVT'?item.svt||[]:[])];return <section className={`year-card ${grade===item.grade?'focused':''}`} key={item.grade}><button className="year-select" onClick={()=>setGrade(item.grade)}><span>0{index+1} / ANNÉE</span><b>Secondaire {['I','II','III','IV'][index]}</b><small>{item.period}</small></button><div className="year-unit-list">{ids.map((id)=>{const lesson=units.find((u)=>u.id===id);const family=themes[lesson.theme];return <button key={id} className="year-unit" onClick={()=>selectLesson(lesson)}><span className={`unit-tag ${family.color}`}>{id}</span><span>{lesson.title}<small>{family.name}</small></span><i>→</i></button>;})}</div><div className="year-hours">{item.note}</div></section>;})}</div><details className="curriculum-note"><summary>À propos de la progression</summary><p>La liste suit les en-têtes détaillés et le tableau annuel du programme (p. 40–100 et p. 101–102). Attention : la matrice de compétences p. 39 répartit A1, A2, A3 et B1 en Sec. I; B2, C1, D1 et D2 en Sec. II; A4, B3, C2 et D3 en Sec. III. Cette répartition contredit plusieurs fiches détaillées et le tableau annuel. Les niveaux affichés suivent ce dernier; la divergence doit être clarifiée avec le MENFP. Les lignes grisées B3, B4, D3 et D4 sont réservées à SVT (p. 101).</p></details></>:<><div className="interdisciplinary-intro"><b>Un parcours interdisciplinaire</b><p>En SES et LLA, le document 2024 prévoit des unités communes aux sciences expérimentales (chimie, physique, biologie, géologie) pour les deux dernières années. Il ne donne pas une progression spécialisée de chimie comparable à SVT/MP. Les équipes enseignantes précisent les compétences au sein de ces projets.</p></div><div className="interdisciplinary-grid">{Object.entries(interdisciplinary).map(([year,topics])=><section className="inter-card" key={year}><span className="eyebrow">{year.toUpperCase()}</span><h2>Explorer le monde à plusieurs échelles</h2>{topics.map((topic,index)=><div className="inter-topic" key={topic}><i>0{index+1}</i><span>{topic}</span></div>)}</section>)}</div></>}<div className="source-note"><span>⌕</span><p><b>La référence utilisée :</b> Programme remanié du MENFP, version définitive du 24 juillet 2024. Son statut après cette date est indiqué dans les sources du projet.</p><a href="https://www.haitidocs.org/doc/menfp-programme-secondaire-2024-chimie?lang=fr" target="_blank" rel="noreferrer">Consulter le document ↗</a></div></div>;
}

function mainRender() {
  const root = createRoot(document.getElementById('root'));
  root.render(<React.StrictMode><App/></React.StrictMode>);
}
mainRender();
