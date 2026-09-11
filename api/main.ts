/// <reference lib="deno.unstable" />
import "@std/dotenv/load";
import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import type { UIMessage } from "ai";
import routeStaticFilesFrom from "./util/routeStaticFilesFrom.ts";
import { handleChat } from "./agent/main.ts";

export const app = new Application();
const router = new Router();

const kv = await Deno.openKv();

export interface User {
  username: string;
  password: string; // In production this would be hashed; storing credentials in KV per requirements
  dateCreated: string;
  lastLogin: string | null;
}

// Chat history endpoint
router.get("/api/chat/history", async (ctx) => {
  const username = ctx.request.url.searchParams.get("username") ?? "anonymous";
  const entry = await kv.get<UIMessage[]>(["chat_history", username]);
  ctx.response.body = { messages: entry.value ?? [] };
});

// Chat agent endpoint
router.post("/api/chat", handleChat);

// Delete single message
router.delete("/api/chat/message", async (ctx) => {
  try {
    const username = ctx.request.url.searchParams.get("username") ?? "anonymous";
    const messageId = ctx.request.url.searchParams.get("messageId");

    if (!messageId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "messageId is required" };
      return;
    }

    const entry = await kv.get<UIMessage[]>(["chat_history", username]);
    const messages = entry.value ?? [];

    const filteredMessages = messages.filter((msg) => msg.id !== messageId);

    if (filteredMessages.length === messages.length) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Message not found" };
      return;
    }

    await kv.set(["chat_history", username], filteredMessages);
    ctx.response.body = { success: true };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: (err as Error).message };
  }
});

// Clear entire conversation
router.delete("/api/chat/history", async (ctx) => {
  try {
    const username = ctx.request.url.searchParams.get("username") ?? "anonymous";

    await kv.delete(["chat_history", username]);
    ctx.response.body = { success: true };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: (err as Error).message };
  }
});

// Hello endpoint
router.get("/api/hello", (ctx) => {
  const name = (ctx.request.url.searchParams.get("name") ?? "friend").trim();
  ctx.response.type = "json";
  ctx.response.body = {
    message: `Hello ${name} from backend template!`,
  };
});

// Register
router.post("/api/register", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { username, password } = body;

    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      ctx.response.status = 400;
      ctx.response.body = { error: "Username and password are required" };
      return;
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Username cannot be empty" };
      return;
    }

    const existing = await kv.get<User>(["users", trimmedUsername]);
    if (existing.value) {
      ctx.response.status = 409;
      ctx.response.body = { error: "Username already exists" };
      return;
    }

    const now = new Date().toISOString();
    const newUser: User = {
      username: trimmedUsername,
      password,
      dateCreated: now,
      lastLogin: null,
    };

    const res = await kv.set(["users", trimmedUsername], newUser);
    if (!res.ok) {
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to create user" };
      return;
    }

    const { password: _, ...safeUser } = newUser;
    ctx.response.status = 201;
    ctx.response.body = { message: "User registered successfully", user: safeUser };
  } catch (err) {
    ctx.response.status = 400;
    ctx.response.body = { error: (err as Error).message || "Invalid JSON" };
  }
});

// Login
router.post("/api/login", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { username, password } = body;

    if (!username || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Username and password are required" };
      return;
    }

    const trimmedUsername = username.trim();
    const entry = await kv.get<User>(["users", trimmedUsername]);

    if (!entry.value || entry.value.password !== password) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid username or password" };
      return;
    }

    const now = new Date().toISOString();
    const updatedUser: User = {
      ...entry.value,
      lastLogin: now,
    };

    await kv.set(["users", trimmedUsername], updatedUser);

    const { password: _, ...safeUser } = updatedUser;
    ctx.response.body = { message: "Login successful", user: safeUser };
  } catch (err) {
    ctx.response.status = 400;
    ctx.response.body = { error: (err as Error).message || "Invalid JSON" };
  }
});

// User profile by username
router.get("/api/users/:username", async (ctx) => {
  const username = ctx.params.username;
  if (!username) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Username parameter missing" };
    return;
  }

  const entry = await kv.get<User>(["users", username]);
  if (!entry.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "User not found" };
    return;
  }

  const { password: _, ...safeUser } = entry.value;
  ctx.response.body = { user: safeUser };
});

// List all users
router.get("/api/users", async (ctx) => {
  const users: Omit<User, "password">[] = [];
  const entries = kv.list<User>({ prefix: ["users"] });

  for await (const entry of entries) {
    const { password: _, ...safeUser } = entry.value;
    users.push(safeUser);
  }

  ctx.response.body = { users };
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(routeStaticFilesFrom([
  `${Deno.cwd()}/dist`,
  `${Deno.cwd()}/public`,
]));

if (import.meta.main) {
  console.log("Server listening on port http://localhost:8000");
  await app.listen({ port: 8000 });
}
