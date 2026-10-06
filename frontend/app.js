
const loginButton = document.getElementById("loginButton");
const addTaskButton = document.getElementById("addTask");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");


/*
 * Cognito Hosted UI
 */

const cognitoLoginUrl =
    "https://us-east-15pnhohgct.auth.us-east-1.amazoncognito.com/login" +
    "?client_id=ol5smuff05sa55cpbi4us96lh" +
    "&response_type=code" +
    "&scope=email+openid+phone" +
    "&redirect_uri=" +
    encodeURIComponent(
        "https://main.d1pgn8um2fjyka.amplifyapp.com/"
    );


loginButton.addEventListener("click", () => {

    window.location.href = cognitoLoginUrl;

});


/*
 * Add Task
 */

addTaskButton.addEventListener("click", () => {

    const task = taskInput.value.trim();

    if (!task) {
        return;
    }

    const li = document.createElement("li");

    li.textContent = task;

    taskList.appendChild(li);

    taskInput.value = "";

    updateTaskCount();

});


/*
 * Update task count
 */

function updateTaskCount() {

    const count = taskList.children.length;

    taskCount.textContent =
        count === 1
            ? "1 task"
            : `${count} tasks`;

}
