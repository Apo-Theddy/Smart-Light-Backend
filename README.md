# Smart Light Backend

REST API and MQTT bridge for **Smart Light**, an end-to-end IoT lighting system made of three parts:

| Part | Repository | Stack |
|---|---|---|
| Mobile app | [Smart-Light-App](https://github.com/Apo-Theddy/Smart-Light-App) | Flutter |
| **Backend (this repo)** | Smart-Light-Backend | NestJS, PostgreSQL, MQTT |
| Device firmware | [Smart-Light-Firmware](https://github.com/Apo-Theddy/Smart-Light-Firmware) | ESP32-S3, C++ |

```
Flutter app ──HTTP──► NestJS API ──MQTT (Mosquitto)──► ESP32 devices
                         │   ▲                              │
                         │   └──── device/status ◄──────────┘
                         ▼
                 PostgreSQL · Redis cache · Gemini analytics
```

## Features

- **Accounts and roles:** registration and login with bcrypt-hashed passwords, plus role management.
- **Devices and LEDs:** register devices by MAC address and manage the LEDs on each one (color, brightness, on/off, pin).
- **Real-time device control:** every LED change runs inside a database transaction and is published to the `leds/update` MQTT topic, which the firmware applies immediately.
- **Online status:** the API subscribes to `device/status` and keeps each device's online/offline state in sync.
- **Event log:** every state change is recorded as an event per device.
- **AI analytics:** `POST /api/events/analytics/devices/all` summarizes device activity and flags anomalies with Google Gemini. Large event sets are split into chunks, analyzed in parallel batches and merged, and results are cached for 24 hours under a hashed key.
- **Validation:** a global `ValidationPipe` with whitelisting rejects unknown fields on every request.

## Tech stack

NestJS 11 · TypeScript · TypeORM · PostgreSQL 15 · MQTT (`@nestjs/microservices` + Eclipse Mosquitto 2) · Redis · `@nestjs/cache-manager` · Google Gemini · Docker Compose

## API overview

All routes are prefixed with `/api`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` |
| Roles | `GET /roles`, `GET /roles/:name`, `POST /roles` |
| Devices | `POST /devices`, `GET /devices/:mac`, `GET /devices/users/:userId`, `GET /devices/leds/:deviceId` |
| LEDs | `POST /leds`, `PUT /leds/:id/state/:deviceId` |
| Events | `POST /events`, `GET /events`, `GET /events/:id`, `GET /events/device/:deviceId`, `POST /events/analytics/devices/all` |
| MQTT | `POST /mqtt/publish` |

## Getting started

```bash
# 1. Create a .env file
#   PORT=3000
#   DB_HOST=localhost  DB_PORT=5432  DB_USER=...  DB_PASSWORD=...  DB_NAME=...
#   DB_SYNCHRONIZE=true  DB_LOGGING=false
#   MQTT_BROKER_URL=mqtt://localhost:1883  MQTT_CLIENT_ID=smart-light-backend
#   GOOGLE_API_KEY=...
#   PGADMIN_DEFAULT_EMAIL=...  PGADMIN_DEFAULT_PASSWORD=...

# 2. Start PostgreSQL, pgAdmin, Redis and the Mosquitto broker
docker compose up -d

# 3. Install and run
yarn install
yarn start:dev
```

The included Mosquitto configuration allows anonymous connections, which is intended for local development only.

## Project structure

```
src/
├── main.ts                 # HTTP server + MQTT microservice bootstrap
├── app.module.ts
├── core/config/            # TypeORM configuration
└── modules/
    ├── account/  role/  user/   # Authentication and authorization
    ├── device/  led/  group/    # Devices and their LEDs
    ├── event/                   # Event log and Gemini analytics
    └── mqtt-client/             # MQTT publishing and device status handling
```
