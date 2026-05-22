#!/bin/bash

# Kubernetes Deployment Script for InvoiceTool
# This script helps you deploy the application to a Kubernetes cluster

set -e

echo "🚀 Deploying InvoiceTool to Kubernetes..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

# Create namespace if it doesn't exist
NAMESPACE=${1:-default}
echo "📦 Using namespace: $NAMESPACE"

kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply ConfigMap
echo "📝 Applying ConfigMap..."
kubectl apply -f .harness/k8s/configmap.yaml -n $NAMESPACE

# Apply Secret (warning about credentials)
echo "🔐 Applying Secret..."
echo "⚠️  Make sure to update .harness/k8s/secret.yaml with your actual credentials!"
read -p "Have you updated the secret file? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    kubectl apply -f .harness/k8s/secret.yaml -n $NAMESPACE
else
    echo "⏭️  Skipping secret deployment. Please apply it manually later."
fi

# Apply Deployment
echo "🚀 Applying Deployment..."
kubectl apply -f .harness/k8s/deployment.yaml -n $NAMESPACE

# Apply Service
echo "🌐 Applying Service..."
kubectl apply -f .harness/k8s/service.yaml -n $NAMESPACE

# Apply HPA
echo "📊 Applying Horizontal Pod Autoscaler..."
kubectl apply -f .harness/k8s/hpa.yaml -n $NAMESPACE

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/invoicetool -n $NAMESPACE --timeout=300s

# Get service information
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Service Information:"
kubectl get service invoicetool-service -n $NAMESPACE
echo ""
echo "📊 Pod Status:"
kubectl get pods -n $NAMESPACE -l app=invoicetool
echo ""
echo "📝 View logs with: kubectl logs -f deployment/invoicetool -n $NAMESPACE"
echo "🔍 Get service URL: kubectl get service invoicetool-service -n $NAMESPACE"