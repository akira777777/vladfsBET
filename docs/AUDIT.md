# Аудит проекта VladfsBET (19.09.2026)

## Найденные проблемы

### Критические
1. **Все unit-тесты сломаны** — 7 тестовых файлов (`packages/db`: 4, `apps/api`: 3) падают при загрузке с ошибкой `TypeError: Cannot read properties of undefined (reading 'config')`. Причина — несовместимость vitest 4.1.11 + vite 8.2.2 (ESM-инициализация `describe`/`it`). CI не запускает тесты, поэтому регрессия осталась незамеченной.
2. **CI-пайплайн неполный** — `.github/workflows/ci.yml` выполняет только `npm run build`. Не запускаются ни тесты, ни lint, ни typecheck, ни миграции БД против поднятого Postgres.

### Высокие
3. **Небезопасные fallback-секреты в проде** — `packages/config`: `SESSION_SECRET`/`JWT_SECRET` имеют дефолтные значения, которые молча применяются даже при `NODE_ENV=production`.
4. **Скрытый mock-Prisma клиент** — `packages/db/src/index.ts` при ошибке конструктора `PrismaClient` подменяет клиент no-op Proxy: запросы «успешно» возвращают пустые данные вместо ошибки. В проде это маскирует отказ БД.
5. **100 ESLint-предупреждений** в `apps/web` — включая реальные баги React: `setState` синхронно в `useEffect` (`slot-tumble-grid.tsx`), обращение к ref во время рендера, неиспользуемые переменные/импорты.

### Средние/низкие
6. Не отслеживаются в git: `docker-compose.yml`, `middleware.ts` (web), `services/wallet` — README ссылается на `npm run docker:up`, но файл отсутствует в репозитории.
7. In-memory кэш ответов в `app.ts` — привязка к процессу, без инвалидации.
8. Остаточные артефакты (скриншоты `*.png`, `.playwright-mcp` логи) в корне репозитория.

## Исправления
- Обновление vitest до ^4.2.x (фикс совместимости с vite 8)
- CI: добавлены lint, typecheck, тесты, миграции
- Валидация обязательных секретов в production (fail-fast)
- Убран молчаливый mock Prisma в production
- Чистка ESLint-предупреждений (unused vars)
