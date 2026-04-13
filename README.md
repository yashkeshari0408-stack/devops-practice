# ☸️ Kubernetes — End-to-End Node.js Deployment

 A complete hands-on Kubernetes learning project covering everything from local cluster setup to production-grade deployments with monitoring, autoscaling, GitOps, and more.

---

## 🗂️ Project Structure

```
Docker_Node/
├── main.js                  # Express app with all endpoints
├── Dockerfile               # node:18-alpine container
├── package.json
├── .dockerignore
├── k8s/                     # All Kubernetes manifests
│   ├── deploy.yaml          # Deployment (probes, limits, sidecar, volumes)
│   ├── service.yaml         # LoadBalancer Service
│   ├── configmap.yaml       # Non-sensitive config
│   ├── secret.yaml          # Sensitive config (base64)
│   ├── ingress.yaml         # Nginx Ingress (yash-app.local)
│   ├── pvc.yaml             # Persistent Volume Claim
│   └── hpa.yaml             # HorizontalPodAutoscaler
└── node-app-chart/          # Helm chart
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
        ├── deployment.yaml
        ├── service.yaml
        └── configmap.yaml
```

---

## 🚀 App Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Basic response |
| `GET /health` | Health check — used by Liveness & Readiness Probes |
| `GET /env` | Shows env vars injected by ConfigMap and Secret |
| `GET /crash` | Simulates unhealthy app — triggers Pod restart |
| `GET /recover` | Recovers app health |
| `GET /write?msg=xxx` | Writes to persistent volume |
| `GET /read` | Reads from persistent volume |

---

## 🏗️ Local Setup (WSL2 + Minikube)

### Prerequisites
- Docker Desktop (Windows) with WSL2 integration enabled
- WSL2 Ubuntu
- Node.js v18 (`nvm install 18`)

### First time setup
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start cluster
minikube start --driver=docker --memory=2200mb
```

### Daily startup
```bash
# 1. Launch Docker Desktop (Windows)
# 2. Open Ubuntu terminal
minikube start --driver=docker --memory=2200mb
cd ~/Docker_Node && code .
minikube tunnel                          # for Ingress/LoadBalancer
```

### Daily shutdown
```bash
minikube stop     # always use stop, never delete
# close VS Code → close terminal → quit Docker Desktop
```

---

## 🐳 Docker

```bash
# Build image inside Minikube's Docker (required for local K8s)
eval $(minikube docker-env)
docker build -t k8s-img .

# Push to Docker Hub (for cloud deployments)
docker tag k8s-img yashkeshari04/node-app:v1
docker push yashkeshari04/node-app:v1
```

> ⚠️ Always run `eval $(minikube docker-env)` before building if using local cluster.

---

## ☸️ Kubernetes Deployment

### Apply everything at once
```bash
kubectl apply -f ~/Docker_Node/k8s/
```

### Access the app
```bash
minikube service node-app-service --url    # NodePort
# OR
minikube tunnel                             # LoadBalancer → http://yash-app.local
```

### Ingress setup (WSL2)
Add to `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1    yash-app.local
```
Then access: `http://yash-app.local/health`

---

## 📋 Key Concepts Covered

### Level 1 — Foundation
| Concept | What it does |
|---|---|
| Pod | Smallest unit. Wraps containers. Temporary — replaced when it dies |
| **Deployment** | Supervises Pods. Maintains replica count. Handles restarts |
| **Service** | Stable entry point. Routes traffic regardless of Pod IP changes |
| **ConfigMap** | Non-sensitive config injected as env vars |
| **Secret** | Sensitive config (base64-encoded) injected as env vars |

### Level 2 — Essentials
| Concept | What it does |
|---|---|
| **Liveness Probe** | Restarts Pod if `/health` fails 3 times in a row |
| **Readiness Probe** | Removes Pod from traffic while unhealthy |
| **Resource Limits** | CPU in millicores (`100m`), Memory in Mebibytes (`64Mi`) |
| **Rolling Update** | `maxSurge:1 + maxUnavailable:0` = zero downtime deploys |
| **Rollback** | `kubectl rollout undo` — instant revert to previous version |
| **Ingress** | Nginx HTTP router with clean URLs and path routing |
| **Persistent Volume** | Data survives Pod restarts via PVC-mounted storage |

