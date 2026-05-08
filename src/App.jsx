import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

import axios from 'axios';

import './App.css';

const UI_TEXT = {
  pt: {
    defaultUser: 'utilizador',
    primarySurface: 'Superfície principal',
    heroHello: 'Olá',
    heroWelcome: 'bem-vindo',
    heroBack: 'de volta',
    homeIntro:
      'Summus agora segue uma direção visual industrial e limpa. Entra em Workflow para abrir notas, organizar o calendario e mover tudo com menos ruido.',
    workflowCountLabel: 'workflows',
    workflows: 'Workflows',
    calendarEvents: 'Eventos do calendário',
    localTime: 'Hora local',
    latestSync: 'Última sync',
    noData: 'Sem dados',
    quickActions: 'Ações rápidas',
    quickEntries: 'Entradas rápidas',
    recentNotes: 'Notas recentes',
    resumeWhere: 'Continua de onde paraste',
    recentEmpty: 'Ainda não tens notas. Usa "Novo" ou entra em Workflow para criar a primeira.',
    recentEmptySidebar: 'Nenhuma nota recente',
    sidebarNew: 'Novo',
    sidebarSearch: 'Procurar',
    sidebarCalendar: 'Calendário',
    sidebarWorkflow: 'Workflows',
    recents: 'Recentes',
    aiDescription: 'Gerar ou editar rapidamente',
    searchDescription: 'Encontrar notas e workflows',
    calendarDescription: 'Ver tarefas por dia',
    workflowDescription: 'Entrar na área de trabalho',
    aiHello: 'Olá, sou o Summus AI. Em que posso ajudar hoje?',
    settings: 'Definições',
    logout: 'Logout',
    save: 'Guardar',
    cancel: 'Cancelar',
    settingsTitle: 'Definições',
    settingsName: 'Nome',
    settingsTheme: 'Tema',
    settingsLanguage: 'Língua',
    settingsPlaceholderName: 'O seu nome',
  },
  en: {
    defaultUser: 'user',
    primarySurface: 'Primary surface',
    heroHello: 'Hi',
    heroWelcome: 'welcome',
    heroBack: 'back',
    homeIntro:
      'Summus now follows a cleaner industrial direction. Jump into Workflow to open notes, organize the calendar, and move faster with less noise.',
    workflowCountLabel: 'workflows',
    workflows: 'Workflows',
    calendarEvents: 'Calendar events',
    localTime: 'Local time',
    latestSync: 'Latest sync',
    noData: 'No data',
    quickActions: 'Quick actions',
    quickEntries: 'Quick entries',
    recentNotes: 'Recent notes',
    resumeWhere: 'Pick up where you left off',
    recentEmpty: 'You do not have notes yet. Use "New" or jump into Workflow to create the first one.',
    recentEmptySidebar: 'No recent notes',
    sidebarNew: 'New',
    sidebarSearch: 'Search',
    sidebarCalendar: 'Calendar',
    sidebarWorkflow: 'Workflows',
    recents: 'Recent',
    aiDescription: 'Generate or edit quickly',
    searchDescription: 'Find notes and workflows',
    calendarDescription: 'See tasks by day',
    workflowDescription: 'Open the workspace',
    aiHello: 'Hi, I am Summus AI. How can I help today?',
    settings: 'Settings',
    logout: 'Logout',
    save: 'Save',
    cancel: 'Cancel',
    settingsTitle: 'Settings',
    settingsName: 'Name',
    settingsTheme: 'Theme',
    settingsLanguage: 'Language',
    settingsPlaceholderName: 'Your name',
  },
  es: {
    defaultUser: 'usuario',
    primarySurface: 'Superficie principal',
    heroHello: 'Hola',
    heroWelcome: 'bienvenido',
    heroBack: 'de vuelta',
    homeIntro:
      'Summus ahora sigue una dirección visual industrial y limpia. Entra en Workflow para abrir notas, organizar el calendario y moverte con menos ruido.',
    workflowCountLabel: 'workflows',
    workflows: 'Workflows',
    calendarEvents: 'Eventos del calendario',
    localTime: 'Hora local',
    latestSync: 'Última sync',
    noData: 'Sin datos',
    quickActions: 'Acciones rápidas',
    quickEntries: 'Entradas rápidas',
    recentNotes: 'Notas recientes',
    resumeWhere: 'Sigue donde lo dejaste',
    recentEmpty: 'Todavía no tienes notas. Usa "Nuevo" o entra en Workflow para crear la primera.',
    recentEmptySidebar: 'No hay notas recientes',
    sidebarNew: 'Nuevo',
    sidebarSearch: 'Buscar',
    sidebarCalendar: 'Calendario',
    sidebarWorkflow: 'Workflows',
    recents: 'Recientes',
    aiDescription: 'Generar o editar rápidamente',
    searchDescription: 'Encontrar notas y workflows',
    calendarDescription: 'Ver tareas por día',
    workflowDescription: 'Entrar en el área de trabajo',
    aiHello: 'Hola, soy Summus AI. ¿En qué puedo ayudarte hoy?',
    settings: 'Ajustes',
    logout: 'Salir',
    save: 'Guardar',
    cancel: 'Cancelar',
    settingsTitle: 'Ajustes',
    settingsName: 'Nombre',
    settingsTheme: 'Tema',
    settingsLanguage: 'Idioma',
    settingsPlaceholderName: 'Tu nombre',
  },
};

