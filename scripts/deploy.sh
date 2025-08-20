#!/bin/bash

# Codegen-Hexa Deployment Script
# This script builds and deploys both backend and frontend to Cloudflare Workers

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "pnpm-workspace.yaml" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    log_error "pnpm is not installed. Please install it first: npm install -g pnpm"
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    log_warning "wrangler is not installed globally. Installing it..."
    pnpm add -g wrangler
fi

# Function to check if user is logged into Cloudflare
check_cloudflare_auth() {
    if ! wrangler whoami &> /dev/null; then
        log_error "You are not logged into Cloudflare. Please run 'wrangler login' first."
        exit 1
    fi
    log_success "Cloudflare authentication verified"
}

# Function to install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    pnpm install
    log_success "Dependencies installed successfully"
}

# Function to build backend
build_backend() {
    log_info "Building backend..."
    cd apps/backend
    pnpm run build
    cd ../..
    log_success "Backend built successfully"
}

# Function to build frontend
build_frontend() {
    log_info "Building frontend..."
    cd apps/frontend
    pnpm run build
    cd ../..
    log_success "Frontend built successfully"
}

# Function to deploy backend
deploy_backend() {
    log_info "Deploying backend to Cloudflare Workers..."
    cd apps/backend
    pnpm run deploy
    cd ../..
    log_success "Backend deployed successfully"
}

# Function to deploy frontend
deploy_frontend() {
    log_info "Deploying frontend to Cloudflare Workers..."
    cd apps/frontend
    pnpm run deploy
    cd ../..
    log_success "Frontend deployed successfully"
}

# Main deployment function
main() {
    log_info "Starting Codegen-Hexa deployment..."
    echo "=========================================="
    
    # Check authentication
    check_cloudflare_auth
    
    # Install dependencies
    install_dependencies
    
    # Build both applications
    log_info "Building applications..."
    build_backend
    build_frontend
    
    # Deploy in sequence (backend first, then frontend)
    log_info "Starting deployment sequence..."
    deploy_backend
    deploy_frontend
    
    echo "=========================================="
    log_success "Deployment completed successfully! 🚀"
    log_info "Your applications are now live on Cloudflare Workers"
}

# Run main function
main "$@"
