import path from 'path';
import fs from 'fs';
import { app } from 'electron';

function readLang(): string {
  try {
    const p = path.join(app.getPath('userData'), 'settings.json');
    const s = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return (s.language as string) || 'ru';
  } catch {
    return 'ru';
  }
}

// ── Welcome task (pinned, index 0) ───────────────────────────────────────────

const WELCOME_RU = {
  title: '👋 Добро пожаловать в toXo',
  subtasks: [
    'Открыть раздел Настройки',
    'Выбрать тему и язык',
    'Загрузить демо-данные (Данные → Загрузить тестовые данные)',
    'Перейти в Аналитику и посмотреть графики',
    'Открыть Финансы и добавить первый счёт',
    'Попробовать форматирование в этом описании',
    'Создать свою первую задачу (Ctrl+N)',
  ],
  description: `<h1>Добро пожаловать в <span style="color: #2082ff">toXo</span> 👋</h1><p>Умный менеджер задач с <strong>богатым редактором</strong>, напоминаниями, дедлайнами, аналитикой и учётом финансов — всё в одном окне.</p><h2>✍️ Форматирование текста</h2><p>Редактор поддерживает полноценное <strong>rich-text</strong> форматирование. Всё это доступно через тулбар над этим полем:</p><ul><li><p><strong>Жирный</strong> — <code>Ctrl+B</code></p></li><li><p><em>Курсив</em> — <code>Ctrl+I</code></p></li><li><p><s>Зачёркнутый</s> текст — кнопка <strong>S</strong> в тулбаре</p></li><li><p>Заголовки <strong>H1</strong>, <strong>H2</strong>, <strong>H3</strong> — кнопка <strong>A</strong> (размер шрифта)</p></li><li><p>Маркированные и нумерованные списки</p></li><li><p><code>Блоки кода</code> для технических заметок</p></li><li><p>Цитаты (blockquote) — для выделения важного</p></li><li><p>Сброс всего форматирования — кнопка <strong>T</strong> с крестиком</p></li></ul><h2>🎨 Цвета текста</h2><p>Выдели любое слово и нажми кнопку <strong>A</strong> с цветной подчёркивающей линией в тулбаре:</p><ul><li><p>Быстрые цвета в один клик</p></li><li><p>Расширенная палитра — через иконку сетки</p></li><li><p><span style="color: #ff453a">Красный</span>, <span style="color: #30d158">зелёный</span>, <span style="color: #ffd60a">жёлтый</span>, <span style="color: #bf5af2">фиолетовый</span>, <span style="color: #2082ff">синий</span> — и любой другой</p></li><li><p>Недавние цвета сохраняются автоматически</p></li><li><p>Добавляй цвета в <strong>Избранное</strong> (ПКМ на цвет → добавить)</p></li><li><p>Сброс цвета — иконка крестика в палитре</p></li></ul><h2>🔤 Шрифты</h2><p>Кнопка <strong>Авто</strong> в тулбаре открывает выбор шрифта:</p><ul><li><p><strong>Авто</strong> — системный шрифт по умолчанию</p></li><li><p><em>+ Добавить шрифт…</em> — введи название любого шрифта, установленного в системе (например: <code>Georgia</code>, <code>Courier New</code>, <code>Comic Sans MS</code>)</p></li><li><p>Добавленные шрифты сохраняются в списке</p></li></ul><h2>🗂 Разделы приложения</h2><ul><li><p><strong>Задачи</strong> — приоритеты (1–3), категории, теги, повторения, напоминания, дедлайны, подзадачи, архив</p></li><li><p><strong>Календарь</strong> — задачи по дням, перетаскивание дедлайнов прямо на дату</p></li><li><p><strong>Аналитика</strong> — графики продуктивности, серия дней, лучший день недели, статистика по категориям</p></li><li><p><strong>Финансы</strong> — счета, транзакции, бюджеты, цели накоплений, графики расходов</p></li><li><p><strong>Настройки</strong> — тема (тёмная / светлая), язык, звук уведомлений, экспорт / импорт данных</p></li></ul><h2>⌨️ Горячие клавиши</h2><ul><li><p><code>Ctrl+N</code> — новая задача</p></li><li><p><code>Ctrl+K</code> — командная палитра / глобальный поиск</p></li><li><p><code>Ctrl+Z</code> / <code>Ctrl+Y</code> — отмена / повтор действия</p></li><li><p><code>Ctrl+D</code> — дублировать задачу</p></li><li><p><code>Ctrl+P</code> — закрепить / открепить задачу</p></li><li><p><code>Ctrl+1</code> / <code>2</code> / <code>3</code> — установить приоритет</p></li><li><p><code>Delete</code> — удалить выбранную задачу</p></li><li><p><code>Escape</code> — закрыть / снять выделение</p></li></ul><h2>🔔 Уведомления</h2><p>Установи напоминание на любую задачу — кнопка <strong>Напоминание</strong> в редакторе. Приложение пришлёт системное уведомление в нужное время. Звук уведомления настраивается в <span style="color: #2082ff"><strong>Настройки → Уведомления</strong></span>.</p><blockquote><p>💡 <strong>Совет:</strong> Нажми на это поле прямо сейчас и попробуй любое форматирование — выдели слово, измени цвет, добавь заголовок!</p></blockquote>`,
};

const WELCOME_EN = {
  title: '👋 Welcome to toXo',
  subtasks: [
    'Open Settings',
    'Choose your theme and language',
    'Load demo data (Data → Load Demo Data)',
    'Go to Analytics and explore the charts',
    'Open Finance and add your first account',
    'Try text formatting in this description',
    'Create your first task (Ctrl+N)',
  ],
  description: `<h1>Welcome to <span style="color: #2082ff">toXo</span> 👋</h1><p>A smart task manager with a <strong>rich text editor</strong>, reminders, deadlines, analytics and finance tracking — all in one window.</p><h2>✍️ Text formatting</h2><p>The editor supports full <strong>rich-text</strong> formatting. Everything is available via the toolbar above this field:</p><ul><li><p><strong>Bold</strong> — <code>Ctrl+B</code></p></li><li><p><em>Italic</em> — <code>Ctrl+I</code></p></li><li><p><s>Strikethrough</s> — button <strong>S</strong> in the toolbar</p></li><li><p>Headings <strong>H1</strong>, <strong>H2</strong>, <strong>H3</strong> — via the font size button</p></li><li><p>Bulleted and numbered lists</p></li><li><p><code>Code blocks</code> for technical notes</p></li><li><p>Blockquotes — for highlighting important content</p></li><li><p>Clear all formatting — the <strong>T</strong> button with an ×</p></li></ul><h2>🎨 Text colors</h2><p>Select any word and click the <strong>A</strong> button with the colored underline in the toolbar:</p><ul><li><p>Quick color swatches in one click</p></li><li><p>Extended palette — via the grid icon</p></li><li><p><span style="color: #ff453a">Red</span>, <span style="color: #30d158">green</span>, <span style="color: #ffd60a">yellow</span>, <span style="color: #bf5af2">purple</span>, <span style="color: #2082ff">blue</span> — and any other color</p></li><li><p>Recent colors are saved automatically</p></li><li><p>Add colors to <strong>Favorites</strong> (right-click a color → add to favorites)</p></li><li><p>Reset color — the × icon inside the palette</p></li></ul><h2>🔤 Fonts</h2><p>The <strong>Auto</strong> button in the toolbar opens the font picker:</p><ul><li><p><strong>Auto</strong> — default system font</p></li><li><p><em>+ Add font…</em> — type the name of any font installed on your system (e.g. <code>Georgia</code>, <code>Courier New</code>, <code>Comic Sans MS</code>)</p></li><li><p>Added fonts are saved in the list for quick access</p></li></ul><h2>🗂 App sections</h2><ul><li><p><strong>Tasks</strong> — priorities (1–3), categories, tags, recurrence, reminders, deadlines, subtasks, archive</p></li><li><p><strong>Calendar</strong> — tasks by day, drag deadlines directly onto a date</p></li><li><p><strong>Analytics</strong> — productivity charts, day streak, best weekday, stats by category</p></li><li><p><strong>Finance</strong> — accounts, transactions, budgets, savings goals, expense charts</p></li><li><p><strong>Settings</strong> — theme (dark / light), language, notification sound, data export / import</p></li></ul><h2>⌨️ Keyboard shortcuts</h2><ul><li><p><code>Ctrl+N</code> — new task</p></li><li><p><code>Ctrl+K</code> — command palette / global search</p></li><li><p><code>Ctrl+Z</code> / <code>Ctrl+Y</code> — undo / redo</p></li><li><p><code>Ctrl+D</code> — duplicate task</p></li><li><p><code>Ctrl+P</code> — pin / unpin task</p></li><li><p><code>Ctrl+1</code> / <code>2</code> / <code>3</code> — set priority</p></li><li><p><code>Delete</code> — delete selected task</p></li><li><p><code>Escape</code> — close / deselect</p></li></ul><h2>🔔 Notifications</h2><p>Set a reminder on any task via the <strong>Reminder</strong> button in the editor. The app will send a system notification at the right time. The notification sound can be changed in <span style="color: #2082ff"><strong>Settings → Notifications</strong></span>.</p><blockquote><p>💡 <strong>Tip:</strong> Click this field right now and try any formatting — select a word, change its color, add a heading!</p></blockquote>`,
};

