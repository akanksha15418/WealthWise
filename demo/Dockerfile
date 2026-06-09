# Build stage using active Eclipse Temurin Maven image
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Run stage using official Eclipse Temurin JRE image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/Expensemanagement-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
