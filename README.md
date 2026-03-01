🎉 TechFest Event Management System

A full-stack role-based Tech Fest Management System built using:

⚙️ NestJS (Backend)
🗄 Prisma + PostgreSQL
🎨 React + TypeScript
🔐 JWT Authentication
👥 Role-based access control (Admin / Team Lead / Volunteer)

🚀 Features
👑 Admin
Create and manage events
Create and assign tasks
View all tasks
Track progress
Manage users

🧑‍💼 Team Lead
Create and assign tasks
View all assigned tasks
Monitor volunteer progress

🙋 Volunteer
View assigned tasks
Mark tasks as completed
Track task progress

🏗 Tech Stack
Backend
NestJS
Prisma ORM
PostgreSQL
JWT Authentication
Role Guards
Frontend
React (Vite)
TypeScript
Axios
TailwindCSS / UI components

📁 Project Structure
techfest-backend/
techfest-frontend/
🛠 Backend Setup
1️⃣ Navigate to backend
cd techfest-backend
2️⃣ Install dependencies
npm install
3️⃣ Setup environment variables

Create .env file inside techfest-backend/:

DATABASE_URL="postgresql://username:password@localhost:5432/techfest"
JWT_SECRET="your_super_secret_key"
PORT=3000

4️⃣ Setup Database
Make sure PostgreSQL is running.
Run Prisma migrations:
npx prisma migrate dev --name init
Generate Prisma client:
npx prisma generate
(Optional) Seed database if you have seed file:
npx prisma db seed

5️⃣ Start Backend Server
npm run start:dev
You should see:
Nest application successfully started
Backend runs on:
http://localhost:3000

💻 Frontend Setup
1️⃣ Navigate to frontend
cd techfest-frontend

2️⃣ Install dependencies
npm install

3️⃣ Configure API base URL
Inside:
src/lib/api.ts
Ensure:
baseURL: "http://localhost:3000",

4️⃣ Start Frontend
npm run dev
Frontend runs on:
http://localhost:8080

🔐 Authentication Flow
User logs in
Backend returns JWT token
Token is stored in localStorage
Axios attaches token in headers
Backend validates via JwtAuthGuard
RolesGuard enforces role permissions

🔒 Role-Based Access
Role	Create Task	Assign Task	View All Tasks	Complete Task
Admin	✅	✅	✅	❌
Team Lead	✅	✅	✅	❌
Volunteer	❌	❌	❌ (Own Only)	✅

📊 Task Tracking
Tasks have status:
TODO
IN_PROGRESS
COMPLETED
Volunteers can mark their assigned tasks complete
Progress tracking available per event

🔒 Super Admin Login (Test)
email: superadmin@techfest.com
password: Admin@123

🧠 Future Improvements
Analytics dashboard
Task completion charts
Email notifications
Real-time updates (WebSockets)
Audit logs
File uploads

👨‍💻 Author
Developed as part of a Tech Fest Management System project.
