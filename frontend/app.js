// ================================
// DOM Elements
// ================================

const loginButton = document.getElementById("loginButton");
const status = document.getElementById("status");

const addTaskButton = document.getElementById("addTask");
const taskInput = document.getElementById("taskInput");

const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");

const searchInput = document.getElementById("searchInput");


// ================================
// Configuration
// ================================

const COGNITO_DOMAIN =
    "https://us-east-15pnhohgct.auth.us-east-1.amazoncognito.com";

const CLIENT_ID =
    "ol5smuff05sa55cpbi4us96lh";

const REDIRECT_URI =
    "https://main.d1pgn8um2fjyka.amplifyapp.com/";

const API_URL =
    "https://lcjln7lx48.execute-api.us-east-1.amazonaws.com/tasks";


// ================================
// Tasks
// ================================

// All tasks returned from backend
let allTasks = [];


// ================================
// Login Button
// ================================

loginButton.addEventListener("click", () => {

    const accessToken =
        sessionStorage.getItem("access_token");

    if (accessToken) {

        signOut();

    } else {

        const loginUrl =
            `${COGNITO_DOMAIN}/login` +
            `?client_id=${CLIENT_ID}` +
            `&response_type=code` +
            `&scope=email+openid+phone` +
            `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

        window.location.href = loginUrl;
    }
});


// ================================
// Cognito Callback
// ================================

async function handleCallback() {

    const params =
        new URLSearchParams(window.location.search);

    const code =
        params.get("code");

    if (!code) {
        return;
    }

    try {

        status.textContent = "Signing in...";

        const response =
            await fetch(
                `${COGNITO_DOMAIN}/oauth2/token`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: new URLSearchParams({
                        grant_type:
                            "authorization_code",

                        client_id:
                            CLIENT_ID,

                        code:
                            code,

                        redirect_uri:
                            REDIRECT_URI
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                `Token request failed: ${response.status}`
            );
        }


        const tokens =
            await response.json();


        sessionStorage.setItem(
            "access_token",
            tokens.access_token
        );

        sessionStorage.setItem(
            "id_token",
            tokens.id_token
        );


        // Remove ?code= from URL
        window.history.replaceState(
            {},
            document.title,
            REDIRECT_URI
        );


        showLoggedInState();

        console.log("Login successful");


        await loadTasks();


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        status.textContent =
            "Login failed.";
    }
}


// ================================
// Check Session
// ================================

async function checkSession() {

    const accessToken =
        sessionStorage.getItem("access_token");

    if (accessToken) {

        showLoggedInState();

        await loadTasks();
    }
}


// ================================
// Logged In UI
// ================================

function showLoggedInState() {

    loginButton.textContent =
        "Sign Out";

    status.textContent =
        "You are logged in.";
}


// ================================
// Sign Out
// ================================

function signOut() {

    sessionStorage.removeItem(
        "access_token"
    );

    sessionStorage.removeItem(
        "id_token"
    );


    allTasks = [];

    taskList.innerHTML = "";

    taskCount.textContent =
        "0 tasks";

    searchInput.value = "";

    status.textContent =
        "You are logged out.";


    const logoutUrl =
        `${COGNITO_DOMAIN}/logout` +
        `?client_id=${CLIENT_ID}` +
        `&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;


    window.location.href =
        logoutUrl;
}


// ================================
// Add Task
// ================================

addTaskButton.addEventListener(
    "click",
    async () => {

        const accessToken =
            sessionStorage.getItem("access_token");


        // Must be logged in
        if (!accessToken) {

            status.textContent =
                "Please login first to add a task.";

            return;
        }


        const title =
            taskInput.value.trim();


        if (!title) {

            status.textContent =
                "Please enter a task.";

            return;
        }


        try {

            status.textContent =
                "Adding task...";


            const response =
                await fetch(
                    API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${accessToken}`
                        },

                        body: JSON.stringify({
                            title: title
                        })
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "API Error:",
                    response.status,
                    errorText
                );

                throw new Error(
                    `API Error: ${response.status}`
                );
            }


            const newTask =
                await response.json();


            console.log(
                "Task created:",
                newTask
            );


            // Add task to all tasks
            allTasks.push(newTask);


            // Clear input
            taskInput.value = "";


            // IMPORTANT:
            // Re-apply current search
            renderTasks();


            status.textContent =
                "Task added successfully.";


        } catch (error) {

            console.error(
                "Add task error:",
                error
            );

            status.textContent =
                "Failed to add task.";
        }
    }
);


// ================================
// Load Tasks
// ================================

async function loadTasks() {

    const accessToken =
        sessionStorage.getItem("access_token");


    if (!accessToken) {
        return;
    }


    try {

        status.textContent =
            "Loading tasks...";


        const response =
            await fetch(
                API_URL,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`
                    }
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "GET API Error:",
                response.status,
                errorText
            );

            throw new Error(
                `GET API Error: ${response.status}`
            );
        }


        allTasks =
            await response.json();


        // Display tasks
        renderTasks();


        status.textContent =
            "Tasks loaded successfully.";


    } catch (error) {

        console.error(
            "Load tasks error:",
            error
        );

        status.textContent =
            "Failed to load tasks.";
    }
}


// ================================
// Render Tasks
// ================================

function renderTasks() {

    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    // ============================
    // Filter
    // ============================

    const filteredTasks =
        allTasks.filter(task => {

            const title =
                String(task.title || "")
                    .toLowerCase();

            return title.includes(searchText);
        });


    // Clear current list
    taskList.innerHTML = "";


    // ============================
    // No Results
    // ============================

    if (filteredTasks.length === 0) {

        const emptyMessage =
            document.createElement("li");

        emptyMessage.textContent =
            searchText
                ? "No tasks found."
                : "No tasks yet.";

        emptyMessage.classList.add(
            "empty-task"
        );

        taskList.appendChild(
            emptyMessage
        );


        updateTaskCount(0);

        return;
    }


    // ============================
    // Display Filtered Tasks
    // ============================

    filteredTasks.forEach(task => {

        const li =
            document.createElement("li");

        li.textContent =
            task.title;

        taskList.appendChild(li);
    });


    // Count only visible tasks
    updateTaskCount(
        filteredTasks.length
    );
}


// ================================
// Search
// ================================

searchInput.addEventListener(
    "input",
    () => {

        renderTasks();
    }
);


// ================================
// Task Count
// ================================

function updateTaskCount(count) {

    taskCount.textContent =
        count === 1
            ? "1 task"
            : `${count} tasks`;
}


// ================================
// Start Application
// ================================

handleCallback();

checkSession();
