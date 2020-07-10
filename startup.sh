#!/bin/sh
if [[ "$ENV" == "production" ]]; then
	hugo --minify
else
	hugo serve --bind 0.0.0.0 --navigateToChanged --renderToDisk
fi
