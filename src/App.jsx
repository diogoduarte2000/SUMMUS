import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';



import axios from 'axios';



import './App.css';







function App() {
  const formatDateKey = (date) => date.toISOString().slice(0, 10);
  const generateEventId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  };
  const normalizeDayEvents = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return [value];
    return [];
  };
  const normalizeStoredEvents = (raw) => {
    if (!raw || typeof raw !== 'object') return {};
    return Object.entries(raw).reduce((acc, [dateKey, value]) => {
      const list = normalizeDayEvents(value).map((evt) => ({
        id: evt.id || generateEventId(),
        title: evt.title || 'Evento',
        description: evt.description || evt.note || '',
        startTime: evt.startTime || '',
        endTime: evt.endTime || '',
        location: evt.location || '',
        allDay: evt.allDay !== undefined ? evt.allDay : !(evt.startTime || evt.endTime),
      }));
      if (list.length) acc[dateKey] = list;
      return acc;
    }, {});
  };
  const getEmptyEventForm = () => ({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    allDay: false,
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);



  const [isRegistering, setIsRegistering] = useState(false);



  const [username, setUsername] = useState('');



  const [password, setPassword] = useState('');



  const [notes, setNotes] = useState([]);



  const [currentNoteId, setCurrentNoteId] = useState(null);



  const [, setNote] = useState('');



  const [searchTerm, setSearchTerm] = useState('');



  const [isComposerOpen, setIsComposerOpen] = useState(false);



  const [composerMode, setComposerMode] = useState('create');



  const [composerNoteId, setComposerNoteId] = useState(null);



  const [composerText, setComposerText] = useState('');



  const [selectedNoteIds, setSelectedNoteIds] = useState([]);



  const [newNoteAnimatingId, setNewNoteAnimatingId] = useState(null);



  const [error, setError] = useState('');



  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);



  const [isSidebarOpen, setIsSidebarOpen] = useState(true);



  const [view, setView] = useState('home');



  const today = new Date();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState(() => {
    try {
      const stored = localStorage.getItem('calendarEvents');
      return stored ? normalizeStoredEvents(JSON.parse(stored)) : {};
    } catch {
      return {};
    }
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState(getEmptyEventForm);
  const [editingEventId, setEditingEventId] = useState(null);



  const modalHistoryRef = useRef(null);



  const popHandledRef = useRef(false);



  const [aiMessages, setAiMessages] = useState([]);



  const [aiInput, setAiInput] = useState('');



  const [aiLoading, setAiLoading] = useState(false);







  const [, setRecentNotes] = useState(() => {



    try {



      const stored = localStorage.getItem('recentNotes');



      return stored ? JSON.parse(stored) : [];



    } catch {



      return [];



    }



  });







  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');



  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'pt');

  const [translatorReady, setTranslatorReady] = useState(false);



  const [isSettingsOpen, setIsSettingsOpen] = useState(false);



  const [settingsName, setSettingsName] = useState('');







  const translatorInitRef = useRef(false);



  useEffect(() => {

    // ensure hidden container exists for Google Translate widget

    let container = document.getElementById('google_translate_container');

    if (!container) {

      container = document.createElement('div');

      container.id = 'google_translate_container';

      container.style.display = 'none';

      document.body.appendChild(container);

    }



    if (translatorInitRef.current) return;

    translatorInitRef.current = true;



    // initialize callback expected by Google script

    window.googleTranslateElementInit = () => {

      if (!window.google?.translate) return;

      new window.google.translate.TranslateElement(

        {

          pageLanguage: 'pt',

          includedLanguages: 'pt,en,es',

          autoDisplay: false,

        },

        'google_translate_container'

      );

      setTranslatorReady(true);

    };



    // load script once

    const existingScript = document.getElementById('google-translate-script');

    if (!existingScript) {

      const script = document.createElement('script');

      script.id = 'google-translate-script';

      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';

      script.async = true;

      document.body.appendChild(script);

    } else {

      // if script was already there, try to mark ready if translate is available

      if (window.google?.translate) setTranslatorReady(true);

    }

  }, []);



  useEffect(() => {

    // keep <html lang> in sync

    const html = document.documentElement;

    if (html) html.setAttribute('lang', language || 'pt');



    // apply Google translation when ready

    const applyTranslation = () => {

      const select = document.querySelector('.goog-te-combo');

      if (select && select.value !== language) {

        select.value = language;

        select.dispatchEvent(new Event('change'));

      }

    };



    if (translatorReady) {

      // small delay so widget mounts before dispatch

      const id = setTimeout(applyTranslation, 80);

      return () => clearTimeout(id);

    }



    return undefined;

  }, [language, translatorReady]);



  useEffect(() => {



    document.body.classList.remove('theme-dark', 'theme-light');



    document.body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');



    localStorage.setItem('theme', theme);



  }, [theme]);






  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
  }, [calendarEvents]);










  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';







  const api = useMemo(() => {

    const instance = axios.create({ baseURL: API_URL });

    instance.interceptors.request.use((config) => {

      const token = localStorage.getItem('token');

      if (token) config.headers.Authorization = token;

      return config;

    });

    return instance;

  }, [API_URL]);


  const renderAiContent = (text) => {
    if (!text) return { __html: "" };
    let html = text;
    html = html.replace(/\\sqrt\\s*\\{([^}]+)\\}/g, "v($1)");
    html = html.replace(/\\sqrt\\s*\\(([^)]+)\\)/g, "v($1)");
    html = html.replace(/\\sqrt/g, "v");
    html = html.replace(/\\times/g, "×");
    html = html.replace(/\\approx/g, "˜");
    html = html.replace(/\\([0-9]+)/g, "$1");
    html = html.replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\t/g, " ");
    html = html.replace(/\\\*/g, "*");
    html = html.replace(/\$(.*?)\$/g, "$1");
    html = html.replace(/\{([^}]+)\}/g, "$1");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\n/g, "<br/>");
    return { __html: html };
  };








  const addRecentNote = (noteObj) => {



    if (!noteObj || !noteObj.text) return;



    const snippet = noteObj.text.trim().slice(0, 80);



    const entry = {



      id: noteObj.id,



      text: snippet,



      updatedAt: noteObj.updatedAt || Date.now(),



    };



    setRecentNotes((prev) => {



      const next = [entry, ...prev.filter((n) => n.id !== entry.id)];



      const trimmed = next.slice(0, 6);



      localStorage.setItem('recentNotes', JSON.stringify(trimmed));



      return trimmed;



    });



  };







  const persistNotes = (nextNotes) => {



    setNotes(nextNotes);



    localStorage.setItem('notes', JSON.stringify(nextNotes));



  };







  const getRowSpan = (text) => {



    const length = text ? text.length : 0;



    const rows = Math.ceil(length / 80);



    return Math.min(18, Math.max(6, rows));



  };



  useEffect(() => {



    const token = localStorage.getItem('token');



    const storedUser = localStorage.getItem('username');







    const storedNotes = localStorage.getItem('notes');



    if (storedNotes) {



      const parsed = JSON.parse(storedNotes);



      const normalized = parsed.map((n, idx) => ({



        ...n,



        updatedAt: n.updatedAt || Date.now() - idx,



      }));



      setNotes(normalized);



      persistNotes(normalized);



      if (normalized.length > 0) {



        setCurrentNoteId(normalized[0].id);



        setNote(normalized[0].text);



      }



    } else {



      // migrate old single-note storage if present



      const migrated = localStorage.getItem('savedNote');



      if (migrated) {



        const initial = [{ id: Date.now().toString(), text: migrated }];



        persistNotes(initial);



        setCurrentNoteId(initial[0].id);



        setNote(migrated);



      }



    }







    if (token) {



      setIsLoggedIn(true);



      setUsername(storedUser || '');



    }



  }, []);







  const handleLogin = async (e) => {



    e.preventDefault();



    setError('');



    try {



      const res = await api.post('/login', { username, password });



      localStorage.setItem('token', res.data.token);



      localStorage.setItem('username', username);



      setIsLoggedIn(true);



      setView('home');



    } catch (err) {



      console.warn('Login offline fallback:', err?.message);



      const offlineToken = `local-${Date.now()}`;



      localStorage.setItem('token', offlineToken);



      localStorage.setItem('username', username || 'offline');



      setIsLoggedIn(true);



      setView('home');



      setError('Servidor indisponível: entrou em modo offline.');


    }



  };







  const handleRegister = async (e) => {



    e.preventDefault();



    setError('');



    try {



      await api.post('/register', { username, password });



      setIsRegistering(false);



      alert('Account created! Now you can log in.');



    } catch (err) {



      console.warn('Register offline fallback:', err?.message);



      // fallback: just switch back to login with same credentials



      setIsRegistering(false);



      setError('Servidor indisponível: conta criada localmente. Faça login.');


    }



  };







  const deleteSelectedNotes = () => {



    if (!selectedNoteIds.length) return;



    const remaining = notes.filter((n) => !selectedNoteIds.includes(n.id));



    persistNotes(remaining);



    setSelectedNoteIds([]);



    if (selectedNoteIds.includes(currentNoteId)) {



      if (remaining.length) {



        setCurrentNoteId(remaining[0].id);



        setNote(remaining[0].text);



      } else {



        setCurrentNoteId(null);



        setNote('');



      }



    }



  };







  const toggleSelectNote = (id) => {



    setSelectedNoteIds((prev) =>



      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]



    );



  };







  const openCreateModal = () => {



    setComposerMode('create');



    setComposerNoteId(null);



    setComposerText('');



    setIsComposerOpen(true);



  };







  const closeCreateModal = () => {



    setIsComposerOpen(false);



    setComposerText('');



    setComposerNoteId(null);



  };







  const openEditModal = (noteObj) => {



    setComposerMode('edit');



    setComposerNoteId(noteObj.id);



    setComposerText(noteObj.text || '');



    setIsComposerOpen(true);



    setCurrentNoteId(noteObj.id);



    setNote(noteObj.text || '');



  };







  const openSettings = () => {



    setSettingsName(username || '');



    setIsSettingsOpen(true);



  };







  const closeSettings = () => {



    setIsSettingsOpen(false);



  };











  const colorPalette = ['#1d3959', '#2f3d2f', '#5a2f2f', '#44355b', '#35545a', '#8b5a1e', '#2f2f2f'];







  const pickColor = () => colorPalette[Math.floor(Math.random() * colorPalette.length)];







  const previewText = (txt, limit = 120) => {



    if (!txt) return '';



    const clean = txt.trim();



    if (clean.length <= limit) return clean;



    return clean.slice(0, limit) + '...';



  };





  const quickActions = [


    {
      key: 'ai',
      label: 'AI',
      description: 'Gerar ou editar rapidamente',
      icon: '\u{1F9E0}',
      onClick: () => {
        if (aiMessages.length === 0) {
          setAiMessages([
            { role: 'assistant', content: 'Olá, sou o Summus AI. Em que posso ajudar hoje?' },
          ]);
        }
        setView('ai');
      },
    },
    {
      key: 'search',
      label: 'Procurar',


      description: 'Encontrar notas e workflows',
      icon: '\u{1F50D}',
      onClick: () => setView('search'),
    },
    {
      key: 'calendar',
      label: 'Calendário',
      description: 'Ver tarefas por dia',
      icon: '\u{1F4C5}',
      onClick: () => setView('calendar'),
    },
    {
      key: 'workflow',
      label: 'Workflow',
      description: 'Entrar na área de trabalho',
      icon: '\u{1F5C2}\uFE0F',
      onClick: () => setView('workflow'),
    },
  ];













  const openDayModal = (dateObj) => {
    if (!dateObj) return;
    setSelectedDay(dateObj);
    setEventForm(getEmptyEventForm());
    setEditingEventId(null);
    setIsDayModalOpen(true);
  };

  const closeDayModal = () => {
    setIsDayModalOpen(false);
    setSelectedDay(null);
    setEventForm(getEmptyEventForm());
    setEditingEventId(null);
  };

  const getEventsForDate = (dateKey, source = calendarEvents) => normalizeDayEvents(source?.[dateKey]);

  const saveCalendarEvent = () => {
    if (!selectedDay || !eventForm.title.trim()) return;
    const key = formatDateKey(selectedDay);
    setCalendarEvents((prev) => {
      const existing = getEventsForDate(key, prev);
      const nextList = editingEventId
        ? existing.map((evt) =>
            evt.id === editingEventId ? { ...evt, ...eventForm, title: eventForm.title.trim() } : evt
          )
        : [...existing, { ...eventForm, id: generateEventId(), title: eventForm.title.trim() }];
      const sorted = nextList.sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return (a.startTime || '24:00').localeCompare(b.startTime || '24:00');
      });
      return { ...prev, [key]: sorted };
    });
    setEventForm(getEmptyEventForm());
    setEditingEventId(null);
    closeDayModal();
  };

  const handleDeleteEvent = (eventId) => {
    if (!selectedDay) return;
    const key = formatDateKey(selectedDay);
    setCalendarEvents((prev) => {
      const remaining = getEventsForDate(key, prev).filter((evt) => evt.id !== eventId);
      const next = { ...prev };
      if (remaining.length) {
        next[key] = remaining;
      } else {
        delete next[key];
      }
      return next;
    });
    if (editingEventId === eventId) {
      setEventForm(getEmptyEventForm());
      setEditingEventId(null);
    }
  };

  const handleEditEvent = (evt) => {
    setEditingEventId(evt.id);
    setEventForm({
      title: evt.title || '',
      description: evt.description || '',
      startTime: evt.startTime || '',
      endTime: evt.endTime || '',
      location: evt.location || '',
      allDay: !!evt.allDay,
    });
  };

  const createNewNote = (text = '') => {
    const timestamp = Date.now();
    const id = timestamp.toString();
    const newNote = { id, text, color: pickColor(), updatedAt: timestamp };
    const next = [newNote, ...notes];
    persistNotes(next);
    setCurrentNoteId(id);
    setNote(text);
    setSelectedNoteIds([]);
    setNewNoteAnimatingId(id);
    addRecentNote(newNote);
    setTimeout(() => setNewNoteAnimatingId(null), 500);
  };







  const handleDraftCreate = () => {



    const content = composerText.trim();



    if (!content) return;







    if (composerMode === 'create') {



      createNewNote(content);



    } else if (composerMode === 'edit' && composerNoteId) {



      setNotes((prev) => {



        const next = prev.map((n) =>



          n.id === composerNoteId ? { ...n, text: content, updatedAt: Date.now() } : n



        );



        const target = next.find((n) => n.id === composerNoteId);



        const reordered = [target, ...next.filter((n) => n.id !== composerNoteId)];



        persistNotes(reordered);



        addRecentNote(target);



        setCurrentNoteId(target.id);



        setNote(target.text);



        setNewNoteAnimatingId(target.id);



        setTimeout(() => setNewNoteAnimatingId(null), 500);



        return reordered;



      });



    }







    closeCreateModal();



  };







  const sendAiMessage = async () => {



    const content = aiInput.trim();



    if (!content || aiLoading) return;







    const nextHistory = [...aiMessages, { role: 'user', content }];



    setAiMessages(nextHistory);



    setAiInput('');



    setAiLoading(true);







    try {



      const res = await api.post('/ai', { messages: nextHistory });



      const reply = res?.data?.reply || 'Sem resposta agora.';



      setAiMessages((prev) => [...prev, { role: 'assistant', content: reply }]);



    } catch (err) {



      const fallback = err?.response?.data?.message || 'Não consegui falar com a AI agora.';


      setAiMessages((prev) => [...prev, { role: 'assistant', content: fallback }]);



    } finally {



      setAiLoading(false);



    }



  };







  useEffect(() => {



    if (!isComposerOpen) return undefined;







    const handleKey = (e) => {



      if (e.key === 'Escape') {



        e.preventDefault();



        closeCreateModal();



      }



    };







    const handlePop = () => {



      popHandledRef.current = true;



      closeCreateModal();



    };







    window.addEventListener('keydown', handleKey);



    window.addEventListener('popstate', handlePop);







    const stateMarker = { modalOpenAt: Date.now() };



    modalHistoryRef.current = stateMarker;



    window.history.pushState(stateMarker, '');







    return () => {



      window.removeEventListener('keydown', handleKey);



      window.removeEventListener('popstate', handlePop);







      if (modalHistoryRef.current && !popHandledRef.current) {



        window.history.back();



      }







      modalHistoryRef.current = null;



      popHandledRef.current = false;



    };



  }, [isComposerOpen]);







  // Note: single-note support for now (backend stores one note per user)







  const sortedNotes = [...notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));



  const sidebarRecentList = sortedNotes.slice(0, 6);



  const handleLogout = () => {



    localStorage.removeItem('token');



    localStorage.removeItem('username');



    setIsLoggedIn(false);



    setUsername('');



    setPassword('');



    setNote('');



    setView('home');



  };







  if (!isLoggedIn) {



    return (



      <div className="login-container">



        <div className={`card ${view === 'workflow' ? 'workspace-card' : ''}`}>



          <h2>Summus</h2>



          <p>{isRegistering ? 'Create a new account.' : 'Enter your credentials to access your workspace.'}</p>



          {error && <p className="small-note" style={{ color: '#ff6b6b' }}>{error}</p>}



          <form onSubmit={isRegistering ? handleRegister : handleLogin}>



            <input



              type="text"



              placeholder="Username"



              value={username}



              onChange={(e) => setUsername(e.target.value)}



              required



            />



            <input



              type="password"



              placeholder="Password"



              value={password}



              onChange={(e) => setPassword(e.target.value)}



              required



            />



            <button className="button" type="submit">



              {isRegistering ? 'Create account' : 'Continue with email'}



            </button>



          </form>



          <p className="small-note">



            {isRegistering ? (



              <>



                Already have an account?{' '}



                <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(false); setError(''); }}>



                  Sign in



                </a>



              </>



            ) : (



              <>



                New here?{' '}



                <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(true); setError(''); }}>



                  Create account



                </a>



              </>



            )}



          </p>



          <p className="small-note">By continuing, you agree to our terms and privacy policy.</p>



        </div>



      </div>



    );



  }







  const selectedDayKey = selectedDay ? formatDateKey(selectedDay) : null;
  const eventsForSelectedDay = selectedDayKey ? getEventsForDate(selectedDayKey) : [];

  return (



    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>



      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>



        <div className="sidebar-header">



          <button



            className="sidebar-toggle"



            onClick={() => setIsSidebarOpen((open) => !open)}



          >
            {'\u2630'}
          </button>



          <button className="sidebar-brand" onClick={() => setView('home')}>SUMMUS</button>



        </div>







        <nav className="sidebar-nav">



          <div className="sidebar-actions">



            <button className="sidebar-action" onClick={() => setView('new')}>



              <span className="sidebar-icon">{'\u2795'}</span>



              <span className="sidebar-text">Novo</span>



            </button>



            <button className="sidebar-action" onClick={() => setView('search')}>



              <span className="sidebar-icon">{'\u{1F50D}'}</span>



              <span className="sidebar-text">Procurar</span>



            </button>



            <button className="sidebar-action" onClick={() => setView('calendar')}>



              <span className="sidebar-icon">{'\u{1F4C5}'}</span>



              <span className="sidebar-text">Calendário</span>



            </button>



          </div>



          <div className="sidebar-section">



            <button className="sidebar-action" onClick={() => setView('workflow')}>



              <span className="sidebar-icon">{'\u{1F9E0}'}</span>



              <span className="sidebar-text">Workflows</span>



            </button>



          </div>



          <div className="sidebar-section">



            <div className="sidebar-section-title">Recentes</div>



            <div className="sidebar-scroll">



              {sidebarRecentList.length === 0 ? (



                <div className="sidebar-item" style={{ opacity: 0.6, cursor: 'default' }}>



                  <span className="sidebar-text">Nenhuma nota recente</span>



                </div>



              ) : (



                sidebarRecentList.map((item) => (



                  <button



                    key={item.id}



                    className="sidebar-item recent-item"



                    onClick={() => {



                      const target = sortedNotes.find((n) => n.id === item.id);



                      if (target) {



                        openEditModal(target);



                        setView('workflow');



                      } else {



                        setNote(item.text);



                        setView('workflow');



                      }



                    }}



                  >



                    <span className="sidebar-text">{previewText(item.text, 70)}</span>



                  </button>



                ))



              )}



            </div>



          </div>



        </nav>







        <div className="sidebar-footer">



          <button



            className="sidebar-user"



            onClick={() => setIsUserMenuOpen((open) => !open)}



          >



            {username}



          </button>



              {isUserMenuOpen && isSidebarOpen && (



                <div className="sidebar-user-menu">



                  <button className="sidebar-user-menu-item" onClick={openSettings}>Settings</button>



                  <button className="sidebar-user-menu-item" onClick={handleLogout}>



                    Logout



                  </button>



                </div>



              )}



        </div>



      </aside>



      <div className="editor-wrapper">



        <main className="editor">



          <div className="card">



            {view === 'calendar' ? (
              <div className="card calendar-card">
                <div className="calendar-header">
                  <button
                    className="ghost-button"
                    onClick={() =>
                      setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
                    }
                  >
                    ‹
                  </button>
                  <div className="calendar-title">
                    {calendarDate.toLocaleString(language === 'pt' ? 'pt-PT' : language === 'es' ? 'es-ES' : 'en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <button
                    className="ghost-button"
                    onClick={() =>
                      setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
                    }
                  >
                    ›
                  </button>
                </div>

                <div className="calendar-grid">
                  {Array.from({ length: 42 }, (_, i) => {
                    const base = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
                    const startDay = base.getDay();
                    const day = i - startDay + 1;
                    const dateObj = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
                    const inMonth = day > 0 && dateObj.getMonth() === calendarDate.getMonth();
                    const isToday = inMonth && dateObj.toDateString() === today.toDateString();
                    const key = formatDateKey(dateObj);
                    const dayEvents = getEventsForDate(key);
                    return (
                      <div
                        key={i}
                        className={`cal-cell ${inMonth ? '' : 'cal-out'} ${isToday ? 'cal-today' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => inMonth && openDayModal(dateObj)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && inMonth) {
                            e.preventDefault();
                            openDayModal(dateObj);
                          }
                        }}
                      >
                        <div className="cal-day-row">
                          <span className="cal-day">{inMonth ? day : ''}</span>
                          {inMonth ? (
                            <button
                              className="cal-add"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDayModal(dateObj);
                              }}
                              title="Adicionar evento"
                              type="button"
                            >
                              +
                            </button>
                          ) : null}
                        </div>
                        <div className="cal-events">
                          {dayEvents.slice(0, 2).map((evt) => (
                            <span className="cal-chip" key={evt.id}>
                              <span className="cal-chip-time">
                                {evt.allDay
                                  ? 'Dia inteiro'
                                  : [evt.startTime, evt.endTime].filter(Boolean).join(' - ') || 'Sem hora'}
                              </span>
                              <span className="cal-chip-title">{evt.title || 'Sem título'}</span>
                            </span>
                          ))}
                          {dayEvents.length > 2 ? (
                            <span className="cal-more">+{dayEvents.length - 2} eventos</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : view === 'home' ? (



              <>



                <h2>Hi {username || 'user'}, welcome back</h2>



                <p>Select &quot;Workflow&quot; from the sidebar to open your notes workspace.</p>



              </>



            ) : view === 'new' ? (



              <>



                <div className="quick-launch">



                  <div className="quick-header">



                    <h2>O que vamos fazer hoje?</h2>



                    <p>Escolhe uma opção para começar rapidamente.</p>



                  </div>



                  <div className="quick-grid">



                    {quickActions.map((action) => (



                      <button



                        key={action.key}



                        className="quick-card"



                        onClick={action.onClick}



                      >



                        <span className="quick-icon">{action.icon}</span>



                        <div className="quick-body">



                          <div className="quick-title">{action.label}</div>



                          <div className="quick-desc">{action.description}</div>



                        </div>



                      </button>



                    ))}



                  </div>



                </div>



              </>



            ) : view === 'search' ? (



              <div className="card">



                <div className="search-header">



                  <h2>Procurar nas notas</h2>



                  <p>Escreve um termo e vê resultados instantâneos.</p>



                  <input



                    className="search-input"



                    type="text"



                    placeholder="Pesquisar título ou conteúdo..."



                    value={searchTerm}



                    onChange={(e) => setSearchTerm(e.target.value)}



                  />



                </div>



                <div className="search-results">



                  {sortedNotes



                    .filter((n) => {



                      if (!searchTerm.trim()) return true;



                      const txt = (n.text || '').toLowerCase();



                      return txt.includes(searchTerm.toLowerCase());



                    })



                    .map((item) => {



                      const preview = previewText(item.text, 160);



                      return (



                        <button



                          key={item.id}



                          className="search-item"



                          onClick={() => {



                            openEditModal(item);



                            setView('workflow');



                          }}



                        >



                          <div className="search-title">{preview || '(sem conteúdo)'}</div>



                          <div className="search-meta">



                            Atualizado {new Date(item.updatedAt || item.id).toLocaleString()}



                          </div>



                        </button>



                      );



                    })}



                </div>



              </div>



            ) : view === 'ai' ? (



              <div className="card">



                <div className="quick-header" style={{ marginBottom: '1rem' }}>



                  <h2>Chat AI</h2>



                  <p>Conversa tipo ChatGPT dentro do Summus.</p>



                </div>



                <div className="ai-chat">



                  <div className="ai-messages">



                    {aiMessages.map((msg, idx) => (



                      <div



                        key={idx}



                        className={`ai-msg ${msg.role === 'assistant' ? 'bot' : 'user'}`}



                      >



                        <strong>{msg.role === 'assistant' ? 'Summus AI' : username || 'Você'}:</strong>{' '}



                        <span dangerouslySetInnerHTML={renderAiContent(msg.content)} />



                      </div>



                    ))}



                    {aiLoading && <div className="ai-msg bot">A pensar...</div>}



                  </div>



                  <div className="ai-input-row">



                    <input



                      type="text"



                      placeholder="Escreve a tua pergunta..."



                      value={aiInput}



                      onChange={(e) => setAiInput(e.target.value)}



                      onKeyDown={(e) => {



                        if (e.key === 'Enter') sendAiMessage();



                      }}



                    />



                    <button className="button" onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()}>



                      Enviar



                    </button>



                  </div>



                </div>



              </div>



            ) : (



              <>



                <div className="workflow-board">



                  <div className="workflow-topbar">



                    <button className="create-pill" onClick={openCreateModal}>



                      <span className="create-icon">+</span>



                      <span>Criar workflow</span>



                    </button>







                    <div className="workflow-top-actions">



                      {selectedNoteIds.length > 0 ? (



                        <div className="bulk-toolbar">



                          <button

                            className="ghost-button danger"

                            onClick={deleteSelectedNotes}

                            title="Eliminar selecionados"

                          >

                            Eliminar {selectedNoteIds.length} item(s)

                          </button>

                        </div>



                      ) : (



                        <div style={{ height: '48px' }} />



                      )}



                    </div>



                  </div>







                  <div className="notes-grid">



                    {sortedNotes.map((item) => {



                      const isActive = item.id === currentNoteId;



                      const isSelected = selectedNoteIds.includes(item.id);



                      const isNew = newNoteAnimatingId === item.id;



                      return (



                        <div



                          key={item.id}



                          className={`note-card ${isActive ? 'selected' : ''} ${isSelected ? 'selected-mode' : ''} ${



                            isNew ? 'merge-in' : ''



                          }`}



                          style={{



                            gridRowEnd: `span ${getRowSpan(item.text)}`,



                            backgroundColor: item.color || undefined,



                          }}



                          onClick={() => openEditModal(item)}



                        >



                          <button



                            className={`note-select ${isSelected ? 'checked' : ''}`}



                            onClick={(e) => {



                              e.stopPropagation();



                              toggleSelectNote(item.id);



                            }}



                            title={isSelected ? 'Desmarcar' : 'Selecionar'}



                          >



                            {isSelected ? '×' : ''}



                          </button>







                          <div className="note-card-content">



                            {(() => {



                              const preview = previewText(item.text, 160);



                              const lines = preview ? preview.split('\n') : [];



                              const title = lines[0] || '(empty)';



                              const body = lines.slice(1).join('\n');



                              return (



                                <>



                                  <div className="note-card-header">



                                    <div className="note-title">{title}</div>



                                  </div>



                                  {body && <div className="note-body">{body}</div>}



                                </>



                              );



                            })()}



                          </div>



                        </div>



                      );



                    })}



                  </div>



                </div>







                {isComposerOpen && (
                  <div
                    className="composer-overlay"
                    onClick={() => {
                      if (composerMode === 'edit') {
                        handleDraftCreate();
                      } else {
                        closeCreateModal();
                      }
                    }}
                    tabIndex={-1}
                  >



                    <div



                      className="composer"



                      onClick={(e) => e.stopPropagation()}



                      onKeyDown={(e) => {



                        if (e.key === 'Escape') closeCreateModal();



                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleDraftCreate();



                      }}



                    >



                      <div className="composer-header">



                        <span>{composerMode === 'edit' ? 'Editar workflow' : 'Novo workflow'}</span>



                        <button className="icon-button" onClick={closeCreateModal} title="Fechar">



                          x



                        </button>



                      </div>



                      <textarea



                        className="composer-textarea"



                        value={composerText}



                        onChange={(e) => setComposerText(e.target.value)}



                        placeholder="Escreva aqui..."



                        autoFocus



                      />



                      <div className="composer-actions">



                        <button className="ghost-button" onClick={closeCreateModal}>



                          Cancelar



                        </button>



                        <button className="button" onClick={handleDraftCreate} disabled={!composerText.trim()}>



                          Guardar



                        </button>



                      </div>



                    </div>



                  </div>



                )}



              </>



            )}



          </div>







        {isDayModalOpen &&
          createPortal(
            <div className="day-modal-overlay" onClick={closeDayModal} tabIndex={-1}>
              <div className="day-modal" onClick={(e) => e.stopPropagation()}>
                <div className="day-modal-header">
                  <h3>
                    {selectedDay
                      ? selectedDay.toLocaleDateString(
                          language === 'pt' ? 'pt-PT' : language === 'es' ? 'es-ES' : 'en-US',
                          {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }
                        )
                      : 'Dia'}
                  </h3>
                  <button className="icon-button" onClick={closeDayModal} title="Fechar">
                    x
                  </button>
                </div>

                <div className="day-modal-section">
                  <div className="section-title">Eventos deste dia</div>
                  {eventsForSelectedDay.length ? (
                    <div className="event-list">
                      {eventsForSelectedDay.map((evt) => (
                        <div className="event-item" key={evt.id}>
                          <div className="event-meta">
                            <div className="event-time">
                              {evt.allDay
                                ? 'Dia inteiro'
                                : [evt.startTime, evt.endTime].filter(Boolean).join(' - ') || 'Sem hora'}
                            </div>
                            <div className="event-title">{evt.title || 'Sem título'}</div>
                            {evt.location ? <div className="event-location">{evt.location}</div> : null}
                            {evt.description ? <div className="event-description">{evt.description}</div> : null}
                          </div>
                          <div className="event-actions">
                            <button className="ghost-button" onClick={() => handleEditEvent(evt)}>
                              Editar
                            </button>
                            <button className="ghost-button danger" onClick={() => handleDeleteEvent(evt.id)}>
                              Apagar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">Ainda não há eventos para este dia.</p>
                  )}
                </div>

                <div className="day-modal-section">
                  <div className="section-title">{editingEventId ? 'Editar evento' : 'Criar evento'}</div>
                  <label className="settings-field">
                    <span>Título *</span>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Adicionar título"
                    />
                  </label>
                  <div className="event-row">
                    <label className="settings-field half">
                      <span>Início</span>
                      <input
                        type="time"
                        value={eventForm.startTime}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, startTime: e.target.value }))}
                        disabled={eventForm.allDay}
                      />
                    </label>
                    <label className="settings-field half">
                      <span>Fim</span>
                      <input
                        type="time"
                        value={eventForm.endTime}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, endTime: e.target.value }))}
                        disabled={eventForm.allDay}
                      />
                    </label>
                  </div>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={eventForm.allDay}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, allDay: e.target.checked }))}
                    />
                    <span>Dia inteiro</span>
                  </label>
                  <label className="settings-field">
                    <span>Local</span>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="Adicionar local"
                    />
                  </label>
                  <label className="settings-field">
                    <span>Descrição</span>
                    <textarea
                      className="composer-textarea"
                      value={eventForm.description}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Notas ou links..."
                      rows={4}
                    />
                  </label>
                  <div className="composer-actions day-actions">
                    <button
                      className="ghost-button"
                      onClick={() => {
                        setEventForm(getEmptyEventForm());
                        setEditingEventId(null);
                      }}
                    >
                      Limpar
                    </button>
                    <div className="composer-actions-end">
                      <button className="ghost-button" onClick={closeDayModal}>
                        Fechar
                      </button>
                      <button className="button" onClick={saveCalendarEvent} disabled={!eventForm.title.trim()}>
                        {editingEventId ? 'Atualizar' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {isSettingsOpen && (



          <div className="settings-overlay" onClick={closeSettings} tabIndex={-1}>



            <div



              className="settings-modal"



              onClick={(e) => e.stopPropagation()}



              onKeyDown={(e) => {



                if (e.key === 'Escape') closeSettings();



              }}



            >



              <h3>Defini??es</h3>



              <label className="settings-field">



                <span>Nome</span>



                <input



                  type="text"



                  value={settingsName}



                  onChange={(e) => setSettingsName(e.target.value)}



                  placeholder="O seu nome"



                />



              </label>



              <label className="settings-field">



                <span>Tema</span>



                <select value={theme} onChange={(e) => setTheme(e.target.value)}>



                  <option value="dark">Dark</option>



                  <option value="light">Light</option>



                </select>



              </label>



              <label className="settings-field">



                <span>L?ngua</span>



                <select value={language} onChange={(e) => setLanguage(e.target.value)}>



                  <option value="pt">Portugu?s</option>



                  <option value="en">English</option>



                  <option value="es">Espa?ol</option>



                </select>



              </label>



              <div className="settings-actions">



                <button className="ghost-button" onClick={closeSettings}>Cancelar</button>



                <button



                  className="button"



                  onClick={() => {



                    setUsername(settingsName);



                    localStorage.setItem('username', settingsName);



                    closeSettings();



                  }}



                >



                  Guardar



                </button>



              </div>



            </div>



          </div>



        )}







        </main>



      </div>



    </div>



  );



}







export default App;










