# LMS IUAP - Full Stack Application

A Learning Management System (LMS) built with a **Next.js** frontend and a **Spring Boot** backend. 

## Features
- **Frontend**: Next.js 15, React, Tailwind CSS, TypeScript
- **Backend**: Spring Boot 3, Spring Security, Java 17+
- **Database**: MongoDB (Atlas)
- **Authentication**: Stateless JWT Authentication, BCrypt Password Encoding
- **SSO**: Fully integrated Google Sign-In (`@react-oauth/google` & `google-api-client`)
- **UI/UX**: Premium dark mode aesthetics with responsive glassmorphism layouts and animations

---

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
- [Java 17](https://adoptium.net/) or higher
- [Node.js](https://nodejs.org/en/) (v18+)
- A **MongoDB Atlas** Cluster (You will need the connection URI).
- A **Google Web Client ID** (From the [Google Cloud Console](https://console.cloud.google.com/)).

---

## 🛠️ Step-by-Step Installation

### 1. Clone the repository
```bash
git clone https://github.com/pamuditha-senanayake/LMS_IUAP.git
cd LMS_IUAP
```

### 2. Backend Setup (Spring Boot)
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Update the environment properties. Open `src/main/resources/application.properties` and paste your exact MongoDB URI and Google Client ID:
   ```properties
   spring.data.mongodb.uri=mongodb+srv://<username>:<password>@cluster0...
   google.client.id=your-google-client-id.apps.googleusercontent.com
   ```
   *(Critical Note: If MongoDB throws a connection error, go to the Atlas Dashboard **Network Access** tab and whitelist your IP `0.0.0.0/0`).*
3. Run the development server using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend API will start securely on `http://localhost:8080`.

### 3. Frontend Setup (Next.js)
1. Open a **new** separate terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install all frontend dependencies:
   ```bash
   npm install
   ```
3. Set up the local environment variables. Create a file named `.env.local` inside the `frontend` folder and add:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The Next.js application will boot up at `http://localhost:3000`. Open this URL in your browser to see the live app!

---

## 🚀 Cloud Deployment (Production)

This monorepo is architected so it can be deployed to the cloud directly from GitHub with zero friction:

### Deploying the Backend
We highly recommend **Railway** or **Render** for Java applications.
1. Connect your GitHub to Railway/Render.
2. Select this repository and set the **Root Directory** to `backend`.
3. The cloud provider will automatically detect the `pom.xml`, build the Maven tree, and deploy it. 
*(Once deployed, grab the new public URL like `https://api.railway.app`)*.

### Deploying the Frontend
We highly recommend **Vercel** for Next.js applications.
1. Connect your GitHub to Vercel and import this repository.
2. Under "Configure Project", click **Edit** on Root Directory and change it to `frontend`.
3. Open the **Environment Variables** tab and map the newly deployed backend:
   - `NEXT_PUBLIC_API_URL` = `https://your-new-backend-url.com`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = `your-google-client-id`
4. Click Deploy!