// ── Demo task definitions ────────────────────────────────────────────────────

export function getLang(): string { return readLang(); }

export interface DemoTask {
  title: string;
  titleEn?: string;
  description?: string;
  priority?: number;
  cat?: 'work' | 'personal' | 'learning' | 'health' | 'finance';
  is_done?: boolean;
  is_pinned?: boolean;
  is_archived?: boolean;
  tags?: string;
  daysAgo?: number;
  deadlineAhead?: number;
  recurrence?: string;
}

export const DEMO_TASKS: DemoTask[] = [
  // ── WORK ──────────────────────────────────────────────────────────────────
  {
    title: 'Подготовить презентацию Q4 для совета директоров', titleEn: 'Prepare Q4 board presentation',
    description: `<h2>Структура презентации</h2><ol><li><p>Финансовые результаты Q4</p></li><li><p>Ключевые метрики продукта</p></li><li><p>Планы на Q1 следующего года</p></li><li><p>Риски и митигация</p></li></ol><p><span style="color: #df5252"><strong>Дедлайн жёсткий</strong></span> — презентация нужна в пятницу до 10:00.</p><p>Использовать корпоративный шаблон из общего диска.</p>`,
    priority: 3, cat: 'work', daysAgo: 3, deadlineAhead: 2, tags: 'срочно,Q4',
  },
  {
    title: 'Провести код-ревью PR #247 — рефакторинг auth', titleEn: 'Code review PR #247 — auth refactor',
    description: `<p>Проверить:</p><ul><li><p>Корректность обработки JWT токенов</p></li><li><p>Защита от timing attacks</p></li><li><p>Тесты покрывают граничные случаи</p></li></ul><p>Ссылка на PR: <code>github.com/org/repo/pull/247</code></p>`,
    priority: 2, cat: 'work', daysAgo: 1, tags: 'code-review',
  },
  {
    title: 'Написать юнит-тесты для модуля авторизации', titleEn: 'Write unit tests for auth module',
    description: `<p>Покрыть следующие сценарии:</p><ul><li><p>Успешный логин / логаут</p></li><li><p>Истечение токена</p></li><li><p>Неверный пароль (rate limiting)</p></li><li><p>2FA flow</p></li></ul><p>Целевое покрытие: <strong>≥ 85%</strong></p>`,
    priority: 2, cat: 'work', daysAgo: 5, tags: 'тесты',
  },
  {
    title: 'Настроить CI/CD pipeline для нового сервиса', titleEn: 'Set up CI/CD pipeline for new service',
    description: `<h3>Шаги</h3><ol><li><p>Настроить GitHub Actions workflow</p></li><li><p>Добавить шаги lint → test → build → deploy</p></li><li><p>Настроить staging и production окружения</p></li><li><p>Добавить Slack-уведомления при деплое</p></li></ol><blockquote><p>Использовать Docker multi-stage build для оптимизации размера образа.</p></blockquote>`,
    priority: 3, cat: 'work', daysAgo: 2, deadlineAhead: 5, tags: 'devops',
  },
  {
    title: 'Мигрировать базу данных с SQLite на PostgreSQL', titleEn: 'Migrate database from SQLite to PostgreSQL',
    description: `<p><span style="color: #df5252"><strong>Важно:</strong></span> выполнять миграцию в период минимальной нагрузки (ночью).</p><h3>План миграции</h3><ol><li><p>Экспортировать данные в CSV</p></li><li><p>Поднять PostgreSQL через Docker</p></li><li><p>Запустить миграционные скрипты</p></li><li><p>Верифицировать integrity</p></li><li><p>Переключить connection string</p></li></ol>`,
    priority: 3, cat: 'work', daysAgo: 7, deadlineAhead: 10, tags: 'база-данных',
  },
  {
    title: 'Написать техническое задание для модуля отчётности', titleEn: 'Write technical spec for reporting module',
    description: `<p>ТЗ должно включать:</p><ul><li><p>User stories с acceptance criteria</p></li><li><p>Схему API endpoints</p></li><li><p>Wireframes основных экранов</p></li><li><p>Оценку сроков и ресурсов</p></li></ul>`,
    priority: 1, cat: 'work', daysAgo: 10, tags: 'документация',
  },
  {
    title: 'Провести аудит безопасности приложения', titleEn: 'Conduct application security audit',
    description: `<h2>Checklist</h2><ul><li><p>SQL injection</p></li><li><p>XSS / CSRF</p></li><li><p>Открытые порты и ненужные сервисы</p></li><li><p>Устаревшие зависимости (npm audit)</p></li><li><p>Secrets в репозитории</p></li></ul><p><span style="color: #df5252">Нужен внешний аудитор</span> для финального review.</p>`,
    priority: 3, cat: 'work', daysAgo: 1, deadlineAhead: 14, tags: 'безопасность',
  },
  {
    title: 'Создать дашборд для мониторинга метрик', titleEn: 'Build metrics monitoring dashboard',
    description: `<p>Использовать <strong>Grafana</strong> + <strong>Prometheus</strong>.</p><p>Метрики для отслеживания:</p><ul><li><p>Latency p50/p95/p99</p></li><li><p>Error rate</p></li><li><p>RPS (requests per second)</p></li><li><p>CPU / Memory usage</p></li></ul>`,
    priority: 2, cat: 'work', daysAgo: 4, tags: 'мониторинг',
  },
  {
    title: 'Оптимизировать медленные SQL-запросы', titleEn: 'Optimize slow SQL queries',
    description: `<p>Запросы из slow query log (> 500ms):</p><ul><li><p><code>SELECT * FROM tasks WHERE user_id = ?</code> — добавить индекс</p></li><li><p>Отчётный запрос за 90 дней — переписать с CTE</p></li></ul><p>Ожидаемый эффект: снижение latency на <span style="color: #22a861"><strong>60-70%</strong></span>.</p>`,
    priority: 2, cat: 'work', daysAgo: 6, tags: 'производительность',
  },
  {
    title: 'Интегрировать Stripe для обработки платежей', titleEn: 'Integrate Stripe for payment processing',
    description: `<p>Реализовать:</p><ul><li><p>Checkout Session для подписок</p></li><li><p>Webhook для обработки событий</p></li><li><p>Портал управления подпиской</p></li></ul><p>Документация: <code>stripe.com/docs</code></p>`,
    priority: 3, cat: 'work', daysAgo: 2, deadlineAhead: 21, tags: 'платежи',
  },
  {
    title: 'Обновить зависимости проекта до актуальных версий', titleEn: 'Update project dependencies to latest versions',
    description: `<p>Запустить <code>npm audit fix</code> и проверить changelog ключевых пакетов:</p><ul><li><p>React 18 → 19</p></li><li><p>TypeScript 5.3 → 5.4</p></li><li><p>Vite 5 → 6</p></li></ul>`,
    priority: 1, cat: 'work', daysAgo: 14, tags: 'обслуживание',
  },
  {
    title: 'Провести ретроспективу спринта #18', titleEn: 'Run sprint #18 retrospective',
    priority: 1, cat: 'work', daysAgo: 3, deadlineAhead: 1,
    description: `<p>Формат: <strong>What went well / What didn't / Action items</strong></p><p>Пригласить: команда разработки, продакт, дизайнер.</p>`,
  },
  {
    title: 'Написать скрипт резервного копирования БД', titleEn: 'Write database backup script',
    description: `<p>Требования:</p><ul><li><p>Ежедневный cron в 03:00</p></li><li><p>Загрузка в S3 с retention 30 дней</p></li><li><p>Уведомление в Slack при ошибке</p></li></ul>`,
    priority: 2, cat: 'work', daysAgo: 8,
  },
  {
    title: 'Написать changelog для версии 2.0', titleEn: 'Write changelog for v2.0',
    priority: 1, cat: 'work', daysAgo: 20, is_done: true,
    description: `<p>Включить в changelog:</p><ul><li><p>Новые функции</p></li><li><p>Breaking changes</p></li><li><p>Исправленные баги</p></li><li><p>Инструкцию по миграции</p></li></ul>`,
  },
  {
    title: 'Обновить документацию API (OpenAPI 3.1)', titleEn: 'Update API docs (OpenAPI 3.1)',
    priority: 1, cat: 'work', daysAgo: 12, tags: 'документация',
    description: `<p>Добавить недостающие endpoints:</p><ul><li><p><code>POST /api/v2/tasks/bulk</code></p></li><li><p><code>GET /api/v2/analytics/summary</code></p></li><li><p><code>DELETE /api/v2/account</code></p></li></ul>`,
  },
  {
    title: 'Провести встречу по планированию Q1', titleEn: 'Run Q1 planning meeting',
    priority: 2, cat: 'work', daysAgo: 1, deadlineAhead: 3,
    description: `<p>Повестка:</p><ol><li><p>Итоги Q4</p></li><li><p>Приоритеты на Q1</p></li><li><p>Распределение ресурсов</p></li></ol>`,
  },
  {
    title: 'Исправить баг с дублированием уведомлений', titleEn: 'Fix notification duplication bug',
    description: `<p><span style="color: #df5252"><strong>Критический баг</strong></span> — пользователи получают одно уведомление 2-3 раза.</p><p>Предположительная причина: race condition в scheduler.</p><p>Проверить: <code>notificationScheduler.ts</code> строки 30-55.</p>`,
    priority: 3, cat: 'work', daysAgo: 0, tags: 'баг',
  },
  {
    title: 'Настроить линтер ESLint + Prettier', titleEn: 'Set up ESLint + Prettier linter',
    priority: 1, cat: 'work', daysAgo: 30, is_done: true,
    description: `<p>Настроены правила для TypeScript, React hooks и импортов.</p>`,
  },
  {
    title: 'Подготовить onboarding-документ для новых разработчиков', titleEn: 'Write onboarding guide for new developers',
    priority: 1, cat: 'work', daysAgo: 15, tags: 'команда',
    description: `<p>Разделы:</p><ul><li><p>Настройка окружения разработки</p></li><li><p>Архитектура проекта</p></li><li><p>Git flow и naming conventions</p></li><li><p>Контакты и каналы коммуникации</p></li></ul>`,
  },
  {
    title: 'Провести собеседование senior backend разработчика', titleEn: 'Interview senior backend developer',
    priority: 2, cat: 'work', daysAgo: 2, deadlineAhead: 2,
    description: `<p>Вопросы для собеседования:</p><ul><li><p>Системный дизайн: спроектируй URL shortener</p></li><li><p>Алгоритмы: сортировка и поиск</p></li><li><p>Базы данных: нормализация, индексы</p></li></ul>`,
  },
  {
    title: 'Настроить автоматический деплой на staging', titleEn: 'Set up automatic staging deploy',
    priority: 2, cat: 'work', daysAgo: 9, is_done: true, tags: 'devops',
  },
  {
    title: 'Ответить на письма клиентов за эту неделю', titleEn: 'Reply to client emails this week',
    priority: 1, cat: 'work', daysAgo: 0, recurrence: 'weekly',
    description: `<p>Проверить почту и helpdesk. Время ответа не более <strong>24 часов</strong>.</p>`,
  },
  {
    title: 'Рефакторинг компонента TaskEditor', titleEn: 'Refactor TaskEditor component',
    priority: 1, cat: 'work', daysAgo: 18, tags: 'рефакторинг',
    description: `<p>Вынести логику в хуки, уменьшить размер компонента с 800 до ~300 строк.</p>`,
  },
  {
    title: 'Написать статью в tech blog команды', titleEn: 'Write article for team tech blog',
    priority: 1, cat: 'work', daysAgo: 25, deadlineAhead: 30,
    description: `<p>Тема: <strong>«Как мы снизили latency API на 70%»</strong></p><p>Включить: причину проблемы, решение, результаты, код-примеры.</p>`,
  },
  {
    title: 'Интегрировать аналитику Mixpanel', titleEn: 'Integrate Mixpanel analytics',
    priority: 2, cat: 'work', daysAgo: 5, tags: 'аналитика',
  },

  // ── PERSONAL ──────────────────────────────────────────────────────────────
  {
    title: 'Купить подарок на день рождения Антону', titleEn: 'Buy birthday gift for Anton',
    description: `<p>Антон любит настольные игры и технику. Бюджет: <span style="color: #22a861"><strong>3000–5000 ₽</strong></span>.</p><p>Идеи:</p><ul><li><p>Настольная игра «Колонизаторы»</p></li><li><p>Механическая клавиатура</p></li><li><p>Книга по программированию</p></li></ul>`,
    priority: 2, cat: 'personal', daysAgo: 1, deadlineAhead: 5, tags: 'подарок',
  },
  {
    title: 'Позвонить маме', titleEn: 'Call mom',
    priority: 2, cat: 'personal', daysAgo: 2, is_done: true, recurrence: 'weekly',
  },
  {
    title: 'Обновить загранпаспорт', titleEn: 'Renew international passport',
    description: `<p>Паспорт истекает через 3 месяца. Нужен для поездки в Европу в мае.</p><p>Документы:</p><ul><li><p>Заявление (форма П-1)</p></li><li><p>Старый паспорт</p></li><li><p>Фото 3.5×4.5 на белом фоне</p></li><li><p>Госпошлина 5000 ₽</p></li></ul><p>МФЦ на Ленинском пр. работает ��н-пт 9:00–20:00.</p>`,
    priority: 3, cat: 'personal', daysAgo: 5, deadlineAhead: 30, tags: 'документы',
  },
  {
    title: 'Купить новый монитор для работы из дома', titleEn: 'Buy new monitor for home office',
    description: `<h3>Критерии выбора</h3><ul><li><p>Диагональ: 27–32 дюйма</p></li><li><p>Разрешение: 2K или 4K</p></li><li><p>Матрица: IPS или OLED</p></li><li><p>Частота: 120+ Гц</p></li><li><p>Бюджет: до 40 000 ₽</p></li></ul><p>Кандидаты: <strong>LG 27GP950-B</strong>, <strong>Dell U2723QE</strong>, <strong>Samsung Odyssey G7</strong></p>`,
    priority: 2, cat: 'personal', daysAgo: 7, tags: 'техника',
  },
  {
    title: 'Организовать отпуск в Японии', titleEn: 'Plan Japan vacation',
    description: `<h2>Маршрут</h2><ol><li><p>Токио — 4 дня</p></li><li><p>Киото — 3 дня</p></li><li><p>Осака — 2 дня</p></li><li><p>Хиросима + Миядзима — 1 день</p></li></ol><h2>Что нужно сделать</h2><ul><li><p>Купить билеты (лучшие цены за 3+ месяца)</p></li><li><p>Оформить визу (срок 2-3 недели)</p></li><li><p>Забронировать отели и рёканы</p></li><li><p>Купить JR Pass</p></li></ul>`,
    priority: 1, cat: 'personal', daysAgo: 14, deadlineAhead: 120, tags: 'путешествие',
  },
  {
    title: 'Убраться в квартире генеральная уборка', titleEn: 'Deep clean the apartment',
    description: `<p>Чеклист:</p><ul><li><p>Помыть окна</p></li><li><p>Разобрать шкафы</p></li><li><p>Почистить холодильник</p></li><li><p>Пропылесосить за мебелью</p></li><li><p>Помыть плиту</p></li></ul>`,
    priority: 1, cat: 'personal', daysAgo: 3, recurrence: 'monthly',
  },
  {
    title: 'Записаться на техосмотр автомобиля', titleEn: 'Schedule car inspection',
    priority: 2, cat: 'personal', daysAgo: 8, deadlineAhead: 20, tags: 'авто',
  },
  {
    title: 'Установить NVMe SSD в ноутбук', titleEn: 'Install NVMe SSD in laptop',
    description: `<p>Купил Samsung 990 Pro 1TB. Нужно:</p><ol><li><p>Сделать резервную копию через Time Machine</p></li><li><p>Разобрать ноутбук (инструкция на iFixit)</p></li><li><p>Заменить диск</p></li><li><p>Восстановить систему</p></li></ol>`,
    priority: 2, cat: 'personal', daysAgo: 4, tags: 'техника',
  },
  {
    title: 'Обновить страховку ОСАГО', titleEn: 'Renew car insurance',
    priority: 2, cat: 'personal', daysAgo: 10, deadlineAhead: 15, tags: 'документы',
  },
  {
    title: 'Купить корм для кошки', titleEn: 'Buy cat food',
    priority: 1, cat: 'personal', daysAgo: 3, is_done: true,
  },
  {
    title: 'Переставить мебель в домашнем кабинете', titleEn: 'Rearrange home office furniture',
    description: `<p>Цель: улучшить освещение рабочего места и добавить места для книг.</p><p>Переставить: стол к окну, стеллаж на правую стену.</p>`,
    priority: 1, cat: 'personal', daysAgo: 20,
  },
  {
    title: 'Посетить концерт Massive Attack', titleEn: 'Attend Massive Attack concert',
    priority: 1, cat: 'personal', daysAgo: 2, deadlineAhead: 45, tags: 'развлечения',
    description: `<p>Билеты уже куплены! VIP-зона, ряд 3.</p><p>Концерт в Крокус Сити Холл, начало в 20:00.</p>`,
  },
  {
    title: 'Подписаться на домашний интернет 1 Гбит/с', titleEn: 'Subscribe to 1 Gbps home internet',
    priority: 2, cat: 'personal', daysAgo: 1,
    description: `<p>Сравнить предложения: <strong>Ростелеком</strong>, <strong>Билайн</strong>, <strong>МТС</strong>.</p><p>Критерии: скорость, цена, стабильность, срок установки.</p>`,
  },
  {
    title: 'Сдать вещи на химчистку', titleEn: 'Take clothes to dry cleaning',
    priority: 1, cat: 'personal', daysAgo: 5,
  },
  {
    title: 'Написать благодарственное письмо ментору', titleEn: 'Write thank-you letter to mentor',
    priority: 1, cat: 'personal', daysAgo: 0,
    description: `<p>Алексей очень помог с переходом в новую компанию. Написать искреннее письмо с конкретными примерами его помощи.</p>`,
  },
  {
    title: 'Купить велосипед для летних прогулок', titleEn: 'Buy bicycle for summer rides',
    priority: 1, cat: 'personal', daysAgo: 25, tags: 'спорт',
    description: `<p>Тип: городской или гибрид. Бюджет: <strong>25 000–40 000 ₽</strong>.</p><ul><li><p>Trek FX 3</p></li><li><p>Specialized Sirrus</p></li><li><p>Cube Travel</p></li></ul>`,
  },
  {
    title: 'Починить кран на кухне', titleEn: 'Fix kitchen faucet',
    priority: 2, cat: 'personal', daysAgo: 6,
    description: `<p>Кран капает ночью. Нужна прокладка или новый картридж. Посмотреть туториал на YouTube перед вызовом сантехника.</p>`,
  },
  {
    title: 'Сделать фотографии для документов', titleEn: 'Take ID photos',
    priority: 2, cat: 'personal', daysAgo: 8, deadlineAhead: 7,
  },
  {
    title: 'Разобрать гараж и выбросить лишнее', titleEn: 'Clean out garage and discard clutter',
    priority: 1, cat: 'personal', daysAgo: 40,
    description: `<p>Не разбирался 2 года. Нужен целый день. Взять мешки для мусора, позвать друга на помощь.</p>`,
  },
  {
    title: 'Обновить пароли во всех важных сервисах', titleEn: 'Update passwords in all important services',
    priority: 2, cat: 'personal', daysAgo: 12,
    description: `<p>Использовать <strong>Bitwarden</strong> для генерации и хранения. Включить 2FA везде, где возможно.</p><ul><li><p>Google, Apple ID</p></li><li><p>Банковские приложения</p></li><li><p>GitHub, GitLab</p></li><li><p>VPN сервис</p></li></ul>`,
  },

  // ── LEARNING ──────────────────────────────────────────────────────────────
  {
    title: 'Пройти курс по Rust (Rustlings + The Book)', titleEn: 'Complete Rust course (Rustlings + The Book)',
    description: `<h2>План обучения</h2><ol><li><p>The Rust Book (глав 1–10) — 2 недели</p></li><li><p>Rustlings упражнения — параллельно</p></li><li><p>Написать CLI-утилиту — 1 неделя</p></li><li><p>Async Rust (Tokio) — 1 неделя</p></li></ol><blockquote><p>Цель: уметь писать production-ready Rust код к лету.</p></blockquote>`,
    priority: 2, cat: 'learning', daysAgo: 10, deadlineAhead: 60, tags: 'rust,программирование',
  },
  {
    title: 'Изучить паттерны проектирования (GoF)', titleEn: 'Study design patterns (GoF)',
    description: `<h3>Категории</h3><ul><li><p><strong>Порождающие:</strong> Singleton, Factory, Builder, Prototype</p></li><li><p><strong>Структурные:</strong> Adapter, Decorator, Facade, Proxy</p></li><li><p><strong>Поведенческие:</strong> Observer, Strategy, Command, Iterator</p></li></ul><p>Для каждого паттерна — пример на TypeScript.</p>`,
    priority: 2, cat: 'learning', daysAgo: 20, tags: 'архитектура',
  },
  {
    title: 'Прочитать «Чистый код» (Роберт Мартин)', titleEn: 'Read "Clean Code" (Robert Martin)',
    description: `<p>Ключевые главы:</p><ul><li><p>Именование переменных и функций</p></li><li><p>Функции (принцип единственной ответственности)</p></li><li><p>Комментарии — когда нужны, а когда нет</p></li><li><p>Unit-тестирование и TDD</p></li></ul><p>Прогресс: <span style="color: #2082ff"><strong>глава 6 из 17</strong></span></p>`,
    priority: 2, cat: 'learning', daysAgo: 30, tags: 'книга',
  },
  {
    title: 'Пройти курс по системному дизайну', titleEn: 'Complete system design course',
    description: `<h2>Темы</h2><ul><li><p>CAP теорема и distributed systems</p></li><li><p>Load balancing</p></li><li><p>Caching (Redis, Memcached)</p></li><li><p>Message queues (Kafka, RabbitMQ)</p></li><li><p>Microservices vs Monolith</p></li></ul><p>Ресурс: <strong>«Designing Data-Intensive Applications»</strong> + Grokking System Design</p>`,
    priority: 3, cat: 'learning', daysAgo: 5, deadlineAhead: 90, tags: 'архитектура',
  },
  {
    title: 'Изучить Docker и Kubernetes', titleEn: 'Learn Docker and Kubernetes',
    description: `<p>Docker: контейнеры, volumes, networks, Docker Compose.</p><p>Kubernetes: pods, deployments, services, Helm charts.</p><p>Практика: задеплоить свой проект в кластер k3s.</p>`,
    priority: 2, cat: 'learning', daysAgo: 15, tags: 'devops',
  },
  {
    title: 'Прочитать «Прагматичный программист»', titleEn: 'Read "The Pragmatic Programmer"',
    priority: 2, cat: 'learning', daysAgo: 45, is_done: true, tags: 'книга',
    description: `<p>Отличная книга! Особенно полезны главы о DRY, orthogonality и tracer bullets.</p>`,
  },
  {
    title: 'Изучить GraphQL и Apollo Server', titleEn: 'Learn GraphQL and Apollo Server',
    description: `<p>Schema definition, resolvers, mutations, subscriptions.</p><p>Практика: переписать REST API одного сервиса на GraphQL.</p>`,
    priority: 2, cat: 'learning', daysAgo: 25, tags: 'backend',
  },
  {
    title: 'Ежедневно решать задачи на LeetCode', titleEn: 'Solve LeetCode problems daily',
    description: `<p>Фокус на:</p><ul><li><p>Arrays & Hashing</p></li><li><p>Two Pointers</p></li><li><p>Sliding Window</p></li><li><p>Binary Search</p></li></ul><p>Цель: <strong>50 задач</strong> за месяц. Текущий результат: <span style="color: #22a861">23/50</span></p>`,
    priority: 2, cat: 'learning', daysAgo: 0, recurrence: 'daily', tags: 'алгоритмы',
  },
  {
    title: 'Пройти курс английского языка B2→C1', titleEn: 'Complete English course B2→C1',
    description: `<p>Платформа: <strong>Preply</strong>, 3 урока в неделю.</p><p>Фокус на: business English, технические презентации, переговоры.</p>`,
    priority: 2, cat: 'learning', daysAgo: 20, deadlineAhead: 180, tags: 'английский',
  },
  {
    title: 'Изучить Figma для прототипирования', titleEn: 'Learn Figma for prototyping',
    description: `<p>Достаточно базового уровня: компоненты, auto-layout, прототипирование переходов.</p><p>Курс: Figma Masterclass на YouTube.</p>`,
    priority: 1, cat: 'learning', daysAgo: 35, tags: 'дизайн',
  },
  {
    title: 'Пройти AWS Certified Developer Associate', titleEn: 'Pass AWS Certified Developer Associate',
    description: `<h3>Темы экзамена</h3><ul><li><p>Lambda, API Gateway, DynamoDB</p></li><li><p>S3, CloudFront, Route 53</p></li><li><p>SQS, SNS, EventBridge</p></li><li><p>IAM, Cognito, KMS</p></li></ul><p>Подготовка: A Cloud Guru + Tutorials Dojo практика-тесты.</p>`,
    priority: 3, cat: 'learning', daysAgo: 3, deadlineAhead: 60, tags: 'aws,сертификация',
  },
  {
    title: 'Написать собственное расширение для VS Code', titleEn: 'Build custom VS Code extension',
    description: `<p>Идея: расширение для быстрого создания TODO-комментариев с тегами и поиском.</p><p>Технологии: <code>vscode</code> API, TypeScript, webpack.</p>`,
    priority: 1, cat: 'learning', daysAgo: 50, tags: 'проект',
  },
  {
    title: 'Изучить WebAssembly (WASM) на практике', titleEn: 'Learn WebAssembly (WASM) in practice',
    description: `<p>Скомпилировать Rust-модуль в WASM и использовать из браузера для обработки изображений.</p>`,
    priority: 2, cat: 'learning', daysAgo: 18, tags: 'rust,frontend',
  },
  {
    title: 'Прочитать «Designing Data-Intensive Applications»', titleEn: 'Read "Designing Data-Intensive Applications"',
    description: `<p>Ddia — одна из лучших книг о backend и distributed systems.</p><p>Главы:</p><ul><li><p>1-3: Надёжность, масштабируемость, обслуживаемость</p></li><li><p>4-6: Хранение данных и репликация</p></li><li><p>7-9: Распределённые транзакции и консенсус</p></li></ul><p>Прогресс: <span style="color: #2082ff"><strong>глава 4</strong></span></p>`,
    priority: 3, cat: 'learning', daysAgo: 8, tags: 'книга,архитектура',
  },
  {
    title: 'Написать статью о TypeScript Generics', titleEn: 'Write article on TypeScript Generics',
    priority: 1, cat: 'learning', daysAgo: 22, deadlineAhead: 30, tags: 'typescript,статья',
    description: `<p>Тема: продвинутые паттерны с generics — conditional types, mapped types, template literals.</p>`,
  },
  {
    title: 'Изучить Vim/Neovim', titleEn: 'Learn Vim/Neovim',
    priority: 1, cat: 'learning', daysAgo: 60, is_done: true,
    description: `<p>Выучил основные движения, текстовые объекты и базовые команды. Теперь использую daily.</p>`,
  },
  {
    title: 'Пройти курс по Machine Learning (fast.ai)', titleEn: 'Complete Machine Learning course (fast.ai)',
    description: `<p>Практический подход: сначала код, потом теория.</p><ul><li><p>Глава 1: Image classification</p></li><li><p>Глава 2: Deployment</p></li><li><p>Глава 3: Data ethics</p></li></ul>`,
    priority: 1, cat: 'learning', daysAgo: 40, tags: 'ml,python',
  },
  {
    title: 'Прочитать «The Manager\'s Path» (Camille Fournier)', titleEn: 'Read "The Manager\'s Path" (Camille Fournier)',
    priority: 1, cat: 'learning', daysAgo: 55, tags: 'книга,менеджмент',
    description: `<p>Книга о карьерном росте от инженера к tech lead и далее. Очень полезна для понимания перехода в management.</p>`,
  },
  {
    title: 'Изучить криптографию (практический курс)', titleEn: 'Study cryptography (practical course)',
    priority: 1, cat: 'learning', daysAgo: 28, tags: 'безопасность',
    description: `<p>Ресурс: Coursera — «Cryptography I» от Dan Boneh (Stanford).</p><p>Темы: симметричное/асимметричное шифрование, хэши, PKI.</p>`,
  },
  {
    title: 'Написать собственный компилятор для мини-языка', titleEn: 'Build your own compiler for a mini-language',
    priority: 1, cat: 'learning', daysAgo: 70, tags: 'компиляторы,проект',
    description: `<p>Шаги: лексер → парсер (AST) → семантический анализ → кодогенерация.</p><p>Язык реализации: <strong>TypeScript</strong>. Целевой: простой стековый язык.</p>`,
  },

  // ── HEALTH ────────────────────────────────────────────────────────────────
  {
    title: 'Записаться к стоматологу на плановый осмотр', titleEn: 'Schedule dental check-up',
    description: `<p><span style="color: #df5252">Последний раз был год назад</span> — пора на профилактику.</p><p>Клиника «Белая улыбка», тел: +7 (495) 123-45-67.</p><p>Записаться на первую половину дня.</p>`,
    priority: 3, cat: 'health', daysAgo: 4, deadlineAhead: 14, tags: 'врач',
  },
  {
    title: 'Сдать общий анализ крови и биохимию', titleEn: 'Get blood test and biochemistry panel',
    description: `<p>Натощак, после 8-часового голодания.</p><p>Показатели для контроля: <strong>витамин D</strong>, <strong>ферритин</strong>, <strong>тиреотропный гормон</strong>, <strong>глюкоза</strong>.</p>`,
    priority: 2, cat: 'health', daysAgo: 6, deadlineAhead: 21, tags: 'анализы',
  },
  {
    title: 'Купить абонемент в спортзал', titleEn: 'Buy gym membership',
    priority: 2, cat: 'health', daysAgo: 14, is_done: true, tags: 'спорт',
    description: `<p>Выбрал World Class рядом с офисом. Безлимитный на год.</p>`,
  },
  {
    title: 'Выпивать 2 литра воды в день', titleEn: 'Drink 2 liters of water daily',
    priority: 1, cat: 'health', daysAgo: 0, recurrence: 'daily',
    description: `<p>Установить напоминание каждые 2 часа. Купить термос для офиса.</p>`,
  },
  {
    title: 'Утренняя зарядка 30 минут', titleEn: '30-minute morning workout',
    description: `<p>Программа:</p><ul><li><p>5 мин — разминка суставов</p></li><li><p>15 мин — кардио (прыжки, бёрпи)</p></li><li><p>10 мин — растяжка</p></li></ul><p>Время: <strong>07:30</strong>. Трекай в журнале справа.</p>`,
    priority: 2, cat: 'health', daysAgo: 0, recurrence: 'daily',
  },
  {
    title: 'Лечь спать до 23:00', titleEn: 'Be in bed by 11 PM',
    priority: 1, cat: 'health', daysAgo: 0, recurrence: 'daily',
    description: `<p>Телефон класть на зарядку в другую комнату за 30 минут до сна. Blue light блокер включать с 21:00.</p>`,
  },
  {
    title: 'Проверить зрение у офтальмолога', titleEn: 'Get eye exam at ophthalmologist',
    priority: 2, cat: 'health', daysAgo: 9, deadlineAhead: 30, tags: 'врач',
    description: `<p>Последний раз проверял 2 года назад. Стало хуже видно вдаль. Нужны новые очки или линзы.</p>`,
  },
  {
    title: 'Купить витамин D3 + K2', titleEn: 'Buy vitamin D3 + K2',
    priority: 1, cat: 'health', daysAgo: 2,
    description: `<p>Дозировка по рекомендации врача: D3 2000 МЕ + K2 100 мкг. Iherb или местная аптека.</p>`,
  },
  {
    title: 'Пройти плановый осмотр у терапевта', titleEn: 'Get annual GP check-up',
    priority: 2, cat: 'health', daysAgo: 5, deadlineAhead: 45, tags: 'врач',
  },
  {
    title: 'Медитация 10 минут каждое утро', titleEn: '10-minute morning meditation',
    priority: 1, cat: 'health', daysAgo: 0, recurrence: 'daily',
    description: `<p>Приложение: <strong>Headspace</strong> или <strong>Insight Timer</strong>. Техника: focused attention на дыхании.</p>`,
  },
  {
    title: 'Пройти курс физиотерапии для спины', titleEn: 'Complete physiotherapy course for back',
    description: `<p>После долгой сидячей работы появились боли в пояснице. Курс: <strong>10 сеансов</strong> через день.</p><p>Упражнения для дома: планка, кошка-корова, мост.</p>`,
    priority: 2, cat: 'health', daysAgo: 3, deadlineAhead: 21, tags: 'реабилитация',
  },
  {
    title: 'Купить эргономичное кресло для рабочего места', titleEn: 'Buy ergonomic office chair',
    description: `<p>Варианты:</p><ul><li><p><strong>Herman Miller Aeron</strong> — топ, дорого (~100к)</p></li><li><p><strong>HM Sayl</strong> — хорошее соотношение цена/качество</p></li><li><p><strong>Hara Chair</strong> — российский аналог</p></li></ul>`,
    priority: 2, cat: 'health', daysAgo: 11, tags: 'оборудование',
  },
  {
    title: 'Уменьшить потребление кофе до 2 чашек в день', titleEn: 'Reduce coffee intake to 2 cups a day',
    priority: 1, cat: 'health', daysAgo: 7, recurrence: 'weekly',
    description: `<p>Сейчас пью 4-5 чашек. Заменять вечерний кофе на зелёный чай или матча.</p>`,
  },
  {
    title: 'Записаться на спортивный массаж', titleEn: 'Book sports massage',
    priority: 1, cat: 'health', daysAgo: 13,
  },
  {
    title: 'Проверить артериальное давление', titleEn: 'Check blood pressure',
    priority: 1, cat: 'health', daysAgo: 15, is_done: true,
    description: `<p>Результат: 118/76. Норма. ✓</p>`,
  },

  // ── FINANCE ───────────────────────────────────────────────────────────────
  {
    title: 'Составить бюджет на следующий квартал', titleEn: 'Create budget for next quarter',
    description: `<h2>Категории бюджета</h2><ul><li><p><span style="color: #22a861"><strong>Доходы:</strong></span> зарплата, фриланс, инвестиции</p></li><li><p><span style="color: #df5252"><strong>Расходы:</strong></span> аренда, еда, транспорт, развлечения</p></li><li><p><span style="color: #2082ff"><strong>Сбережения:</strong></span> цель — 20% от дохода</p></li></ul><blockquote><p>Правило: сначала платить себе, потом тратить.</p></blockquote>`,
    priority: 3, cat: 'finance', daysAgo: 2, deadlineAhead: 7, tags: 'бюджет',
  },
  {
    title: 'Проверить и отменить лишние подписки', titleEn: 'Review and cancel unnecessary subscriptions',
    description: `<p>Активные подписки для проверки:</p><ul><li><p>Netflix — 799 ₽/мес</p></li><li><p>Spotify — 199 ₽/мес</p></li><li><p>Adobe CC — 2990 ₽/мес <span style="color: #df5252">(отменить?)</span></p></li><li><p>ChatGPT Plus — 1900 ₽/мес</p></li><li><p>VPN — 399 ₽/мес</p></li></ul><p>Итого: ~6287 ₽/мес. Можно оптимизировать до ~3000 ₽.</p>`,
    priority: 2, cat: 'finance', daysAgo: 5, tags: 'подписки',
  },
  {
    title: 'Подать налоговую декларацию 3-НДФЛ', titleEn: 'File tax return',
    priority: 3, cat: 'finance', daysAgo: 1, deadlineAhead: 30, tags: 'налоги',
    description: `<p>Оформить вычет за:</p><ul><li><p>Обучение (курсы + репетитор)</p></li><li><p>Лечение (стоматолог)</p></li></ul><p>Через Госуслуги или личный кабинет налогоплательщика.</p>`,
  },
  {
    title: 'Перевести деньги на ИИС тип Б', titleEn: 'Transfer funds to investment account',
    priority: 2, cat: 'finance', daysAgo: 10, is_done: true,
    description: `<p>Внёс 400 000 ₽. Купил: 60% ОФЗ + 40% ETF на российские акции.</p>`,
  },
  {
    title: 'Пополнить инвестиционный портфель', titleEn: 'Top up investment portfolio',
    description: `<p>Ежемесячное пополнение: <strong>30 000 ₽</strong></p><p>Распределение:</p><ul><li><p>50% — ETF на S&P 500 (SBSP)</p></li><li><p>30% — Облигации (ОФЗ-ПД)</p></li><li><p>20% — Золото (TGLD)</p></li></ul>`,
    priority: 2, cat: 'finance', daysAgo: 3, recurrence: 'monthly', tags: 'инвестиции',
  },
  {
    title: 'Сравнить условия ипотеки в разных банках', titleEn: 'Compare mortgage terms across banks',
    priority: 1, cat: 'finance', daysAgo: 20, tags: 'ипотека',
    description: `<p>Сравнить: <strong>Сбер</strong>, <strong>ВТБ</strong>, <strong>Альфа</strong>, <strong>Т-Банк</strong>.</p><p>Параметры: ставка, первоначальный взнос, срок, досрочное погашение.</p>`,
  },
  {
    title: 'Провести аудит расходов за прошлый квартал', titleEn: 'Audit last quarter expenses',
    priority: 2, cat: 'finance', daysAgo: 7, tags: 'аудит',
    description: `<p>Выгрузить выписки из банков и категоризировать расходы.</p><p>Найти статьи, где превышен бюджет.</p>`,
  },
  {
    title: 'Настроить автоплатежи по всем регулярным счетам', titleEn: 'Set up autopayments for all regular bills',
    priority: 1, cat: 'finance', daysAgo: 30,
    description: `<p>ЖКХ, интернет, телефон — всё настроить через Сбербанк Онлайн. Больше не пропускать платежи.</p>`,
  },
  {
    title: 'Открыть накопительный счёт с высоким процентом', titleEn: 'Open high-yield savings account',
    priority: 2, cat: 'finance', daysAgo: 9,
    description: `<p>Цель: экстренный фонд на 6 месяцев расходов.</p><p>Лучшие предложения: Сбер (~15% годовых), Т-Банк (~15.5%).</p>`,
  },
  {
    title: 'Купить ETF на индекс Мосбиржи', titleEn: 'Buy Moscow Exchange index ETF',
    priority: 1, cat: 'finance', daysAgo: 18, tags: 'инвестиции',
    description: `<p>Рассмотреть: <strong>TMOS</strong> (Т-Банк) или <strong>EQMX</strong> (ВТБ).</p><p>Покупать ежемесячно фиксированную сумму — стратегия dollar-cost averaging.</p>`,
  },
];

