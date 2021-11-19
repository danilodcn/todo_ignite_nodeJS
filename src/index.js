const express = require("express");
const { v4: uuid4 } = require("uuid");

const users = [];

const app = express();
app.use(express.json());

function findUserByUsername(username) {
  const user = users.find((user) => user.username === username);
  return user;
}

function checkExistUserAccount(request, response, next) {
  const { username } = request.headers;
  if (!username) {
    return response.status(400).json({ error: "username not in headers" });
  }

  const user = findUserByUsername(username);

  if (!user) {
    return response.status(400).json({ error: "user not exist" });
  }

  request.user = user;
  return next();
}

function getTodoUsingID(request, response, next) {
  const user = request.user;

  const { id } = request.params;
  if (!id) {
    return response.status(400).json({ error: "id not found in route params" });
  }

  const todo = user.todos.find((todo) => todo.id == id);
  if (!todo) {
    return response.status(400).json({ error: "todo not found" });
  }

  request.todo = todo;
  request.id = id;

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  if (!name || !username) {
    return response.status(400).json({ error: "user or username not found" });
  }

  const user_exist = findUserByUsername(username);

  if (user_exist) {
    return response.status(400).json({ error: "user already exist" });
  }
  let user = {
    id: uuid4(),
    name,
    username,
    todos: [],
  };
  users.push(user);
  response.status(201).json(user);
});

app.get("/todos", checkExistUserAccount, (request, response) => {
  const user = request.user;

  return response.json(user.todos);
});

app.post("/todos", checkExistUserAccount, (request, response) => {
  const user = request.user;
  const { title, deadline } = request.body;

  if (!title || !deadline) {
    return response.status(400).json({ error: "title or deadline not found" });
  }

  const todo = {
    id: uuid4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };
  user.todos.push(todo);

  return response.json(todo);
});

app.put(
  "/todos/:id",
  checkExistUserAccount,
  getTodoUsingID,
  (request, response) => {
    const { todo } = request;
    const { title, deadline } = request.body;

    if (!title || !deadline) {
      return response
        .status(400)
        .json({ error: "title or deadline not found" });
    }

    todo.title = title;
    todo.deadline = deadline;
    return response.send(todo);
  }
);

app.patch(
  "/todos/:id/done",
  checkExistUserAccount,
  getTodoUsingID,
  (request, response) => {
    const { todo } = request;

    todo.done = true;

    return response.json(todo);
  }
);

app.delete(
  "/todos/:id",
  checkExistUserAccount,
  getTodoUsingID,
  (request, response) => {
    const { id, user } = request;
    user.todos = user.todos.filter((todo) => todo.id != id);
    
    return response.json(user);
  }
);

app.listen(4000, () => {
  console.log("server running on http://localhost:4000");
});
