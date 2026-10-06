
const loginButton = document.getElementById("loginButton");
const status = document.getElementById("status");

const addTaskButton = document.getElementById("addTask");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");


// ================================
// Cognito Configuration
// ================================

const COGNITO_DOMAIN =
    "https://us-east-15pnhohgct.auth.us-east-1.amazoncognito.com";

const CLIENT_ID =
    "ol5smuff05sa55cpbi4us96lh";

const REDIRECT_URI =
    "https://main.d1pgn8um2fjyka.amplifyapp.com/";


// ================================
// Login
// ================================

loginButton.addEventListener("click", () => {

    const loginUrl =
        `${COGNITO_DOMAIN}/login` +
        `?client_id=${CLIENT_ID}` +
        `&response_type=code` +
        `&scope=email+openid+phone` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    window.location.href = loginUrl;

});


// ================================
// Handle Cognito Callback
// ================================

async function handleCallback() {

    const params = new URLSearchParams(
        window.location.search
    );

    const code = params.get("code");

    // No authorization code
    if (!code) {
        return;
    }

    try {

        const response = await fetch(
            `${COGNITO_DOMAIN}/oauth2/token`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    client_id: CLIENT_ID,
                    code: code,
                    redirect_uri: REDIRECT_URI
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                "Failed to exchange authorization code"
            );
        }

        const tokens = await response.json();

        // Save tokens
        sessionStorage.setItem(
            "access_token",
            tokens.access_token
        );

        sessionStorage.setItem(
            "id_token",
            tokens.id_token
        );

        // Remove ?code=... from URL
        window.history.replaceState(
            {},
            document.title,
            REDIRECT_URI
        );

        // Update UI
        status.textContent =
            "You are logged in.";

        loginButton.textContent =
            "Logged in";

        loginButton.disabled = true;

        console.log("Login successful");

    } catch (error) {

        console.error("Login error:", error);

        status.textContent =
            "Login failed. Check the browser console.";

    }
}


// ================================
// Check Existing Session
// ================================

function checkSession() {

    const accessToken =
        sessionStorage.getItem("access_token");

    if (accessToken) {

        status.textContent =
            "You are logged in.";

        loginButton.textContent =
            "Logged in";

        loginButton.disabled = true;

    }

}


// ================================
// Add Task
// ================================

addTaskButton.addEventListener("click", () => {

    // Check if user is logged in
    const accessToken =
        sessionStorage.getItem("access_token");

    if (!accessToken) {

        status.textContent =
            "Please login first to add a task.";

        return;
    }


    // Get task text
    const task = taskInput.value.trim();

    if (!task) {
        return;
    }


    // Add task to UI
    const li = document.createElement("li");

    li.textContent = task;

    taskList.appendChild(li);

    taskInput.value = "";

    updateTaskCount();


    status.textContent =
        "Task added successfully.";

});


// ================================
// Update Task Count
// ================================

function updateTaskCount() {

    const count =
        taskList.children.length;

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
