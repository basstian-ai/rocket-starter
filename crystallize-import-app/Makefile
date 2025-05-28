# === Makefile Helper ===

# Styles
YELLOW=$(shell echo "\033[00;33m")
RED=$(shell echo "\033[00;31m")
RESTORE=$(shell echo "\033[0m")

# Variables
PACKAGE_MANAGER := pnpm
DOCKER_COMPOSE = docker-compose
DEPENDENCIES := node pnpm git docker caddy
.DEFAULT_GOAL := list
CADDY_PID_FILE := caddy.dev.pid
CADDY = sudo caddy

.PHONY: list
list:
	@echo "******************************"
	@echo "${YELLOW}Available targets${RESTORE}:"
	@grep -E "^[a-zA-Z-]+:.*?## .*$$" Makefile | sort | awk "BEGIN {FS = \":.*?## \"}; {printf \" ${YELLOW}%-15s${RESTORE} > %s\n\", $$1, $$2}"
	@echo "${RED}==============================${RESTORE}"

.PHONY: check-dependencies
check-dependencies:
	@for dependency in $(DEPENDENCIES); do \
		if [ -z "$$(command -v $$dependency)" ]; then \
			echo "${RED}Error:${RESTORE} ${YELLOW}$$dependency${RESTORE} is not installed."; \
			exit 1; \
		fi; \
	done
	@echo "All ${YELLOW}dependencies are installed.${RESTORE}"

.PHONY: install
install: check-dependencies update ## Install the Application and reset the database

.PHONY: update
update: check-dependencies ## Update the Repo
	@$(PACKAGE_MANAGER) install

.PHONY: start-services
start-services: ## Start Services -- ensure stop-services is called before if needed
	@echo "Starting Caddy server..."
	@touch $(CADDY_PID_FILE)
	@$(CADDY) start --pidfile $(CADDY_PID_FILE) --config Caddyfile

.PHONY: stop-services
stop-services: ## Stop Services
	@echo "Stopping Caddy server..."
	-@$(CADDY) stop --config Caddyfile --adapter caddyfile > /dev/null 2>&1 || true
	-@sudo pkill -f "caddy" || true
	-@if [ -f $(CADDY_PID_FILE) ]; then \
		echo "PID file found, removing..."; \
		rm -f $(CADDY_PID_FILE); \
	fi
	@echo "Caddy server stop sequence completed."

.PHONY: serve
serve: ## Serve the application
	@echo "Listing node_modules/.bin/ before attempting to serve..."
	ls -la ./node_modules/.bin/ || echo "node_modules/.bin not found during make serve"
	@echo "Checking for Remix CLI script..."
	@if [ -f ./node_modules/@remix-run/dev/dist/cli.js ]; then \
		echo "Found Remix CLI script, executing with node..."; \
		node ./node_modules/@remix-run/dev/dist/cli.js vite:dev --host; \
	else \
		echo "Remix CLI script not found at ./node_modules/@remix-run/dev/dist/cli.js. Trying pnpm run dev as fallback."; \
		$(PACKAGE_MANAGER) run dev --host; \
	fi
