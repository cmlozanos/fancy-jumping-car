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