// ── Public API ───────────────────────────────────────────────────────────────

export function getWelcomeTask() {
  const lang = readLang();
  return lang === 'en' ? WELCOME_EN : WELCOME_RU;
}

export function getDemoCategories() {
  const en = readLang() === 'en';
  return {
    work:     en ? 'Work'     : 'Работа',
    personal: en ? 'Personal' : 'Личное',
    learning: en ? 'Learning' : 'Обучение',
    health:   en ? 'Health'   : 'Здоровье',
    finance:  en ? 'Finance'  : 'Финансы',
  };
}

export function getFinanceDemoData() {
  const en = readLang() === 'en';
  return {
    accounts: en ? [
      { name: 'Main Card',        type: 'bank',    balance: 85400,  currency: 'USD', color: '#0a84ff' },
      { name: 'Cash',             type: 'cash',    balance: 1200,   currency: 'USD', color: '#30d158' },
      { name: 'Savings Account',  type: 'savings', balance: 24000,  currency: 'USD', color: '#bf5af2' },
    ] : [
      { name: 'Основная карта',  type: 'bank',    balance: 85400,  currency: 'RUB', color: '#0a84ff' },
      { name: 'Наличные',        type: 'cash',    balance: 12000,  currency: 'RUB', color: '#30d158' },
      { name: 'Накопительный',   type: 'savings', balance: 240000, currency: 'RUB', color: '#bf5af2' },
    ],
    categories: en ? [
      { name: 'Salary',               type: 'income',  color: '#30d158', icon: '💰' },
      { name: 'Freelance',            type: 'income',  color: '#0a84ff', icon: '💻' },
      { name: 'Groceries',            type: 'expense', color: '#ff9f0a', icon: '🛒' },
      { name: 'Cafes & Restaurants',  type: 'expense', color: '#ff6b6b', icon: '☕' },
      { name: 'Transport',            type: 'expense', color: '#64d2ff', icon: '🚇' },
      { name: 'Housing',              type: 'expense', color: '#bf5af2', icon: '🏠' },
      { name: 'Health',               type: 'expense', color: '#ff453a', icon: '💊' },
      { name: 'Entertainment',        type: 'expense', color: '#ffd60a', icon: '🎮' },
      { name: 'Clothing',             type: 'expense', color: '#ff9f0a', icon: '👔' },
      { name: 'Education',            type: 'expense', color: '#5e5ce6', icon: '📚' },
    ] : [
      { name: 'Зарплата',             type: 'income',  color: '#30d158', icon: '💰' },
      { name: 'Фриланс',              type: 'income',  color: '#0a84ff', icon: '💻' },
      { name: 'Продукты',             type: 'expense', color: '#ff9f0a', icon: '🛒' },
      { name: 'Кафе и рестораны',     type: 'expense', color: '#ff6b6b', icon: '☕' },
      { name: 'Транспорт',            type: 'expense', color: '#64d2ff', icon: '🚇' },
      { name: 'Жильё',                type: 'expense', color: '#bf5af2', icon: '🏠' },
      { name: 'Здоровье',             type: 'expense', color: '#ff453a', icon: '💊' },
      { name: 'Развлечения',          type: 'expense', color: '#ffd60a', icon: '🎮' },
      { name: 'Одежда',               type: 'expense', color: '#ff9f0a', icon: '👔' },
      { name: 'Обучение',             type: 'expense', color: '#5e5ce6', icon: '📚' },
    ],
    // catIdx: index into categories array above (0=salary,1=freelance,2=groceries,3=cafe,4=transport,5=housing,6=health,7=entertainment,8=clothing,9=education)
    // accIdx: index into accounts array (0=main,1=cash,2=savings)
    transactions: en ? [
      { type: 'income',  amount: 5800,  catIdx: 0, accIdx: 0, daysBack: 28, title: 'March salary' },
      { type: 'income',  amount: 1800,  catIdx: 1, accIdx: 0, daysBack: 20, title: 'Freelance: landing page' },
      { type: 'income',  amount: 900,   catIdx: 1, accIdx: 0, daysBack: 8,  title: 'Freelance: API integration' },
      { type: 'expense', amount: 240,   catIdx: 2, accIdx: 0, daysBack: 27, title: 'Supermarket' },
      { type: 'expense', amount: 310,   catIdx: 2, accIdx: 0, daysBack: 20, title: 'Whole Foods' },
      { type: 'expense', amount: 195,   catIdx: 2, accIdx: 1, daysBack: 13, title: 'Farmers market' },
      { type: 'expense', amount: 255,   catIdx: 2, accIdx: 0, daysBack: 6,  title: 'Grocery store' },
      { type: 'expense', amount: 140,   catIdx: 3, accIdx: 1, daysBack: 25, title: 'Coffee shop' },
      { type: 'expense', amount: 225,   catIdx: 3, accIdx: 0, daysBack: 18, title: 'Team dinner' },
      { type: 'expense', amount: 60,    catIdx: 3, accIdx: 1, daysBack: 9,  title: 'Coffee' },
      { type: 'expense', amount: 180,   catIdx: 3, accIdx: 0, daysBack: 3,  title: 'Business lunch' },
      { type: 'expense', amount: 105,   catIdx: 4, accIdx: 1, daysBack: 26, title: 'Monthly transit pass' },
      { type: 'expense', amount: 43,    catIdx: 4, accIdx: 0, daysBack: 19, title: 'Uber' },
      { type: 'expense', amount: 33,    catIdx: 4, accIdx: 1, daysBack: 11, title: 'Scooter rental' },
      { type: 'expense', amount: 1750,  catIdx: 5, accIdx: 0, daysBack: 29, title: 'Rent' },
      { type: 'expense', amount: 210,   catIdx: 5, accIdx: 0, daysBack: 22, title: 'Utilities' },
      { type: 'expense', amount: 190,   catIdx: 6, accIdx: 0, daysBack: 16, title: 'Doctor visit' },
      { type: 'expense', amount: 120,   catIdx: 6, accIdx: 0, daysBack: 10, title: 'Pharmacy' },
      { type: 'expense', amount: 90,    catIdx: 7, accIdx: 0, daysBack: 24, title: 'Cinema (2 tickets)' },
      { type: 'expense', amount: 15,    catIdx: 7, accIdx: 0, daysBack: 15, title: 'Spotify subscription' },
      { type: 'expense', amount: 18,    catIdx: 7, accIdx: 0, daysBack: 7,  title: 'Netflix subscription' },
      { type: 'expense', amount: 125,   catIdx: 8, accIdx: 0, daysBack: 21, title: 'Nike sneakers' },
      { type: 'expense', amount: 68,    catIdx: 8, accIdx: 0, daysBack: 14, title: 'Jeans' },
      { type: 'expense', amount: 49,    catIdx: 9, accIdx: 0, daysBack: 17, title: 'TypeScript course' },
      { type: 'expense', amount: 35,    catIdx: 9, accIdx: 0, daysBack: 5,  title: 'Clean Architecture book' },
      { type: 'income',  amount: 1500,  catIdx: -1, accIdx: 2, daysBack: 28, title: 'Savings deposit' },
    ] : [
      { type: 'income',  amount: 120000, catIdx: 0, accIdx: 0, daysBack: 28, title: 'Зарплата за март' },
      { type: 'income',  amount: 35000,  catIdx: 1, accIdx: 0, daysBack: 20, title: 'Фриланс-проект: лендинг' },
      { type: 'income',  amount: 18000,  catIdx: 1, accIdx: 0, daysBack: 8,  title: 'Фриланс-проект: API интеграция' },
      { type: 'expense', amount: 4800,   catIdx: 2, accIdx: 0, daysBack: 27, title: 'Пятёрочка' },
      { type: 'expense', amount: 6200,   catIdx: 2, accIdx: 0, daysBack: 20, title: 'ВкусВилл' },
      { type: 'expense', amount: 3900,   catIdx: 2, accIdx: 1, daysBack: 13, title: 'Рынок' },
      { type: 'expense', amount: 5100,   catIdx: 2, accIdx: 0, daysBack: 6,  title: 'Магнит' },
      { type: 'expense', amount: 2800,   catIdx: 3, accIdx: 1, daysBack: 25, title: 'Кофейня Double B' },
      { type: 'expense', amount: 4500,   catIdx: 3, accIdx: 0, daysBack: 18, title: 'Ресторан с командой' },
      { type: 'expense', amount: 1200,   catIdx: 3, accIdx: 1, daysBack: 9,  title: 'Стаканчик кофе' },
      { type: 'expense', amount: 3600,   catIdx: 3, accIdx: 0, daysBack: 3,  title: 'Бизнес-ланч' },
      { type: 'expense', amount: 2100,   catIdx: 4, accIdx: 1, daysBack: 26, title: 'Метро (месячный)' },
      { type: 'expense', amount: 850,    catIdx: 4, accIdx: 0, daysBack: 19, title: 'Яндекс Такси' },
      { type: 'expense', amount: 650,    catIdx: 4, accIdx: 1, daysBack: 11, title: 'Самокат' },
      { type: 'expense', amount: 35000,  catIdx: 5, accIdx: 0, daysBack: 29, title: 'Аренда квартиры' },
      { type: 'expense', amount: 4200,   catIdx: 5, accIdx: 0, daysBack: 22, title: 'Коммунальные услуги' },
      { type: 'expense', amount: 3800,   catIdx: 6, accIdx: 0, daysBack: 16, title: 'Врач-терапевт' },
      { type: 'expense', amount: 2400,   catIdx: 6, accIdx: 0, daysBack: 10, title: 'Аптека' },
      { type: 'expense', amount: 1800,   catIdx: 7, accIdx: 0, daysBack: 24, title: 'Кино (2 билета)' },
      { type: 'expense', amount: 599,    catIdx: 7, accIdx: 0, daysBack: 15, title: 'Подписка Spotify' },
      { type: 'expense', amount: 299,    catIdx: 7, accIdx: 0, daysBack: 7,  title: 'Подписка Netflix' },
      { type: 'expense', amount: 12500,  catIdx: 8, accIdx: 0, daysBack: 21, title: 'Кроссовки Nike' },
      { type: 'expense', amount: 6800,   catIdx: 8, accIdx: 0, daysBack: 14, title: 'Джинсы' },
      { type: 'expense', amount: 4990,   catIdx: 9, accIdx: 0, daysBack: 17, title: 'Курс TypeScript на Stepik' },
      { type: 'expense', amount: 2490,   catIdx: 9, accIdx: 0, daysBack: 5,  title: 'Книга Clean Architecture' },
      { type: 'income',  amount: 30000,  catIdx: -1, accIdx: 2, daysBack: 28, title: 'Пополнение накопительного' },
    ],
    budgets: [2, 3, 4, 7], // catIdx indices for budgets
    budgetLimits: en ? [1000, 500, 250, 250] : [20000, 10000, 5000, 5000],
    goals: en ? [
      { name: 'Japan Vacation',   target: 15000, current: 4200,  currency: 'USD', color: '#ff9f0a', daysAhead: 180 },
      { name: 'New MacBook Pro',  target: 10000, current: 6000,  currency: 'USD', color: '#64d2ff', daysAhead: 90  },
      { name: 'Emergency Fund',   target: 25000, current: 12000, currency: 'USD', color: '#30d158', daysAhead: null },
    ] : [
      { name: 'Отпуск в Японии',        target: 300000, current: 85000,  currency: 'RUB', color: '#ff9f0a', daysAhead: 180 },
      { name: 'Новый MacBook Pro',       target: 200000, current: 120000, currency: 'RUB', color: '#64d2ff', daysAhead: 90  },
      { name: 'Подушка безопасности',    target: 500000, current: 240000, currency: 'RUB', color: '#30d158', daysAhead: null },
    ],
  };
}
