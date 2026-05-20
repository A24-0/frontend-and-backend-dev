import React, { Suspense, lazy } from "react";
import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";

const About = lazy(() => import("./pages/About.jsx"));

export default function App() {
  return (
    <>
      <nav>
        <Link to="/">Главная</Link>
        <Link to="/about">О нас</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/about"
            element={
              <Suspense fallback={<p>Загрузка…</p>}>
                <About />
              </Suspense>
            }
          />
        </Routes>
      </main>
    </>
  );
}
