# Аудит проекта VladfsBET (19.09.2026)

## Итог
Проведён полный аудит и устранены слабые стороны. Все изменения проверены:
`typecheck` (web/api/db/config) и тесты проходят.

## Исправлено

### Критическое — сломанные тесты
- **Причина падения всех 7 тестовых файлов** (`packages/db`: 4, `apps/api`: 3) с ошибкой
  `TypeError: Cannot read properties of undefined (reading 'config')` — баг Vitest на Windows
  (vitest-dev/vitest#10692): при запуске из shell с нижним регистром буквы диска (`cd /d c:\...`)
  Vitest загружает вторую копию рантайма с пустым collector, и первый же `describe()` падает.
  На Linux (CI) баг не воспроизводится.
- **Решение**: добавлен кросс-платформенный launcher `scripts/run-vitest.mjs`, который нормализует
  букву диска к верхнему регистру перед запуском Vitest. Скрипты `test` в `packages/db`,
  `apps/api`, `apps/web` переведены на него. Проверено: 15 тестов db, 25 тестов api, web-тесты — проходят.
- **vitest закреплён на ^4.1.11** (совместим с таргетом Node 20 / `@types/node ^20`).
  vitest 5.x требует `@types/node ^22 || >=24` и несовместим с проектом.
- **Web-тест `route.test.ts` подключён**: в `apps/web` добавлен `vitest` в devDependencies и
  тест включён в `test`-скрипт (ранее файл не запускался и ломал `tsc --noEmit`).

### Безопасность
- `packages/config`: убраны жёстко зашитые дефолты `SESSION_SECRET`/`JWT_SECRET`.
  В production `getEnvConfig()` теперь падает с ошибкой, если секреты не заданы (fail-fast),
  вместо молчаливого использования известного ключа. В dev применяются явные dev-фоллбеки.
- `packages/db`: убран молчаливый no-op mock Prisma. Теперь при сбое инициализации клиент
  **бросает ошибку** (вместо возврата пустых данных); mock доступен только по явному
  `USE_MOCK_PRISMA=true` вне production.

### CI (`.github/workflows/ci.yml`)
- Пайплайн расширен: помимо build добавлены `db:generate`, `db:validate`,
  `db:migrate:deploy`, `typecheck`, `lint`, `test` (`npx turbo run test`).
- Добавлен корневой скрипт `db:migrate:deploy` и пакетный `db:migrate:deploy` (prisma migrate deploy).

### Качество кода (`apps/web`)
- ESLint: **100 → 28 предупреждений** (0 ошибок). Удалено 112 неиспользуемых импортов
  в 22 файлах (в основном неиспользуемые lucide-иконки).
- Удалён мёртвый `apps/web/src/proxy.ts` (нигде не импортировался).
- Исправлены React-предупреждения в `slot-tumble-grid.tsx` (setState в effect, exhaustive-deps,
  ref в рендере) и неиспользуемые импорты в `match-tracker.tsx`, `provably-fair.test.ts`.

### Гигиена репозитория
- `.gitignore`: добавлены `/*.png`, `/*.jpg`, `.playwright-mcp/` (корневые debug-артефакты,
  не задевая легитимные `apps/web/public/*.jpg`).

## Осталось (осознанный техдолг, 28 предупреждений, 0 ошибок)
- ~15 «assigned but never used» переменных/сеттеров состояния (признак мёртвого кода,
  напр. `setSelectedFeature` в casino, `setProvablyFairData` в hilo/mines, `setActiveSeats`
  в live-dealer-table) — требуют точечного рефакторинга логики.
- ~10 React-хук предупреждений в анимационных игровых компонентах (`set-state-in-effect`,
  `react-hooks/refs`, `exhaustive-deps`, вызов `Math.random()` в рендере) — намеренные
  анимационные паттерны; правка рискованна без визуальной проверки.
- In-memory кэш ответов в `apps/api/src/app.ts` привязан к процессу без инвалидации.
- Build-артефакты `index.js`/`index.d.ts` в `packages/config/src/` (следует перенести только в `dist/`).

