#!/bin/bash

gunicorn -w 4 -b 0.0.0.0:8000 main:app --worker-class aiohttp.GunicornWebWorker
