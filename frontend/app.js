// ================================
// Add Task
// ================================

addTaskButton.addEventListener("click", async () => {

    // Get access token
    const accessToken =
        sessionStorage.getItem("access_token");

    // User must be logged in
    if (!accessToken) {

        status.textContent =
            "Please login first to add a task.";

        return;
    }


    // Get task title
    const title =
        taskInput.value.trim();

    if (!title) {
        return;
    }


    // Create a task ID
    const taskId =
        Date.now().toString();


    try {

        status.textContent =
            "Adding task...";


        // Send task to API Gateway
        const response = await fetch(
            "https://lcjln7lx48.execute-api.us-east-1.amazonaws.com/tasks",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${accessToken}`
                },

                body: JSON.stringify({
                    taskId: taskId,
                    title: title
                })
            }
        );


        // Check API response
        if (!response.ok) {

            throw new Error(
                `API Error: ${response.status}`
            );
        }


        // Read Lambda response
        const task =
            await response.json();


        // Add returned task to UI
        const li =
            document.createElement("li");

        li.textContent =
            task.title;

        taskList.appendChild(li);


        // Clear input
        taskInput.value = "";

        updateTaskCount();


        status.textContent =
            "Task added successfully.";

        console.log(
            "Task created:",
            task
        );


    } catch (error) {

        console.error(
            "Add task error:",
            error
        );

        status.textContent =
            "Failed to add task.";

    }

});
