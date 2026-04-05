package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"prodman/internal/adapter/repository"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {

	db, err := repository.InitializeDatabase()
	if err != nil {
		log.Fatalf("Fatal error initializing database: %v", err)
	}

	productRepo := repository.NewProductRepository(db)
	app := NewApp(productRepo)

	err = wails.Run(&options.App{
		Title:  "Inventory Manager",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		log.Fatal("Error:", err)
	}
}
