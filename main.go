package main

import (
	"bytes"
	"context"
	_ "embed"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/abiiranathan/revelt/health"
	"github.com/abiiranathan/revelt/revelt"
)

const (
	SSReveltConfig = "revelt.json"
	SideCarScript  = "render-server.cjs"
	ClientDir      = "client"
)

func main() {
	cfg, err := revelt.LoadConfig(SSReveltConfig)
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	sidecarPath := filepath.Join(cfg.OutDir, SideCarScript)

	renderer, err := revelt.New(ctx, sidecarPath,
		revelt.WithWorkers(cfg.Workers),
		revelt.WithRenderTimeout(time.Duration(cfg.TimeoutMS)*time.Millisecond),
		revelt.WithProjectConfig(cfg),
	)
	if err != nil {
		log.Fatalf("failed to start revelt: %v", err)
	}
	defer renderer.Close()

	mux := http.NewServeMux()

	mux.Handle("/healthz", health.Liveness(renderer))
	mux.Handle("/readyz", health.Readiness(renderer))

	clientAssetsDir := filepath.Join(cfg.OutDir, ClientDir)
	fs := http.FileServer(http.Dir(clientAssetsDir))
	mux.Handle(cfg.StaticPrefix, http.StripPrefix(cfg.StaticPrefix, fs))

	// Core Multipage Route Management
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" && r.URL.Path != "/analytics" {
			http.NotFound(w, r)
			return
		}

		indexHTML, err := os.ReadFile(indexPagePath(cfg))
		if err != nil {
			http.Error(w, "index.html not found: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Hydrate navbar, identifying active route location.
		navbar, err := renderer.Render(r.Context(), revelt.RenderInput{
			Component: "Navbar",
			Props: map[string]any{
				"activePath": r.URL.Path,
			},
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Determine target active content page island
		pageComponent := "TaskBoard"
		if r.URL.Path == "/analytics" {
			pageComponent = "AnalyticsPanel"
		}

		content, err := renderer.Render(r.Context(), revelt.RenderInput{
			Component: pageComponent,
			Props:     map[string]any{},
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		t, err := template.New("index").Parse(string(indexHTML))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		buf := new(bytes.Buffer)
		err = t.Execute(buf, map[string]any{
			"Navbar":       template.HTML(navbar.HTML),
			"PageContent":  template.HTML(content.HTML),
			"StaticPrefix": cfg.StaticPrefix,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Write(buf.Bytes())
	})

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Application running on http://localhost:%d", cfg.Port)

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failure: %v", err)
		}
	}()

	<-ctx.Done()
	stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}

func indexPagePath(cfg *revelt.ProjectConfig) string {
	return filepath.Join(cfg.OutDir, ClientDir, "index.html")
}
