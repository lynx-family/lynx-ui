#!/bin/bash
set -e

node tools/lint/check-changed.mjs "$@"
