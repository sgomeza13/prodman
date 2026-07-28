package main

import (
	"embed"
	"log"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"prodman/internal/adapter/repository"
)

//go:embed all:frontend/dist
var assets embed.FS

// imagesHandler serves product photos from the config dir. The asset server
// only routes here for paths the embedded frontend assets don't cover.
func imagesHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(r.URL.Path, "/images/")
		if name == r.URL.Path || name == "" || strings.Contains(name, "..") || strings.ContainsAny(name, "/\\") {
			http.NotFound(w, r)
			return
		}
		dir, err := imagesDirPath()
		if err != nil {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(dir, name))
	})
}

func main() {

	db, err := repository.InitializeDatabase()
	if err != nil {
		log.Fatalf("Fatal error initializing database: %v", err)
	}

	productRepo := repository.NewProductRepository(db)
	app := NewApp(productRepo)

	err = wails.Run(&options.App{
		Title:  "Prodman",
		Width:  1280,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets:  assets,
			Handler: imagesHandler(),
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		log.Fatal("Error:", err)
	}
}
