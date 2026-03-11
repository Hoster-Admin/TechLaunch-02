#!/bin/bash
set -e

# ── Backend
mkdir -p backend/src/{controllers,models,routes,middleware,config,utils,migrations,seeders}

# ── Frontend  
npx --yes create-react-app frontend --template cra-template 2>/dev/null || true
# We'll manually set up instead
mkdir -p frontend/src/{components/{ui,layout,home,admin,shared},pages/{home,admin},hooks,context,utils,styles}
mkdir -p frontend/public

echo "Structure created"
