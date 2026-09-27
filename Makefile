# Bundle sync only writes this repository; provide the canonical data directory explicitly.
.DEFAULT_GOAL := check
LEARNING_SOURCE ?=
.PHONY: sync-gates check-gates

sync-gates:
	node tools/sync-learning-gate.mjs --source "$(LEARNING_SOURCE)"

check-gates:
	node tools/sync-learning-gate.mjs --check $(if $(LEARNING_SOURCE),--source "$(LEARNING_SOURCE)")

check: check-gates

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
PORT ?= 8080

.PHONY: run venv install check install-tests test

check:
	node --check src/main.js
	node --check learning-gate.js
	node --check sw.js
	node tools/check.mjs
	node tools/check-performance.mjs

install-tests:
	npm ci

# Includes tools/touch-check.cjs plus native long hold/release browser coverage.
test:
	npm test

icons:
	node tools/icons.cjs

run: venv install
	$(PYTHON) -m http.server $(PORT)

venv:
	python3 -m venv $(VENV)

install:
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
