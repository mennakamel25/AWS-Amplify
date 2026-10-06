// ================================
// DOM Elements
// ================================

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
// API Gateway
// ================================

const API_URL =
    "https://lcjln7lx48.execute-api.us-east-1.amazonaws.com/tasks";


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

    const params =
        new URLSearchParams(window.location.search);

    const code =
        params.get("code");

    if (!code) {
        return;
    }

    try {

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
                        grant_type: "authorization_code",
                        client_id: CLIENT_ID,
                        code: code,
                        redirect_uri: REDIRECT_URI
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


        // Save tokens
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


        // Update UI
        status.textContent =
            "You are logged in.";

        loginButton.textContent =
            "Logged in";

        loginButton.disabled =
            true;


        console.log("Login successful");


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

        loginButton.disabled =
            true;

    }

}


// ================================
// Add Task
// ================================

addTaskButton.addEventListener(
    "click",
    async () => {

        // ============================
        // Check Login
        // ============================

        const accessToken =
            sessionStorage.getItem("access_token");


        if (!accessToken) {

            status.textContent =
                "Please login first to add a task.";

            return;

        }


        // ============================
        // Get Task
        // ============================

        const title =
            taskInput.value.trim();


        if (!title) {

            status.textContent =
                "Please enter a task.";

            return;

        }


        // ============================
        // Generate Task ID
        // ============================

        const taskId =
            Date.now().toString();


        try {

            status.textContent =
                "Adding task...";


            // ========================
            // POST /tasks
            // ========================

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
                            taskId: taskId,
                            title: title
                        })
                    }
                );


            // ========================
            // Check Response
            // ========================

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


            // ========================
            // Get Lambda Response
            // ========================

            const task =
                await response.json();


            console.log(
                "Task created:",
                task
            );


            // ========================
            // Show Task in UI
            // ========================

            const li =
                document.createElement("li");

            li.textContent =
                task.title;

            taskList.appendChild(li);


            // ========================
            // Clear Input
            // ========================

            taskInput.value = "";


            // ========================
            // Update Counter
            // ========================

            updateTaskCount();


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

checkSession()
