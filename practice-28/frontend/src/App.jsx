import React, { useCallback, useEffect, useState } from "react";
import { api, getToken, getUser, setToken, setUser } from "./api.js";

export default function App() {
  const [user, setUserState] = useState(getUser());
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const loadPosts = useCallback(async () => {
    const data = await api.posts();
    setPosts(data.posts);
  }, []);

  useEffect(() => {
    loadPosts().catch(() => {});
  }, [loadPosts]);

  async function handleAuth(mode) {
    setError("");
    try {
      const fn = mode === "login" ? api.login : api.register;
      const data = await fn({ email, password });
      setToken(data.token);
      setUser(data.user);
      setUserState(data.user);
      await loadPosts();
      if (data.user.role === "admin") {
        const s = await api.adminStats();
        setStats(s);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setUserState(null);
    setStats(null);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createPost({ title, body });
      setTitle("");
      setBody("");
      await loadPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    await api.deletePost(id);
    await loadPosts();
  }

  return (
    <div className="app">
      <h1>Лента постов</h1>
      {error && <p className="error">{error}</p>}

      {!getToken() ? (
        <div className="card">
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" onClick={() => handleAuth("login")}>
            Войти
          </button>{" "}
          <button type="button" onClick={() => handleAuth("register")}>
            Регистрация
          </button>
          <p>Админ: admin@example.com / admin123</p>
        </div>
      ) : (
        <>
          <div className="card">
            <p>
              {user.email} ({user.role})
            </p>
            <button type="button" onClick={logout}>
              Выйти
            </button>
            {stats && (
              <p>
                Статистика: пользователей {stats.users}, постов {stats.posts}
              </p>
            )}
          </div>
          <form className="card" onSubmit={handleCreate}>
            <h2>Новый пост</h2>
            <input placeholder="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea placeholder="Текст" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
            <button type="submit">Опубликовать</button>
          </form>
        </>
      )}

      <section>
        {posts.map((p) => (
          <article className="card" key={p.id}>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
            <small>{p.author_email}</small>
            {user && (user.role === "admin" || user.id === p.user_id) && (
              <div>
                <button type="button" onClick={() => handleDelete(p.id)}>
                  Удалить
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
