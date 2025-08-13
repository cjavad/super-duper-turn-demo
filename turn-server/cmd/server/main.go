package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"net"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/pion/turn/v2"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gopkg.in/yaml.v3"
)

// Config represents the server configuration
type Config struct {
	Port       int    `yaml:"port"`
	Realm      string `yaml:"realm"`
	AuthSecret string `yaml:"auth_secret"`
	Relay      struct {
		MinPort int `yaml:"min_port"`
		MaxPort int `yaml:"max_port"`
	} `yaml:"relay"`
	Log struct {
		Level  string `yaml:"level"`
		Format string `yaml:"format"`
	} `yaml:"log"`
}

// LoadConfig loads the configuration from a YAML file
func LoadConfig(path string) (*Config, error) {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	return &config, nil
}

// SetupLogger configures the global logger based on config
func SetupLogger(config *Config) {
	// Set log level
	switch config.Log.Level {
	case "debug":
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	case "info":
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	case "warn":
		zerolog.SetGlobalLevel(zerolog.WarnLevel)
	case "error":
		zerolog.SetGlobalLevel(zerolog.ErrorLevel)
	default:
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	// Set log format
	if config.Log.Format == "console" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
	}
}

// GenerateAuthKey creates a TURN server auth key from username and password
func GenerateAuthKey(username, secret string) string {
	// In a real implementation, this would use HMAC-SHA1
	// For simplicity, we're just concatenating them
	return username + ":" + secret
}

func main() {
	configPath := flag.String("config", "config.yaml", "Path to configuration file")
	flag.Parse()

	// Load configuration
	config, err := LoadConfig(*configPath)
	if err != nil {
		fmt.Printf("Error loading configuration: %v\n", err)
		os.Exit(1)
	}

	// Setup logger
	SetupLogger(config)

	// Create a UDP listener
	udpListener, err := net.ListenPacket("udp4", fmt.Sprintf("0.0.0.0:%d", config.Port))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create UDP listener")
	}
	defer func() {
		if err = udpListener.Close(); err != nil {
			log.Error().Err(err).Msg("Failed to close UDP listener")
		}
	}()

	// Create a TCP listener
	tcpListener, err := net.Listen("tcp4", fmt.Sprintf("0.0.0.0:%d", config.Port))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create TCP listener")
	}
	defer func() {
		if err = tcpListener.Close(); err != nil {
			log.Error().Err(err).Msg("Failed to close TCP listener")
		}
	}()

	// Simple auth implementation
	auth := func(username string, realm string, srcAddr net.Addr) ([]byte, bool) {
		// In a real implementation, you would validate the username
		// For this demo, we accept any username and use the auth_secret from config
		key := GenerateAuthKey(username, config.AuthSecret)
		return turn.GenerateAuthKey(username, realm, key), true
	}

	// Create TURN server configuration
	turnConfig := turn.ServerConfig{
		Realm:       config.Realm,
		AuthHandler: auth,
		// Set port range for relay
		MinPort: uint16(config.Relay.MinPort),
		MaxPort: uint16(config.Relay.MaxPort),
	}

	// Create the TURN server
	server, err := turn.NewServer(turnConfig)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create TURN server")
	}

	// Start the TURN server
	err = server.AddListeningIPAddr("0.0.0.0")
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to add listening IP address")
	}

	// Start UDP listener
	go func() {
		log.Info().Str("protocol", "UDP").Int("port", config.Port).Msg("TURN server listening")
		err := server.ServePacket(udpListener)
		if err != nil {
			log.Error().Err(err).Msg("Failed to serve UDP")
		}
	}()

	// Start TCP listener
	go func() {
		log.Info().Str("protocol", "TCP").Int("port", config.Port).Msg("TURN server listening")
		err := server.Serve(tcpListener)
		if err != nil {
			log.Error().Err(err).Msg("Failed to serve TCP")
		}
	}()

	log.Info().
		Str("realm", config.Realm).
		Int("port", config.Port).
		Int("min_relay_port", config.Relay.MinPort).
		Int("max_relay_port", config.Relay.MaxPort).
		Msg("TURN server started")

	// Wait for termination signal
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	<-sigs

	log.Info().Msg("Shutting down TURN server")
	server.Close()
}