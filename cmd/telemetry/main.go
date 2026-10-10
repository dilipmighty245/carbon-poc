package main

import (
	"flag"
	"log"
	"os"

	"saurient-platform/internal/telemetry"
)

func main() {
	defaultPort := os.Getenv("TELEMETRY_PORT")
	if defaultPort == "" {
		defaultPort = "8085"
	}

	portFlag := flag.String("port", defaultPort, "HTTP port for the EM6400 industrial telemetry simulator server")
	flag.Parse()

	log.Printf("Starting Sattric EM6400 Industrial Telemetry Simulation Server on port %s...", *portFlag)
	gen := telemetry.NewTelemetryGenerator()
	srv := telemetry.NewServer(gen, *portFlag)

	if err := srv.Start(); err != nil {
		log.Fatalf("Telemetry server failed: %v", err)
	}
}
