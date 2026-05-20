# Практика 25 — Webpack / Vite, оптимизация бандла

## Стек

- React 18, Vite 5
- `react-router-dom`: маршруты `/` и `/about`
- `React.lazy` + `Suspense` для страницы «О нас»
- `rollup-plugin-visualizer`: отчёт `dist/bundle-report.html` после `npm run build`

## Запуск

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
```

После сборки откройте `dist/bundle-report.html` в браузере для просмотра карты бандла.
