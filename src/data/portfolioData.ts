export interface CapabilityItem {
  area: string;
  focus: string;
  detail: string;
}

export interface JourneyMilestone {
  index: string;
  title: string;
  phase: string;
  summary: string;
  highlights: string[];
  technologies: string[];
  accentHex: string;
}

export type ProjectCategory =
  | 'All'
  | 'AI & ML'
  | 'Software'
  | 'Android';

export type ProjectStatus = 'concept' | 'in-progress' | 'prototype' | 'completed';

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  categoryLabel: string;
  filterGroup: Exclude<ProjectCategory, 'All'>;
  year: string;
  status: ProjectStatus;
  statusLabel: string;
  featured?: boolean;
  image: string;
  gallery?: string[];
  summary: string;
  features: string[];
  stack: string[];
  problem: string;
  architecture: string;
  outcome: string;
  demoNotes: string;
  repoUrl?: string;
}

export interface ToolkitGroup {
  category: string;
  description: string;
  items: {
    name: string;
    level: 'Core' | 'Production' | 'Applied' | 'Exploring';
    ratio: number;
    note: string;
  }[];
}

export interface NowBuildingItem {
  id: string;
  title: string;
  area: string;
  progress: number;
  status: string;
  activeTasks: string[];
  upcoming: string;
}

export interface InterestItem {
  id: string;
  title: string;
  tag: string;
  description: string;
}

export interface CollaborativeBuild {
  title: string;
  badge: string;
  stack: string;
  summary: string;
}

export const PROFILE = {
  brand: 'Jashed',
  osName: 'JashedOS',
  fullName: 'Md. Ahsanul Haque Jashed',
  initials: 'AHJ',
  role: 'Software Engineer · Full-Stack Web, Android (Kotlin) & Applied AI Builder',
  education: 'Diploma in Computer Science & Technology (CST) · Chittagong Polytechnic Institute (Roll 881524)',
  location: 'Chittagong, Bangladesh (Remote & On-Site Ready)',
  email: 'jashed7118@gmail.com',
  phone: '01965447118',
  phoneHref: 'tel:+8801965447118',
  github: 'https://github.com/Jashedvai',
  facebook: 'https://www.facebook.com/md.jashed.1422409',
  instagram: 'https://www.instagram.com/john6260wick?fqnt=MW85OWJsNWNtdnZsYw==',
  instagramHandle: '@john6260wick',
  instagramQrPath: '/assets/aistudio/WhatsApp_Image_2026-11-20_at_8.08.29_PM_ad97a008.jpeg',
  // Real photos uploaded by Jashed
  portraitPath: '/assets/aistudio/WhatsApp_Image_2026-11-18_at_7.07.59_PM_8999fb4b.jpeg',
  portraitCampus: '/assets/aistudio/WhatsApp_Image_2026-11-18_at_7.07._PM_cba373a6.jpeg',
  portraitOutdoor: '/assets/aistudio/WhatsApp_Image_2026-11-18_at_7.07.59_PM_8999fb4b.jpeg',
  setupPhotoDark: '/assets/aistudio/image_009c7032.png',
  setupPhotoNeon: '/assets/aistudio/pc-pictures-x611uj0yk7e8y1ey_70298ab2.webp',
  roomRefIsometric: '/assets/aistudio/image_009c7032.png',
  roomRefStudio: '/assets/aistudio/image_009c7032.png',
  beyondImagePath: '/assets/aistudio/WhatsApp_Image_2026-11-18_at_7.07.59_PM_8999fb4b.jpeg',
  bioHeadline: 'Full-Stack Web, Android (Kotlin) & Applied AI Builder',
  bioLead:
    'Computer Science & Technology (CST) builder at Chittagong Polytechnic Institute with hands-on ownership across Django/React full-stack systems, native Android (Kotlin/Jetpack Compose), and applied computer vision pipelines—combining structured relational architecture with high-craft interactive interfaces.',
  philosophy:
    'Build honest, practical tools that solve real workflows—and never stop refining how software feels to touch and use.',
  focusAreas: [
    'Full-Stack Web & Relational Business Ledgers (Django · React · SQL)',
    'Native Android & Audio-Reactive Interfaces (Kotlin · Jetpack Compose · Media3)',
    'Applied Computer Vision & Edge AI (YOLOv8 · PaddleOCR · ONNX · OpenCV)',
    'Interactive 3D Web & Spatial Glassmorphism OS Experiences (Three.js)',
  ],
  differentiators: [
    {
      title: 'End-to-End Product Ownership',
      detail:
        'Taking ambiguous real-world problems—from observing daily pharmacy counter bottlenecks at Harinadighi to writing relational schemas, API routes, and polished UI—to concrete deliverables.',
    },
    {
      title: 'Transparent Engineering Rigor',
      detail:
        'Separating delivered codebases (StockPilot Phase 1, TriCode Nexus, Medicine Center UI) from active AI and mobile research prototypes with clear technical roadmaps.',
    },
    {
      title: 'Human-Centered & Bilingual Craft',
      detail:
        'Combining accessibility-first AI workflows (OCR/TTS overlays) and Bengali counter ergonomics with interactive Three.js 3D, React motion, and literary discipline (Ghum).',
    },
  ],
};

