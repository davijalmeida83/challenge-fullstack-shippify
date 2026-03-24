# Fullstack Challenge — Task Dependencies

## Overview

This challenge evaluates your ability to design and implement a solid backend with real business rules, while maintaining clarity and simplicity.

You will build a task management system with **task dependencies**, where completing a task depends on the state of other tasks.

---

## Stack

* Node.js
* Express
* SQLite (file-based, persisted via Docker volume)
* React
* Docker + Docker Compose

---

Access:

* Frontend: http://localhost:3000
* Backend: http://localhost:3001

## Required Features

### 1. Create Tasks

* Task 1: Setup project
* Task 2: Implement API
* Task 3: Write tests
* Task 4: Deploy → depends on [1, 2, 3]
* Task 5: Monitoring → depends on [4]

---
Expected request:

curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{                          
    "title": "Monitoring",
    "dependencies": [4] (Optional)
  }'



Expected response:

```json
[
  {
    "id": 1,
    "title": "Task A",
    "completed": false,
    "dependencies": [1,2]
  }
]
```
### 2. List task

Critical rule:

* Tasks must be ordered by id, show dependencies id and title

---

### 3. Complete Task on UI

Critical rule:

* A task can only be completed if **ALL dependencies are completed**

Expected error:

```json
{
  "error": "Cannot complete task. Pending dependencies",
  "pending": [1, 2]
}
```

---