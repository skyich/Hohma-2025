/**
 * Telegram Year Stats - Web App
 * Карусель с touch-свайпами и отображение статистики
 */

// ============================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================

let statsData = null;
let currentSlide = 0;
let totalSlides = 0;
let touchStartX = 0;
let touchEndX = 0;
let isDragging = false;

// Порядок категорий для отображения
const CATEGORY_ORDER = [
    'chat_summary',     // Общая статистика
    'activity',         // Активность
    'messages',         // Сообщения
    'voice',           // Голосовые
    'video_notes',     // Кружочки
    'reaction_star',   // Звезда чата
    'favorite_person', // Любимый человек
    'mutual_love',     // Взаимная любовь
    'reactions',       // Популярные реакции
    'emoji',           // Эмодзи в тексте
    'stickers',        // Популярные стикеры
    'sticker_senders', // Любители стикеров
    'verbose_users',   // Самые многословные
    'forwarders',      // Репосты
    'user_summary',    // Сводка по участникам
];

// Иконки категорий
const CATEGORY_ICONS = {
    'chat_summary': '📊',
    'activity': '📅',
    'messages': '💬',
    'voice': '🎤',
    'video_notes': '⭕',
    'reaction_star': '⭐',
    'favorite_person': '💕',
    'mutual_love': '💞',
    'reactions': '👍',
    'emoji': '😀',
    'stickers': '🎭',
    'sticker_senders': '🃏',
    'verbose_users': '📝',
    'forwarders': '🔄',
    'user_summary': '👥',
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    createLights();
    await loadStats();
    setupCarousel();
    setupNavigation();
});

