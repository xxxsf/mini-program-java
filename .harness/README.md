# Harness CI/CD Configuration for InvoiceTool

This directory contains the Harness configuration files for the InvoiceTool project, enabling automated build, test, and deployment pipelines.

## 📁 Directory Structure

```
.harness/
├── README.md                    # This file
├── harness.yaml                 # Complete pipeline configuration (build + deploy)
├── pipeline.yaml                # Simplified pipeline configuration
├── ci.yaml                      # CI-focused configuration
└── k8s/                         # Kubernetes manifests
    ├── deployment.yaml          # Kubernetes deployment
    ├── service.yaml             # Kubernetes service
    ├── configmap.yaml           # Configuration maps
    ├── secret.yaml              # Secrets (example - update with real values)
    └── hpa.yaml                 # Horizontal Pod Autoscaler
```

## 🚀 Quick Start

### 1. Prerequisites

- Harness account with appropriate permissions
- Docker registry access (Docker Hub, AWS ECR, GCR, etc.)
- Kubernetes cluster access
- GitHub repository connected to Harness

### 2. Configure Harness Connectors

Before running the pipeline, configure the following connectors in Harness:

- **GitHub Connector**: Connect to your GitHub repository
- **Docker Registry Connector**: Connect to your container registry
- **Kubernetes Connector**: Connect to your Kubernetes cluster

### 3. Update Configuration Files

#### Update `harness.yaml` or `pipeline.yaml`:

```yaml
# Update connector references
connectorRef: account.your-github-connector
connectorRef: account.your-docker-connector
connectorRef: account.your-kubernetes-connector

# Update Docker registry path
imagePath: your-docker-registry/invoicetool:latest
```

#### Update Kubernetes Secrets:

Edit `.harness/k8s/secret.yaml` and replace with your actual base64-encoded credentials:

```bash
# Encode your credentials
echo -n "your_username" | base64
echo -n "your_password" | base64
```

#### Update Database Configuration:

Edit `.harness/k8s/configmap.yaml` to match your database configuration:

```yaml
spring.datasource.url: "jdbc:mysql://your-database-host:3306/invoicetool?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
```

### 4. Pipeline Options

Choose the appropriate configuration file based on your needs:

#### `harness.yaml` - Complete Pipeline
- Full CI/CD pipeline with build, test, and deployment
- Includes service and environment definitions
- Suitable for production environments

#### `pipeline.yaml` - Simplified Pipeline
- Streamlined build and deploy process
- Easier to configure and maintain
- Good for development and staging

#### `ci.yaml` - CI Only
- Focuses on continuous integration
- Build, test, and Docker image creation
- Use when you want manual deployment control

### 5. Running the Pipeline

1. **Import Pipeline in Harness**:
   - Go to your Harness project
   - Select "Pipelines" → "New Pipeline"
   - Choose "Import from Git" or "YAML"
   - Upload or reference the configuration file

2. **Execute Pipeline**:
   - Select the pipeline
   - Click "Run"
   - Choose the branch and input required parameters
   - Monitor the execution

## 🔧 Configuration Details

### Build Stage

The build stage performs the following steps:

1. **Setup**: Configures Java environment
2. **Build**: Compiles the Spring Boot application using Maven
3. **Test**: Runs unit tests
4. **Docker Build**: Creates a Docker image
5. **Push**: Pushes the image to the registry (optional)

### Deploy Stage

The deploy stage:

1. **Service Configuration**: Defines the Kubernetes service
2. **Deployment**: Performs a rolling update to Kubernetes
3. **Health Checks**: Monitors application health

### Kubernetes Resources

- **Deployment**: Manages application pods (2 replicas by default)
- **Service**: Exposes the application (LoadBalancer type)
- **ConfigMap**: Stores configuration data
- **Secret**: Stores sensitive data (credentials)
- **HPA**: Auto-scales based on CPU and memory usage

## 🐳 Docker Configuration

The `Dockerfile` in the project root uses a multi-stage build:

1. **Build Stage**: Uses Maven to compile the application
2. **Runtime Stage**: Creates a lightweight runtime image
3. **Optimizations**: Container support, memory limits, health checks

Build the image locally:
```bash
docker build -t invoicetool:latest .
```

Run the container:
```bash
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/invoicetool \
  -e SPRING_DATASOURCE_USERNAME=root \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  invoicetool:latest
```

## 📊 Monitoring and Scaling

### Health Checks

The application includes health checks at:
- `/actuator/health` - Liveness probe
- `/actuator/health/readiness` - Readiness probe

### Auto-scaling

The HPA configuration:
- **Min Replicas**: 2
- **Max Replicas**: 10
- **CPU Threshold**: 70%
- **Memory Threshold**: 80%

## 🔐 Security Considerations

1. **Secrets Management**: Never commit actual credentials to Git
2. **Use Harness Secrets**: Store sensitive data in Harness secrets manager
3. **RBAC**: Configure proper role-based access control
4. **Network Policies**: Implement Kubernetes network policies
5. **Image Scanning**: Enable container image vulnerability scanning

## 🛠️ Troubleshooting

### Build Failures

- Check Java version compatibility (requires Java 17)
- Verify Maven wrapper permissions: `chmod +x mvnw`
- Review build logs in Harness

### Deployment Failures

- Verify Kubernetes cluster connectivity
- Check resource limits and requests
- Review pod logs: `kubectl logs -f deployment/invoicetool`
- Verify ConfigMap and Secret references

### Database Connection Issues

- Verify database URL format
- Check network connectivity between pods and database
- Confirm credentials in Secret are correct
- Review database logs

## 📝 Customization

### Environment Variables

Add custom environment variables in the deployment.yaml:

```yaml
env:
- name: CUSTOM_VAR
  valueFrom:
    configMapKeyRef:
      name: invoicetool-config
      key: custom.var
```

### Resource Limits

Adjust resource limits in deployment.yaml:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

## 🤝 Contributing

When updating the pipeline:

1. Test changes in a development environment first
2. Update this README with any configuration changes
3. Use Harness pipeline validation before committing
4. Tag releases for rollback capability

## 📚 Additional Resources

- [Harness Documentation](https://docs.harness.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Spring Boot Docker Guide](https://spring.io/guides/topicals/spring-boot-docker/)
- [Maven Docker Image](https://hub.docker.com/_/maven)