let siteData = null;

const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const saveStatus = document.getElementById('save-status');

// ---------- boot ----------

async function boot() {
  const res = await fetch('/api/session');
  const session = await res.json();
  if (session.isAdmin) {
    await loadDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginScreen.classList.remove('hidden');
  dashboard.classList.add('hidden');
}

function showDashboard() {
  loginScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const password = document.getElementById('login-password').value;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      loginError.textContent = body.error || 'تعذر تسجيل الدخول';
      return;
    }
    await loadDashboard();
  } catch (err) {
    loginError.textContent = 'تعذر الاتصال بالخادم';
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  showLogin();
});

// ---------- load & render ----------

async function loadDashboard() {
  const res = await fetch('/api/data');
  siteData = await res.json();
  showDashboard();
  renderProfile();
  renderTheme();
  renderSocials();
  renderProjects();
}

function renderProfile() {
  const p = siteData.profile;
  document.getElementById('avatar-preview').src = p.avatar || '';
  document.getElementById('banner-preview').style.backgroundImage = p.banner ? `url("${p.banner}")` : '';
  document.getElementById('display-name-input').value = p.displayName || '';
  document.getElementById('status-input').value = p.status || '';
  document.getElementById('bio-input').value = p.bio || '';
}

function renderTheme() {
  const t = siteData.theme;
  document.getElementById('color-top').value = t.gradientTop || '#1b1f2a';
  document.getElementById('color-middle').value = t.gradientMiddle || '#12141c';
  document.getElementById('color-bottom').value = t.gradientBottom || '#0a0b0f';
  document.getElementById('color-accent').value = t.accent || '#6c7bff';
  updateGradientPreview();
}

function updateGradientPreview() {
  const top = document.getElementById('color-top').value;
  const mid = document.getElementById('color-middle').value;
  const bottom = document.getElementById('color-bottom').value;
  document.getElementById('gradient-preview').style.background =
    `linear-gradient(to bottom, ${top}, ${mid}, ${bottom})`;
}

// ---------- profile field bindings ----------

document.getElementById('display-name-input').addEventListener('input', (e) => {
  siteData.profile.displayName = e.target.value;
});
document.getElementById('status-input').addEventListener('input', (e) => {
  siteData.profile.status = e.target.value;
});
document.getElementById('bio-input').addEventListener('input', (e) => {
  siteData.profile.bio = e.target.value;
});

document.getElementById('avatar-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = await uploadFile(file);
  if (url) {
    siteData.profile.avatar = url;
    document.getElementById('avatar-preview').src = url;
  }
});

document.getElementById('banner-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = await uploadFile(file);
  if (url) {
    siteData.profile.banner = url;
    document.getElementById('banner-preview').style.backgroundImage = `url("${url}")`;
  }
});

// ---------- theme field bindings ----------

['color-top', 'color-middle', 'color-bottom', 'color-accent'].forEach((id) => {
  document.getElementById(id).addEventListener('input', () => {
    siteData.theme.gradientTop = document.getElementById('color-top').value;
    siteData.theme.gradientMiddle = document.getElementById('color-middle').value;
    siteData.theme.gradientBottom = document.getElementById('color-bottom').value;
    siteData.theme.accent = document.getElementById('color-accent').value;
    updateGradientPreview();
  });
});

// ---------- socials ----------

