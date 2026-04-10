package main

import "embed"

//go:embed web/dist/*
var webAssets embed.FS
