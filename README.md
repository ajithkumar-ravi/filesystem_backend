# Filesystem Backend

This is the backend for the File Explorer application. It is built using Node.js, Express, and MySQL.

## Features

- RESTful API for file and folder management.
- Supports creating, renaming, moving, and deleting files and folders.
- Prevents moving a folder into itself or its own descendant.
- Checks for duplicate names within the same folder.
- Centralized error handling.

## Prerequisites

- Node.js (v14 or higher recommended)
- MySQL Server

## Setup Instructions

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Database Configuration:**
    - **Note:** This project was developed and tested using **[Aiven MySQL](https://aiven.io/)** for cloud database hosting. However, you can use any MySQL provider you are comfortable with (e.g., local MySQL, XAMPP, AWS RDS, etc.).
    - Ensure your MySQL server is running.
    - Create a database (e.g., `file_explorer`).
    - Run the SQL schema to create the required tables:
      ```bash
      mysql -u your_user -p your_database < schema.sql
      ```
    - Create a `.env` file with your database credentials:
      ```env
      PORT=5000
      DB_HOST=localhost
      DB_USER=root
      DB_PASSWORD=your_password
      DB_NAME=file_explorer
      DB_PORT=3306
      ```

3.  **Start the server:**
    - For development with auto-restart:
      ```bash
      npm run dev
      ```
    - For production:
      ```bash
      npm start
      ```

    The server will start on `http://localhost:5000` (or the port specified in `.env`).

## Render Deployment

This project is optimized for deployment on [Render](https://render.com). 

1. Push your code to a GitHub/GitLab repository.
2. In the Render Dashboard, create a new **Web Service** and connect your repository.
3. Use the following settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add the following **Environment Variables** in the Render dashboard:
   - `FRONTEND_URL` (e.g., your Vercel URL, to configure CORS)
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` (Pointing to your remote MySQL instance like Aiven or PlanetScale)
5. (Optional) Alternatively, you can use the included `render.yaml` file as a Blueprint to automatically configure the service.

## API Endpoints

-   `GET /api/files` - List children of a folder (requires `parentId` query param, omit for root)
-   `GET /api/files/:id` - Get details of a specific file/folder and its breadcrumb path
-   `POST /api/files` - Create a new file or folder
-   `PUT /api/files/:id` - Rename or change file type/content
-   `PATCH /api/files/:id/move` - Move a file/folder to a new parent folder
-   `DELETE /api/files/:id` - Delete a file/folder (cascades to children if it's a folder)
