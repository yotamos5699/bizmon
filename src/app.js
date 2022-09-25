import inquirer from "inquirer";
import axios from "axios";
import "inquirer/lib/objects/choices.js";
require("dotenv").config();
const apiUrl = process.env.DB_GOOGLESHEET_URL;

const main = async () => {
  let data = await axios.get(apiUrl);

  let devName = await inquirer
    .prompt([
      {
        type: "list",
        message: "Pick Developer Name",
        name: "devName",
        choices: data.data.developers,
      },
    ])
    .catch((err) => console.log(err));

  let developers_related_tasks = [];
  console.log("dev name", devName);

  data.data.mainTasks.forEach((task) => {
    if (task.developer === devName.devName) developers_related_tasks.push(task);
  });

  //console.log(developers_related_tasks);

  let dev_related_tasks = developers_related_tasks.map((task) => {
    return { task_name: task.task_name, ID: task.ID };
  });

  dev_related_tasks.push(
    { task_name: "__ADD NEW TASK__", ID: null },
    { task_name: "__EDIT TASK__", ID: null }
  );

  console.table(developers_related_tasks);
  let main_task_selection = await inquirer
    .prompt([
      {
        type: "list",
        message: "Pick A Task",
        name: "task_name",
        choices: dev_related_tasks.map((task) => task.task_name),
      },
    ])
    .catch((err) => console.log(err));

  let related_sub_tasks = [];
  if (main_task_selection.task_name === "__ADD NEW TASK__") addMainTask();
  else if (main_task_selection.task_name === "__EDIT TASK__") editMainTask();
  else {
    console.log(dev_related_tasks);
    console.log("in else");
    const choiseID = dev_related_tasks.filter((task) => {
      if (task.task_name === main_task_selection.task_name) {
        return task.ID;
      }
    });

    data.data.subTasks.forEach((subTask) => {
      let ID = choiseID[0].ID;
      let sTask = subTask.mainTaskID;
      console.log({ ID, sTask });
      if (subTask.mainTaskID === ID) {
        related_sub_tasks.push(subTask);
      }
    });
  }
  console.table(related_sub_tasks);
  let related_sub_tasks_selection = related_sub_tasks;
  related_sub_tasks_selection.push({ task_name: "__ADD NEW TASK__", ID: null });

  let sub_task_selection = await inquirer
    .prompt([
      {
        type: "list",
        message: "Pick A Task",
        name: "task_name",
        choices: related_sub_tasks_selection.map((task) => task.task_name),
      },
    ])
    .catch((err) => console.log(err));

  let sub_tasks_data = related_sub_tasks.filter(
    (task) => task.task_name === sub_task_selection.task_name
  );
  console.table(sub_tasks_data);
  if (sub_task_selection.task === "__ADD NEW TASK__") addSubTask();
  else editSubTask(sub_tasks_data);
};
const addMainTask = () => {
  console.log("add task !!");
};

const editMainTask = () => {
  console.log("edit task !!!");
};

const editSubTask = async (sub_tasks_data) => {
  console.log(sub_tasks_data);
  let isSure = await inquirer.prompt({
    type: "confirm",
    message: "r u sure u whant to edit this task ",
    name: "isSure",
  });

  if (!isSure.isSure) {
    console.log("is not sure !!");
    return;
  }

  let isFinished = await inquirer.prompt({
    type: "confirm",
    message: "IS THE TASK FINISHED",
    name: "isFinished",
  });
  if (isFinished.isFinished) {
    console.log("is finished");

    axios
      .post({
        method: "post",
        url: apiUrl + `?ID=${sub_tasks_data[0].ID}&action=close_sub_task`,
        headers: {
          "Content-Type": "application/json",
          mode: "no-cors",
        },
      })
      .then((res) => console.log(res))
      .catch((err) => {
        console.log(err);
      });

    return;
  }

  let answers = await inquirer
    .prompt([
      {
        type: "input",
        message: "update task name (press enter to keep default)",
        name: "task_name",
        skip: true,
        default: sub_tasks_data[0].task_name,
      },
      {
        type: "input",
        message: "update task contect (press enter to keep default)",
        name: "task_content",
        default: sub_tasks_data[0].task_content,
      },
      {
        type: "number",
        message: "update priority (press enter to keep default)",
        name: "priority_points",
        default: sub_tasks_data[0].priority_points,
      },
    ])
    .catch((err) => console.log(err));
  let ff = sub_tasks_data[0];
  let object = { ...ff, ...answers };
  console.log(JSON.stringify(object, null, 2));
  let parameters = Object.keys(object);

  let urlParams = "";
  parameters.forEach((parameter, index) => {
    urlParams += `${parameter}=${object[parameter]}`;
    if (index != parameters.length - 1) urlParams += "&";
  });

  let postUrl = apiUrl + "?" + urlParams + "&action=edit_sub_task";

  console.log(postUrl);

  let config = {
    method: "post",
    url: postUrl,
    headers: {
      "Content-Type": "application/json",
      mode: "no-cors",
    },
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
};

main();
