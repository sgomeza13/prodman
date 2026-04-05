package repository

import (
	"embed"
	"fmt"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"github.com/pressly/goose/v3"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

//go:embed migrations
var embedMigrations embed.FS

func InitializeDatabase() (*gorm.DB, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return nil, fmt.Errorf("could not find user config dir: %w", err)
	}

	appDir := filepath.Join(configDir, "prodman")
	if err := os.MkdirAll(appDir, os.ModePerm); err != nil {
		return nil, fmt.Errorf("could not create app directory: %w", err)
	}

	dbPath := filepath.Join(appDir, "inventory.db")

	//Open GORM connection
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	//Extract the raw SQL database from GORM to give to Goose
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get raw sql db: %w", err)
	}

	//Configure Goose to use our embedded SQL files
	goose.SetBaseFS(embedMigrations)

	if err := goose.SetDialect("sqlite3"); err != nil {
		return nil, fmt.Errorf("failed to set goose dialect: %w", err)
	}

	// This will safely apply any new .sql files in the migrations folder
	if err := goose.Up(sqlDB, "migrations"); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	return db, nil
}
