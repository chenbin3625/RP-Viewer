package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"gopkg.in/yaml.v3"
	"proto-viewer/server"
)

type Config struct {
	PrototypeDir string `yaml:"prototype_dir"`
	Port         int    `yaml:"port"`
}

func main() {
	configPath := flag.String("config", "config.yaml", "path to config file")
	dev := flag.Bool("dev", false, "enable dev mode (proxy to Vite)")
	flag.Parse()

	data, err := os.ReadFile(*configPath)
	if err != nil {
		log.Fatalf("Failed to read config: %v", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		log.Fatalf("Failed to parse config: %v", err)
	}

	if cfg.Port == 0 {
		cfg.Port = 8080
	}

	srv := server.New(cfg.PrototypeDir, cfg.Port, webAssets, *dev)
	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("Proto Viewer started at http://localhost:%d", cfg.Port)
	log.Printf("Serving prototypes from: %s", cfg.PrototypeDir)
	if *dev {
		log.Printf("Dev mode: proxying frontend to http://localhost:5173")
	}
	log.Fatal(srv.ListenAndServe(addr))
}
