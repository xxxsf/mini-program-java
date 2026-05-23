# Multi-stage Dockerfile for InvoiceTool Spring Boot Application
# Stage 1: Build stage
FROM maven:3.8.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY invoiceTool_Java/pom.xml ./

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY invoiceTool_Java/src ./src

# Build the application
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Install CA certificates for SSL connections
RUN apk add --no-cache ca-certificates && \
    update-ca-certificates

# Create upload directory
RUN mkdir -p /tmp/uploads && chmod 777 /tmp/uploads

# Copy the built JAR file from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the application port
EXPOSE 8080

# JVM options and application startup
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:InitialRAMPercentage=50.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", \
  "app.jar"]