async function loadSite() {
  let data;
  try {
    const res = await fetch('/api/data');
    data = await res.json();
  } catch (err) {
    console.error('تعذر تحميل بيانات الموقع', err);
    return;
  }

  applyTheme(data.theme);
  applyProfile(data.profile);
  renderSocials(data.socials || []);
  renderProjects(data.projects || []);
}

function applyTheme(theme = {}) {
  const root = document.documentElement.style;
  if (theme.gradientTop) root.setProperty('--gradient-top', theme.gradientTop);
  if (theme.gradientMiddle) root.setProperty('--gradient-middle', theme.gradientMiddle);
  if (theme.gradientBottom) root.setProperty('--gradient-bottom', theme.gradientBottom);
  if (theme.accent) root.setProperty('--accent', theme.accent);
}

function applyProfile(profile = {}) {
  const banner = document.getElementById('banner');
  const avatar = document.getElementById('avatar');
  const name = document.getElementById('display-name');
  const statusText = document.getElementById('status-text');
  const bio = document.getElementById('bio');
  const footerName = document.getElementById('footer-name');

  if (profile.banner) banner.style.backgroundImage = `url("${profile.banner}")`;
  if (profile.avatar) avatar.src = profile.avatar;
  name.textContent = profile.displayName || '';
  statusText.textContent = profile.status || '';
  bio.textContent = profile.bio || '';
  footerName.textContent = profile.displayName || '';

  document.title = profile.displayName ? `${profile.displayName} — الملف الشخصي` : 'الملف الشخصي';
}

function renderSocials(socials) {
  const container = document.getElementById('socials');
  container.innerHTML = '';
  socials.forEach((s) => {
    if (!s.url) return;
    const a = document.createElement('a');
    a.className = 'social-link';
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', s.label || 'رابط تواصل');
    a.title = s.label || '';

    const img = document.createElement('img');
    img.src = s.icon || '';
    img.alt = s.label || '';
    a.appendChild(img);

    container.appendChild(a);
  });
}

function renderProjects(projects) {
  const container = document.getElementById('projects');
  container.innerHTML = '';

  if (!projects.length) {
    const empty = document.createElement('p');
    empty.className = 'projects-empty';
    empty.textContent = 'لا توجد مشاريع مضافة بعد.';
    container.appendChild(empty);
    return;
  }

  projects.forEach((p) => {
    const card = document.createElement(p.link ? 'a' : 'div');
    card.className = 'project-card';
    if (p.link) {
      card.href = p.link;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }

    const image = document.createElement('div');
    image.className = 'project-image';
    if (p.image) image.style.backgroundImage = `url("${p.image}")`;

    const body = document.createElement('div');
    body.className = 'project-body';

    const title = document.createElement('h3');
    title.className = 'project-title';
    title.textContent = p.title || '';

    const desc = document.createElement('p');
    desc.className = 'project-description';
    desc.textContent = p.description || '';

    body.appendChild(title);
    body.appendChild(desc);
    card.appendChild(image);
    card.appendChild(body);
    container.appendChild(card);
  });
}

loadSite();
