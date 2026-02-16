VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
PORT ?= 8080

.PHONY: run venv install

run: venv install
	$(PYTHON) -m http.server $(PORT)

venv:
	python3 -m venv $(VENV)

install:
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
