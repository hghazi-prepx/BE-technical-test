# Docker Setup for PrepX Timer API

This guide explains how to set up a local MongoDB database using Docker for the project.

## Requirements

- Docker Desktop installed on the system
- Docker Compose (comes with Docker Desktop)

## Included Services

### 1. MongoDB Database
- **Port:** 27017
- **Username:** admin
- **Password:** password123
- **Database:** prepx-timer

### 2. Mongo Express (Database Management Interface)
- **Port:** 8081
- **URL:** http://localhost:8081
- **Username:** admin
- **Password:** admin123

## Running Services

### 1. Starting the Database
```bash
# Run all services in the background
docker-compose up -d

# Run MongoDB only
docker-compose up -d mongodb

# Show container status
docker-compose ps
```

### 2. Viewing Logs
```bash
# View MongoDB logs
docker-compose logs mongodb

# View live logs
docker-compose logs -f mongodb
```

### 3. Stopping Services
```bash
# Stop all services
docker-compose down

# Stop with data deletion
docker-compose down -v
```

## Connecting to the Database

### From the Application
Use the following connection string in the `.env` file:
```
MONGODB_URI=mongodb://admin:password123@localhost:27017/prepx-timer?authSource=admin
```

### From MongoDB Compass
```
mongodb://admin:password123@localhost:27017/prepx-timer?authSource=admin
```

### From Command Line
```bash
# Enter MongoDB container
docker exec -it prepx-mongodb mongosh

# Or connect directly
mongosh "mongodb://admin:password123@localhost:27017/prepx-timer?authSource=admin"
```

## Database Initialization

On first run, the initialization script `mongo-init/init-db.js` will be executed, which:

- Creates collections: `exams`, `studenttimers`
- Creates indexes for performance optimization
- Inserts sample data for testing

## Data Management

### Backup
```bash
# Create backup
docker exec prepx-mongodb mongodump --uri="mongodb://admin:password123@localhost:27017/prepx-timer?authSource=admin" --out=/backup

# Copy files from container
docker cp prepx-mongodb:/backup ./backup
```

### Restore
```bash
# Copy backup files to container
docker cp ./backup prepx-mongodb:/backup

# Restore data
docker exec prepx-mongodb mongorestore --uri="mongodb://admin:password123@localhost:27017/prepx-timer?authSource=admin" /backup/prepx-timer
```

## Troubleshooting

### Common Issues

1. **Connection failure:**
   - Make sure Docker is running
   - Check that port 27017 is not in use

2. **Authentication issues:**
   - Make sure to use `authSource=admin` in connection string

3. **Data loss:**
   - Data is stored in a separate volume
   - Use `docker-compose down` instead of `docker-compose down -v`

### Useful Commands
```bash
# Show volume information
docker volume ls

# Check disk usage
docker system df

# Clean up unused resources
docker system prune
```

## Security

⚠️ **Warning:** The passwords used here are for local development only. In production environment:

- Use strong passwords
- Use environment variables to store passwords
- Enable SSL/TLS
- Restrict network access