const taskInput = document.getElementById("taskInput");
const addTaskButton = document.getElementById("addTask");
const taskList = document.getElementById("taskList");

addTaskButton.addEventListener("click", () => {

    const task = taskInput.value.trim();

    if (!task) {
        return;
    }

    const li = document.createElement("li");

    li.textContent = task;

    taskList.appendChild(li);

    taskInput.value = "";
});