### Level 3 — Real World
| Concept | What it does |
|---|---|
| **Namespaces** | Isolate dev/prod environments in same cluster |
| **Helm** | Package manager — one chart, multiple environments via values |
| **HPA** | Auto-scales Pods based on CPU usage (tested 2→5→2 replicas) |
| **Sidecar Pattern** | Helper container sharing volume with main app for log shipping |

### Level 4 — Production
| Concept | What it does |
|---|---|
| **Docker Hub** | Public registry for cloud deployments (`yashkeshari04/node-app:v1`) |
| **Killercoda** | Free 2-node K8s playground — pods spread across real nodes |
| **Prometheus** | Scrapes and stores cluster/app metrics as time-series |
| **Grafana** | Visualizes Prometheus metrics with dashboards and alerts |

---

## 🔧 Useful Commands

### Debugging
```bash
kubectl get pods                          # list pods
kubectl get pods -w                       # watch live
kubectl get pods -o wide                  # show which node
kubectl describe pod <pod-name>           # full info + Events section
kubectl logs <pod-name>                   # view logs
kubectl logs -f <pod-name>               # stream logs live
kubectl logs <pod-name> --previous        # crashed pod logs
kubectl logs <pod-name> -c log-sidecar    # specific container
kubectl exec -it <pod-name> -- sh         # shell inside pod
```

### Scaling
```bash
kubectl scale deployment node-app-deployment --replicas=5
kubectl get hpa                           # auto-scaling status
kubectl top pods                          # CPU/memory usage
```

### Rolling updates & rollbacks
```bash
kubectl rollout history deployment node-app-deployment
kubectl rollout undo deployment node-app-deployment
kubectl rollout undo deployment node-app-deployment --to-revision=2
```

### Namespaces
```bash
kubectl get pods -n yash-dev
kubectl get pods --all-namespaces
kubectl apply -f deploy.yaml -n yash-dev
```

### Helm
```bash
helm install myapp ./node-app-chart
helm upgrade myapp ./node-app-chart --set replicaCount=3
helm rollback myapp 1
helm list --all-namespaces
helm uninstall myapp
```

### Monitoring
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
# Login: admin / prom-operator → http://localhost:3000
```

---

## ☁️ Cloud Deployment (Killercoda)

Free 2-node cluster: https://killercoda.com/playgrounds/scenario/kubernetes

```bash
# Deploy from Docker Hub
kubectl create deployment node-app --image=yashkeshari04/node-app:v1
kubectl scale deployment node-app --replicas=2
kubectl expose deployment node-app --type=NodePort --port=80 --target-port=8000

# See pods on different nodes
kubectl get pods -o wide

# Get node IP and access app
kubectl get nodes -o wide
curl http://<NODE-IP>:<NODEPORT>/health
```

---

## 🔁 GitOps with ArgoCD 

ArgoCD watches this GitHub repo and automatically syncs changes to the cluster.

```
git push → ArgoCD detects change → kubectl apply automatically
```

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# https://localhost:8080
```

---

## 🏗️ Architecture Overview

```
Browser
   ↓
http://yash-app.local  (hosts file → 127.0.0.1)
   ↓
minikube tunnel
   ↓
Nginx Ingress Controller
   ↓
node-app-service (LoadBalancer)
   ↓
┌─────────────────────────────┐
│  Pod                        │
│  ├── node-app (main)        │ ← serves traffic
│  └── log-sidecar (helper)   │ ← ships logs
│                             │
│  Volumes:                   │
│  ├── /app/data  (PVC)       │ ← persistent storage
│  └── /app/logs (emptyDir)   │ ← shared between containers
└─────────────────────────────┘
   ↑
ConfigMap (APP_ENV, APP_MESSAGE)
Secret    (DB_PASSWORD)
HPA       (auto-scales 2→5 based on CPU)
```

---

## 📝 Notes

- Always use `minikube stop` not `minikube delete`
- Rebuild image after any code change: `eval $(minikube docker-env) && docker build -t k8s-img .`
- If Minikube gets stuck: `docker pull gcr.io/k8s-minikube/kicbase:v0.0.50` then restart
- Secret values are base64 encoded: `echo -n 'password' | base64`
- Each namespace needs its own ConfigMap, Secret, PVC

---
