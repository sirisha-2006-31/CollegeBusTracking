# College Bus Tracking - Final Version

## Features
- Admin login and protected admin dashboard
- Admin CRUD for buses, drivers, routes and bus stops
- Each bus can be assigned to a route
- Driver login with assigned-bus lookup
- Real driver GPS using browser/device geolocation
- Desktop test GPS simulator on Driver GPS page
- Socket.IO live bus location broadcast
- Student page is public: no admin token required
- Student selects a bus and one of that bus route's stops
- Distance from live bus to selected stop
- ETA to selected stop (uses driver speed when available; otherwise 30 km/h)
- Live Leaflet/OpenStreetMap map

## Important database step
Existing BUS001 and BUS003 documents may not have a `route` field because the old schema did not contain it. After starting the new backend, use the admin bus UPDATE API to assign:
- BUS001 -> Route 1 ObjectId
- BUS003 -> Route 2 ObjectId

Get the Route IDs from the admin-authenticated GET `/api/routes` request.

## Run
Backend:
```cmd
D:
cd D:\CollegeProjects\CollegeBusTrackingackend
node server.js
```
Frontend:
```cmd
D:
cd D:\CollegeProjects\CollegeBusTrackingrontend
npm install
npm run dev
```

Keep your existing `.env` file in `backend`. It is intentionally not included in this ZIP.

## Driver test
1. Create/login a user with role `driver`.
2. Admin creates a Driver record using that user's ObjectId and assigns BUS001 or BUS003.
3. Open `/driver` while logged in as that driver.
4. Use **Start Real GPS** on a phone/device, or **Start Test GPS** on a desktop.
5. Open `/` in another browser/tab as the student.

## Student ETA
1. Select BUS001 or BUS003.
2. Select a stop from that bus's assigned route.
3. The page shows the live bus, selected stop, distance and expected arrival time.
