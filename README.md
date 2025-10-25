# Expense Tracker Web Application

A full-stack Expense Tracker application containerized using **Docker**.  
The application allows users to manage their personal finances by adding, editing, and deleting transactions, and viewing summaries.

---

## Features

- User registration and login
- Add, edit, and delete transactions
- View total balance, income, expenses, and category-wise summaries
- Persistent storage using PostgreSQL
- Multi-container setup for easy deployment with Docker Compose

---

## Architecture Overview

The application is deployed using three Docker containers:

1. **Backend Container**: Node.js + Express (handles API and business logic)  
2. **Frontend Container**: Static HTML/CSS/JS served via Nginx  
3. **Database Container**: PostgreSQL for persistent transaction and user data  

All containers communicate via Docker's internal network. The frontend is exposed on **port 80** for browser access, while the backend communicates internally on **port 5000**.  

**Note**: End users **do not need to build the images** manually. Simply using the `docker-compose.yml` file will pull the pre-built images from Docker Hub and run the application.

---

## Requirements

- Docker Desktop / Docker Engine
- Docker Compose
- Internet connection (to pull images from Docker Hub)

---

## Running the Application

### Using only `docker-compose.yml` (recommended for end users)

# Clone the repository (optional)
git clone https://github.com/yuvaraj-15/Expense-Tracker.git
cd expense-tracker

# Start the application
```docker-compose up -d```

### 2. Access the Application

Open your browser and visit:

[http://localhost](http://localhost)

You can now register, log in, and manage your transactions directly.

---

## Docker Images Used

- **Backend**: `yuvaraj015/expense-tracker-backend:v1.0.0`
- **Frontend**: `yuvaraj015/expense-tracker-frontend:v1.0.0`
- **Database**: `postgres:15` (Official PostgreSQL image)

---

## Notes

- Dockerfiles are included in the repository.
- The provided Dockerfiles were used to build and push the above images to Docker Hub.
- End users don’t need to modify or rebuild them unless customizing the application.
- The single `docker-compose.yml` file is sufficient to set up and run the complete app.

---

## Author

**Yuvaraj U** 