export const CAPABILITIES: CapabilityItem[] = [
  {
    area: 'Software',
    focus: 'Full-Stack Web & Ledgers',
    detail: 'Django, React, TypeScript, and relational SQLite/MySQL/Supabase platforms for real-world retail & campus operations.',
  },
  {
    area: 'Android',
    focus: 'Kotlin, Compose & Media3',
    detail: 'Offline-first counter apps, AccessibilityService overlays, and real-time sub-bass FFT audio visualizers.',
  },
  {
    area: 'Applied AI',
    focus: 'OCR, Detection & Vision',
    detail: 'YOLOv8 speech-bubble detection, PaddleOCR dialogue extraction, ONNX Runtime TTS, and OpenCV ink-mask preservation.',
  },
  {
    area: 'Creative 3D',
    focus: 'Three.js & Spatial UI',
    detail: 'Custom metallic hero sculptures, 3D developer studio rooms, ascending journey staircases, and glassmorphism OS design.',
  },
  {
    area: 'Product',
    focus: 'Independent Delivery',
    detail: 'Open to Software Engineering Internships, Junior Engineer, and Product Builder roles (Remote & On-Site Ready).',
  },
];

export const JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    index: '01',
    title: 'Early Curiosity',
    phase: 'Discovery',
    summary: 'Early curiosity about computers, operating systems, hardware internals, and how logic turns into interactive screens.',
    highlights: [
      'Exploring operating systems, hardware internals, and digital tools',
      'Curiosity about how logic turns into interactive screens',
      'First steps writing small scripts and troubleshooting systems',
    ],
    technologies: ['Logic', 'Hardware', 'CLI'],
    accentHex: '#38BDF8',
  },
  {
    index: '02',
    title: 'CST at CPI',
    phase: 'Academic Foundation',
    summary: 'Beginning Diploma in Computer Science & Technology (CST) at Chittagong Polytechnic Institute (Roll 881524).',
    highlights: [
      'Formal coursework in computer architecture, networking, and data structures',
      'Collaborative engineering labs across Chittagong Polytechnic Institute',
      'Building disciplined engineering habits from the ground up',
    ],
    technologies: ['CS Fundamentals', 'Networking', 'Data Structures'],
    accentHex: '#60A5FA',
  },
  {
    index: '03',
    title: 'OOP & Core Languages',
    phase: 'Fundamentals',
    summary: 'Mastering object-oriented programming and scripting fundamentals across Java, Python, and SQL.',
    highlights: [
      'Mastering loops, recursion, memory thinking, and object-oriented design',
      'Writing algorithmic problem solvers and structured relational models',
      'Debugging systematically rather than guessing',
    ],
    technologies: ['Java', 'Python', 'SQL'],
    accentHex: '#38BDF8',
  },
  {
    index: '04',
    title: 'TriCode Nexus',
    phase: 'Collaborative Build',
    summary: 'Co-engineered TriCode Nexus scientific calculator in a 3-member CST team using Java SE & Swing.',
    highlights: [
      'Decoupled trigonometry and expression evaluation engine from the UI layer',
      'Crafted an Apple-inspired #2C666E / #F0EDEE keypad layout',
      'First collaborative team software packaged with clean MVC boundaries',
    ],
    technologies: ['Java SE', 'Swing', 'Custom UI'],
    accentHex: '#2DD4BF',
  },
  {
    index: '05',
    title: 'Web & CPITimeline',
    phase: 'Frontend & Portals',
    summary: 'Exploring React, TypeScript, and building CPITimeline—a Bengali-first 7-department campus portal.',
    highlights: [
      'Built accessible Bengali-first campus news and academic routine indexing',
      'Covered all 7 Chittagong Polytechnic Institute engineering departments',
      'Mastered responsive Tailwind CSS, React state, and modern TypeScript',
    ],
    technologies: ['React', 'TypeScript', 'Tailwind CSS'],
    accentHex: '#38BDF8',
  },
  {
    index: '06',
    title: 'Android & Media3',
    phase: 'Mobile Craft',
    summary: 'Building native Android interfaces with Kotlin, Jetpack Compose, Media3 ExoPlayer FFT, and Flutter personalisation.',
    highlights: [
      'Integrated Android Media3 ExoPlayer with 20–160 Hz sub-bass FFT extraction',
      'Built NOVA Canvas Studio featuring Nothing, Cupertino, One UI & Ember themes',
      'Focused on fluid 60fps mobile UI and touch ergonomics',
    ],
    technologies: ['Kotlin', 'Jetpack Compose', 'Flutter'],
    accentHex: '#2DD4BF',
  },
  {
    index: '07',
    title: 'Applied Vision AI',
    phase: 'Intelligent Systems',
    summary: 'Designing PanelFlow AI V8 and panelcolour—combining YOLOv8, PaddleOCR, ONNX Runtime, and OpenCV.',
    highlights: [
      'Architected AccessibilityService floating overlay reading controls in PanelFlow AI',
      'Specified YOLOv8n bubble localization, reading-order sorting & ONNX TTS',
      'Designed OpenCV edge-masking in panelcolour to preserve crisp manga ink',
    ],
    technologies: ['YOLOv8', 'PaddleOCR', 'OpenCV'],
    accentHex: '#0A84FF',
  },
  {
    index: '08',
    title: 'Business Systems',
    phase: 'Real-World Software',
    summary: 'Building Sahen Sah J.H. Medicine Center app at Harinadighi and StockPilot Django inventory platform.',
    highlights: [
      'Replaced manual paper tally notebooks with 6-tab bilingual Bengali/English counter UI',
      'Engineered StockPilot Phase 1 Django backend with role-based auth & SQLite-to-MySQL schema',
      'Implemented live financial KPIs and 7-day MPAndroidChart analytics',
    ],
    technologies: ['Django', 'SQLite / MySQL', 'MPAndroidChart'],
    accentHex: '#60A5FA',
  },
  {
    index: '09',
    title: '3D Spatial Web',
    phase: 'Current Lab',
    summary: 'Uniting Three.js 3D architectural spaces, metallic AHJ sculptures, and Glassmorphism Virtual OS.',
    highlights: [
      'Built an interactive 14×16 ft (224 sq. ft.) sim-racing & developer studio with GSAP camera glide',
      'Crafted a Liquid Glass JashedOS featuring drag-to-snap windows & Web Audio FFT',
      'Designed the custom metallic AHJ 3D monogram and ascending staircase',
    ],
    technologies: ['Three.js', 'GSAP', 'Web Audio API'],
    accentHex: '#38BDF8',
  },
  {
    index: '10',
    title: 'Engineering Impact',
    phase: 'Next Horizon',
    summary: 'Open to Software Engineering Internships, Junior Engineer, and Product Builder roles shipping real products.',
    highlights: [
      'Shipping tested, production-ready web, Android, and applied AI software',
      'Deepening scalable backend architecture and edge ML optimization',
      'Collaborating with ambitious engineering teams globally',
    ],
    technologies: ['Full-Stack', 'Mobile', 'Applied AI'],
    accentHex: '#F59E0B',
  },
];

