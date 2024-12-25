// 在文件开头添加 axios 检查
if (typeof axios === 'undefined') {
    console.error('Axios 未正确加载！');
    // 尝试重新加载 axios
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/axios@1.6.7/dist/axios.min.js';
    script.onload = () => {
        console.log('Axios 已成功加载');
        // 初始化聊天功能
        initChat();
    };
    document.head.appendChild(script);
} else {
    // 直接初始化聊天功能
    initChat();
}

// 将原来的 DOMContentLoaded 事件处理程序移到这个函数中
function initChat() {
    const API_URL = 'https://api.moonshot.cn/v1/chat/completions';
    const API_KEY = 'sk-DWr1GOOUw7LVhBf5RFIaUQ2hqSIO5oCarCeEvSwwsTtq0Gtu';
    let conversationHistory = [];

    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendMessage');
    const voiceButton = document.getElementById('voiceInput');
    const themeToggle = document.getElementById('toggleTheme');
    const clearButton = document.getElementById('clearChat');
    const emojiButton = document.getElementById('emojiButton');

    // API 调用函数
    async function callMoonshotAPI(message) {
        try {
            console.log('发送请求到 API...', {
                url: API_URL,
                message: message,
                history: conversationHistory
            });

            const requestBody = {
                model: "moonshot-v1-8k",
                messages: conversationHistory.concat([{
                    role: "user",
                    content: message
                }]),
                temperature: 0.7
            };

            console.log('请求体:', requestBody);

            const response = await axios({
                method: 'post',
                url: API_URL,
                data: requestBody,
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30秒超时
            });
            
            console.log('API 响应:', response.data);
            
            if (response.data && response.data.choices && response.data.choices[0]) {
                return response.data.choices[0].message.content;
            } else {
                console.error('API 响应格式不正确:', response.data);
                throw new Error('API 响应格式错误');
            }
        } catch (error) {
            console.error('完整错误信息:', error);
            
            if (error.response) {
                // 服务器返回了错误状态码
                console.error('服务器响应错误:', {
                    status: error.response.status,
                    data: error.response.data
                });
                
                switch (error.response.status) {
                    case 401:
                        throw new Error('API 密钥无效或已过期');
                    case 429:
                        throw new Error('请求过于频繁，请稍后再试');
                    case 500:
                        throw new Error('服务器内部错误');
                    default:
                        throw new Error(`服务器返回错误 (${error.response.status})`);
                }
            } else if (error.request) {
                // 请求已发送但没有收到响应
                console.error('未收到服务器响应');
                throw new Error('无法连接到服务器，请检查网络连接');
            } else {
                // 请求配置出错
                console.error('请求配置错误:', error.message);
                throw new Error('请求配置错误: ' + error.message);
            }
        }
    }

    // 主题切换
    themeToggle.addEventListener('click', () => {
        document.body.dataset.theme = 
            document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        themeToggle.querySelector('i').classList.toggle('fa-moon');
        themeToggle.querySelector('i').classList.toggle('fa-sun');
    });

    // 清空聊天记录
    clearButton.addEventListener('click', () => {
        if (confirm('确定要清空所有聊天记录吗？')) {
            chatMessages.innerHTML = '';
            conversationHistory = [];
            addMessage('聊天记录已清空。有什么我可以帮您的吗？', 'ai');
        }
    });

    // 发送消息
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            try {
                addMessage(message, 'user');
                userInput.value = '';
                sendButton.disabled = true;
                addThinkingMessage();

                const response = await callMoonshotAPI(message);
                removeThinkingMessage();
                
                if (response) {
                    addMessage(response, 'ai');
                    conversationHistory.push(
                        { role: "user", content: message },
                        { role: "assistant", content: response }
                    );
                } else {
                    addMessage('抱歉，我现在无法回答。请稍后再试。', 'ai');
                }
            } catch (error) {
                removeThinkingMessage();
                const errorMessage = error.message || '发生未知错误，请稍后重试';
                addMessage(errorMessage, 'error');
                console.error('聊天错误:', error);
            } finally {
                sendButton.disabled = false;
            }
        }
    }

    // 添加消息
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 添加思考中消息
    function addThinkingMessage() {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.classList.add('message', 'ai', 'thinking');
        thinkingDiv.textContent = '正在思考...';
        chatMessages.appendChild(thinkingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 移除思考中消息
    function removeThinkingMessage() {
        const thinkingMessage = chatMessages.querySelector('.thinking');
        if (thinkingMessage) {
            thinkingMessage.remove();
        }
    }

    // 模拟AI响应
    function getAIResponse(message) {
        const responses = [
            '我明白您的意思了。',
            '这是一个很好的问题。',
            '让我为您解答这个问题。',
            '我需要更多信息来帮助您。',
            '这个问题很有趣，让我想想。'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // 自动调整输入框高度
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    });

    // 事件监听器
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 语音输入功能
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'zh-CN';

        voiceButton.addEventListener('click', () => {
            recognition.start();
            voiceButton.classList.add('recording');
        });

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            userInput.value = text;
            voiceButton.classList.remove('recording');
        };

        recognition.onerror = () => {
            voiceButton.classList.remove('recording');
            alert('语音识别失败，请重试');
        };
    } else {
        voiceButton.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateButton');
    
    generateButton.addEventListener('click', () => {
        const projectPath = 'C:/Users/Administrator/Desktop/NewProject.1.toe';
        
        // 尝试多种方式打开文件
        const methods = [
            () => window.open(`touchdesigner:${projectPath}`),
            () => window.location.href = `touchdesigner:${projectPath}`,
            () => {
                const link = document.createElement('a');
                link.href = projectPath;
                link.click();
            },
            () => {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = `touchdesigner:${projectPath}`;
                document.body.appendChild(iframe);
                setTimeout(() => document.body.removeChild(iframe), 1000);
            }
        ];

        // 依次尝试每种方法
        let methodIndex = 0;
        const tryNextMethod = () => {
            if (methodIndex < methods.length) {
                try {
                    methods[methodIndex]();
                    console.log(`尝试方法 ${methodIndex + 1}`);
                    methodIndex++;
                    setTimeout(tryNextMethod, 1000);
                } catch (error) {
                    console.error(`方法 ${methodIndex + 1} 失败:`, error);
                    methodIndex++;
                    tryNextMethod();
                }
            } else {
                alert('无法打开文件，请手动打开 TouchDesigner 并加载项目文件。');
            }
        };

        tryNextMethod();
    });

    // 保持动画效果
    generateButton.addEventListener('mouseenter', () => {
        generateButton.classList.add('pulse');
    });

    generateButton.addEventListener('mouseleave', () => {
        generateButton.classList.remove('pulse');
    });

    const video = document.getElementById('bgVideo');
    
    // 监听视频加载状态
    video.addEventListener('loadeddata', () => {
        console.log('视频已加载成功');
        video.play().catch(error => {
            console.error('视频播放失败:', error);
        });
    });

    video.addEventListener('error', (e) => {
        console.error('视频加载错误:', e);
        console.log('视频路径:', video.querySelector('source').src);
        // 添加纯色背景作为后备方案
        document.querySelector('.hero').style.backgroundColor = '#1a1a1a';
    });

    // 如果 5 秒后视频还没加载，显示错误信息
    setTimeout(() => {
        if (video.readyState === 0) {
            console.error('视频加载超时');
            document.querySelector('.hero').style.backgroundColor = '#1a1a1a';
        }
    }, 5000);

    // 添加搜索功能
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    function handleSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            console.log('搜索:', searchTerm);
            // 这里可以添加实际的搜索逻辑
            alert('搜索功能正在开发中...');
        }
    }

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}); 