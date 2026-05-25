// ===== SUPPORT CHAT WIDGET =====
function initSupportChat() {
  const chatWidget = document.createElement('div');
  chatWidget.id = 'supportChatWidget';
  chatWidget.innerHTML = `
    <div style="position:fixed;bottom:30px;right:30px;z-index:998;width:380px;max-width:90vw;border-radius:12px;overflow:hidden;box-shadow:0 5px 40px rgba(0,0,0,0.3);display:flex;flex-direction:column;height:500px;background:var(--panel2)">
      <div style="background:#ff6b35;color:white;padding:15px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:bold" data-en="King Food Support" data-ar="دعم King Food">King Food Support</span>
        <button id="chatToggleBtn" style="background:none;border:none;color:white;cursor:pointer;font-size:1.3rem">⌄</button>
      </div>
      <div id="chatMessages" style="flex:1;overflow-y:auto;padding:15px;display:flex;flex-direction:column;gap:10px"></div>
      <div style="border-top:1px solid #ccc;padding:10px;display:flex;gap:8px;flex-wrap:wrap">
        <input id="chatInput" type="text" placeholder="Type message..." style="flex:1;min-width:150px;padding:8px;border:1px solid #ccc;border-radius:6px;background:var(--panel);color:var(--text)">
        <button id="chatSendBtn" style="padding:8px 12px;background:#ff6b35;color:white;border:none;border-radius:6px;cursor:pointer">Send</button>
        <input id="chatFileBtn" type="file" accept="image/*,video/*,.pdf" style="display:none">
        <button id="chatAttachBtn" style="padding:8px 12px;background:#f59e0b;color:white;border:none;border-radius:6px;cursor:pointer;font-size:1rem">📎</button>
      </div>
    </div>
  `;
  document.body.appendChild(chatWidget);

  const toggle = document.getElementById('chatToggleBtn');
  const messages = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const attachBtn = document.getElementById('chatAttachBtn');
  const fileInput = document.getElementById('chatFileBtn');
  let chatOpen = true;

  toggle.onclick = () => {
    messages.parentElement.parentElement.style.height = chatOpen ? '60px' : '500px';
    toggle.textContent = chatOpen ? '⌃' : '⌄';
    messages.parentElement.style.display = chatOpen ? 'none' : 'flex';
    messages.nextElementSibling.style.display = chatOpen ? 'none' : 'flex';
    chatOpen = !chatOpen;
  };

  sendBtn.onclick = async () => {
    if (!input.value.trim()) return;
    const msg = input.value;
    input.value = '';
    addMessage(msg, 'user');
    try {
      const res = await api('/api/support/chat', { method: 'POST', body: JSON.stringify({ message: msg }) });
      addMessage(res.reply || 'Thanks for your message', 'support');
    } catch (e) {
      addMessage('Error: ' + e.message, 'error');
    }
  };

  attachBtn.onclick = () => fileInput.click();
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/support/upload', { method: 'POST', body: formData });
      const data = await res.json();
      addMessage(`📎 ${file.name}`, 'user');
      addMessage('File received ✓', 'support');
    } catch (e) {
      addMessage('Upload failed', 'error');
    }
  };

  function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `padding:10px;border-radius:8px;max-width:80%;word-wrap:break-word;${sender === 'user' ? 'background:#ff6b35;color:white;align-self:flex-end;text-align:right' : sender === 'error' ? 'background:#dc2626;color:white' : 'background:#e0e0e0;color:#333'}`;
    msgDiv.textContent = text;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
  }
}

// ===== TRANSLATION SYSTEM =====
function applyTranslations() {
  const currentLang = lang.get();
  document.querySelectorAll('[data-en][data-ar]').forEach(el => {
    el.textContent = currentLang === 'ar' ? el.dataset.ar : el.dataset.en;
  });
  
  // Update document direction
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.body.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
}

// Integrate with language toggle
const origLangToggle = document.getElementById('langToggle');
if (origLangToggle) {
  origLangToggle.onclick = (e) => {
    e.preventDefault();
    lang.set(lang.get() === 'en' ? 'ar' : 'en');
    applyTranslations();
  };
}

// Initialize on page load
applyTranslations();
initSupportChat();