// Seven Core Project Showcase Cards aligned directly with Md. Ahsanul Haque Jashed's CV
export const PROJECTS: ProjectItem[] = [
  {
    id: 'panelflow-ai',
    title: 'PanelFlow AI',
    subtitle: 'AI-Powered Manga Reading Assistant · Sole Architect & Mobile Prototype Lead',
    categoryLabel: 'Applied AI · Android',
    filterGroup: 'AI & ML',
    year: '2026',
    status: 'in-progress',
    statusLabel: 'V8 UI Prototype & Pipeline',
    featured: true,
    image: '/assets/aistudio/WhatsApp_Image_2026-11-18_at_6.39.28_PM__4__cbf1e3fb.jpeg',
    gallery: [
      '/assets/aistudio/WhatsApp_Image_2026-11-18_at_6.39.28_PM__4__cbf1e3fb.jpeg',
    ],
    summary:
      'End-to-end Android reading assistant featuring a dark Command Center with one-tap AccessibilityService & Floating Overlay controls, supporting Gallery, PDF, and TXT libraries.',
    features: [
      'Dark Command Center with one-tap AccessibilityService and Floating Overlay controls',
      'Multi-format chapter ingestion supporting device Gallery images, PDF documents, and TXT files',
      'Offline-first inference pipeline: YOLOv8n bubble localization, reading-order sorting, PaddleOCR extraction, and ONNX Runtime TTS',
    ],
    stack: ['Kotlin', 'Jetpack Compose', 'YOLOv8', 'PaddleOCR', 'ONNX Runtime', 'OpenCV'],
    problem:
      'Reading dense manga and webtoon chapters on mobile lacks hands-free narration and reliable panel-by-panel speech-bubble ordering.',
    architecture:
      'Android AccessibilityService overlay paired with a modular offline pipeline combining YOLOv8n localization, manga/webtoon sorting, PaddleOCR, and ONNX TTS.',
    outcome:
      'V8 UI Prototype and end-to-end offline inference pipeline architecture completed.',
    demoNotes: 'Inspect the live V8 Command Center prototype screenshot in gallery.',
    repoUrl: 'https://github.com/Jashedvai',
  },
  {
    id: 'stockpilot',
    title: 'StockPilot',
    subtitle: 'Inventory & Business Management Platform · Full-Stack Developer',
    categoryLabel: 'Full-Stack Web',
    filterGroup: 'Software',
    year: '2026',
    status: 'in-progress',
    statusLabel: 'Phase 1 Codebase Delivered',
    featured: true,
    image: '/assets/aistudio/Screenshot_2026-11-21_205957_fbfe19f9.png',
    gallery: ['/assets/aistudio/Screenshot_2026-11-21_205957_fbfe19f9.png'],
    summary:
      'Executive retail management platform delivering a Phase 1 Django backend foundation with role-based access scaffolding, product catalog, vendor purchase, customer sales, and low-stock monitoring.',
    features: [
      'Delivered Phase 1 Django backend with secure user authentication, profile views, and role-based access scaffolding',
      'Live executive command center tracking BDT inventory retail value, cumulative sales revenue, cashflow, and Apple lineup stock valuation',
      'Relational schema designed for direct transition from SQLite in local dev to MySQL in multi-module production',
    ],
    stack: ['Python', 'Django', 'SQLite', 'MySQL', 'HTML5', 'CSS3', 'JavaScript'],
    problem:
      'Retail operators relying on scattered spreadsheets face stockouts, manual purchase errors, and lack role-controlled audit visibility.',
    architecture:
      'Normalized Django relational models engineered cleanly for local SQLite prototyping and multi-module MySQL production deployment.',
    outcome:
      'Phase 1 codebase delivered covering authentication, profiles, and executive inventory command center.',
    demoNotes: 'Authentic StockPilot Bangladesh Tech Retail Command Center screenshot shown in gallery.',
    repoUrl: 'https://github.com/Jashedvai',
  },
  {
    id: 'medicine-center-system',
    title: 'Sahen Sah J.H. Medicine Center',
    subtitle: 'Pharmacy Tally & Inventory App · Product Engineer & Android UI Developer',
    categoryLabel: 'Android · Business POS',
    filterGroup: 'Android',
    year: '2026',
    status: 'completed',
    statusLabel: 'Working UI & Analytics Prototype',
    image: '/assets/aistudio/WhatsApp_Image_2026-11-18_at_6.39.28_PM_1785be90.jpeg',
    gallery: ['/assets/aistudio/WhatsApp_Image_2026-11-18_at_6.39.28_PM_1785be90.jpeg'],
    summary:
      'Offline-first pharmacy operations app tailored to daily counter workflows at Harinadighi, replacing manual paper tally notebooks with bilingual Bengali/English analytics.',
    features: [
      'Live financial KPI cards (Total Sales, Total Profit, Avg Margin, Receivable Due) in BDT (Tk)',
      '7-Day Performance bar graph powered by MPAndroidChart and SQLite local persistence',
      'High-speed bilingual Bengali/English 6-tab counter navigation: Tally, Cashbox, Expenses, Billing, Customers, and Calculator',
    ],
    stack: ['Kotlin', 'Android', 'SQLite', 'MPAndroidChart'],
    problem:
      'Local pharmacy counters tracking daily sales and customer credit on paper notebooks cannot easily monitor real-time profit margins or 7-day trends.',
    architecture:
      'Offline-first Android SQLite transactional ledger linking counter billing directly to cashbox totals, dues, and MPAndroidChart rollups.',
    outcome:
      'Working UI & analytics prototype tailored to real daily pharmacy counter operations at Harinadighi.',
    demoNotes: 'Authentic bilingual pharmacy app screenshot shown in gallery.',
    repoUrl: 'https://github.com/Jashedvai',
  },
  {
    id: 'nova-canvas-studio',
    title: 'NOVA Canvas Studio',
    subtitle: 'OS-Inspired Personalisation Engine · Cross-Platform UI & State Architect',
    categoryLabel: 'Cross-Platform · Flutter',
    filterGroup: 'Android',
    year: '2026',
    status: 'prototype',
    statusLabel: 'Interactive Prototype',
    image: '/assets/aistudio/WhatsApp_Image_2026-11-18_at_6.39.28_PM__2__ff5f70e0.jpeg',
    gallery: ['/assets/aistudio/WhatsApp_Image_2026-11-18_at_6.39.28_PM__2__ff5f70e0.jpeg'],
    summary:
      'Interactive mobile lock-screen canvas with one-tap aesthetic preset switching across four system visual languages: Nothing dot-matrix, Cupertino frosted glass, One UI, and Ember.',
    features: [
      'Interactive live lock-screen canvas showing real-time clock typography, weather, step telemetry, calendar events, and notifications',
      'One-tap preset switching across Nothing dot-matrix, Cupertino frosted glass, One UI, and Ember',
      'Four modular theme editors (Theme, Canvas, Icons, Lock) with undo/redo history and Riverpod + Supabase sync architecture',
    ],
    stack: ['Flutter', 'Dart', 'Riverpod', 'Supabase', 'FastAPI'],
    problem:
      'Mobile personalisation scatters lock-screen typography, icon geometry, and wallpaper tokens across disconnected tools.',
    architecture:
      'Unified design-token engine structured around modular theme editors, undo/redo state history, and planned Riverpod + Supabase sync.',
    outcome:
      'Interactive prototype demonstrating instant cross-OS aesthetic language switching.',
    demoNotes: 'Inspect the Canvas Studio mobile prototype screenshot in gallery.',
    repoUrl: 'https://github.com/Jashedvai',
  },
  {
    id: 'ai-manga-colorizer',
    title: 'panelcolour',
    subtitle: 'Linework-Preserving AI Manga Colorizer · Computer Vision & Studio UI Designer',
    categoryLabel: 'Computer Vision · AI',
    filterGroup: 'AI & ML',
    year: '2026',
    status: 'prototype',
    statusLabel: 'UI Prototype & Vision Concept',
    image: '/assets/aistudio/WhatsApp_Image_2026-11-18_at_6.39.28_PM__3__ecd1b7f3.jpeg',
    gallery: [
      '/assets/aistudio/WhatsApp_Image_2026-11-18_at_6.39.28_PM__3__ecd1b7f3.jpeg',
    ],
    summary:
      'Creator studio organizing black-and-white manga panels by chapter with OpenCV edge-masking to isolate crisp ink strokes and screentones before style synthesis.',
    features: [
      'Chapter panel studio tracking Line Art Only vs. Colored status clearly',
      'OpenCV edge-masking pipeline isolating fine black ink strokes and screentones prior to shading',
      'Selectable Natural Painterly and Anime Cel Shading modes with character palette locking for cross-panel consistency',
    ],
    stack: ['Python', 'OpenCV', 'Android UI', 'Palette Locking'],
    problem:
      'Generic AI colorizers smudge fine manga pen work and drift character hair/clothing colors between consecutive pages.',
    architecture:
      'OpenCV edge-mask separation layered beneath style-conditioned shading modes and cross-panel character palette locks.',
    outcome:
      'UI Prototype & Vision Concept showcasing Awakening Panel 4 and Duet Sketch workflows.',
    demoNotes: 'Original studio UI mockup and shaded output shown in gallery.',
    repoUrl: 'https://github.com/Jashedvai',
  },
  {
    id: 'liquid-morph-player',
    title: 'Liquid Morph Music Player',
    subtitle: 'Real-Time Bass FFT Visualizer · Android & Audio Visualization Developer',
    categoryLabel: 'Android · Audio FFT',
    filterGroup: 'Android',
    year: '2026',
    status: 'prototype',
    statusLabel: 'Interactive UI & Starter Build',
    featured: true,
    image: '/assets/aistudio/WhatsApp_Image_2026-11-18_at_6.39.28_PM__1__7875892f.jpeg',
    gallery: ['/assets/aistudio/WhatsApp_Image_2026-11-18_at_6.39.28_PM__1__7875892f.jpeg'],
    summary:
      'Android Media3 ExoPlayer audio engine coupled with real-time Fast Fourier Transform (FFT) sub-bass extraction (20–160 Hz) driving four switchable shader visualizer modes.',
    features: [
      'Android Media3 ExoPlayer sessions integrated with real-time 20–160 Hz sub-bass FFT extraction',
      'Four switchable visual shader modes (LIQUID, FLOW, 3D, WAVE) driven by a live 0–100% Bass Energy slider',
      'Seamless playback from local device storage (+ ADD SONGS) and direct online audio stream URLs',
    ],
    stack: ['Kotlin', 'Jetpack Compose', 'Android Media3', 'FFT Audio'],
    problem:
      'Standard music players treat playback controls and real-time acoustic energy as separate experiences.',
    architecture:
      'Media3 ExoPlayer audio session analyzer extracting low-end FFT magnitudes to drive harmonic radial & fluid visualizers.',
    outcome:
      'Interactive UI & starter build—also recreated as a live interactive Web Audio FFT player inside JashedOS.',
    demoNotes: 'Click Launch Audio Player below to test the live FFT visualizer in JashedOS.',
    repoUrl: 'https://github.com/Jashedvai',
  },
  {
    id: 'tricode-nexus',
    title: 'TriCode Nexus Calculator',
    subtitle: 'Academic Team Build · Java SE, Swing & Custom Architectural UI',
    categoryLabel: 'Java SE · Software',
    filterGroup: 'Software',
    year: '2024',
    status: 'completed',
    statusLabel: 'Completed Team Build',
    image:
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 480'%3E%3Crect width='800' height='480' fill='%230F172A'/%3E%3Crect x='210' y='28' width='380' height='424' rx='24' fill='%232C666E' stroke='%23F0EDEE' stroke-opacity='0.25' stroke-width='2'/%3E%3Crect x='234' y='54' width='332' height='108' rx='14' fill='%23132A2E'/%3E%3Ctext x='254' y='88' fill='%2384E2D9' font-family='monospace' font-size='14'%3ETRICODE NEXUS · JAVA SE%3C/text%3E%3Ctext x='546' y='136' text-anchor='end' fill='%23F0EDEE' font-family='monospace' font-size='34' font-weight='bold'%3Esin(45%C2%B0) = 0.7071%3C/text%3E%3Crect x='234' y='182' width='74' height='54' rx='10' fill='%23F0EDEE'/%3E%3Ctext x='271' y='215' text-anchor='middle' fill='%23132A2E' font-family='monospace' font-size='16' font-weight='bold'%3Esin%3C/text%3E%3Crect x='320' y='182' width='74' height='54' rx='10' fill='%23F0EDEE'/%3E%3Ctext x='357' y='215' text-anchor='middle' fill='%23132A2E' font-family='monospace' font-size='16' font-weight='bold'%3Ecos%3C/text%3E%3Crect x='406' y='182' width='74' height='54' rx='10' fill='%23F0EDEE'/%3E%3Ctext x='443' y='215' text-anchor='middle' fill='%23132A2E' font-family='monospace' font-size='16' font-weight='bold'%3Etan%3C/text%3E%3Crect x='492' y='182' width='74' height='54' rx='10' fill='%230F766E'/%3E%3Ctext x='529' y='215' text-anchor='middle' fill='%23F0EDEE' font-family='monospace' font-size='18' font-weight='bold'%3EAC%3C/text%3E%3Crect x='234' y='250' width='332' height='176' rx='14' fill='%231A444A'/%3E%3Ctext x='400' y='324' text-anchor='middle' fill='%23F0EDEE' font-family='sans-serif' font-size='18' font-weight='bold'%3EDecoupled Java Swing Engine%3C/text%3E%3Ctext x='400' y='354' text-anchor='middle' fill='%23CBE7E9' font-family='monospace' font-size='13'%3E%232C666E Teal %C2%B7 %23F0EDEE Alabaster%3C/text%3E%3C/svg%3E",
    gallery: [
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 480'%3E%3Crect width='800' height='480' fill='%230F172A'/%3E%3Crect x='210' y='28' width='380' height='424' rx='24' fill='%232C666E' stroke='%23F0EDEE' stroke-opacity='0.25' stroke-width='2'/%3E%3Crect x='234' y='54' width='332' height='108' rx='14' fill='%23132A2E'/%3E%3Ctext x='254' y='88' fill='%2384E2D9' font-family='monospace' font-size='14'%3ETRICODE NEXUS · JAVA SE%3C/text%3E%3Ctext x='546' y='136' text-anchor='end' fill='%23F0EDEE' font-family='monospace' font-size='34' font-weight='bold'%3Esin(45%C2%B0) = 0.7071%3C/text%3E%3Crect x='234' y='182' width='74' height='54' rx='10' fill='%23F0EDEE'/%3E%3Ctext x='271' y='215' text-anchor='middle' fill='%23132A2E' font-family='monospace' font-size='16' font-weight='bold'%3Esin%3C/text%3E%3Crect x='320' y='182' width='74' height='54' rx='10' fill='%23F0EDEE'/%3E%3Ctext x='357' y='215' text-anchor='middle' fill='%23132A2E' font-family='monospace' font-size='16' font-weight='bold'%3Ecos%3C/text%3E%3Crect x='406' y='182' width='74' height='54' rx='10' fill='%23F0EDEE'/%3E%3Ctext x='443' y='215' text-anchor='middle' fill='%23132A2E' font-family='monospace' font-size='16' font-weight='bold'%3Etan%3C/text%3E%3Crect x='492' y='182' width='74' height='54' rx='10' fill='%230F766E'/%3E%3Ctext x='529' y='215' text-anchor='middle' fill='%23F0EDEE' font-family='monospace' font-size='18' font-weight='bold'%3EAC%3C/text%3E%3Crect x='234' y='250' width='332' height='176' rx='14' fill='%231A444A'/%3E%3Ctext x='400' y='324' text-anchor='middle' fill='%23F0EDEE' font-family='sans-serif' font-size='18' font-weight='bold'%3EDecoupled Java Swing Engine%3C/text%3E%3Ctext x='400' y='354' text-anchor='middle' fill='%23CBE7E9' font-family='monospace' font-size='13'%3E%232C666E Teal %C2%B7 %23F0EDEE Alabaster%3C/text%3E%3C/svg%3E",
    ],
    summary:
      'Scientific desktop calculator co-engineered in a 3-member CST team, cleanly decoupling a trigonometry and expression evaluation engine from an Apple-inspired #2C666E / #F0EDEE keypad.',
    features: [
      'Co-engineered in a 3-member Computer Science & Technology academic team',
      'Decoupled recursive expression & trigonometry evaluator from the Swing UI layer',
      'Custom Apple-inspired #2C666E teal & #F0EDEE alabaster tactile keypad architecture',
    ],
    stack: ['Java SE', 'Swing', 'Custom Architectural UI', 'Expression Parser'],
    problem:
      'Tightly coupled GUI calculator code becomes brittle when extending scientific functions and expression rules.',
    architecture:
      'Strict separation between the Java SE evaluation engine and custom Swing keypad components.',
    outcome:
      'Completed academic team release demonstrating modular OOP engineering.',
    demoNotes: 'Interactive CLI evaluation also available inside the JashedOS Terminal.',
    repoUrl: 'https://github.com/Jashedvai',
  },
];

