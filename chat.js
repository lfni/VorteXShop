document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const chatHistory = document.getElementById('chat-history');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const newChatButton = document.getElementById('new-chat');
    const themeToggle = document.getElementById('theme-toggle');
    const chatList = document.getElementById('chat-list');
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettings = document.getElementById('close-settings');
    const confirmPanel = document.getElementById('confirm-panel');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    
    // وضعیت برنامه
    let chats = {};
    let currentChatId = '1';
    let isWaitingForResponse = false;
    let chatToDelete = null;
    
    // بارگذاری اولیه
    loadChats();
    
    // تنظیم تم اولیه
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i> تغییر تم';
    }
    
    // مدیریت تم
    themeToggle.addEventListener('click', function() {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i> تغییر تم';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> تغییر تم';
        }
    });
    
    // گفتگوی جدید
    newChatButton.addEventListener('click', createNewChat);
    
    // ارسال پیام
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && !isWaitingForResponse) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // تنظیم ارتفاع خودکار برای textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    // مدیریت پنل تنظیمات
    settingsButton.addEventListener('click', function(e) {
        e.stopPropagation();
        settingsPanel.classList.toggle('open');
    });
    
    closeSettings.addEventListener('click', function(e) {
        e.stopPropagation();
        settingsPanel.classList.remove('open');
    });
    
    // مدیریت پنل تأیید حذف
    confirmDeleteBtn.addEventListener('click', function() {
        if (chatToDelete) {
            deleteChat(chatToDelete);
            chatToDelete = null;
        }
        confirmPanel.classList.remove('open');
    });
    
    cancelDeleteBtn.addEventListener('click', function() {
        chatToDelete = null;
        confirmPanel.classList.remove('open');
    });
    
    // بستن پنل‌ها با کلیک خارج از آنها
    document.addEventListener('click', function(e) {
        if (!settingsPanel.contains(e.target) && e.target !== settingsButton) {
            settingsPanel.classList.remove('open');
        }
        
        if (!confirmPanel.contains(e.target)) {
            confirmPanel.classList.remove('open');
        }
    });
    
    // جلوگیری از بسته شدن پنل با کلیک روی محتوای آن
    settingsPanel.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    confirmPanel.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // توابع
    function createNewChat() {
        const chatId = Date.now().toString();
        currentChatId = chatId;
        
        chats[chatId] = {
            id: chatId,
            title: 'گفتگوی جدید',
            messages: [],
            createdAt: new Date().toISOString()
        };
        
        saveChats();
        renderChatList();
        loadChat(chatId);
    }
    
    function loadChats() {
        const savedChats = localStorage.getItem('chats');
        if (savedChats) {
            chats = JSON.parse(savedChats);
            if (Object.keys(chats).length > 0) {
                const lastChatId = Object.keys(chats)[Object.keys(chats).length - 1];
                currentChatId = lastChatId;
                loadChat(lastChatId);
            } else {
                createNewChat();
            }
        } else {
            createNewChat();
        }
        
        renderChatList();
    }
    
    function saveChats() {
        localStorage.setItem('chats', JSON.stringify(chats));
    }
    
    function renderChatList() {
        chatList.innerHTML = '';
        
        // مرتب سازی چت‌ها بر اساس تاریخ ایجاد (جدیدترین اول)
        const sortedChats = Object.values(chats).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        sortedChats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
            chatItem.dataset.chatId = chat.id;
            chatItem.innerHTML = `
                <div class="chat-item-content">
                    <i class="fas fa-comment"></i>
                    <span class="chat-item-title">${chat.title}</span>
                </div>
                <button class="delete-chat-btn" data-chat-id="${chat.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            // رویداد کلیک برای انتخاب چت
            chatItem.addEventListener('click', function(e) {
                // اگر روی دکمه حذف کلیک شده بود، این رویداد را اجرا نکن
                if (!e.target.closest('.delete-chat-btn')) {
                    currentChatId = chat.id;
                    loadChat(chat.id);
                    renderChatList();
                }
            });
            
            // رویداد کلیک برای دکمه حذف
            const deleteBtn = chatItem.querySelector('.delete-chat-btn');
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                showDeleteConfirmation(chat.id);
            });
            
            chatList.appendChild(chatItem);
        });
    }
    
    function showDeleteConfirmation(chatId) {
        chatToDelete = chatId;
        confirmPanel.classList.add('open');
    }
    
    function deleteChat(chatId) {
        delete chats[chatId];
        saveChats();
        
        // اگر چت فعلی حذف شده است، یک چت جدید ایجاد کنید
        if (currentChatId === chatId) {
            if (Object.keys(chats).length > 0) {
                currentChatId = Object.keys(chats)[0];
                loadChat(currentChatId);
            } else {
                createNewChat();
            }
        }
        
        renderChatList();
    }
    
    function loadChat(chatId) {
        const chat = chats[chatId];
        if (!chat) return;
        
        chatHistory.innerHTML = '';
        
        if (chat.messages.length === 0) {
            displayWelcomeMessage();
        } else {
            chat.messages.forEach(msg => {
                displayMessage(msg.content, msg.role, false);
            });
            scrollToBottom();
        }
    }
    
    function displayWelcomeMessage() {
        const welcomeMessage = `
            <div class="welcome-message">
                <h2 class="nastaliq-font">به پارسی چت خوش آمدید!</h2>
                <p class="nastaliq-font">من یک مدل زبانی پیشرفته هستم که می‌توانم به سوالات شما پاسخ دهم. چگونه می‌توانم خدمتتان باشم؟</p>
                <div class="suggestions">
                    <button class="suggestion-btn nastaliq-font">معرفی خودت</button>
                    <button class="suggestion-btn nastaliq-font">ایده‌هایی برای کسب و کار</button>
                    <button class="suggestion-btn nastaliq-font">تاریخ ایران</button>
                </div>
            </div>
        `;
        
        const container = document.createElement('div');
        container.className = 'ai-message welcome-container';
        container.innerHTML = welcomeMessage;
        chatHistory.appendChild(container);
        
        // اضافه کردن event listener برای دکمه‌های پیشنهادی
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                userInput.value = this.textContent;
                userInput.focus();
            });
        });
    }
    
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message || isWaitingForResponse) return;
        
        // نمایش پیام کاربر
        displayMessage(message, 'user');
        addMessageToChat(currentChatId, message, 'user');
        
        // به‌روزرسانی عنوان چت اگر اولین پیام است
        if (chats[currentChatId].messages.length === 1) {
            chats[currentChatId].title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            saveChats();
            renderChatList();
        }
        
        userInput.value = '';
        userInput.style.height = 'auto';
        isWaitingForResponse = true;
        
        // نمایش نشانگر تایپ هوش مصنوعی
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai-message typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatHistory.appendChild(typingIndicator);
        scrollToBottom();
        
        // ارسال به API هوش مصنوعی
        getAIResponse(message).then(response => {
            chatHistory.removeChild(typingIndicator);
            displayMessage(response, 'ai');
            addMessageToChat(currentChatId, response, 'assistant');
            isWaitingForResponse = false;
        }).catch(error => {
            chatHistory.removeChild(typingIndicator);
            displayMessage("متأسفانه در پردازش درخواست شما خطایی رخ داده است.", 'ai');
            addMessageToChat(currentChatId, "متأسفانه در پردازش درخواست شما خطایی رخ داده است.", 'assistant');
            isWaitingForResponse = false;
            console.error('Error:', error);
        });
    }
    
    function displayMessage(message, sender, scroll = true) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const content = document.createElement('div');
        content.className = 'message-content';
        if (sender === 'ai') {
            content.classList.add('nastaliq-font');
        }
        content.textContent = message;
        messageElement.appendChild(content);
        
        // فقط برای پیام‌های هوش مصنوعی دکمه‌های action اضافه می‌کنیم
        if (sender === 'ai') {
            const actions = document.createElement('div');
            actions.className = 'message-actions';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.title = 'کپی پاسخ';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                copyToClipboard(message);
            });
            
            const regenerateBtn = document.createElement('button');
            regenerateBtn.className = 'regenerate-btn';
            regenerateBtn.title = 'بازنویسی پاسخ';
            regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            regenerateBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                regenerateResponse(messageElement);
            });
            
            actions.appendChild(copyBtn);
            actions.appendChild(regenerateBtn);
            messageElement.appendChild(actions);
        }
        
        chatHistory.appendChild(messageElement);
        
        if (scroll) {
            scrollToBottom();
        }
    }
    
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            const notice = document.createElement('div');
            notice.className = 'copied-notice';
            notice.textContent = 'کپی شد!';
            event.target.closest('.message').appendChild(notice);
            
            setTimeout(() => {
                notice.remove();
            }, 3000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }
    
    function regenerateResponse(messageElement) {
        const lastUserMessage = chats[currentChatId].messages
            .slice().reverse()
            .find(msg => msg.role === 'user');
        
        if (!lastUserMessage) return;
        
        // حذف پیام قبلی
        messageElement.remove();
        
        // حذف آخرین پاسخ هوش مصنوعی از تاریخچه چت
        chats[currentChatId].messages = chats[currentChatId].messages
            .filter(msg => msg.role !== 'assistant' || 
                   msg !== chats[currentChatId].messages.slice().reverse()
                   .find(m => m.role === 'assistant'));
        
        saveChats();
        
        // نمایش نشانگر تایپ
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai-message typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatHistory.appendChild(typingIndicator);
        scrollToBottom();
        
        // درخواست پاسخ جدید با تنظیمات دقیق‌تر
        getAIResponse(lastUserMessage.content, true).then(response => {
            chatHistory.removeChild(typingIndicator);
            displayMessage(response, 'ai');
            addMessageToChat(currentChatId, response, 'assistant');
        }).catch(error => {
            chatHistory.removeChild(typingIndicator);
            displayMessage("متأسفانه در پردازش درخواست شما خطایی رخ داده است.", 'ai');
            addMessageToChat(currentChatId, "متأسفانه در پردازش درخواست شما خطایی رخ داده است.", 'assistant');
            console.error('Error:', error);
        });
    }
    
    function addMessageToChat(chatId, content, role) {
        if (!chats[chatId]) return;
        
        chats[chatId].messages.push({
            content,
            role,
            timestamp: new Date().toISOString()
        });
        
        saveChats();
    }
    
    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
    async function getAIResponse(message, precise = false) {
        // اینجا باید آدرس API واقعی و کلید API خود را قرار دهید
        const API_URL = 'https://api.gapapi.com/v1';
        const API_KEY = 'sk-3jOHwUslaY8Io0v68k4ZFCfQCe3xyMcdihOarWf11pmssPOZ';
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "Qwen/Qwen2-72B-Instruct",
                    messages: [
                        {
                            role: "system",
                            content: precise ? 
                                "شما یک مدل هوش مصنوعی به نام هوش مصنوعی پارسی هستید. لطفاً پاسخ را با دقت و جزئیات بیشتر ارائه دهید. از منابع معتبر استفاده کنید و پاسخ را کاملاً ساختارمند ارائه دهید." :
                                "شما یک مدل هوش مصنوعی به نام هوش مصنوعی پارسی هستید. پاسخ‌های خود را با لحن دوستانه و رسمی ارائه دهید. تو از چندین زبان پشتیبانی میکنی یکی انگلیسی و فارسی و عربی و آلمانی."
                        },
                        ...chats[currentChatId].messages.map(msg => ({
                            role: msg.role,
                            content: msg.content
                        }))
                    ],
                    temperature: precise ? 0.3 : 0.7, // دقت بیشتر با temperature پایین‌تر
                    max_tokens: precise ? 1500 : 1000 // پاسخ‌های طولانی‌تر برای حالت دقیق
                })
            });
            
            if (!response.ok) {
                throw new Error(`خطای API: ${response.status}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error calling AI API:', error);
            throw error;
        }
    }
});