function renderSocials() {
  const list = document.getElementById('socials-list');
  list.innerHTML = '';

  siteData.socials.forEach((social, index) => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const top = document.createElement('div');
    top.className = 'item-card-top';

    const icon = document.createElement('img');
    icon.className = 'item-icon-preview';
    icon.src = social.icon || '';
    icon.alt = '';

    const fields = document.createElement('div');
    fields.className = 'item-fields';

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.placeholder = 'اسم الحساب (مثال: انستقرام)';
    labelInput.value = social.label || '';
    labelInput.addEventListener('input', () => (social.label = labelInput.value));

    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.placeholder = 'رابط الحساب (https://...)';
    urlInput.value = social.url || '';
    urlInput.addEventListener('input', () => (social.url = urlInput.value));

    fields.appendChild(labelInput);
    fields.appendChild(urlInput);
    top.appendChild(icon);
    top.appendChild(fields);

    const footer = document.createElement('div');
    footer.className = 'item-card-footer';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      const url = await uploadFile(file);
      if (url) {
        social.icon = url;
        icon.src = url;
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger';
    deleteBtn.textContent = 'حذف';
    deleteBtn.addEventListener('click', () => {
      siteData.socials.splice(index, 1);
      renderSocials();
    });

    footer.appendChild(fileInput);
    footer.appendChild(deleteBtn);

    card.appendChild(top);
    card.appendChild(footer);
    list.appendChild(card);
  });
}

document.getElementById('add-social-btn').addEventListener('click', () => {
  siteData.socials.push({
    id: 'social-' + Date.now(),
    label: '',
    url: '',
    icon: '',
  });
  renderSocials();
});

// ---------- projects ----------

function renderProjects() {
  const list = document.getElementById('projects-list');
  list.innerHTML = '';

  siteData.projects.forEach((project, index) => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const top = document.createElement('div');
    top.className = 'item-card-top';

    const image = document.createElement('div');
    image.className = 'item-image-preview';
    if (project.image) image.style.backgroundImage = `url("${project.image}")`;

    const fields = document.createElement('div');
    fields.className = 'item-fields';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.placeholder = 'اسم المشروع';
    titleInput.value = project.title || '';
    titleInput.addEventListener('input', () => (project.title = titleInput.value));

    const linkInput = document.createElement('input');
    linkInput.type = 'url';
    linkInput.placeholder = 'رابط المشروع (اختياري)';
    linkInput.value = project.link || '';
    linkInput.addEventListener('input', () => (project.link = linkInput.value));

    fields.appendChild(titleInput);
    fields.appendChild(linkInput);
    top.appendChild(image);
    top.appendChild(fields);

    const descInput = document.createElement('textarea');
    descInput.rows = 2;
    descInput.placeholder = 'وصف مختصر للمشروع';
    descInput.value = project.description || '';
    descInput.addEventListener('input', () => (project.description = descInput.value));

    const footer = document.createElement('div');
    footer.className = 'item-card-footer';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      const url = await uploadFile(file);
      if (url) {
        project.image = url;
        image.style.backgroundImage = `url("${url}")`;
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn danger';
    deleteBtn.textContent = 'حذف';
    deleteBtn.addEventListener('click', () => {
      siteData.projects.splice(index, 1);
      renderProjects();
    });

    footer.appendChild(fileInput);
    footer.appendChild(deleteBtn);

    card.appendChild(top);
    card.appendChild(descInput);
    card.appendChild(footer);
    list.appendChild(card);
  });
}

document.getElementById('add-project-btn').addEventListener('click', () => {
  siteData.projects.push({
    id: 'project-' + Date.now(),
    title: '',
    description: '',
    image: '',
    link: '',
  });
  renderProjects();
});

// ---------- upload helper ----------

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const body = await res.json();
    if (!res.ok) {
      alert(body.error || 'فشل رفع الملف');
      return null;
    }
    return body.url;
  } catch (err) {
    alert('تعذر رفع الملف');
    return null;
  }
}

// ---------- save ----------

document.getElementById('save-btn').addEventListener('click', async () => {
  saveStatus.textContent = 'جارِ الحفظ...';
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData),
    });
    if (res.status === 401) {
      saveStatus.textContent = '';
      showLogin();
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      saveStatus.textContent = body.error || 'حدث خطأ أثناء الحفظ';
      return;
    }
    saveStatus.textContent = 'تم الحفظ ✓';
    setTimeout(() => (saveStatus.textContent = ''), 2500);
  } catch (err) {
    saveStatus.textContent = 'تعذر الاتصال بالخادم';
  }
});

boot();