export const COLLABORATIVE_BUILDS: CollaborativeBuild[] = [
  {
    title: 'CPITimeline — 7-Department Polytechnic Portal',
    badge: 'React · Bengali UI',
    stack: 'React, JavaScript, HTML5, CSS3, Bengali UI',
    summary:
      'Accessible Bengali-first campus news and academic routine portal indexing updates across all 7 Chittagong Polytechnic Institute engineering departments.',
  },
  {
    title: 'Applied Systems & Hardware Prototypes',
    badge: 'Systems R&D',
    stack: 'TallyKatha · Remote Mouse Controller · AuraOS',
    summary:
      'Prototyped an offline-first multi-branch accounting ledger blueprint (TallyKatha), an Android-to-Desktop wireless HID utility (Wi-Fi/Bluetooth), and focus analytics studies.',
  },
];

export const TOOLKIT_GROUPS: ToolkitGroup[] = [
  {
    category: 'Languages',
    description: 'Core programming languages used across web, Android, and AI systems.',
    items: [
      { name: 'Kotlin & Java', level: 'Production', ratio: 88, note: 'Android apps, Swing & OOP architecture' },
      { name: 'Python', level: 'Core', ratio: 88, note: 'Django backends, OpenCV & AI pipelines' },
      { name: 'TypeScript / JavaScript', level: 'Core', ratio: 90, note: 'React, Three.js, Vite & Node.js' },
      { name: 'Dart & SQL (HTML5/CSS3)', level: 'Production', ratio: 84, note: 'Flutter personalisation & relational schemas' },
    ],
  },
  {
    category: 'Web & Cross-Platform',
    description: 'Frameworks for full-stack interfaces, motion, and interactive 3D worlds.',
    items: [
      { name: 'React & Tailwind CSS', level: 'Core', ratio: 92, note: 'Glassmorphism OS, portals & dashboards' },
      { name: 'Django', level: 'Production', ratio: 82, note: 'StockPilot auth, RBAC & retail ledgers' },
      { name: 'Flutter & Riverpod', level: 'Applied', ratio: 78, note: 'NOVA Canvas Studio state architecture' },
      { name: 'Three.js & Framer Motion', level: 'Applied', ratio: 84, note: '3D rooms, staircases & metallic hero scenes' },
    ],
  },
  {
    category: 'Mobile & Applied AI',
    description: 'Native Android media/overlay services and edge computer vision.',
    items: [
      { name: 'Jetpack Compose & Media3', level: 'Production', ratio: 84, note: 'PanelFlow V8, ExoPlayer FFT visualizers' },
      { name: 'YOLOv8 & PaddleOCR', level: 'Applied', ratio: 78, note: 'Speech-bubble localization & text extraction' },
      { name: 'ONNX Runtime & OpenCV', level: 'Applied', ratio: 76, note: 'Offline edge TTS & ink-mask isolation' },
    ],
  },
  {
    category: 'Databases & Architecture',
    description: 'Offline-first persistence, API design, and role-based access.',
    items: [
      { name: 'SQLite & MySQL', level: 'Production', ratio: 86, note: 'Counter POS ledgers & multi-module scaling' },
      { name: 'Supabase & FastAPI', level: 'Applied', ratio: 76, note: 'Theme sync & REST inference services' },
      { name: 'Role-Based Auth & Offline-First', level: 'Production', ratio: 85, note: 'Resilient retail & mobile architectures' },
    ],
  },
];

