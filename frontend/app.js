// ================================
// Configuration (unchanged)
// ================================
const COGNITO_DOMAIN = "https://us-east-15pnhohgct.auth.us-east-1.amazoncognito.com";
const CLIENT_ID = "ol5smuff05sa55cpbi4us96lh";
const REDIRECT_URI = "https://main.d1pgn8um2fjyka.amplifyapp.com/";
const API_URL = "https://lcjln7lx48.execute-api.us-east-1.amazonaws.com/tasks";

// ================================
// State + DOM (filled after page loads)
// ================================
let allTasks = [];
let loginButton, status, addTaskButton, taskInput, taskList, taskCount, searchInput;

function getToken() {
    return sessionStorage.getItem("access_token");
}

// ================================
// Helpers
// ================================

// Accepts: [..] | {tasks:[..]} | {items:[..]} | {Items:[..]} | {body:"<json>"}
function normalizeTasks(data) {
    if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return []; }
    }
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
        if (data.body !== undefined) return normalizeTasks(data.body);
        for (const key of ["tasks", "items", "Items", "data"]) {
            if (Array.isArray(data[key])) return data[key];
        }
    }
    return [];
}

function extractTask(data) {
    if (data && typeof data === "object") {
        if (data.body !== undefined) {
            try {
                const inner = typeof data.body === "string" ? JSON.parse(data.body) : data.body;
                return extractTask(inner);
            } catch { return null; }
        }
        const t = data.task || data.item || data.Item || data;
        if (t && typeof t.title === "string" && t.title) return t;
    }
    return null;
}

function setStatus(msg) {
    if (status) status.textContent = msg;
}

// ================================
// Login / Sign Out
// ================================
function login() {
    if (getToken()) { signOut(); return; }

    window.location.href =
        `${COGNITO_DOMAIN}/login` +
        `?client_id=${CLIENT_ID}` +
        `&response_type=code` +
        `&scope=email+openid+phone` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
}

async function handleCallback() {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return false;

    try {
        setStatus("Signing in...");

        const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: CLIENT_ID,
                code: code,
                redirect_uri: REDIRECT_URI
            })
        });

        if (!response.ok) throw new Error(`Token request failed: ${response.status}`);

        const tokens = await response.json();
        sessionStorage.setItem("access_token", tokens.access_token);
        sessionStorage.setItem("id_token", tokens.id_token);

        window.history.replaceState({}, document.title, REDIRECT_URI);

        showLoggedInState();
        await loadTasks();
        return true;
    } catch (error) {
        console.error("Login error:", error);
        setStatus("Login failed.");
        return true; // callback was handled (even if it failed)
    }
}

async function checkSession() {
    if (!getToken()) return;
    showLoggedInState();
    await loadTasks();
}

function showLoggedInState() {
    loginButton.textContent = "Sign Out";
    setStatus("You are logged in.");
}

function signOut() {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("id_token");

    allTasks = [];
    taskList.innerHTML = "";
    taskCount.textContent = "0 tasks";
    searchInput.value = "";
    setStatus("You are logged out.");

    window.location.href =
        `${COGNITO_DOMAIN}/logout` +
        `?client_id=${CLIENT_ID}` +
        `&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;
}

// ================================
// GET TASKS
// ================================
async function loadTasks(silent = false) {
    const accessToken = getToken();
    if (!accessToken) return;

    try {
        if (!silent) setStatus("Loading tasks...");

        const response = await fetch(API_URL, {
            method: "GET",
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            console.error("GET Error:", response.status, await response.text());
            throw new Error(`GET Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Raw GET response:", data);

        allTasks = normalizeTasks(data);
        renderTasks();

        if (!silent) setStatus("Tasks loaded successfully.");
    } catch (error) {
        console.error("Load tasks error:", error);
        setStatus("Failed to load tasks.");
    }
}

// ================================
// ADD TASK
// ================================
async function addTask() {
    const accessToken = getToken();

    if (!accessToken) {
        setStatus("Please login first to add a task.");
        return;
    }

    const title = taskInput.value.trim();
    if (!title) {
        setStatus("Please enter a task.");
        return;
    }

    try {
        setStatus("Adding task...");

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({ title: title })
        });

        if (!response.ok) {
            console.error("POST Error:", response.status, await response.text());
            throw new Error(`POST Error: ${response.status}`);
        }

        let data = null;
        try { data = await response.json(); } catch { /* empty body is fine */ }
        console.log("Raw POST response:", data);

        // Clear the input AND the search, so the new task is not filtered out
        taskInput.value = "";
        searchInput.value = "";

        const newTask = extractTask(data);

        if (newTask) {
            allTasks.push(newTask);
            renderTasks();
        } else {
            // API didn't return the task itself -> reload from the server
            await loadTasks(true);
        }

        setStatus("Task added successfully.");
    } catch (error) {
        console.error("Add task error:", error);
        setStatus("Failed to add task.");
    }
}

// ================================
// RENDER TASKS (with search)
// ================================
function renderTasks() {
    const searchText = searchInput.value.trim().toLowerCase();

    const tasksToShow = searchText === ""
        ? allTasks
        : allTasks.filter(task =>
            String(task.title || "").toLowerCase().includes(searchText)
          );

    taskList.innerHTML = "";

    if (tasksToShow.length === 0) {
        const li = document.createElement("li");
        li.textContent = searchText ? "No tasks found." : "No tasks yet.";
        li.classList.add("empty-task");
        taskList.appendChild(li);
        updateTaskCount(0);
        return;
    }

    tasksToShow.forEach(task => {
        const li = document.createElement("li");
        li.textContent = task.title;
        taskList.appendChild(li);
    });

    updateTaskCount(tasksToShow.length);
}

function updateTaskCount(count) {
    taskCount.textContent = count === 1 ? "1 task" : `${count} tasks`;
}

// ================================
// Start Application (after DOM is ready)
// ================================
document.addEventListener("DOMContentLoaded", async function () {
    loginButton   = document.getElementById("loginButton");
    status        = document.getElementById("status");
    addTaskButton = document.getElementById("addTask");
    taskInput     = document.getElementById("taskInput");
    taskList      = document.getElementById("taskList");
    taskCount     = document.getElementById("taskCount");
    searchInput   = document.getElementById("searchInput");

    // Tell us exactly which id is missing/misspelled in the HTML
    const required = { loginButton, status, addTaskButton, taskInput, taskList, taskCount, searchInput };
    const missing = Object.keys(required).filter(k => !required[k]);
    if (missing.length) {
        console.error("Missing HTML elements with these ids:", missing);
        alert("Missing HTML ids: " + missing.join(", "));
        return;
    }

    loginButton.addEventListener("click", login);
    addTaskButton.addEventListener("click", addTask);
    searchInput.addEventListener("input", renderTasks);

    // Pressing Enter in the task input adds the task
    taskInput.addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });

    const handled = await handleCallback();
    if (!handled) await checkSession();
});