const CLOCK_MARKS = Array.from({ length: 12 }, (_, index) => index);
const PROFILE_NAMES_STORAGE_KEY = 'summusProfileNames';
const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const readStoredProfileNames = () => {
  try {
    const raw = localStorage.getItem(PROFILE_NAMES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};
const getStoredProfileName = (userKey) => {
  if (!userKey) return '';
  return readStoredProfileNames()[userKey] || '';
};
const saveStoredProfileName = (userKey, name) => {
  if (!userKey) return;
  const next = readStoredProfileNames();
  const trimmedName = name.trim();
  if (trimmedName) {
    next[userKey] = trimmedName;
  } else {
    delete next[userKey];
  }
  localStorage.setItem(PROFILE_NAMES_STORAGE_KEY, JSON.stringify(next));
};

function App() {
  const formatDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
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



  const [profileName, setProfileName] = useState(() => localStorage.getItem('displayName') || '');



  const [password, setPassword] = useState('');



  const [registerName, setRegisterName] = useState('');



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



  const [now, setNow] = useState(() => new Date());
  const today = now;
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
  const t = (key) => UI_TEXT[language]?.[key] ?? UI_TEXT.pt[key] ?? key;



  const [isSettingsOpen, setIsSettingsOpen] = useState(false);



  const [settingsName, setSettingsName] = useState('');







  const translatorInitRef = useRef(false);



  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {

    // ensure hidden container exists for Google Translate widget

    let container = document.getElementById('google_translate_container');

    if (!container) {

      container = document.createElement('div');

      container.id = 'google_translate_container';

      document.body.appendChild(container);

    }

    Object.assign(container.style, {
      position: 'fixed',
      left: '-9999px',
      top: '0',
      opacity: '0',
      pointerEvents: 'none',
    });

    const initializeTranslator = () => {
      if (!window.google?.translate) return;

      if (container.dataset.initialized !== 'true') {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'pt',
            includedLanguages: 'pt,en,es',
            autoDisplay: false,
          },
          'google_translate_container'
        );

        container.dataset.initialized = 'true';
      }

      setTranslatorReady(true);
    };



    if (translatorInitRef.current) return;

    translatorInitRef.current = true;



    // initialize callback expected by Google script

    window.googleTranslateElementInit = initializeTranslator;



    // load script once

    const existingScript = document.getElementById('google-translate-script');

    if (!existingScript) {

      const script = document.createElement('script');

      script.id = 'google-translate-script';

      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';

      script.async = true;

      script.addEventListener('load', initializeTranslator);

      document.body.appendChild(script);

      return () => script.removeEventListener('load', initializeTranslator);

    } else {

      // if script was already there, try to mark ready if translate is available

      if (window.google?.translate) initializeTranslator();

    }

    return undefined;

  }, []);



  useEffect(() => {

    // keep the source language stable for the translator widget

    const html = document.documentElement;

    if (html) html.setAttribute('lang', 'pt');

    document.body.dataset.language = language;



    // apply Google translation when ready

    let cancelled = false;
    let timeoutId = null;
    let attempts = 0;

    const applyTranslation = () => {
      if (cancelled) return;

      const select = document.querySelector('.goog-te-combo');

      if (!select) {
        attempts += 1;
        if (attempts < 12) {
          timeoutId = window.setTimeout(applyTranslation, 250);
        }
        return;
      }

      if (select.value !== language) {

        select.value = language;

        select.dispatchEvent(new Event('change'));

      }

    };



    if (translatorReady) {

      applyTranslation();

      return () => {
        cancelled = true;
        if (timeoutId) window.clearTimeout(timeoutId);
      };

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










  const API_URL = import.meta.env.DEV
    ? import.meta.env.VITE_API_URL || 'http://localhost:5000'
    : '/api';







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
    if (!text) return { __html: '' };
    let html = escapeHtml(text);
    html = html.replace(/\\sqrt\s*\{([^}]+)\}/g, 'v($1)');
    html = html.replace(/\\sqrt\s*\(([^)]+)\)/g, 'v($1)');
    html = html.replace(/\\sqrt/g, 'v');
    html = html.replace(/\\times/g, '×');
    html = html.replace(/\\approx/g, '˜');
    html = html.replace(/\\([0-9]+)/g, '$1');
    html = html.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, ' ');
    html = html.replace(/\\\*/g, '*');
    html = html.replace(/\$(.*?)\$/g, '$1');
    html = html.replace(/\{([^}]+)\}/g, '$1');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br/>');
    return { __html: html };
  };

  const isOfflineFallbackError = (err) =>
    !err?.response &&
    [
      err?.code === 'ERR_NETWORK',
      err?.code === 'ECONNABORTED',
      typeof err?.message === 'string' && err.message.toLowerCase().includes('network'),
      typeof err?.message === 'string' && err.message.toLowerCase().includes('timeout'),
    ].some(Boolean);








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



      try {



        const parsed = JSON.parse(storedNotes);



        const safeNotes = Array.isArray(parsed) ? parsed : [];



        const normalized = safeNotes.map((n, idx) => ({



          ...n,



          updatedAt: n.updatedAt || Date.now() - idx,



        }));



        setNotes(normalized);



        persistNotes(normalized);



        if (normalized.length > 0) {



          setCurrentNoteId(normalized[0].id);



          setNote(normalized[0].text);



        }



      } catch (err) {



        console.warn('Notes storage parse failed:', err?.message);



        localStorage.removeItem('notes');



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



      setProfileName(getStoredProfileName(storedUser || '') || localStorage.getItem('displayName') || '');



    }



  }, []);







  const handleLogin = async (e) => {



    e.preventDefault();



    setError('');



    try {



      const res = await api.post('/login', { username, password });



      localStorage.setItem('token', res.data.token);



      localStorage.setItem('username', username);



      const resolvedProfileName =
        res?.data?.name || getStoredProfileName(username) || profileName.trim();



      setProfileName(resolvedProfileName);



      localStorage.setItem('displayName', resolvedProfileName);



      saveStoredProfileName(username, resolvedProfileName);



      setIsLoggedIn(true);



      setView('home');



    } catch (err) {



      if (!isOfflineFallbackError(err)) {



        setError(err?.response?.data?.message || 'Não foi possível iniciar sessão.');



        return;



      }



      console.warn('Login offline fallback:', err?.message);



      const offlineToken = `local-${Date.now()}`;



      localStorage.setItem('token', offlineToken);



      localStorage.setItem('username', username || 'offline');



      const resolvedProfileName = getStoredProfileName(username || 'offline') || profileName.trim();



      setProfileName(resolvedProfileName);



      localStorage.setItem('displayName', resolvedProfileName);



      saveStoredProfileName(username || 'offline', resolvedProfileName);



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



      if (registerName.trim()) {



        saveStoredProfileName(username, registerName);



        setProfileName(registerName.trim());



        localStorage.setItem('displayName', registerName.trim());



      }



      setIsRegistering(false);



      alert('Account created! Now you can log in.');



    } catch (err) {



      if (registerName.trim()) {



        saveStoredProfileName(username, registerName);



        setProfileName(registerName.trim());



        localStorage.setItem('displayName', registerName.trim());



      }



      if (!isOfflineFallbackError(err)) {



        setError(err?.response?.data?.message || 'Não foi possível criar conta.');



        return;



      }



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



    setSettingsName(profileName || username || '');



    setIsSettingsOpen(true);



  };







  const closeSettings = () => {



    setIsSettingsOpen(false);



  };











  const colorPalette = ['#141414', '#1b1b1b', '#242424', '#2b201f', '#301814', '#1f2326', '#34302c'];







  const pickColor = () => colorPalette[Math.floor(Math.random() * colorPalette.length)];







  const previewText = (txt, limit = 120) => {



    if (!txt) return '';



    const clean = txt.trim();



    if (clean.length <= limit) return clean;



    return clean.slice(0, limit) + '...';



  };





  const quickActions = [
    {
      key: 'search',
      label: t('sidebarSearch'),


      description: t('searchDescription'),
      icon: 'SR',
      onClick: () => setView('search'),
    },
    {
      key: 'calendar',
      label: t('sidebarCalendar'),
      description: t('calendarDescription'),
      icon: 'CL',
      onClick: () => setView('calendar'),
    },
    {
      key: 'workflow',
      label: t('sidebarWorkflow'),
      description: t('workflowDescription'),
      icon: 'WF',
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
  const homeRecentList = sortedNotes.slice(0, 4);
  const totalCalendarEvents = Object.values(calendarEvents).reduce(
    (count, dayEvents) => count + normalizeDayEvents(dayEvents).length,
    0
  );
  const latestNoteTimestamp = sortedNotes[0]?.updatedAt || sortedNotes[0]?.id || null;
  const locale = language === 'pt' ? 'pt-PT' : language === 'es' ? 'es-ES' : 'en-US';
  const displayNameLabel = (profileName || username || t('defaultUser'))
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim();
  const heroLines = [t('heroHello'), displayNameLabel || t('defaultUser'), t('heroWelcome'), t('heroBack')];
  const loginClock = today.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const loginDate = today.toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
  const latestSyncValue = latestNoteTimestamp
    ? new Date(latestNoteTimestamp).toLocaleDateString(locale)
    : t('noData');
  const hourAngle = ((today.getHours() % 12) + today.getMinutes() / 60) * 30;
  const minuteAngle = (today.getMinutes() + today.getSeconds() / 60) * 6;



  const handleLogout = () => {



    localStorage.removeItem('token');



    localStorage.removeItem('username');



    localStorage.removeItem('displayName');



    setIsLoggedIn(false);



    setUsername('');



    setProfileName('');



    setPassword('');



    setNote('');



    setView('home');



  };

  const openNoteFromSummary = (item) => {
    const target = sortedNotes.find((note) => note.id === item.id);

    if (target) {
      openEditModal(target);
      setView('workflow');
      return;
    }

    setNote(item.text);
    setView('workflow');
  };







  if (!isLoggedIn) {



    return (



      <div className="login-container">



        <div className={`card auth-card ${view === 'workflow' ? 'workspace-card' : ''}`}>



          <div className="auth-kicker">Glyph Layer</div>



          <div className="auth-title-row">
            <h2>SUMMUS</h2>
            <span className="metric-accent">NOTHING MODE</span>
          </div>



          <div className="auth-copy">
            <p>{isRegistering ? 'Create a new account.' : 'Enter your credentials to access your workspace.'}</p>
            {error && <p className="small-note" style={{ color: '#ff6b6b' }}>{error}</p>}
          </div>



          <div className="auth-grid">
            <div className="auth-widget-board">
              <div className="auth-widget auth-widget-date">
                <span className="metric-label">Today</span>
                <strong className="auth-dot-display">{loginDate}</strong>
                <span className="auth-widget-copy">Nothing-style workspace entry point</span>
              </div>
              <div className="auth-widget auth-widget-orbit">
                <div className="auth-orbit">
                  <span className="auth-orbit-core" />
                </div>
                <span className="metric-label">Mode</span>
                <strong>{isRegistering ? 'Onboarding' : 'Access'}</strong>
              </div>
              <div className="auth-widget auth-widget-clock">
                <span className="metric-label">Clock</span>
                <strong className="auth-dot-display">{loginClock}</strong>
              </div>
            </div>



            <form className="auth-form auth-form-panel" onSubmit={isRegistering ? handleRegister : handleLogin}>



            {isRegistering && (
              <input
                className="auth-input"
                type="text"
                placeholder={t('settingsName')}
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                autoComplete="name"
                required
              />
            )}



            <input
              className="auth-input"



              type="text"



              placeholder="Username"



              value={username}



              onChange={(e) => setUsername(e.target.value)}



              required



            />



            <input
              className="auth-input"



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
          </div>



          <div className="auth-footer">
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



              <span className="sidebar-icon">NW</span>



              <span className="sidebar-text">{t('sidebarNew')}</span>



            </button>



            <button className="sidebar-action" onClick={() => setView('search')}>



              <span className="sidebar-icon">SR</span>



              <span className="sidebar-text">{t('sidebarSearch')}</span>



            </button>



            <button className="sidebar-action" onClick={() => setView('calendar')}>



              <span className="sidebar-icon">CL</span>



              <span className="sidebar-text">{t('sidebarCalendar')}</span>



            </button>



          </div>



          <div className="sidebar-section">



            <button className="sidebar-action" onClick={() => setView('workflow')}>



              <span className="sidebar-icon">WF</span>



              <span className="sidebar-text">{t('sidebarWorkflow')}</span>



            </button>



          </div>



          <div className="sidebar-section">



            <div className="sidebar-section-title">{t('recents')}</div>



            <div className="sidebar-scroll">



              {sidebarRecentList.length === 0 ? (



                <div className="sidebar-item" style={{ opacity: 0.6, cursor: 'default' }}>



                  <span className="sidebar-text">{t('recentEmptySidebar')}</span>



                </div>



              ) : (



                sidebarRecentList.map((item) => (



                  <button



                    key={item.id}



                    className="sidebar-item recent-item"



                    onClick={() => openNoteFromSummary(item)}



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



            {profileName || username || t('defaultUser')}



          </button>



              {isUserMenuOpen && isSidebarOpen && (



                <div className="sidebar-user-menu">



                  <button className="sidebar-user-menu-item" onClick={openSettings}>{t('settings')}</button>



                  <button className="sidebar-user-menu-item" onClick={handleLogout}>



                    {t('logout')}



                  </button>



                </div>



              )}



        </div>



      </aside>



      <div className="editor-wrapper">



        <main className="editor">



          <div className={`card app-shell app-shell-${view}`}>



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



              <div className="home-panel">
                <div className="home-grid">
                  <div className="home-hero">
                    <div className="home-hero-copy">
                      <div className="home-kicker">{t('primarySurface')}</div>
                      <h2>
                        {heroLines.map((line, index) => (
                          <span
                            key={`${line}-${index}`}
                            className="home-hero-line"
                            style={{ '--line-index': index }}
                          >
                            {line}
                          </span>
                        ))}
                      </h2>
                      <p>{t('homeIntro')}</p>
                      <div className="home-hero-meta">
                        <span className="home-hero-chip">{loginDate}</span>
                        <span className="home-hero-chip">
                          {sortedNotes.length.toString().padStart(2, '0')} {t('workflowCountLabel')}
                        </span>
                      </div>
                    </div>
                    <div className="home-hero-clock" aria-label={`${t('localTime')}: ${loginClock}`}>
                      <div className="home-hero-clock-face" aria-hidden="true">
                        {CLOCK_MARKS.map((mark) => (
                          <span
                            key={mark}
                            className="home-hero-clock-mark"
                            style={{ '--rotation': `${mark * 30}deg` }}
                          />
                        ))}
                        <span
                          className="home-hero-clock-hand home-hero-clock-hand-hour"
                          style={{ transform: `translateX(-50%) rotate(${hourAngle}deg)` }}
                        />
                        <span
                          className="home-hero-clock-hand home-hero-clock-hand-minute"
                          style={{ transform: `translateX(-50%) rotate(${minuteAngle}deg)` }}
                        />
                        <span className="home-hero-clock-center" />
                      </div>
                      <div className="home-hero-clock-readout">
                        <span className="home-hero-clock-label">{t('localTime')}</span>
                        <strong className="home-hero-clock-value">{loginClock}</strong>
                        <span className="home-hero-clock-date">{loginDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="home-metrics">
                    <div className="home-metric home-metric-workflows">
                      <span className="metric-label">{t('workflows')}</span>
                      <strong className="metric-value">{sortedNotes.length}</strong>
                    </div>
                    <div className="home-metric home-metric-calendar">
                      <span className="metric-label">{t('calendarEvents')}</span>
                      <strong className="metric-value">{totalCalendarEvents}</strong>
                    </div>
                    <div className="home-metric home-metric-clock">
                      <span className="metric-label">{t('localTime')}</span>
                      <strong className="metric-value">{loginClock}</strong>
                      <span className="metric-subvalue">{loginDate}</span>
                    </div>
                    <div className="home-metric home-metric-sync">
                      <span className="metric-label">{t('latestSync')}</span>
                      <strong className="metric-value">{latestSyncValue}</strong>
                    </div>
                  </div>
                </div>

                <div className="home-secondary-grid">
                  <section className="home-section">
                    <div className="home-section-header">
                      <span className="section-title">{t('quickActions')}</span>
                      <h3>{t('quickEntries')}</h3>
                    </div>

                    <div className="home-action-grid">
                      {quickActions.map((action) => (
                        <button
                          key={action.key}
                          className={`home-action-card home-action-${action.key}`}
                          style={{ '--action-index': action.key === 'ai' ? 0 : action.key === 'search' ? 1 : action.key === 'calendar' ? 2 : 3 }}
                          onClick={action.onClick}
                        >
                          <span className="home-action-icon">{action.icon}</span>
                          <div className="home-action-copy">
                            <div className="quick-title">{action.label}</div>
                            <div className="quick-desc">{action.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="home-section">
                    <div className="home-section-header">
                      <span className="section-title">{t('recentNotes')}</span>
                      <h3>{t('resumeWhere')}</h3>
                    </div>

                    <div className="home-recent-list">
                      {homeRecentList.length === 0 ? (
                        <div className="home-recent-empty">
                          {t('recentEmpty')}
                        </div>
                      ) : (
                        homeRecentList.map((item, index) => (
                          <button
                            key={item.id}
                            className="home-recent-item"
                            style={{ '--recent-index': index }}
                            onClick={() => openNoteFromSummary(item)}
                          >
                            <div className="home-recent-meta">
                              <span className="note-index">WF-{String(item.id).slice(-4)}</span>
                              <span className="note-meta">
                                {new Date(item.updatedAt || item.id).toLocaleDateString(locale)}
                              </span>
                            </div>
                            <div className="home-recent-title">{previewText(item.text, 92) || '(sem conteudo)'}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </div>



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



                        className={`quick-card quick-card-${action.key}`}



                        onClick={action.onClick}



                      >



                        <span className="quick-tag">NODE</span>



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



                  <div className="auth-kicker">Glyph Assistant</div>



                  <h2>Chat AI</h2>



                  <p>Conversa tipo ChatGPT dentro do Summus.</p>



                  <div className="ai-status">CHANNEL OPEN</div>



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







                    <div className="workflow-status">
                      <span className="workflow-pill">GRID {sortedNotes.length.toString().padStart(2, '0')}</span>
                      <span className="workflow-microcopy">Industrial board with modular cards</span>
                    </div>



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



                            '--note-tint': item.color || '#1b1b1b',



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



                                    <div className="note-card-topline">
                                      <span className="note-index">WF-{String(item.id).slice(-4)}</span>
                                      <span className="note-meta">
                                        {new Date(item.updatedAt || item.id).toLocaleDateString()}
                                      </span>
                                    </div>



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



                          {t('cancel')}



                        </button>



                        <button className="button" onClick={handleDraftCreate} disabled={!composerText.trim()}>



                          {t('save')}



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



              <h3>{t('settingsTitle')}</h3>



              <label className="settings-field">



                <span>{t('settingsName')}</span>



                <input



                  type="text"



                  value={settingsName}



                  onChange={(e) => setSettingsName(e.target.value)}



                  placeholder={t('settingsPlaceholderName')}



                />



              </label>



              <label className="settings-field">



                <span>{t('settingsTheme')}</span>



                <select value={theme} onChange={(e) => setTheme(e.target.value)}>



                  <option value="dark">Dark</option>



                  <option value="light">Light</option>



                </select>



              </label>



              <label className="settings-field">



                <span>{t('settingsLanguage')}</span>



                <select value={language} onChange={(e) => setLanguage(e.target.value)}>



                   <option value="pt">Português</option>



                  <option value="en">English</option>



                   <option value="es">Español</option>



                </select>



              </label>



              <div className="settings-actions">



                <button className="ghost-button" onClick={closeSettings}>{t('cancel')}</button>



                <button



                  className="button"



                  onClick={() => {

                    const trimmedName = settingsName.trim();

                    setProfileName(trimmedName);

                    localStorage.setItem('displayName', trimmedName);

                    saveStoredProfileName(username, trimmedName);

                    closeSettings();

                  }}

                >
                  {t('save')}
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