export const PERSONAL_INTERESTS: InterestItem[] = [
  {
    id: 'ghum-writing',
    title: 'Literary Craft & Storytelling (Ghum)',
    tag: 'Creative Writing',
    description:
      'Exploring reflective Bengali & English prose, pacing, and atmospheric world-building through my writing discipline (Ghum).',
  },
  {
    id: 'manga-visuals',
    title: 'Manga, Linework & Visual Direction',
    tag: 'Visual Arts',
    description:
      'Studying monochrome ink composition, pacing across double-page spreads, and how AI tools can respect human linework rather than erase it.',
  },
  {
    id: 'audio-fft',
    title: 'Audio Synthesis & Reactive Visuals',
    tag: 'Sound & Shaders',
    description:
      'Experimenting with sub-bass FFT extraction, Web Audio oscillators, and fluid shaders that turn acoustic rhythm into tactile motion.',
  },
  {
    id: 'hardware-workspaces',
    title: 'Hardware R&D & Dark Studio Ergonomics',
    tag: 'Systems & Space',
    description:
      'Designing practical 12×10×9 ft dark tech studio layouts, wireless Android-to-PC HID controllers, and calm late-night coding setups.',
  },
];

export const NOW_BUILDING: NowBuildingItem[] = [
  {
    id: 'nb-panelflow',
    title: 'PanelFlow AI V8',
    area: 'Kotlin · YOLOv8 · PaddleOCR · ONNX',
    progress: 74,
    status: 'Active Development',
    activeTasks: [
      'Refining floating AccessibilityService overlay gesture stability across PDF & Gallery',
      'Improving YOLOv8n bubble ordering on double-page manga spreads',
    ],
    upcoming: 'Offline ONNX Runtime TTS caching & chapter bookmark sync',
  },
  {
    id: 'nb-stockpilot',
    title: 'StockPilot',
    area: 'Python · Django · SQLite / MySQL',
    progress: 62,
    status: 'Phase 1 Delivered',
    activeTasks: [
      'Expanding vendor purchase & customer sales ledgers onto MySQL schemas',
      'Refining low-stock reorder alerts inside the dark executive cockpit',
    ],
    upcoming: 'Multi-branch stock transfer logs & audit CSV exports',
  },
  {
    id: 'nb-workspace',
    title: 'JashedOS · AHJ 3D Studio',
    area: 'Three.js · GSAP · Glassmorphism OS',
    progress: 92,
    status: 'Polishing',
    activeTasks: [
      'Integrating metallic AHJ 3D monogram sculpture & apple-style glassmorphism OS',
      'Polishing drag-to-snap windows, 3D room navigation & mobile milestone cards',
    ],
    upcoming: 'Interactive live code previews inside Safari & Terminal',
  },
];

export const LEARNING_OBJECTIVES: string[] = [
  'Optimizing edge ONNX Runtime & PaddleOCR inference latency on mid-range Android devices',
  'Advancing Three.js PBR chrome shaders and GPU-friendly mobile spatial UIs',
  'Deepening Django/MySQL relational scaling and clean full-stack testing workflows',
];
