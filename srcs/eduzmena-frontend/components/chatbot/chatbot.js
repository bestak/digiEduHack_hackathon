// Chatbot WebSocket client with JSON response processing

const CONFIG = {
    wsUrl: "http://localhost:8000/chat",
    // Fields to extract from JSON response (tried in order)
    responseFields: ["response", "message", "text", "content", "data.response", "data.message", "result", "answer"],
    errorFields: ["error", "error_message", "errorMessage", "message"]
};

const chatWindow = document.getElementById("chat-window");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

/**
 * Get value from object using dot notation path
 */
function getValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Extract response text from JSON
 */
function extractResponse(json) {
    // Try each field
    for (const field of CONFIG.responseFields) {
        const value = getValue(json, field);
        if (value != null) {
            return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        }
    }
    // Fallback: return whole object as JSON
    return JSON.stringify(json, null, 2);
}

/**
 * Extract error message from JSON
 */
function extractError(json) {
    for (const field of CONFIG.errorFields) {
        const value = getValue(json, field);
        if (value != null) return String(value);
    }
    return "An error occurred";
}

/**
 * Process WebSocket message
 */
function processMessage(data) {
    try {
        const json = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Check for errors
        if (json.error || json.status === 'error' || json.type === 'error') {
            return { type: 'error', content: extractError(json) };
        }
        
        // Extract response
        return { type: 'message', content: extractResponse(json) };
    } catch (e) {
        // Not JSON, return as plain text
        return { type: 'message', content: String(data) };
    }
}

/**
 * Add message to chat window
 */
function appendMessage(text, sender, isError = false) {
    const div = document.createElement("div");
    div.className = `message ${sender}${isError ? ' error' : ''}`;
    div.textContent = text;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Show connection status
 */
function showStatus(text) {
    const div = document.createElement("div");
    div.className = "message system status-message";
    div.textContent = `[${text}]`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Connect to WebSocket
 */
function connect() {
    try {
        socket = new WebSocket(CONFIG.wsUrl);

        socket.onopen = () => {
            console.log("Connected");
            reconnectAttempts = 0;
            showStatus("Connected");
        };

        socket.onerror = () => showStatus("Connection error");

        socket.onclose = () => {
            showStatus("Disconnected");
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                setTimeout(() => {
                    showStatus(`Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`);
                    connect();
                }, 3000);
            } else {
                showStatus("Connection failed. Please refresh.");
            }
        };

        socket.onmessage = (event) => {
            const processed = processMessage(event.data);
            appendMessage(processed.content, "bot", processed.type === 'error');
        };
    } catch (error) {
        console.error("Connection error:", error);
        showStatus("Connection failed");
    }
}

/**
 * Send message
 */
function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(text);
    appendMessage(text, "user");
    chatInput.value = "";
    
    // Remove status on first message
    const status = chatWindow.querySelector('.status-message');
    if (status) status.remove();
}

// Initialize
if (chatWindow && chatInput && sendBtn) {
    connect();
    sendBtn.addEventListener("click", sendMessage);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
} else {
    console.error("Chatbot elements not found");
}