// Создание мерцающих огоньков
function createLights() {
    const container = document.getElementById('lights');
    const colors = ['#ffd700', '#ffbf00', '#ffa500', '#ff8c00', '#fff8dc'];
    
    for (let i = 0; i < 30; i++) {
        const light = document.createElement('div');
        light.className = 'light';
        
        const size = Math.random() * 6 + 2;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 5;
        
        light.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}%;
            top: ${y}%;
            background: ${color};
            box-shadow: 0 0 ${size * 2}px ${color};
            --duration: ${duration}s;
            --delay: ${delay}s;
        `;
        
        container.appendChild(light);
    }
}

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================

async function loadStats() {
    try {
        const response = await fetch('stats.json');
        statsData = await response.json();
        
        // Обновляем подзаголовок
        const subtitle = document.getElementById('chat-subtitle');
        if (statsData.chat_summary) {
            const total = formatNumber(statsData.chat_summary.total_messages);
            const users = statsData.chat_summary.total_users;
            subtitle.textContent = `${total} сообщений • ${users} участников`;
        } else {
            subtitle.textContent = `Статистика за ${statsData.year} год`;
        }
        
        renderCategories();
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        document.getElementById('chat-subtitle').textContent = 'Ошибка загрузки данных';
    }
}

// ============================================
// РЕНДЕРИНГ КАТЕГОРИЙ
// ============================================

function renderCategories() {
    const carousel = document.getElementById('carousel');
    carousel.innerHTML = '';
    
    const categories = [];
    
    // Добавляем категории в нужном порядке
    for (const key of CATEGORY_ORDER) {
        if (key === 'chat_summary' && statsData.chat_summary) {
            categories.push({ key, data: statsData.chat_summary, type: 'summary' });
        } else if (key === 'activity' && statsData.activity) {
            categories.push({ key, data: statsData.activity, type: 'activity' });
        } else if (statsData.categories && statsData.categories[key]) {
            categories.push({ key, data: statsData.categories[key], type: 'category' });
        }
    }
    
    totalSlides = categories.length;
    document.getElementById('total-count').textContent = totalSlides;
    
    categories.forEach((cat, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = renderCategoryContent(cat.key, cat.data, cat.type);
        carousel.appendChild(slide);
    });
    
    // Создаём точки навигации
    createNavDots();
    updateSlidePosition();
}

function renderCategoryContent(key, data, type) {
    const icon = CATEGORY_ICONS[key] || '📌';
    
    if (type === 'summary') {
        return renderChatSummary(icon, data);
    } else if (type === 'activity') {
        return renderActivity(icon, data);
    } else {
        return renderCategoryList(icon, key, data);
    }
}

// Общая статистика чата
function renderChatSummary(icon, data) {
    const firstDate = data.first_message_date ? formatDate(data.first_message_date) : '—';
    const lastDate = data.last_message_date ? formatDate(data.last_message_date) : '—';
    
    return `
        <div class="category-card">
            <div class="category-header">
                <span class="category-icon">${icon}</span>
                <h2 class="category-title">Статистика чата</h2>
                <p class="category-subtitle">${firstDate} — ${lastDate}</p>
            </div>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-icon">💬</div>
                    <div class="summary-value">${formatNumber(data.total_messages)}</div>
                    <div class="summary-label">сообщений</div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon">❤️</div>
                    <div class="summary-value">${formatNumber(data.total_reactions)}</div>
                    <div class="summary-label">реакций</div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon">👥</div>
                    <div class="summary-value">${data.total_users}</div>
                    <div class="summary-label">участников</div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon">📈</div>
                    <div class="summary-value">${data.avg_messages_per_day}</div>
                    <div class="summary-label">сообщ./день</div>
                </div>
            </div>
        </div>
    `;
}

// Активность по дням/часам
function renderActivity(icon, data) {
    const maxWeekday = Math.max(...data.by_weekday);
    const maxHour = Math.max(...data.by_hour);
    
    const weekdayBars = data.by_weekday.map((val, i) => {
        const height = maxWeekday > 0 ? Math.max((val / maxWeekday * 100), 5) : 5;
        const count = formatNumber(val);
        return `
            <div class="bar-container" title="${count} сообщений">
                <div class="bar-wrapper">
                    <div class="bar" style="height: ${height}%"></div>
                </div>
                <span class="bar-label">${data.weekday_labels[i]}</span>
            </div>
        `;
    }).join('');
    
    const hourBars = data.by_hour.map((val, i) => {
        const height = maxHour > 0 ? Math.max((val / maxHour * 100), 3) : 3;
        const label = i % 3 === 0 ? i : '';
        return `
            <div class="bar-container">
                <div class="bar-wrapper">
                    <div class="bar" style="height: ${height}%"></div>
                </div>
                <span class="bar-label">${label}</span>
            </div>
        `;
    }).join('');
    
    return `
        <div class="category-card">
            <div class="category-header">
                <span class="category-icon">${icon}</span>
                <h2 class="category-title">Активность</h2>
                <p class="category-subtitle">когда чат был жив</p>
            </div>
            <div class="activity-chart">
                <div class="chart-title">По дням недели</div>
                <div class="bar-chart weekday-chart">${weekdayBars}</div>
            </div>
            <div class="activity-chart" style="margin-top: 32px;">
                <div class="chart-title">По часам</div>
                <div class="bar-chart hour-chart">${hourBars}</div>
            </div>
        </div>
    `;
}

// Список топа
function renderCategoryList(icon, key, category) {
    const isPair = category.is_pair;
    const isSummary = category.is_summary;
    const isEmoji = key === 'emoji' || key === 'reactions';
    const isStickers = key === 'stickers';
    
    let itemsHtml = '';
    
    if (isSummary) {
        // Сводка по участникам
        itemsHtml = category.data.slice(0, 11).map((item, i) => {
            const place = i + 1;
            return renderUserSummaryItem(item, place);
        }).join('');
    } else if (isPair) {
        // Пары
        itemsHtml = category.data.slice(0, 10).map((item, i) => {
            const place = i + 1;
            const isMutual = key === 'mutual_love';
            return renderPairItem(item, place, category.unit, isMutual);
        }).join('');
    } else if (isEmoji) {
        // Эмодзи/реакции
        itemsHtml = category.data.slice(0, 11).map((item, i) => {
            const place = i + 1;
            return renderEmojiItem(item, place, category.unit);
        }).join('');
    } else if (isStickers) {
        // Стикеры
        itemsHtml = category.data.slice(0, 11).map((item, i) => {
            const place = i + 1;
            return renderStickerItem(item, place, category.unit);
        }).join('');
    } else {
        // Обычный топ пользователей
        itemsHtml = category.data.slice(0, 11).map((item, i) => {
            const place = i + 1;
            return renderUserItem(item, place, category.unit, key);
        }).join('');
    }
    
    return `
        <div class="category-card">
            <div class="category-header">
                <span class="category-icon">${icon}</span>
                <h2 class="category-title">${category.title}</h2>
                <p class="category-subtitle">${category.subtitle}</p>
            </div>
            <ul class="top-list">${itemsHtml}</ul>
        </div>
    `;
}

// Рендер элемента пользователя
function renderUserItem(item, place, unit, key) {
    const topClass = place <= 3 ? `top-${place}` : '';
    const avatar = renderAvatar(item.avatar_path, item.display_name);
    const value = formatValue(item.value);
    
    let extraInfo = '';
    if (key === 'messages' && item.extra?.total_chars) {
        extraInfo = `<div class="item-extra">${formatNumber(item.extra.total_chars)} символов</div>`;
    } else if (key === 'voice' && item.extra?.count) {
        extraInfo = `<div class="item-extra">${item.extra.count} сообщений</div>`;
    } else if (key === 'video_notes' && item.extra?.total_minutes) {
        extraInfo = `<div class="item-extra">${item.extra.total_minutes} мин</div>`;
    } else if (key === 'verbose_users' && item.extra?.msg_count) {
        extraInfo = `<div class="item-extra">${item.extra.msg_count} сообщений</div>`;
    } else if (key === 'sticker_senders' && item.extra?.top_stickers) {
        const stickers = item.extra.top_stickers.slice(0, 3).map(path => 
            `<img src="${getAssetPath(path)}" alt="" class="sticker-img" onerror="this.style.display='none'">`
        ).join('');
        extraInfo = `<div class="sticker-row">${stickers}</div>`;
    } else if (key === 'reaction_star' && item.extra?.top_emojis) {
        const emojis = Object.keys(item.extra.top_emojis).slice(0, 5).map(e => 
            `<span class="emoji-small">${e}</span>`
        ).join('');
        extraInfo = `<div class="emoji-row">${emojis}</div>`;
    }
    
    return `
        <li class="top-item ${topClass}">
            <div class="place-badge">${place}</div>
            ${avatar}
            <div class="item-info">
                <div class="item-name">${item.display_name}</div>
                ${extraInfo}
            </div>
            <div class="item-value">
                <span class="value-number">${value}</span>
                <span class="value-unit">${unit}</span>
            </div>
        </li>
    `;
}

// Рендер пары
function renderPairItem(item, place, unit, isMutual) {
    const topClass = place <= 3 ? `top-${place}` : '';
    const avatar1 = renderAvatar(item.user1_avatar, item.user1_name, 36);
    const avatar2 = renderAvatar(item.user2_avatar, item.user2_name, 36);
    const arrow = isMutual ? '💕' : '→';
    const value = formatValue(item.value);
    
    let emojiRow = '';
    if (item.extra?.top_emojis) {
        const emojis = Object.keys(item.extra.top_emojis).slice(0, 4).map(e => 
            `<span class="emoji-small">${e}</span>`
        ).join('');
        emojiRow = `<div class="emoji-row">${emojis}</div>`;
    }
    
    return `
        <li class="top-item pair-item ${topClass}">
            <div class="place-badge">${place}</div>
            <div class="pair-container">
                <div class="pair-user">
                    ${avatar1}
                    <span class="pair-name">${item.user1_name}</span>
                </div>
                <span class="pair-arrow">${arrow}</span>
                <div class="pair-user">
                    ${avatar2}
                    <span class="pair-name">${item.user2_name}</span>
                </div>
            </div>
            <div class="item-value">
                <span class="value-number">${value}</span>
                <span class="value-unit">${unit}</span>
            </div>
        </li>
    `;
}

// Рендер эмодзи
function renderEmojiItem(item, place, unit) {
    const topClass = place <= 3 ? `top-${place}` : '';
    const value = formatValue(item.value);
    
    return `
        <li class="top-item ${topClass}">
            <div class="place-badge">${place}</div>
            <div class="emoji-display">${item.item_name}</div>
            <div class="item-info">
                <div class="item-name">${item.item_name}</div>
            </div>
            <div class="item-value">
                <span class="value-number">${value}</span>
                <span class="value-unit">${unit}</span>
            </div>
        </li>
    `;
}

// Рендер стикера
function renderStickerItem(item, place, unit) {
    const topClass = place <= 3 ? `top-${place}` : '';
    const value = formatValue(item.value);
    const stickerPath = item.extra?.sticker_path;
    
    let stickerDisplay = `<div class="emoji-display">${item.item_name}</div>`;
    if (stickerPath) {
        stickerDisplay = `<img src="${getAssetPath(stickerPath)}" alt="${item.item_name}" class="sticker-img" onerror="this.outerHTML='<div class=\\'emoji-display\\'>${item.item_name}</div>'">`;
    }
    
    return `
        <li class="top-item ${topClass}">
            <div class="place-badge">${place}</div>
            ${stickerDisplay}
            <div class="item-info">
                <div class="item-name">${item.item_name}</div>
            </div>
            <div class="item-value">
                <span class="value-number">${value}</span>
                <span class="value-unit">${unit}</span>
            </div>
        </li>
    `;
}

// Рендер сводки пользователя
function renderUserSummaryItem(item, place) {
    const topClass = place <= 3 ? `top-${place}` : '';
    const avatar = renderAvatar(item.avatar_path, item.display_name);
    
    // Форматируем время голосовых и кружков
    const voiceTime = formatDuration(item.voice_seconds || 0);
    const videoTime = formatDuration(item.video_notes_seconds || 0);
    
    return `
        <li class="top-item summary-item ${topClass}">
            <div class="place-badge">${place}</div>
            ${avatar}
            <div class="item-info">
                <div class="item-name">${item.display_name}</div>
                <div class="summary-stats">
                    <span class="stat-item">💬 ${formatNumber(item.messages_count)}</span>
                    <span class="stat-item">⭐ ${formatNumber(item.reactions_received)}</span>
                </div>
            </div>
            <div class="item-value">
                <span class="value-number">${formatNumber(item.total_chars)}</span>
                <span class="value-unit">символов</span>
            </div>
        </li>
    `;
}

// Форматирование длительности
function formatDuration(seconds) {
    if (!seconds) return '0 мин';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} мин`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours} ч ${remainMins} мин`;
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function renderAvatar(path, name, size = 44) {
    if (path) {
        const src = getAssetPath(path);
        return `<img src="${src}" alt="${name}" class="avatar" style="width:${size}px;height:${size}px" onerror="this.outerHTML='${renderAvatarPlaceholder(name, size)}'">`;
    }
    return renderAvatarPlaceholder(name, size);
}

function renderAvatarPlaceholder(name, size = 44) {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return `<div class="avatar-placeholder" style="width:${size}px;height:${size}px;font-size:${size/2.5}px">${initial}</div>`;
}

function getAssetPath(absolutePath) {
    if (!absolutePath) return '';
    // Извлекаем имя файла и папку
    const parts = absolutePath.split('/');
    const filename = parts[parts.length - 1];
    const folder = parts[parts.length - 2]; // avatars или stickers
    return `${folder}/${filename}`;
}

function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatValue(val) {
    if (typeof val === 'number') {
        if (Number.isInteger(val)) {
            return formatNumber(val);
        }
        return val.toFixed(1);
    }
    return val;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function truncate(str, maxLen) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen) + '…';
}

// ============================================
// КАРУСЕЛЬ
// ============================================

function setupCarousel() {
    const carousel = document.getElementById('carousel');
    
    // Touch события
    carousel.addEventListener('touchstart', handleTouchStart, { passive: true });
    carousel.addEventListener('touchmove', handleTouchMove, { passive: true });
    carousel.addEventListener('touchend', handleTouchEnd);
    
    // Клавиатура
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    });
}

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    isDragging = true;
}

function handleTouchMove(e) {
    if (!isDragging) return;
    touchEndX = e.touches[0].clientX;
}

function handleTouchEnd() {
    if (!isDragging) return;
    isDragging = false;
    
    const diff = touchStartX - touchEndX;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold) {
        if (diff > 0) {
            nextSlide();
        } else {
            prevSlide();
        }
    }
    
    touchStartX = 0;
    touchEndX = 0;
}

function setupNavigation() {
    document.getElementById('prev-btn').addEventListener('click', prevSlide);
    document.getElementById('next-btn').addEventListener('click', nextSlide);
}

function createNavDots() {
    const container = document.getElementById('nav-dots');
    container.innerHTML = '';
    
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.className = 'nav-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(i));
        container.appendChild(dot);
    }
}

function goToSlide(index) {
    currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
    updateSlidePosition();
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlidePosition();
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlidePosition();
    }
}

function updateSlidePosition() {
    const carousel = document.getElementById('carousel');
    carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Обновляем точки
    const dots = document.querySelectorAll('.nav-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
    
    // Обновляем счётчик
    document.getElementById('current-index').textContent = currentSlide + 1;
    
    // Скрываем стрелки на краях
    document.getElementById('prev-btn').style.opacity = currentSlide === 0 ? '0.3' : '1';
    document.getElementById('next-btn').style.opacity = currentSlide === totalSlides - 1 ? '0.3' : '1';
}

